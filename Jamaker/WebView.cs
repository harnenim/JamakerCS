using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Windows.Forms;
using CefSharp;
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
            string name = targetFrameName;
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
                requestFocus = hwnd;
                return;
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
            Script("setDpi", new object[] { dpi = DeviceDpi / 96 });
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

        protected string Script(string name) { return Script(name, new object[] { }); }
        protected string Script(string name, object arg)
        {
            object result = null;

            try
            {
                if (InvokeRequired)
                {
                    result = Invoke(new Action(() => { Script(name, arg); }));
                }
                else
                {
                    object[] args = arg.GetType().IsArray ? (object[])arg : new object[] { arg };
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

        public void Alert(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Alert(target, msg); }));
                return;
            }
            MessageBoxEx.Show(GetHwnd(target), msg, Text);
        }
        public void Confirm(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Confirm(target, msg); }));
                return;
            }

            if (MessageBoxEx.Show(GetHwnd(target), msg, Text, MessageBoxButtons.YesNo) == DialogResult.Yes)
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
            Prompt prompt = new Prompt(GetHwnd(target), msg, Text, def);
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
            Script("dragover", new object[] { (e.X - Location.X) / dpi, (e.Y - Location.Y) / dpi });
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
            ,   CachePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\" + (name == null ? @"CEF" : name)
            ,   CommandLineArgsDisabled = false
            };
            settings.CefCommandLineArgs.Add("disable-web-security");
            settings.CefCommandLineArgs.Add("disable-popup-blocking");
            Cef.Initialize(settings);
            CefSharpSettings.ShutdownOnExit = true; // Release일 땐 false 해줘야 함

            InitializeComponent();
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
    }
}
