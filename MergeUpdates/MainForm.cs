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
        #region TODO: WebForm 분리 예정
        protected string msgTitle = "WebForm";

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
            }
            else
            {
                mainView.Focus();
            }
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
        #endregion

        public virtual void InitAfterLoad()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { InitAfterLoad(); }));
                return;
            }
            windows.Add("editor", Handle.ToInt32());
            //OverrideInitAfterLoad();
        }

        protected string Script(string name) { return mainView.Script(name); }
        protected string Script(string name, object arg) { return mainView.Script(name, arg); }

        public void Alert(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Alert(target, msg); }));
                return;
            }

            MessageBoxEx.Show(GetHwnd(target), msg, msgTitle);
        }
        public void Confirm(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Confirm(target, msg); }));
                return;
            }

            if (MessageBoxEx.Show(GetHwnd(target), msg, msgTitle, MessageBoxButtons.YesNo) == DialogResult.Yes)
            {
                Script("afterConfirmYes");
            }
            else
            {
                Script("afterConfirmNo");
            }
        }

        #region 파일 드래그
        public void ShowDragging()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { ShowDragging(); }));
            }
            else
            {
                layerForDrag.Visible = true;
                Script("showDragging");
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
                Script("hideDragging");
            }
        }
        string[] droppedFiles = null;
        protected void DragLeaveMain(object sender, EventArgs e) { HideDragging(); }
        protected void DragOverMain(object sender, DragEventArgs e)
        {
            try { e.Effect = DragDropEffects.All; } catch { }
            Script("dragover", new object[] { e.X - Location.X, e.Y - Location.Y });
        }
        protected void DragDropMain(object sender, DragEventArgs e)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { DragDropMain(sender, e); }));
            }
            else
            {
                droppedFiles = (string[])e.Data.GetData(DataFormats.FileDrop);
                HideDragging();
                Drop(e.X - Location.X, e.Y - Location.Y);
            }
        }
        protected virtual void Drop(int x, int y)
        {
            OverrideDrop(x, y);
        }
        private void ClickLayerForDrag(object sender, MouseEventArgs e)
        {
            // 레이어가 클릭됨 -> 드래그 끝났는데 안 사라진 상태
            HideDragging();
        }
        #endregion

        public void WebForm()
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
        }
        #endregion

        public MainForm()
        {
            WebForm();

            int[] rect = { 0, 0, 1280, 800 };
            StreamReader sr = null;
            try
            {   // 설정 파일 경로
                sr = new StreamReader("setting/MergeUpdates.txt", Encoding.UTF8);
                string[] strRect = sr.ReadToEnd().Split(',');
                if (strRect.Length >= 4)
                {
                    rect[0] = Convert.ToInt32(strRect[0]);
                    rect[1] = Convert.ToInt32(strRect[1]);
                    rect[2] = Convert.ToInt32(strRect[2]);
                    rect[3] = Convert.ToInt32(strRect[3]);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                rect[0] = (System.Windows.Forms.SystemInformation.VirtualScreen.Width - 1280) / 2;
                rect[1] = (System.Windows.Forms.SystemInformation.VirtualScreen.Height - 800) / 2;
            }
            finally { sr?.Close(); }

            StartPosition = FormStartPosition.Manual;
            Location = new Point(rect[0], rect[1]);
            Size = new Size(rect[2], rect[3]);

            SetStyle(ControlStyles.SupportsTransparentBackColor, true);
            BackColor = Color.Transparent;
            AllowTransparency = true;

            mainView.LifeSpanHandler = new LSH(this);
            mainView.LoadUrl(Path.Combine(Directory.GetCurrentDirectory(), "view/MergeUpdates.html"));
            mainView.JavascriptObjectRepository.Settings.LegacyBindingEnabled = true;
            mainView.JavascriptObjectRepository.Register("binder", new Binder(this), false, BindingOptions.DefaultBinder);
            mainView.RequestHandler = new RequestHandler(); // TODO: 팝업에서 이동을 막아야 되는데...

            FormClosed += new FormClosedEventHandler(WebFormClosed);
        }

        private void WebFormClosed(object sender, FormClosedEventArgs e)
        {
            try
            {
                RECT offset = new RECT();
                WinAPI.GetWindowRect(Handle.ToInt32(), ref offset);

                // 설정 폴더 없으면 생성
                DirectoryInfo di = new DirectoryInfo("setting");
                if (!di.Exists)
                {
                    di.Create();
                }

                StreamWriter sw = new StreamWriter("setting/MergeUpdates.txt", false, Encoding.UTF8);
                sw.Write(offset.left + "," + offset.top + "," + (offset.right - offset.left) + "," + (offset.bottom - offset.top));
                sw.Close();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

            Process.GetCurrentProcess().Kill();
        }

        private void OverrideDrop(int x, int y)
        {
            Script("drop", new object[] { x, y });
        }

        #region 파일
        public void DropFileToArea(int dropArea)
        {
            if (droppedFiles == null)
            {
                return;
            }

            string path = droppedFiles[0];
            string text = "";
            StreamReader sr = null;
            try
            {
                Encoding encoding = TextFile.BOM.DetectEncoding(path);
                sr = new StreamReader(path, encoding);
                text = sr.ReadToEnd();
            }
            catch
            {
                Script("alert", "파일을 열지 못했습니다.");
            }
            finally { sr?.Close(); }

            string name = path;
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
