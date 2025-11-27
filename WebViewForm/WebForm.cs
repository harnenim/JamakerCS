using Microsoft.Web.WebView2.Core;
using System.Runtime.Versioning;
using System.Text;

namespace WebViewForm
{
    [SupportedOSPlatform("windows7.0")]
    public partial class WebForm : Form
    {
        #region 창 조작
        protected readonly Dictionary<string, int> windows = [];
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
        protected virtual int GetHwnd(string target)
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
            Script("setDpi", [dpi = DeviceDpi / 96]);
        }

        private void OnDpiChanged(object sender, DpiChangedEventArgs e)
        {
            SetDpi();
        }
        #endregion

        public virtual void InitAfterLoad(string title)
        {
            windows.Add("editor", Handle.ToInt32());
            Text = title;
            SetDpi();
        }
        private static string ScriptToEval(string name, object?[] args)
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
                    )
                {
                    script += arg;
                }
                else if (type == typeof(bool))
                {
                    script += (bool)arg ? "true" : "false";
                }
                else if (type == typeof(string))
                {
                    script += Microsoft.CodeAnalysis.CSharp.SymbolDisplay.FormatLiteral(arg.ToString()!, true);
                }
            }
            script += ")";
            return script;
        }
        public void Script(string func, params object?[] args)
        {
            Eval(ScriptToEval(func, args));
        }
        public void Eval(string script)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Eval(script); }));
                return;
            }
            mainView.ExecuteScriptAsync(script);
        }
        public void ScriptToPopup(string name, string func, params object[] args)
        {
            Eval(popups[name], ScriptToEval(func, args));
        }
        public void Eval(PopupForm popup, string script)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Eval(popup, script); }));
                return;
            }
            popup.mainView.ExecuteScriptAsync(script);
        }

        public virtual string GetTitle()
        {
            return Text;
        }
        public virtual void Alert(string target, string msg)
        {
            MessageBoxEx.Show(GetHwnd(target), msg, GetTitle());
        }
        public virtual void Confirm(string target, string msg)
        {
            if (MessageBoxEx.Show(GetHwnd(target), msg, GetTitle(), MessageBoxButtons.YesNo) == DialogResult.Yes)
            {
                Script("afterConfirmYes");
            }
            else
            {
                Script("afterConfirmNo");
            }
        }

        public virtual void Prompt(string target, string msg, string def)
        {
            WinAPI.EnableWindow(Handle, false);

            string? value = null;
            Prompt prompt = new(GetHwnd(target), msg, GetTitle(), def);

            Thread thread = new(() =>
            {
                DialogResult result = prompt.ShowDialog();
                if (result == DialogResult.OK)
                {
                    value = prompt.value;
                }
            });
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            thread.Join();

            WinAPI.EnableWindow(Handle, true);
            Activate();

            if (value != null)
            {
                Script("afterPrompt", value);
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
            Script("dragover", (e.X - Location.X) / dpi, (e.Y - Location.Y) / dpi);
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
        protected virtual void Drop(int x, int y) {}
        private void ClickLayerForDrag(object sender, MouseEventArgs e)
        {
            // 레이어가 클릭됨 -> 드래그 끝났는데 안 사라진 상태
            HideDragging();
        }
        #endregion

        public CoreWebView2Environment? env;
        public async void InitializeAsync(string name, object binder)
        {
            InitializeComponent();
            Name = name;

            CoreWebView2EnvironmentOptions op = new("--disable-web-security --disable-scroll-anchoring");
            env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Application.StartupPath, "temp"), op);
            await mainView.EnsureCoreWebView2Async(env);
            mainView.CoreWebView2.AddHostObjectToScript("binder", binder);

            mainView.CoreWebView2.NewWindowRequested += OpenPopup;

            StandbyPopup();
        }
        // 다음 팝업 미리 생성해두기
        private void StandbyPopup()
        {
            if (InvokeRequired)
            {
                tmpPopup = null;
                Invoke(new Action(() => { StandbyPopup(); }));
                return;
            }
            tmpPopup = new PopupForm(env!);
        }

        private PopupForm? tmpPopup;
        protected readonly Dictionary<string, PopupForm> popups = [];
        private readonly Dictionary<string, PopupForm> urlPopups = [];

        private void OpenPopup(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
        {
            if (tmpPopup != null)
            {
                PopupForm popup = tmpPopup;
                if (popups.TryGetValue(e.Name, out var oldPopup))
                {
                    popup = oldPopup;
                }
                else
                {
                    tmpPopup = null;
                    new Thread(() => { StandbyPopup(); }).Start();
                }
                popup.Show();
                if (!popup.fixedUrl)
                {
                    e.NewWindow = popup.mainView.CoreWebView2;
                }

                popups[e.Name] = urlPopups[e.Uri] = popup;
                windows[e.Name] = popup.Handle.ToInt32();

                popup.Text = e.Name;
                AfterOpenPopup(e.Name, popup);
                popup.FormClosed += (s2, e2) => {
                    popups.Remove(e.Name);
                };
                popup.Opacity = 1;
            }
            e.Handled = true;
        }
        public virtual void AfterOpenPopup(string name, PopupForm popup)
        {
            // 각 프로그램에서 필요 시 override
        }

        public static Encoding DetectEncoding(string file)
        {
            Encoding encoding = Encoding.UTF8;
            FileStream? fs = null;
            try
            {
                Ude.CharsetDetector cdet = new();
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
