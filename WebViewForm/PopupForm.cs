using Microsoft.Web.WebView2.Core;

namespace WebViewForm
{
    public partial class PopupForm : Form
    {
        public PopupForm(CoreWebView2Environment env)
        {
            InitializeComponent();
            InitWebView(env);
        }

        private async void InitWebView(CoreWebView2Environment env)
        {
            await mainView.EnsureCoreWebView2Async(env);
            mainView.Source = new Uri(Path.Combine(Directory.GetCurrentDirectory(), "view/test.html"));
        }
    }
}
