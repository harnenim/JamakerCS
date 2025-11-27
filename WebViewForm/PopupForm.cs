using Microsoft.Web.WebView2.Core;

namespace WebViewForm
{
    public partial class PopupForm : Form
    {
        public PopupForm(CoreWebView2Environment env)
        {
            Opacity = 0;
            InitializeComponent();
            InitWebView(env);
        }

        public bool fixedUrl = false;

        private async void InitWebView(CoreWebView2Environment env)
        {
            await mainView.EnsureCoreWebView2Async(env);
            mainView.CoreWebView2.DocumentTitleChanged += (s, e) => { try { Text = mainView.CoreWebView2.DocumentTitle; } catch { } };
            mainView.NavigationStarting += (s, e) => { Activate(); };
            mainView.CoreWebView2.WindowCloseRequested += (s, e) => { try { Close(); } catch { } };
        }
    }
}
