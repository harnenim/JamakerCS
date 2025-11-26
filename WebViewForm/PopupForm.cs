using Microsoft.Web.WebView2.Core;
using System.Windows.Controls.Primitives;

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

        private async void InitWebView(CoreWebView2Environment env)
        {
            await mainView.EnsureCoreWebView2Async(env);
            mainView.Source = new Uri(Path.Combine(Directory.GetCurrentDirectory(), "view/test.html"));

            mainView.CoreWebView2.DocumentTitleChanged += (s, e) => { try { Text = mainView.CoreWebView2.DocumentTitle; } catch { } };
            mainView.CoreWebView2.NavigationStarting += (s, e) => { Activate(); };
            mainView.CoreWebView2.WindowCloseRequested += (s2, e2) => { try { Close(); } catch { } };
        }
    }
}
