using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using CefSharp;
using CefSharp.Handler;
using CefSharp.WinForms;
using Jamaker.addon;

namespace Jamaker
{
    public class LSH : ILifeSpanHandler
    {
        private readonly MainForm mainForm;

        public const int useCustomPopup = 0; // 1: viewer만 / 2: viewer & finder

        public LSH(MainForm mainForm)
        {
            this.mainForm = mainForm;
        }
        
        public bool OnBeforePopup(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame
            , string targetUrl, string targetFrameName
            , WindowOpenDisposition targetDisposition, bool userGesture
            , IPopupFeatures popupFeatures, IWindowInfo windowInfo, IBrowserSettings browserSettings
            , ref bool noJavascriptAccess, out IWebBrowser newBrowser)
        {
#pragma warning disable IDE0059 // 불필요한 값 할당
            string name = targetFrameName;
#pragma warning restore IDE0059 // 불필요한 값 할당
            if ((useCustomPopup > 0 && name.Equals("viewer")) || (useCustomPopup > 1 && name.Equals("finder")))
            {
                Popup popup = mainForm.GetPopup(name);
                if (popup == null)
                {
                    popup = new Popup(mainForm, name, targetUrl);
                    if (name.Equals("viewer"))
                    {
                        popup.Text = "미리보기";
                        //popup.FormBorderStyle = FormBorderStyle.Sizable;
                    }
                    else
                    {
                        popup.Text = "찾기/바꾸기";
                    }
                    popup.Show();
                    mainForm.SetWindow(name, popup.Handle.ToInt32(), popup);
                }
                else
                {
                    try
                    {
                        popup.Show();
                        WinAPI.SetForegroundWindow(popup.Handle.ToInt32());
                        popup.mainView.Focus();
                        popup.SetFocus();
                    }
                    finally { }
                }
                newBrowser = null;
                return true;
            }
            else
            {
                /*
                if (name.Equals("viewer") || name.Equals("finder"))
                {
                    windowInfo.Style |= 0x80880080;
                }
                */
                newBrowser = null;
                return false;
            }
        }

        public void OnAfterCreated(IWebBrowser chromiumWebBrowser, IBrowser browser)
        {
            List<string> names = browser.GetFrameNames();
            if (names.Count > 0)
            {
                Console.WriteLine($"OnAfterCreated: {names[0]}");
                int hwnd = browser.GetHost().GetWindowHandle().ToInt32();
                mainForm.SetWindow(names[0], hwnd);
                mainForm.SetFocus(hwnd);

                if (mainForm.afterInitAddon != null && names[0] == "addon")
                {
                    string afterInitAddon = mainForm.afterInitAddon;
                    mainForm.afterInitAddon = null;
                    new Thread(() =>
                    {
                        try
                        {
                            Thread.Sleep(1000); // 1초 지연 실행
                            Console.WriteLine($"addon.eval: {afterInitAddon}");
                            //mainForm.Script(chromiumWebBrowser, "eval", afterInitAddon );
                        }
                        catch (Exception e)
                        {
                            Console.WriteLine(e);
                        }
                    }).Start();
                }
            }
        }

        public bool DoClose(IWebBrowser chromiumWebBrowser, IBrowser browser)
        {
            return false;
        }

        public void OnBeforeClose(IWebBrowser chromiumWebBrowser, IBrowser browser)
        {
            List<string> names = browser.GetFrameNames();
            if (names.Count > 0)
            {
                mainForm.RemoveWindow(names[0]);
            }
        }
    }

    public class RequestHandler : CefSharp.Handler.RequestHandler
    {
        protected override bool OnBeforeBrowse(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame, IRequest request, bool userGesture, bool isRedirect)
        {
            return false;
        }
    }

    partial class MainForm
    {
        #region 창 조작
        protected readonly Dictionary<string, int> windows = new Dictionary<string, int>();
        protected readonly Dictionary<string, Popup> popups = new Dictionary<string, Popup>();

        public virtual void SetWindow(string name, int hwnd)
        {
            RemoveWindow(name); // 남아있을 수 있음
            windows.Add(name, hwnd);
            OverrideSetWindow(name, hwnd);
        }
        public void SetWindow(string name, int hwnd, Popup popup)
        {
            RemoveWindow(name); // 남아있을 수 있음
            windows.Add(name, hwnd);
            popups.Add(name, popup);
        }
        public void RemoveWindow(string name)
        {
            windows.Remove(name);
            popups.Remove(name);
        }
        public Popup GetPopup(string name)
        {
            return popups.ContainsKey(name) ? popups[name] : null;
        }
        // window.open 시에 브라우저에 커서 가도록
        public void SetFocus(int hwnd)
        {
            if (LSH.useCustomPopup > 0)
            {
#pragma warning disable CS0162 // 접근할 수 없는 코드가 있습니다.
                requestFocus = hwnd;
                return;
#pragma warning restore CS0162 // 접근할 수 없는 코드가 있습니다.
            }
            if (InvokeRequired)
            {
                Invoke(new Action(() => { SetFocus(hwnd); }));
                return;
            }
            mainView.Focus();
        }
        private int requestFocus = 0;
        private void FocusIfRequested(object sender, EventArgs e)
        {
            // TODO: Popup에 대해선 미개발
        }
        protected virtual int GetHwnd(string target)
        {
            /*
            try
            {
                return windows[target];
            }
            catch { }
            return 0;
            */
            return OverrideGetHwnd(target);
        }

        public void FocusWindow(string target)
        {
            //WinAPI.SetForegroundWindow(GetHwnd(target));
            OverrideFocusWindow(target);
        }

        private double dpi = 1;
        private void SetDpi()
        {
            Script("setDpi", dpi = DeviceDpi / 96);
        }

        private void OnDpiChanged(object sender, DpiChangedEventArgs e)
        {
            SetDpi();
        }
        #endregion

        public virtual void InitAfterLoad(string title)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { InitAfterLoad(title); }));
                return;
            }
            windows.Add("editor", Handle.ToInt32());
            Text = title;
            SetDpi();
            OverrideInitAfterLoad();
        }

        protected string Script(string name, params object[] args) { return InScript(name, args); }
        private string InScript(string name, object[] args)
        {
            object result = null;

            try
            {
                if (InvokeRequired)
                {
                    result = Invoke(new Action(() => { InScript(name, args); }));
                }
                else
                {
                    mainView.ExecuteScriptAsync(name, args);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            if (result == null) return null;
            return result.ToString();
        }
        public string Script(IWebBrowser chromiumWebBrowser, string name, params object[] args) {
            return InScript(chromiumWebBrowser, name, args);
        }
        private string InScript(IWebBrowser chromiumWebBrowser, string name, object[] args)
        {
            object result = null;

            try
            {
                if (InvokeRequired)
                {
                    result = Invoke(new Action(() => { InScript(name, args); }));
                }
                else
                {
                    chromiumWebBrowser.ExecuteScriptAsync(name, args);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            if (result == null) return null;
            return result.ToString();
        }

        /*
        public virtual string GetTitle()
        {
            return Text;
        }
        */
        public void Alert(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Alert(target, msg); }));
                return;
            }
            MessageBoxEx.Show(GetHwnd(target), msg, GetTitle());
        }
        public void Confirm(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Confirm(target, msg); }));
                return;
            }

            if (MessageBoxEx.Show(GetHwnd(target), msg, GetTitle(), MessageBoxButtons.YesNo) == DialogResult.Yes)
            {
                Script("afterConfirmYes");
            }
            else
            {
                Script("afterConfirmNo");
            }
        }

        public void Prompt(string target, string msg, string def)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Prompt(target, msg, def); }));
                return;
            }
            Prompt prompt = new Prompt(GetHwnd(target), msg, GetTitle(), def);
            DialogResult result = prompt.ShowDialog();
            if (result == DialogResult.OK)
            {
                Script("afterPrompt", prompt.value);
            }
        }

        #region 파일 드래그
        public void ShowDragging()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { ShowDragging(); }));
                return;
            }
            layerForDrag.Visible = true;
            Script("showDragging");
        }
        public void HideDragging()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { HideDragging(); }));
                return;
            }
            layerForDrag.Visible = false;
            Script("hideDragging");
        }
        string[] droppedFiles = null;
        protected void DragLeaveMain(object sender, EventArgs e) { HideDragging(); }
        protected void DragOverMain(object sender, DragEventArgs e)
        {
            try { e.Effect = DragDropEffects.All; } catch { }
            Script("dragover", (e.X - Location.X) / dpi, (e.Y - Location.Y) / dpi);
        }
        protected void DragDropMain(object sender, DragEventArgs e)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { DragDropMain(sender, e); }));
                return;
            }
            droppedFiles = (string[])e.Data.GetData(DataFormats.FileDrop);
            HideDragging();
            Drop((int) ((e.X - Location.X) / dpi), (int) ((e.Y - Location.Y) / dpi));
        }
        protected virtual void Drop(int x, int y)
        {
            OverrideDrop(x, y);
        }
        private void ClickLayerForDrag(object sender, MouseEventArgs e)
        {
            // 레이어가 클릭됨 -> 드래그 끝났는데 안 사라진 상태
            HideDragging();
        }
        #endregion

        public void WebForm()
        {
            WebForm(@"CEF");
        }
        public void WebForm(string name)
        {
            // 브라우저 설정
            CefSettings settings = new CefSettings
            {   Locale = "ko"
            ,   CachePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\" + (name ?? @"CEF")
            ,   CommandLineArgsDisabled = false
            };
            settings.CefCommandLineArgs.Add("disable-web-security");
            settings.CefCommandLineArgs.Add("disable-popup-blocking");
            settings.CefCommandLineArgs.Add("unsafely-treat-insecure-origin-as-secure", "file:///");
            Cef.Initialize(settings);
            CefSharpSettings.ShutdownOnExit = true; // Release일 땐 false 해줘야 함

            InitializeComponent();

            mainView.BrowserSettings = new BrowserSettings() { JavascriptAccessClipboard = CefState.Enabled, };
            mainView.PermissionHandler = new MyPermissionHandler();
        }
        public class MyPermissionHandler : PermissionHandler
        {
            protected override bool OnShowPermissionPrompt(IWebBrowser chromiumWebBrowser, IBrowser browser, ulong promptId, string requestingOrigin, PermissionRequestType requestedPermissions, IPermissionPromptCallback callback)
            {
                callback.Continue(PermissionRequestResult.Accept);
                return true;
            }
        }

        public static Encoding DetectEncoding(string file)
        {
            Encoding encoding = Encoding.UTF8;
            FileStream fs = null;
            try
            {
                Ude.CharsetDetector cdet = new Ude.CharsetDetector();
                cdet.Feed(fs = File.OpenRead(file));
                cdet.DataEnd();
                encoding = Encoding.GetEncoding(cdet.Charset);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
            finally
            {
                fs?.Close();
            }
            return encoding;
        }

        public int CheckFFmpegWithAlert()
        {
            int status = VideoInfo.CheckFFmpeg();
            switch (status)
            {
                case 2: Script("alert", "ffmpeg.exe 파일이 없습니다."); break;
                case 1: Script("alert", "ffprobe.exe 파일이 없습니다."); break;
                case 0: Script("alert", "ffmpeg.exe, ffprobe.exe 파일이 없습니다."); break;
            }
            return status;
        }
    }
}
