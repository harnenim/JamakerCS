using System;
using System.Drawing;
using System.IO;
using System.Text;
using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;
using System.Diagnostics;
using System.Collections.Generic;

namespace Jamaker
{
    public partial class MainForm : Form
    {
        private readonly Dictionary<string, int> windows = new Dictionary<string, int>();

        public MainForm()
        {
            // 브라우저 설정
            CefSettings settings = new CefSettings
            {   Locale = "ko"
            ,   CachePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\CEF"
            };
            settings.CefCommandLineArgs.Add("disable-web-security");
            Cef.Initialize(settings);
            CefSharpSettings.ShutdownOnExit = true; // Release일 땐 false 해줘야 함

            InitializeComponent();

            StartPosition = FormStartPosition.Manual;
            Location = new Point(1000, 1000); // 처음에 안 보이게
            Size = new Size(1200, 800);

            SetStyle(ControlStyles.SupportsTransparentBackColor, true);
            BackColor = Color.Transparent;
            AllowTransparency = true;

            mainView.LifeSpanHandler = new LSH(this);
            mainView.LoadUrl(Path.Combine(Directory.GetCurrentDirectory(), "view/Updater.html"));
            mainView.JavascriptObjectRepository.Settings.LegacyBindingEnabled = true;
            mainView.JavascriptObjectRepository.Register("binder", new Binder(this), false, BindingOptions.DefaultBinder);
            mainView.RequestHandler = new RequestHandler(); // TODO: 팝업에서 이동을 막아야 되는데...

            FormClosed += new FormClosedEventHandler(WebFormClosed);

            windows.Add("editor", Handle.ToInt32());
        }
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
            }
            else
            {
                mainView.Focus();
            }
        }
        private int requestFocus = 0;
        private void FocusIfRequested(object sender, EventArgs e)
        {

        }

        private void WebFormClosed(object sender, FormClosedEventArgs e)
        {
            Process.GetCurrentProcess().Kill();
        }

        #region 창 조작
        private int GetHwnd(string target)
        {
            try
            {
                return windows[target];
            }
            catch { }
            return 0;
        }
        public void MoveWindow(string target, int x, int y, int width, int height, bool resizable)
        {
            try
            {
                int hwnd = GetHwnd(target);
                if (!resizable)
                {
                    // TODO: 안 됨.............
                    WinAPI.DisableResize(hwnd);
                }
                if (hwnd > 0)
                {   // 윈도우 그림자 여백 보정
                    WinAPI.MoveWindow(hwnd, x - 7, y, width + 14, height + 9, true);
                }
            }
            catch { }
        }

        public void FocusWindow(string target)
        {
            if (target.Equals("player"))
            {
                return;
            }
            int hwnd = GetHwnd(target);
            WinAPI.SetForegroundWindow(hwnd);

            // 에디터 활성화할 땐 커서까지 포커싱
            if (target.Equals("editor"))
            {
                delayFocusing = 10; // 창 전환 후 바로 호출하면 꼬임
                timer.Tick += FocusEditor;
            }
        }
        private int delayFocusing = 0;
        private void FocusEditor(object sender, EventArgs e)
        {
            if (--delayFocusing == 0)
            {
                mainView.Focus();
                timer.Tick -= FocusEditor;
            }
        }
        public void GetWindows(string[] targets)
        {
            foreach (string target in targets)
            {
                int hwnd = GetHwnd(target);
                if (hwnd > 0)
                {
                    RECT targetOffset = new RECT();
                    WinAPI.GetWindowRect(hwnd, ref targetOffset);
                    if (target.Equals("player"))
                    {
                        Script("afterGetWindow", new object[] { target
                            , targetOffset.left
                            , targetOffset.top
                            , targetOffset.right - targetOffset.left
                            , targetOffset.bottom - targetOffset.top
                        });
                    }
                    else
                    {
                        Script("afterGetWindow", new object[] { target
                            , targetOffset.left + 7
                            , targetOffset.top
                            , targetOffset.right - targetOffset.left - 14
                            , targetOffset.bottom - targetOffset.top - 9
                        });
                    }
                }
            }
        }
        #endregion

        #region 브라우저 통신
        private string Script(string name) { return mainView.Script(name); }
        private string Script(string name, object arg) { return mainView.Script(name, arg); }

        readonly string msgTitle = "SamiUpdater";
        public void Alert(string target, string msg)
        {if (InvokeRequired)
            {
                Invoke(new Action(() => { Alert(target, msg); }));
            }
            else
            {
                MessageBoxEx.Show(GetHwnd(target), msg, msgTitle);
            }
        }
        public void Confirm(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Confirm(target, msg); }));
            }
            else
            {
                if (MessageBoxEx.Show(GetHwnd(target), msg, msgTitle, MessageBoxButtons.YesNo) == DialogResult.Yes)
                {
                    Script("afterConfirmYes");
                }
                else
                {
                    Script("afterConfirmNo");
                }
            }
        }
        #endregion

        #region 파일 드래그 관련
        public void ShowDragging()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { ShowDragging(); }));
            }
            else
            {
                layerForDrag.Visible = true;
                Script("tmpBinder.showDragging");
            }
        }
        public void HideDragging()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { HideDragging(); }));
            }
            else
            {
                layerForDrag.Visible = false;
                Script("tmpBinder.hideDragging");
            }
        }

        protected void DragLeaveMain(object sender, EventArgs e) { HideDragging(); }
        protected void DragOverMain(object sender, DragEventArgs e) { try { e.Effect = DragDropEffects.All; } catch { } }
        protected void DragDropMain(object sender, DragEventArgs e)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { DragDropMain(sender, e); }));
            }
            else
            {
                DropListFile(e);
                HideDragging();
            }
        }

        #endregion

        #region 파일

        string dropedFile = null;

        private void DropListFile(DragEventArgs e)
        {
            dropedFile = null;
            try
            {
                string[] strFiles = (string[])e.Data.GetData(DataFormats.FileDrop);
                foreach (string strFile in strFiles)
                {
                    if (strFile.ToUpper().EndsWith(".SMI") || strFile.ToUpper().EndsWith(".SRT"))
                    {
                        dropedFile = strFile;
                        Script("drop", new object[] { e.X - Location.X, e.Y - Location.Y });
                        break;
                    }
                }
            }
            catch { }
        }
        public void DropFileToArea(int dropArea)
        {
            if (dropedFile == null)
            {
                return;
            }

            string text = "";
            StreamReader sr = null;
            try
            {
                Encoding encoding = TextFile.BOM.DetectEncoding(dropedFile); // TODO: BOM 없으면 버그 있나...?
                //Console.WriteLine("encoding: " + encoding);
                sr = new StreamReader(dropedFile, encoding);
                text = sr.ReadToEnd();
            }
            catch
            {
                Script("alert", "파일을 열지 못했습니다.");
            }
            finally { sr?.Close(); }

            string name = dropedFile;
            string path = dropedFile;
            switch (dropArea)
            {
                case 1:
                    {
                        path = path.Substring(0, path.Replace('/', '\\').LastIndexOf('\\'));
                        break;
                    }
                case 2:
                    {
                        name = name.Substring(path.Replace('/', '\\').LastIndexOf('\\') + 1);
                        break;
                    }
            }
            Script("setFile", new object[] { dropArea, text, name, path });
        }

        public void Save(string dir, string name, string text)
        {
            Console.WriteLine("Save");
            StreamWriter sw = null;
            try
            {   // 무조건 UTF-8로 저장
                (sw = new StreamWriter(dir + "/" + name, false, Encoding.UTF8)).Write(text);
                Script("alert", "저장했습니다.");
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                Script("alert", "저장되지 않았습니다.");
            }
            finally
            {
                if (sw != null) sw.Close();
            }
        }
        #endregion
    }
}
