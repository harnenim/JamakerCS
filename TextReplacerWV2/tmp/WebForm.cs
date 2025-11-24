using Microsoft.Web.WebView2.Core;
using System.Text;

namespace Jamaker
{
    public partial class WebForm : Form
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

        protected void InitAfterLoad(string title)
        {
            windows.Add("editor", Handle.ToInt32());
            Text = title;
            SetDpi();
        }
        public void Script(string name, params object?[] args)
        {
            string script = name + "(";
            for (int i = 0; i < args.Length; i++)
            {
                if (i > 0) script += ",";

                object? arg = args[i];
                if (arg == null)
                {
                    script += "null";
                    continue;
                }
                Type type = arg.GetType();
                if (type == typeof(int)
                    || type == typeof(long)
                    || type == typeof(double)
                    || type == typeof(bool)
                    )
                {
                    script += arg;
                }
                else if (type == typeof(string))
                {
                    script += Microsoft.CodeAnalysis.CSharp.SymbolDisplay.FormatLiteral(arg.ToString()!, true);
                }
            }
            script += ")";
            InScript(script);
        }
        public void InScript(string script)
        {
            mainView.ExecuteScriptAsync(script);
        }

        public void Alert(string target, string msg)
        {
            MessageBoxEx.Show(GetHwnd(target), msg, Text);
        }
        public void Confirm(string target, string msg)
        {
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
        protected string[]? droppedFiles = null;
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
            droppedFiles = (string[]?)e.Data?.GetData(DataFormats.FileDrop);
            HideDragging();
            Drop((int) ((e.X - Location.X) / dpi), (int) ((e.Y - Location.Y) / dpi));
        }
        protected void Drop(int x, int y) {}
        private void ClickLayerForDrag(object sender, MouseEventArgs e)
        {
            // 레이어가 클릭됨 -> 드래그 끝났는데 안 사라진 상태
            HideDragging();
        }
        #endregion

        public async void InitializeAsync(string name, BaseBinder binder)
        {
            InitializeComponent();
            Name = name;

            CoreWebView2EnvironmentOptions op = new CoreWebView2EnvironmentOptions("--disable-web-security");
            CoreWebView2Environment env = await CoreWebView2Environment.CreateAsync(null, null, op);
            await mainView.EnsureCoreWebView2Async(env);
            mainView.CoreWebView2.AddHostObjectToScript("binder", binder);
        }

        public static Encoding DetectEncoding(string file)
        {
            Encoding encoding = Encoding.UTF8;
            FileStream? fs = null;
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
