using System;
using System.Collections.Generic;
using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;

namespace Jamaker
{
    public class LSH : ILifeSpanHandler
    {
        private readonly MainForm mainForm;

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
            /*
            if (name.Equals("viewer") || name.Equals("finder"))
            {
                windowInfo.Style |= 0x80880080;
            }
            */
            newBrowser = null;
            return false;
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
        public void SetWindow(string name, int hwnd)
        {
            RemoveWindow(name); // 남아있을 수 있음
            windows.Add(name, hwnd);
        }
        public void RemoveWindow(string name)
        {
            windows.Remove(name);
        }
        // window.open 시에 브라우저에 커서 가도록
        public void SetFocus(int hwnd)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { SetFocus(hwnd); }));
                return;
            }
            mainView.Focus();
        }
        protected int GetHwnd(string target)
        {
            try
            {
                return windows[target];
            }
            catch { }
            return 0;
        }

        public void FocusWindow(string target)
        {
            WinAPI.SetForegroundWindow(GetHwnd(target));
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
            Script("dragover", new object[] { e.X - Location.X, e.Y - Location.Y });
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
            Drop(e.X - Location.X, e.Y - Location.Y);
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
            // 브라우저 설정
            CefSettings settings = new CefSettings
            {   Locale = "ko"
            ,   CachePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\CEF"
            };
            settings.CefCommandLineArgs.Add("disable-web-security");
            Cef.Initialize(settings);
            CefSharpSettings.ShutdownOnExit = true; // Release일 땐 false 해줘야 함

            InitializeComponent();
        }
    }
}
