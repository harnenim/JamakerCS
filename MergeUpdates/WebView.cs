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
