using System;
using System.Collections.Generic;
using CefSharp;
using CefSharp.WinForms;

namespace SmiEdit
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
                        popup.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Sizable;
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

    public class WebView : ChromiumWebBrowser
    {
        #region 스크립트 핸들러

        delegate string ScriptHandler(string name, object[] args);
        public string Script(string name) { return Script(name, new object[] { }); }
        public string Script(string name, object arg)
        {
            object result = null;

            try
            {
                if (InvokeRequired)
                {
                    result = Invoke(new Action(() => { Script(name, arg);  }));
                }
                else
                {
                    object[] args = arg.GetType().IsArray ? (object[])arg : new object[] { arg };
                    this.ExecuteScriptAsync(name, args);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            if (result == null) return null;
            return result.ToString();
        }

        #endregion
    }
}
