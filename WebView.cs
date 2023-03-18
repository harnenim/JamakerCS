using System;
using System.Collections.Generic;
using CefSharp;
using CefSharp.WinForms;

namespace SmiEdit
{
    public class LSH : ILifeSpanHandler
    {
        private readonly MainForm mainForm;

        public LSH(MainForm mainForm)
        {
            this.mainForm = mainForm;
        }

        public bool OnBeforePopup(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame, string targetUrl, string targetFrameName, WindowOpenDisposition targetDisposition, bool userGesture, IPopupFeatures popupFeatures, IWindowInfo windowInfo, IBrowserSettings browserSettings, ref bool noJavascriptAccess, out IWebBrowser newBrowser)
        {
            newBrowser = null;
            return false;
        }

        public void OnAfterCreated(IWebBrowser chromiumWebBrowser, IBrowser browser)
        {
            List<string> names = browser.GetFrameNames();
            if (names.Count > 0)
            {
                int hwnd = browser.GetHost().GetWindowHandle().ToInt32();
                mainForm.SetWindow(names[0], hwnd);
                WinAPI.SetTaskbarHide(hwnd);
            }
            mainForm.SetFocus(chromiumWebBrowser);
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

    public class WebView : ChromiumWebBrowser
    {
        #region 스크립트 핸들러

        delegate string ScriptHandler(string name, object[] args);
        public string Script(string name) { return Script(name, null); }
        public string Script(string name, object[] args)
        {
            object result = null;

            try
            {
                if (InvokeRequired)
                {
                    result = Invoke(new ScriptHandler(Script), new object[] { name, args });
                }
                else
                {
                    int len = (args == null) ? 0 : Math.Min(10, args.Length);
                    object[] param = new object[len + 1];
                    param[0] = name;
                    for (int i = 0; i < len; i++)
                    {
                        param[i + 1] = args[i];
                    }
                    //result = Document.InvokeScript("call", param);
                    this.ExecuteScriptAsync("call", param);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                //Environment.Exit(0);
            }

            if (result == null) return null;
            return result.ToString();
        }

        #endregion
    }
}
