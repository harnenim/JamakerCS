using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Text;
using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;
using System.Diagnostics;
using SmiEditBridge;
using SmiEdit.addon;

namespace SmiEdit
{
    public partial class MainForm : Form
    {
        public PlayerBridge player = null;

        private readonly Dictionary<string, int> windows = new Dictionary<string, int>();
        private readonly Dictionary<string, Popup> popups = new Dictionary<string, Popup>();

        public string strSettingJson = "불러오기 실패 예제";

        public MainForm()
        {
            // 브라우저 설정
            CefSettings settings = new CefSettings
            {   Locale = "ko"
            ,   CachePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\CEF"
            };
            settings.CefCommandLineArgs.Add("disable-web-security");
            Cef.Initialize(settings);

            InitializeComponent();

            StartPosition = FormStartPosition.Manual;
            Location = new Point(-10000, -10000); // 처음에 안 보이게
            Size = new Size(0, 0);

            SetStyle(ControlStyles.SupportsTransparentBackColor, true);
            BackColor = Color.Transparent;
            AllowTransparency = true;

            mainView.LifeSpanHandler = new LSH(this);
            LoadSetting();
            mainView.LoadUrl(Path.Combine(Directory.GetCurrentDirectory(), "view/editor.html"));
            mainView.JavascriptObjectRepository.Settings.LegacyBindingEnabled = true;
            mainView.JavascriptObjectRepository.Register("binder", new Binder(this), false, BindingOptions.DefaultBinder);

            timer.Interval = 10;
            timer.Enabled = true;
            timer.Tick += FollowWindow;
            timer.Tick += RefreshPlayer;
            timer.Start();

            FormClosing += new FormClosingEventHandler(BeforeExit);
            FormClosed += new FormClosedEventHandler(WebFormClosed);
        }

        public void InitAfterLoad()
        {
            try
            {
                if (InvokeRequired)
                {
                    Invoke(new Action(() => { InitAfterLoad(); }));
                }
                else
                {
                    windows.Add("editor", Handle.ToInt32());

                    Script("init", new string[] { strSettingJson }); // C#에서 객체 그대로 못 보내주므로 json string 만드는 걸로
                    Script("setPlayerDlls", new string[] { "|(없음),PotPlayer|팟플레이어" }); // TODO: dll 폴더 내용물 체크하는 것 필요...
                    Script("setDroppable");

                    WinAPI.GetWindowRect(windows["editor"], ref lastOffset);
                    useFollowWindow = true;
                }
            }
            catch { }
        }
        public void SetWindow(string name, int hwnd)
        {
            RemoveWindow(name); // 남아있을 수 있음
            windows.Add(name, hwnd);
            if (name.Equals("viewer") || name.Equals("finder"))
            {
                if (!LSH.useCustomPopup)
                {
                    Invoke(new Action(() =>
                    {
                        WinAPI.SetTaskbarHide(hwnd);
                    }));
                }
            }
        }
        public void SetWindow(string name, int hwnd, Popup popup)
        {
            RemoveWindow(name); // 남아있을 수 있음
            windows.Add(name, hwnd);
            popups.Add(name, popup);
            popup.mainView.JavascriptObjectRepository.Register("binder", new Binder(this), false, BindingOptions.DefaultBinder);
        }
        public void RemoveWindow(string name)
        {
            windows.Remove(name);
            popups.Remove(name);
        }
        public Popup GetPopup(string name)
        {
            return popups.ContainsKey(name) ? popups[name] : null;
        }
        // window.open 시에 브라우저에 커서 가도록
        public void SetFocus(IWebBrowser chromiumWebBrowser)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() =>
                {
                    SetFocus(chromiumWebBrowser);
                }));
            }
            else
            {
                chromiumWebBrowser.Focus();
            }
        }

        public void RefreshPlayer(object sender, EventArgs e)
        {
            if (player != null)
            {
                if (player.CheckAndRerfreshPlayer())
                {   // 플레이어 살아있음
                    if (player.initialOffset.top + 100 < player.initialOffset.bottom)
                    {   // 유효
                        int fps = player.GetFps();
                        int time = player.GetTime();
                        Script("refreshTime", new object[] { time, fps });
                        UpdateViewerTime(time);
                    }
                    else
                    {   // 실행 직후 초기 위치 가져옴
                        if (player.GetWindowInitialPosition() != null )
                        {   // 초기화 성공
                            player.MoveWindow(); // 설정 위치로 이동
                        }
                    }
                }
            }
        }
        
        public void BeforeExit(object sender, FormClosingEventArgs e)
        {
            e.Cancel = true;
            Script("beforeExit");
        }
        public void DoExit(bool resetPlayer, bool exitPlayer)
        {
            int playerHwnd = GetHwnd("player");
            if (playerHwnd > 0)
            {
                if (resetPlayer)
                {
                    player.ResetPosition();
                }
                if (exitPlayer)
                {
                    player.DoExit();
                }
            }
            Process.GetCurrentProcess().Kill();
        }

        public void WebFormClosed(object sender, FormClosedEventArgs e)
        {
            Process.GetCurrentProcess().Kill();
        }

        #region 창 조작
        private int GetHwnd(string target)
        {
            try
            {
                if (target.Equals("player"))
                {
                    return player.hwnd;
                }
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
                if (!target.Equals("editor"))
                {   // follow window 동작 일시정지
                    WinAPI.GetWindowRect(windows["editor"], ref lastOffset);
                }
                if (!resizable)
                {
                    // TODO: 안 됨.............
                    WinAPI.DisableResize(hwnd);
                }
                if (target.Equals("player"))
                {
                    player.currentOffset.top = y;
                    player.currentOffset.left = x;
                    player.currentOffset.right = x + width;
                    player.currentOffset.bottom = y + height;
                    if (hwnd > 0)
                    {
                        player.MoveWindow();
                    }
                }
                else
                {
                    if (hwnd > 0)
                    {   // 윈도우 그림자 여백 보정
                        WinAPI.MoveWindow(hwnd, x - 7, y, width + 14, height + 9, true);
                        if (target.Equals("editor"))
                        {
                            Script("setDpiBy", new object[] { width });
                        }
                    }
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
        }
        public void SetFollowWindow(bool follow)
        {
            if (follow)
            {
                WinAPI.GetWindowRect(windows["editor"], ref lastOffset);
            }
            useFollowWindow = follow;
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

        bool useFollowWindow = false;
        RECT lastOffset, offset, viewerOffset;
        int saveSettingAfter = 0;
        public void FollowWindow(object sender, EventArgs e)
        {
            if (!useFollowWindow)
            {
                return;
            }
            WinAPI.GetWindowRect(windows["editor"], ref offset);
            if ((   lastOffset.top != offset.top
                 || lastOffset.left != offset.left
                 || lastOffset.right != offset.right
                 || lastOffset.bottom != offset.bottom
                )
             && (offset.top > -32000) // 창 최소화 시 문제
            )
            {
                try
                {
                    int viewer = windows["viewer"];
                    if (viewer > 0)
                    {
                        WinAPI.MoveWindow(viewer, offset.left - lastOffset.left, offset.top - lastOffset.top, ref viewerOffset);
                    }
                }
                catch { }

                int player = this.player.hwnd;
                if (player > 0)
                {
                    this.player.MoveWindow(offset.left - lastOffset.left, offset.top - lastOffset.top);
                }

                lastOffset = offset;
                saveSettingAfter = 300; // 창 이동 후 3초간 변화 없으면 설정 저장
            }
            else if (saveSettingAfter > 0)
            {
                if (--saveSettingAfter == 0)
                {
                    WinAPI.GetWindowRect(windows["editor"], ref offset);
                    Script("eval", new object[] {
                        $"setting.window.x = { offset.left + 7 };"
                    +   $"setting.window.y = { offset.top };"
                    +   $"setting.window.width = { offset.right - offset.left - 14 };"
                    +   $"setting.window.height = { offset.bottom - offset.top - 9 };"
                    });

                    int viewer = windows["viewer"];
                    if (viewer > 0)
                    {
                        WinAPI.GetWindowRect(viewer, ref viewerOffset);
                        Script("eval", new object[] {
                            $"setting.viewer.window.x = { viewerOffset.left + 7};"
                        +   $"setting.viewer.window.y = { viewerOffset.top };"
                        +   $"setting.viewer.window.width = { viewerOffset.right - viewerOffset.left - 14 };"
                        +   $"setting.viewer.window.height = { viewerOffset.bottom - viewerOffset.top - 9 };"
                        });
                    }

                    int player = this.player.hwnd;
                    if (player > 0)
                    {
                        SmiEditBridge.RECT playerOffset = this.player.GetWindowPosition();
                        Script("eval", new object[] {
                            $"setting.player.window.x = { playerOffset.left };"
                        +   $"setting.player.window.y = { playerOffset.top };"
                        +   $"setting.player.window.width = { playerOffset.right - playerOffset.left };"
                        +   $"setting.player.window.height = { playerOffset.bottom - playerOffset.top };"
                        });
                    }
                    Script("saveSetting");
                }
            }
        }
        #endregion

        #region 브라우저 통신
        protected string Script(string name) { return mainView.Script(name); }
        protected string Script(string name, object[] args) { return mainView.Script(name, args); }
        //protected string Script(string name, string arg) { return mainView.Script(name, arg); }

        protected void ScriptToPopup(string name, string func, object arg)
        {
            if (LSH.useCustomPopup)
            {
                if (popups.ContainsKey(name))
                {
                    popups[name].Script(func, arg);
                }
            }
            else
            {
                if (name.Equals("viewer"))
                {
                    Script("SmiEditor.Viewer.window." + func, new object[] { arg });
                }
                else if (name.Equals("finder"))
                {
                    Script("SmiEditor.Finder.window." + func, new object[] { arg });
                }
            }
        }
        
        // Finder, Viewer는 팝업 형태 제한
        public void SendMsg(string target, string msg) { ScriptToPopup(target, "sendMsg", msg); }
        public void OnloadFinder (string last ) { ScriptToPopup("finder", "init", last); }
        public void RunFind      (string param) { mainView.Script("SmiEditor.Finder.runFind"      , param); }
        public void RunReplace   (string param) { mainView.Script("SmiEditor.Finder.runReplace"   , param); }
        public void RunReplaceAll(string param) { mainView.Script("SmiEditor.Finder.runReplaceAll", param); }

        public void UpdateViewerSetting(     ) { ScriptToPopup("viewer", "setSetting", strSettingJson); }
        public void UpdateViewerTime(int time) { ScriptToPopup("viewer", "refreshTime", time); }
        private string viewerLines = "[]";
        public void UpdateViewerLines(string lines) {
        	ScriptToPopup("viewer", "setLines", viewerLines = lines);
        }
        #endregion

        #region 설정
        private void LoadSetting()
        {
            try
            {
                StreamReader sr = new StreamReader("view/setting.json", Encoding.UTF8);
                strSettingJson = sr.ReadToEnd();
                sr.Close();

                //setting = JObject.Parse(strSettingJson);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }
        }

        public void SaveSetting(string strSettingJson)
        {
            this.strSettingJson = strSettingJson;
            Console.WriteLine("save setting: " + strSettingJson);

            //setting = JObject.Parse(strSettingJson);

            StreamWriter sw = new StreamWriter("view/setting.json", false, Encoding.UTF8);
            sw.WriteLine(strSettingJson);
            sw.Close();
            
            UpdateViewerSetting();
        }

        public void SetPlayer(string dll, string exe)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() =>
                {
                    SetPlayer(dll, exe);
                }));
            }
            else
            {
                // TODO: DLL 불러오기 필요?
                player = new PotPlayerBridge(exe);
            }
        }

        public void RunPlayer(string path)
        {
            if (player.hwnd > 0) return;

            try
            {
                Console.WriteLine("path: " + path);
                ProcessStartInfo startInfo = new ProcessStartInfo
                {   FileName = path
                ,   Arguments = null
                };
                Process.Start(startInfo);
            }
            catch { }
        }
        #endregion

        #region 메뉴
        private void KeyDownInMenuStrip(object sender, KeyEventArgs e)
        {   // 메뉴를 다 끈 다음에야 이벤트가 잡히는 듯...?
            switch (e.KeyCode)
            {
                case Keys.Tab: // 안 먹힘...
                case Keys.Alt: // Alt로는 안 먹히고
                case Keys.Menu: // Menu로 먹힘
                case Keys.Escape:
                    mainView.Focus();
                    break;
            }
        }

        public void SetMenus(string[][] menus)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() =>
                {
                    SetMenus(menus);
                }));
            }
            else
            {
                menuStrip.Items.Clear();
                foreach (string[] menu in menus)
                {
                    string menuName = menu[0];
                    ToolStripMenuItem menuItem = new ToolStripMenuItem
                    {   Text = menuName
                    ,   Name = menuName.Split('(')[0]
                    ,   Size = new Size(60, 20)
                    };
                    menuStrip.Items.Add(menuItem);

                    for (int i = 1; i < menu.Length; i++)
                    {
                        string[] tmp = menu[i].Split('|');
                        string subMenuName = tmp[0];
                        if (tmp.Length == 2)
                        {
                            string subMenuFunc = tmp[1];
                            if (subMenuFunc.Length > 0)
                            {
                                ToolStripMenuItem subMenuItem = new ToolStripMenuItem
                                {   Text = subMenuName
                                ,   Name = subMenuName.Split('(')[0]
                                ,   Size = new Size(200, 22)
                                };
                                subMenuItem.Click += new EventHandler(new EventHandler((object sender, EventArgs e) => {
                                    Console.WriteLine(tmp[1]);
                                    Script("eval", new object[] { tmp[1] });
                                }));
                                menuItem.DropDownItems.Add(subMenuItem);
                            }
                        }
                    }
                }
            }
        }
        public void FocusToMenu(int keyCode)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => {
                    FocusToMenu(keyCode);
                }));
            }
            else
            {
                menuStrip.Focus();
                ToolStripMenuItem toOpen = (ToolStripMenuItem)menuStrip.Items[0];
                foreach (ToolStripItem item in menuStrip.Items)
                {
                    int index = item.Text.IndexOf("&") + 1;
                    if (index > 0)
                    {
                        char key = item.Text.ToUpper().ToCharArray()[index];
                        if (key == keyCode)
                        {
                            toOpen = (ToolStripMenuItem)item;
                            break;
                        }
                    }
                }
                toOpen.ShowDropDown();
                toOpen.Select();
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
                Script("setShowDrag", new object[] { true });
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
                Script("setShowDrag", new object[] { false });
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

        const string FileDialogFilter = "SAMI 자막 파일|*.smi";

        private void DropListFile(DragEventArgs e)
        {
            try
            {
                string[] strFiles = (string[])e.Data.GetData(DataFormats.FileDrop);
                foreach (string strFile in strFiles)
                {
                    if (strFile.ToUpper().EndsWith(".SMI"))
                    {
                        LoadFile(strFile);
                        break;
                    }
                }
            }
            catch { }
        }

        public void OpenFile()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => {
                    OpenFile();
                }));
            }
            else
            {
                OpenFileDialog dialog = new OpenFileDialog{ Filter = FileDialogFilter };
                if (dialog.ShowDialog() == DialogResult.OK)
                {
                    LoadFile(dialog.FileName);
                }
            }
        }
        private void LoadFile(string path)
        {
            string text = "";
            Encoding encoding = TextFile.BOM.DetectEncoding(path); // TODO: BOM 없으면 버그 있나...?
            //Console.WriteLine("encoding: " + encoding);
            StreamReader sr = null;
            try
            {
                sr = new StreamReader(path, encoding);
                text = sr.ReadToEnd();
            }
            catch { }
            finally { if (sr != null) sr.Close(); }

            Script("openFile", new string[] { path, text });
        }
        public void CheckLoadVideoFile(string smiPath)
        {
            string[] exts = new string[] { "mkv", "mp4", "avi", "m2ts", "ts" }; // TODO: 우선순위 설정 기능...?
            string withoutExt = smiPath.Substring(0, smiPath.Length - 4);
            foreach (string ext in exts)
            {
                string videoPath = withoutExt + "." + ext;
                if (File.Exists(videoPath))
                {
                    Script("confirmLoadVideo", new string[] { videoPath });
                    return;
                }
            }
        }
        public void LoadVideoFile(string path)
        {
            player.OpenFile(path);
        }

        public void Save(string text, string path)
        {
            if (path == null || path.Length == 0)
            {
                if (InvokeRequired)
                {
                    Invoke(new Action(() => {
                        Save(text, path);
                    }));
                    return;
                }
                else
                {
                    SaveFileDialog dialog = new SaveFileDialog{ Filter = FileDialogFilter };
                    if (dialog.ShowDialog() != DialogResult.OK)
                    {   // 저장 취소
                        return;
                    }
                    path = dialog.FileName;
                }
            }

            StreamWriter sw = null;
            try
            {   // 무조건 UTF-8로 저장
                (sw = new StreamWriter(path, false, Encoding.UTF8)).Write(text);
                Script("afterSaveFile", new object[] { path });
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                Script("alert", new object[] { "저장되지 않았습니다." });
            }
            finally
            {
                if (sw != null) sw.Close();
            }
        }
        #endregion

        #region 부가기능
        public void RunColorPicker()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { RunColorPicker(); }));
            }
            else
            {
                new ColorPicker(this).ShowDialog(this);
            }
        }
        public void InputText(string text)
        {
            Script("SmiEditor.inputText", new object[] { text });
        }
        public void AfterTransform(string text)
        {
            Script("SmiEditor.afterTransform", new object[] { text });
        }
        #endregion

        public void Test(object obj)
        {
            Console.WriteLine(obj);
            //Script("test", new object[] { obj });
            //mainView.JavascriptObjectRepository.Register("test", obj, false, BindingOptions.DefaultBinder);
            //Script("eval", new object[] { "console.log(test)" });
        }
    }
}
