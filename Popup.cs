using System;
using System.Windows.Forms;

namespace SmiEdit
{
    public partial class Popup : Form
    {
        //ChromiumWebBrowser mainView = null;

        public Popup(string url)
        {
            InitializeComponent();

            mainView.LoadUrl(url);
            mainView.JavascriptObjectRepository.Settings.LegacyBindingEnabled = true;
        }

        public string Script(string name) { return mainView.Script(name, new object[] { }); }
        public string Script(string name, object arg) { return mainView.Script(name, new object[] { arg }); }

        // window.open 시에 브라우저에 커서 가도록
        public void SetFocus()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() =>
                {
                    SetFocus();
                }));
            }
            else
            {
                mainView.Focus();
            }
        }
    }
}
