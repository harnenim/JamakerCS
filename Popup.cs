using CefSharp;
using CefSharp.WinForms;
using System;
using System.Windows.Forms;

namespace SmiEdit
{
    public partial class Popup : Form
    {
        MainForm _;
        string name;

        public Popup(MainForm mainForm, string name, string url)
        {
            _ = mainForm;
            this.name = name;

            InitializeComponent();

            mainView.LoadUrl(url);
            mainView.JavascriptObjectRepository.Settings.LegacyBindingEnabled = true;
            mainView.JavascriptObjectRepository.Register("binder", new PopupBinder(this), false, BindingOptions.DefaultBinder);

            FormClosing += new FormClosingEventHandler(WebFormClosing);
            FormClosed += new FormClosedEventHandler(WebFormClosed);
        }

        public void WebFormClosing(object sender, FormClosingEventArgs e)
        {
            e.Cancel = true;
            Hide();
        }

        public void WebFormClosed(object sender, FormClosedEventArgs e)
        {
            _.RemoveWindow(name);
        }

        public void OnloadViewer()
        {
            _.UpdateViewerSetting();
        }
        public void OnloadFinder()
        {
            _.OnloadFinder();
        }

        public void RunFind(string param) { _.RunFind(param); }
        public void RunReplace(string param) { _.RunReplace(param); }
        public void RunReplaceAll(string param) { _.RunReplaceAll(param); }

        string msgTitle = "하늣 ;>ㅅ<;";
        public void Alert(string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Alert(msg); }));
            }
            else
            {
                MessageBoxEx.Show(Handle.ToInt32(), msg, msgTitle);
            }
        }
        public void Confirm(string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Confirm(msg); }));
            }
            else
            {
                if (MessageBoxEx.Show(Handle.ToInt32(), msg, msgTitle, MessageBoxButtons.YesNo) == DialogResult.Yes)
                {
                    Script("afterConfirmYes");
                }
                else
                {
                    Script("afterConfirmNo");
                }
            }
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

        public void SetTitle(string title)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { SetTitle(title); }));
            }
            else
            {
                Text = title;
            }
        }
    }
}
