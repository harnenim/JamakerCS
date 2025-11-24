using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Windows.Forms;

namespace Jamaker
{
    partial class MainForm
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

        public virtual void InitAfterLoad(string title)
        {
            windows.Add("editor", Handle.ToInt32());
            Text = title;
            SetDpi();
            OverrideInitAfterLoad();
        }

        protected void Script(string name, params object[] args) { InScript(name, args); }
        private void InScript(string name, object[] args)
        {
            try
            {
                string script = $"{name}(";
                for (int i = 0; i < args.Length; i++)
                {
                    if (i > 0) script += ",";
                    Type type = args[i].GetType();
                    if (type.Equals(typeof(int))
                        || type.Equals(typeof(Int64))
                        || type.Equals(typeof(float))
                        || type.Equals(typeof(double))
                        || type.Equals(typeof(bool))
                        )
                    {
                        script += args[i];

                    }
                    else
                    {
                        script += $"\"{Microsoft.CodeAnalysis.CSharp.SymbolDisplay.FormatLiteral(args[0].ToString(), false)}\"";
                    }
                }
                script += ");";
                mainView.ExecuteScriptAsync(script);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }
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

        #region 파일 드래그
        public void ShowDragging()
        {
            layerForDrag.Visible = true;
            Script("showDragging");
        }
        public void HideDragging()
        {
            layerForDrag.Visible = false;
            Script("hideDragging");
        }
        string[] droppedFiles = null;
        protected void DragLeaveMain(object sender, EventArgs e) { HideDragging(); }
        protected void DragOverMain(object sender, DragEventArgs e)
        {
            try { e.Effect = DragDropEffects.All; } catch { }
            Script("dragover", new object[] { (e.X - Location.X) / dpi, (e.Y - Location.Y) / dpi });
        }
        protected void DragDropMain(object sender, DragEventArgs e)
        {
            droppedFiles = (string[])e.Data.GetData(DataFormats.FileDrop);
            HideDragging();
            Drop((int)((e.X - Location.X) / dpi), (int)((e.Y - Location.Y) / dpi));
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
            WebForm(@"CEF");
        }
        public void WebForm(string name)
        {
            /*
            // 브라우저 설정
            CefSettings settings = new CefSettings
            {
                Locale = "ko"
            ,
                CachePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\" + (name == null ? @"CEF" : name)
            };
            settings.CefCommandLineArgs.Add("disable-web-security");
            Cef.Initialize(settings);
            CefSharpSettings.ShutdownOnExit = true; // Release일 땐 false 해줘야 함
            */

            InitializeComponent();
        }

        public static Encoding DetectEncoding(string file)
        {
            Encoding encoding = Encoding.UTF8;
            FileStream fs = null;
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
