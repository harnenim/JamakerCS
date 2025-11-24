using Microsoft.Web.WebView2.Core;
using Newtonsoft.Json;
using System.Diagnostics;
using System.Text;
using WindowsAPICodePack.Dialogs;

namespace MovieLog
{

    partial class MainForm
    {
        /*
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
        #endregion
        */
        
        public virtual void InitAfterLoad(string title)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { InitAfterLoad(title); }));
                return;
            }
            Text = title;
            OverrideInitAfterLoad();
        }
        public void Alert(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Alert(target, msg); }));
                return;
            }
            //MessageBoxEx.Show(GetHwnd(target), msg, Text);
            MessageBoxEx.Show(Handle.ToInt32(), msg, Text);
        }
        public void Confirm(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Confirm(target, msg); }));
                return;
            }

            //if (MessageBoxEx.Show(GetHwnd(target), msg, Text, MessageBoxButtons.YesNo) == DialogResult.Yes)
            if (MessageBoxEx.Show(Handle.ToInt32(), msg, Text, MessageBoxButtons.YesNo) == DialogResult.Yes)
            {
                mainView.ExecuteScriptAsync($"afterConfirmYes()");
            }
            else
            {
                mainView.ExecuteScriptAsync($"afterConfirmNo()");
            }
        }

        /*
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
                return;
            }
            droppedFiles = (string[])e.Data.GetData(DataFormats.FileDrop);
            HideDragging();
            Drop(e.X - Location.X, e.Y - Location.Y);
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
        */
        public void Script(string name, params object[] args)
        {
            string script = name + "(";
            for (int i = 0; i < args.Length; i++)
            {
                if (i > 0) script += ",";

                object arg = args[i];
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
    }

    public partial class MainForm : Form
    {
        private string dbFilename = "sqlite.db";
        private string setting = "{}";

        async void InitializeAsync()
        {
            var op = new CoreWebView2EnvironmentOptions("--disable-web-security");
            var env = await CoreWebView2Environment.CreateAsync(null, null, op);
            await mainView.EnsureCoreWebView2Async(env);
            mainView.CoreWebView2.AddHostObjectToScript("binder", new Binder(this));
        }

        public MainForm()
        {
            InitializeComponent();
            InitializeAsync();

            int[] rect = { 0, 0, 1024, 768 };
            StreamReader? sr = null;
            try
            {   // 설정 파일 경로
                sr = new StreamReader("config/MediaLibrary.txt", Encoding.UTF8);
                string[] config = sr.ReadToEnd().Split('\n');

                string[] pos = config[0].Trim().Split(',');
                for (int i = 0; i < 4; i++)
                {
                    rect[i] = int.Parse(pos[i]);
                }

                dbFilename = config[1].Trim();

                setting = config[2].Trim();
                for (int i = 3; i < config.Length; i++)
                {
                    setting += config[i];
                }
                setting = setting.Trim();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                rect[0] = (SystemInformation.VirtualScreen.Width - 1024) / 2;
                rect[1] = (SystemInformation.VirtualScreen.Height - 768) / 2;
            }
            finally { sr?.Close(); }

            StartPosition = FormStartPosition.Manual;
            Location = new Point(rect[0], rect[1]);
            Size = new Size(rect[2], rect[3]);

            InitWebView();
        }

        private async void InitWebView()
        {
            await mainView.EnsureCoreWebView2Async(null);
            mainView.Source = new Uri(Path.Combine(Directory.GetCurrentDirectory(), "view/MediaLibrary.html"));
            //mainView.CoreWebView2.Settings.AreDevToolsEnabled = false;
        }

        public void OverrideInitAfterLoad()
        {
            string? base64 = null;
            try
            {
                using (FileStream fs = new FileStream(dbFilename, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    int size = (int)new FileInfo(dbFilename).Length;
                    byte[] bytes = new byte[size];
                    fs.Read(bytes, 0, size);
                    base64 = Convert.ToBase64String(bytes);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }
            Console.WriteLine($"ML.init({setting}, '{{base64}}')");
            Script("ML.init", setting, base64);

            FormClosing += new FormClosingEventHandler(BeforeExit);
        }

        public void OpenFolder(string path)
        {
            Console.WriteLine("OpenFolder");
            List<Dictionary<string, object>> list = new();
            if (Directory.Exists(path))
            {
                string[] dirs = Directory.GetDirectories(path);
                foreach (string dir in dirs)
                {
                    string filepath = dir.Replace("\\", "/"); ;
                    string[] paths = filepath.Split('/');

                    Dictionary<string, object> info = new()
                    {
                        ["path"] = filepath,
                        ["name"] = paths[paths.Length - 1],
                        ["dir"] = true
                    };
                    list.Add(info);
                }
                string[] files = Directory.GetFiles(path);
                foreach (string file in files)
                {
                    string filepath = file.Replace("\\", "/"); ;
                    string[] paths = filepath.Split('/');

                    Dictionary<string, object> info = new()
                    {
                        ["path"] = filepath,
                        ["name"] = paths[paths.Length - 1],
                        ["dir"] = false
                    };
                    list.Add(info);
                }
                Console.WriteLine(list.Count);
                Script("ML.openFolder", path, JsonConvert.SerializeObject(list));
            }
        }
        public void OpenExplorer(string path)
        {
            if (path != null)
            {
                ProcessStartInfo startInfo = new ProcessStartInfo
                {
                    FileName = "explorer"
                ,
                    Arguments = path.Replace("/", "\\")
                };
                Process.Start(startInfo);
            }
        }
        public void RunVideo(string path)
        {
            /*
            ProcessStartInfo startInfo = new ProcessStartInfo
            {
                FileName = "rundll32"
            ,
                Arguments = "url.dll,FileProtocolHandler \"" + path.Replace("/", "\\") + "\""
            };
            */
            ProcessStartInfo startInfo = new ProcessStartInfo
            {
                FileName = "C:\\Program Files\\DAUM\\PotPlayer\\PotPlayer64.exe"
            ,
                Arguments = path.Replace("/", "\\")
            };
            Process.Start(startInfo);
        }
        public void RunBDMV(string path)
        {
            /*
		    $.ajax({
                "url" : "bridge/run.jsp"
			,	"data":{ cmd: "PowerDVD", path: path }
            });
            */
        }

        public void SelectFolder(string after)
        {
            CommonOpenFileDialog dialog = new();
            dialog.IsFolderPicker = true;
            if (dialog.ShowDialog() == CommonFileDialogResult.Ok)
            {
                string path = dialog.FileName;
                Script($"ML.{after}", path);
            }
        }
        public void SelectFolders(string after)
        {
            CommonOpenFileDialog dialog = new();
            dialog.IsFolderPicker = true;
            if (dialog.ShowDialog() == CommonFileDialogResult.Ok)
            {
                string root = dialog.FileName;
                string[] dirs = Directory.GetDirectories(root);
                List<string> list = new();
                foreach (string dir in dirs)
                {
                    string path = dir.Replace("\\", "/");
                    /*
                    SqliteCommand command = conn.CreateCommand();
                    command.CommandText = "SELECT _ FROM anime WHERE path LIKE $path$ OR path LIKE $subpath$";
                    command.Parameters.AddWithValue("$path$", path);
                    command.Parameters.AddWithValue("$subpath$", path + "/%");
                    Console.WriteLine(command.CommandText);
                    SqliteDataReader result = command.ExecuteReader();
                    if (result.Read())
                    {   // 이미 존재하던 폴더
                        continue;
                    }
                    */
                    list.Add(path);
                }
                Script($"ML.{after}", JsonConvert.SerializeObject(list));
            }
        }
        private void BeforeExit(object? sender, FormClosingEventArgs e)
        {
            SaveSetting();
            Script("beforeExit");
        }

        public void SaveSetting(string setting)
        {
            this.setting = setting;
            SaveSetting();
        }
        public void SaveSetting()
        {
            StreamWriter? sw = null;
            try
            {
                RECT offset = new RECT();
                WinAPI.GetWindowRect(Handle.ToInt32(), ref offset);
                string pos = $"{offset.left},{offset.top},{offset.right - offset.left},{offset.bottom - offset.top}";

                // 설정 폴더 없으면 생성
                DirectoryInfo di = new DirectoryInfo("config");
                if (!di.Exists)
                {
                    di.Create();
                }

                sw = new StreamWriter("config/MediaLibrary.txt", false, Encoding.UTF8);
                sw.WriteLine(pos);
                sw.WriteLine(dbFilename);
                sw.Write(setting);

                Script("ML.setSetting", setting);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                Alert("", "설정이 저장되지 않았습니다.");
            }
            finally
            {
                sw?.Close();
            }
        }

        public void Commit(string base64)
        {
            Console.WriteLine("commit");
            try
            {
                File.WriteAllBytes(@dbFilename, Convert.FromBase64String(base64));
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }
        }
    }
}