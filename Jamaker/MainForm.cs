using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Text;
using System.Windows.Forms;
using CefSharp;
using System.Diagnostics;
using Jamaker.addon;
using System.Reflection;
using System.Threading;

namespace Jamaker
{
    public partial class MainForm : Form
    {
        public PlayerBridge.PlayerBridge player = null;

        private string strSettingJson = "불러오기 실패 예제";
        private string strBridgeList = "NoPlayer: (없음)"; // 기본값
        private string strHighlights = "SyncOnly: 싱크 줄 구분\neclipse: 이클립스 스타일";
        private readonly Dictionary<string, string> bridgeDlls = new Dictionary<string, string>();

        public MainForm()
        {
            string ProcName = Process.GetCurrentProcess().ProcessName;
            if (Process.GetProcessesByName(ProcName).Length > 1) {
                MessageBox.Show($"{ProcName}는 이미 실행 중입니다.");
                Process.GetCurrentProcess().Kill();
            }

            WebForm();
            OverrideInitializeComponent();

            menuStrip.MouseDown += (clickMenuStrip = new MouseEventHandler(MouseDownInMenuStrip)); // 디자이너에 넣으면 오류 발생

            StartPosition = FormStartPosition.Manual;
            Location = new Point(-10000, -10000); // 처음에 안 보이게

            SetStyle(ControlStyles.SupportsTransparentBackColor, true);
            BackColor = Color.Transparent;
            AllowTransparency = true;

            mainView.LifeSpanHandler = new LSH(this);
            LoadSetting();
            mainView.LoadUrl(Path.Combine(Directory.GetCurrentDirectory(), "view/editor.html"));
            mainView.JavascriptObjectRepository.Settings.LegacyBindingEnabled = true;
            mainView.JavascriptObjectRepository.Register("binder", new Binder(this), false, BindingOptions.DefaultBinder);
            mainView.RequestHandler = new RequestHandler(); // TODO: 팝업에서 이동을 막아야 되는데...

            timer.Interval = 10;
            timer.Enabled = true;
            timer.Tick += FollowWindow;
            timer.Tick += RefreshPlayer;
            timer.Tick += FocusIfRequested;
            timer.Start();

            FormClosing += new FormClosingEventHandler(BeforeExit);
            FormClosed += new FormClosedEventHandler(WebFormClosed);

            // 실행 직후 섬네일 남은 게 있으면 삭제
            ClearThumbnails();
        }
        private MenuStrip menuStrip;
        private readonly MouseEventHandler clickMenuStrip;
        private void OverrideInitializeComponent()
        {
            menuStrip = new MenuStrip
            {
                Location = new Point(0, 0),
                Name = "menuStrip",
                Size = new Size(layerForDrag.Width, 0),
                TabIndex = 1,
                Text = "menuStrip"
            };
            menuStrip.MenuDeactivate += new EventHandler(EscapeMenuFocusAfterCheck);
            menuStrip.KeyDown += new KeyEventHandler(KeyDownInMenuStrip);
            menuStrip.LostFocus += new EventHandler(CloseMenuStrip);
            Controls.Add(menuStrip);
            MainMenuStrip = menuStrip;

            ResizeAfterRefreshMenuStrip();
        }
        private void ResizeAfterRefreshMenuStrip()
        {
            layerForDrag.Visible = true;
            ResumeLayout(false);

            mainView.Location = new Point(0, menuStrip.Height);
            mainView.Size = new Size(layerForDrag.Width, layerForDrag.Height);
            layerForDrag.Visible = false;
            ResumeLayout(false);
        }

        public void OverrideInitAfterLoad()
        {
            try
            {
                Script("init", new object[] { strSettingJson, false }); // C#에서 객체 그대로 못 보내주므로 json string 만드는 걸로
                Script("setPlayerDlls", strBridgeList); // 플레이어 브리지 추가 가능토록
                Script("setHighlights", strHighlights);
                Script("setDroppable");

                WinAPI.GetWindowRect(windows["editor"], ref lastOffset);
                useFollowWindow = true;
            }
            catch { }
        }
        public void OverrideSetWindow(string name, int hwnd)
        {
            if ((LSH.useCustomPopup < 1 && name.Equals("viewer"))
             || (LSH.useCustomPopup < 2 && name.Equals("finder")))
            {
                WinAPI.SetTaskbarHide(hwnd);
            }
        }

        private int refreshPlayerIndex = 0;
        private void RefreshPlayer(object sender, EventArgs e)
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

                        if (++refreshPlayerIndex % 100 == 0)
                        {   // 1초마다 파일명 확인
                            refreshPlayerIndex = 0;
                            player.GetFileName();
                        }
                    }
                    else
                    {   // 실행 직후 초기 위치 가져옴
                        if (player.GetWindowInitialPosition() != null )
                        {   // 초기화 성공
                            player.MoveWindow(); // 설정 위치로 이동
                        }
                    }

                    // 저장 대화상자를 띄우기 위해 현재 영상 파일명 요청 후 대기
                    if (saveAfter > 0)
                    {
                        saveAfter--;
                        if (saveAfter == 0)
                        {   // 파일명 응답 대기 시간 만료
                            if (saveAfter > 0) SaveWithDialogAfterGetVideoFileName("-");
                        }
                    }
                }
                else
                {   // 플레이어 죽었으면 바로 저장 대화상자 띄우기
                    if (saveAfter > 0)
                    {
                        saveAfter = 0;
                        SaveWithDialogAfterGetVideoFileName("-");
                    }
                }
            }
            else
            {   // 플레이어 죽었으면 바로 저장 대화상자 띄우기
                if (saveAfter > 0)
                {
                    saveAfter = 0;
                    SaveWithDialogAfterGetVideoFileName("-");
                }
            }
        }

        private void BeforeExit(object sender, FormClosingEventArgs e)
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

        private void WebFormClosed(object sender, FormClosedEventArgs e)
        {
            Process.GetCurrentProcess().Kill();
        }

        #region 창 조작
        private int OverrideGetHwnd(string target)
        {
            try
            {
                if (target.Equals("player"))
                {
                    return player == null ? 0 : player.hwnd;
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
                    if (player != null)
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
                }
                else
                {
                    if (hwnd > 0)
                    {   // 윈도우 그림자 여백 보정
                        WinAPI.MoveWindow(hwnd, x - 7, y, width + 14, height + 9, true);
                        if (target.Equals("editor"))
                        {
                            Script("setDpiBy", width);
                        }
                    }
                }
            }
            catch { }
        }

        public void OverrideFocusWindow(string target)
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
        private void FollowWindow(object sender, EventArgs e)
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
                int moveX = offset.left - lastOffset.left;
                int moveY = offset.top - lastOffset.top;
            	
                try
                {
                    int viewer = windows["viewer"];
                    if (viewer > 0)
                    {
                        int vMoveX = moveX;
                        int vMoveY = moveY;
                        WinAPI.GetWindowRect(viewer, ref viewerOffset);
                        if (viewerOffset.left - lastOffset.left > lastOffset.right - viewerOffset.left)
                        {   // 오른쪽 경계에 더 가까울 땐 오른쪽을 따라감
                            vMoveX = offset.right - lastOffset.right;
                        }
                        if (viewerOffset.top - lastOffset.top > lastOffset.top - viewerOffset.top)
                        {   // 아래쪽 경계에 더 가까울 땐 아래쪽을 따라감
                            vMoveY = offset.bottom - lastOffset.bottom;
                        }
                        WinAPI.MoveWindow(viewer, vMoveX, vMoveY, ref viewerOffset);
                    }
                }
                catch { }

                int player = this.player == null ? 0 : this.player.hwnd;
                if (player > 0)
                {
                    int pMoveX = moveX;
                    int pMoveY = moveY;
                    PlayerBridge.RECT playerOffset = this.player.GetWindowPosition();
                    if (playerOffset.left - lastOffset.left > lastOffset.right - playerOffset.left)
                    {   // 오른쪽 경계에 더 가까울 땐 오른쪽을 따라감
                        pMoveX = offset.right - lastOffset.right;
                    }
                    if (playerOffset.top - lastOffset.top > playerOffset.top - viewerOffset.top)
                    {   // 아래쪽 경계에 더 가까울 땐 아래쪽을 따라감
                        pMoveY = offset.bottom - lastOffset.bottom;
                    }
                    this.player.MoveWindow(pMoveX, pMoveY);
                }

                lastOffset = offset;
                saveSettingAfter = 300; // 창 이동 후 3초간 변화 없으면 설정 저장

                Script("refreshPaddingBottom");
            }
            else if (saveSettingAfter > 0)
            {
                if (--saveSettingAfter == 0)
                {
                    WinAPI.GetWindowRect(windows["editor"], ref offset);
                    Script("eval", 
                        $"setting.window.x = { offset.left + 7 };"
                    +   $"setting.window.y = { offset.top };"
                    +   $"setting.window.width = { offset.right - offset.left - 14 };"
                    +   $"setting.window.height = { offset.bottom - offset.top - 9 };"
                    );

                    int viewer = windows["viewer"];
                    if (viewer > 0)
                    {
                        WinAPI.GetWindowRect(viewer, ref viewerOffset);
                        Script("eval",
                            $"setting.viewer.window.x = { viewerOffset.left + 7};"
                        +   $"setting.viewer.window.y = { viewerOffset.top };"
                        +   $"setting.viewer.window.width = { viewerOffset.right - viewerOffset.left - 14 };"
                        +   $"setting.viewer.window.height = { viewerOffset.bottom - viewerOffset.top - 9 };"
                        );
                    }

                    int player = this.player.hwnd;
                    if (player > 0)
                    {
                        PlayerBridge.RECT playerOffset = this.player.GetWindowPosition();
                        Script("eval",
                            $"setting.player.window.x = { playerOffset.left };"
                        +   $"setting.player.window.y = { playerOffset.top };"
                        +   $"setting.player.window.width = { playerOffset.right - playerOffset.left };"
                        +   $"setting.player.window.height = { playerOffset.bottom - playerOffset.top };"
                        );
                    }
                    Script("saveSetting");
                }
            }
        }
        #endregion

        #region 브라우저 통신

        private void ScriptToPopup(string name, string func, object arg)
        {
            if (LSH.useCustomPopup < 1 && name.Equals("viewer"))
            {
                Script("SmiEditor.Viewer.window." + func, arg);
            }
            else if (LSH.useCustomPopup < 2 && name.Equals("finder"))
            {
                Script("SmiEditor.Finder.window." + func, arg);
            }
            else if (popups.ContainsKey(name))
            {
                popups[name].Script(func, arg);
            }
        }
        
        // Finder, Viewer는 팝업 형태 제한
        public void SendMsg(string target, string msg) { ScriptToPopup(target, "sendMsg", msg); }
        public void OnloadFinder() { Script("SmiEditor.Finder.onload"); }
        public void OnloadFinder (string last ) { ScriptToPopup("finder", "init", last); }
        public void RunFind      (string param) { Script("SmiEditor.Finder.runFind"      , param); }
        public void RunReplace   (string param) { Script("SmiEditor.Finder.runReplace"   , param); }
        public void RunReplaceAll(string param) { Script("SmiEditor.Finder.runReplaceAll", param); }

        public void UpdateViewerSetting(     ) {
            ScriptToPopup("viewer", "setSetting", strSettingJson);
            ScriptToPopup("viewer", "setLines", viewerLines);
        }
        private void UpdateViewerTime(int time) {
            ScriptToPopup("viewer", "refreshTime", time);
            if (LSH.useCustomPopup > 0)
            {
                Popup viewer = GetPopup("viewer");
                if (viewer != null)
                {
                    int h = time;
                    int ms = h % 1000; h = (h - ms) / 1000;
                    int s = h % 60; h = (h - s) / 60;
                    int m = h % 60; h = (h - m) / 60;
                    string title = $"미리보기 - {h}:{ (m > 9 ? "" : "0") + m }:{ (s > 9 ? "" : "0") + s }:{ (ms > 99 ? "" : "0") + (ms > 9 ? "" : "0") + ms }";
                    viewer.SetTitle(title);
                }
            }
        }
        private string viewerLines = "[]";
        public void UpdateViewerLines(string lines) {
        	ScriptToPopup("viewer", "setLines", viewerLines = lines);
        }
        #endregion

        #region 설정
        private void LoadSetting()
        {
        	StreamReader sr = null;
            try
            {   // 설정 파일 경로
                sr = new StreamReader("setting/Jamaker.json", Encoding.UTF8);
                strSettingJson = sr.ReadToEnd();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                try
                {   // 구버전 설정 파일 경로
                    sr = new StreamReader("view/setting.json", Encoding.UTF8);
                    strSettingJson = sr.ReadToEnd();
                }
                catch (Exception e2) { Console.WriteLine(e2); }
            }
            finally { sr?.Close(); }

            try
            {
                sr = new StreamReader("bridge/list.txt", Encoding.UTF8);
                strBridgeList = sr.ReadToEnd();
            }
            catch (Exception e) { Console.WriteLine(e); }
            finally { sr?.Close(); }

            try
            {
                sr = new StreamReader("view/lib/highlight/list.txt", Encoding.UTF8);
                strHighlights = sr.ReadToEnd();
            }
            catch (Exception e) { Console.WriteLine(e); }
            finally { sr?.Close(); }

            string[] bridgeList = strBridgeList.Split('\n');
            for (int i = 0; i < bridgeList.Length; i++)
            {
                string strBridge = bridgeList[i].Trim();
                int devider = strBridge.IndexOf(":");
                if (devider > 0)
                {
                    string[] bridge = { strBridge.Substring(0, devider).Trim(), strBridge.Substring(devider + 1).Trim() };
                    bridgeDlls.Add(bridge[0], bridge[1]);
                }
            }
        }

        public void RepairSetting()
        {
            // 백지 상태에서 시작
            strSettingJson = "";

            StreamReader sr = null;
            try
            {
                // 설정 폴더 없으면 생성
                DirectoryInfo di = new DirectoryInfo("setting");
                if (!di.Exists)
                {
                    di.Create();
                }
                else
                {
                    if (File.Exists("setting/Jamaker.json"))
                    {   // 설정파일 있는데 여기로 왔으면 설정파일이 깨졌다는 의미
                        File.Delete("setting/Jamaker.json");
                    }
                    if (File.Exists("setting/Jamaker.json.bak"))
                    {   // 백업 파일 존재하면 가져오기
                        File.Move("setting/Jamaker.json.bak", "setting/Jamaker.json");
                        sr = new StreamReader("setting/Jamaker.json", Encoding.UTF8);
                        strSettingJson = sr.ReadToEnd();
                    }
                }
            }
            catch (Exception e) { Console.WriteLine(e); }
            finally { sr?.Close(); }

            // 프로그램 다시 초기화
            Script("init", new object[] { strSettingJson, true });
        }

        public void SaveSetting(string strSettingJson)
        {
            this.strSettingJson = strSettingJson;

            try
            {
                // 설정 폴더 없으면 생성
                DirectoryInfo di = new DirectoryInfo("setting");
                if (!di.Exists)
                {
                    di.Create();
                }
                else if (File.Exists("setting/Jamaker.json"))
                {
                    // 기존 설정파일 백업 후 진행
                    if (File.Exists("setting/Jamaker.json.bak"))
                    {
                        File.Delete("setting/Jamaker.json.bak");
                    }
                    File.Move("setting/Jamaker.json", "setting/Jamaker.json.bak");
                }

                StreamWriter sw = new StreamWriter("setting/Jamaker.json", false, Encoding.UTF8);
                sw.Write(strSettingJson);
                sw.Close();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            UpdateViewerSetting();
        }

        private string[] videoExts = new string[] { "mkv", "mp4", "avi", "wmv", "m2ts", "ts" };
        public void SetVideoExts(string exts)
        {
            videoExts = exts.Split(',');
        }

        public void SetPlayer(string dll, string path, bool withRun)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() =>
                {
                    SetPlayer(dll, path, withRun);
                }));
            }
            else
            {
                // 플레이어 선택이 바뀌었으면 연결 끊기
                if (player != null && !dll.Equals(player.GetType().Name))
                {
                    player = null;
                }

                string[] paths = path.Replace('\\', '/').Split('/');
                string exe = paths[paths.Length - 1];

                // 잔여 플레이어가 없으면 실행
                if (player == null)
                {
                    try
                    {   // DLL 파일 동적 호출
                        string dllPath = Path.Combine(Directory.GetCurrentDirectory(), $"bridge/{dll}.dll");
                        Assembly asm = Assembly.LoadFile(dllPath);
                        Type[] types = asm.GetExportedTypes();
                        player = (PlayerBridge.PlayerBridge)Activator.CreateInstance(types[0]);
                    }
                    catch
                    {
                        Script("alert", "플레이어 브리지 라이브러리가 없습니다.");
                    }
                    player?.SetEditorHwnd(Handle.ToInt32());
                }

                // 플레이어 있으면 exe 파일 설정
                if (player != null)
                {
                    player.FindPlayer(exe);

                    if (withRun && player.hwnd == 0)
                    {
                        try
                        {
                            ProcessStartInfo startInfo = new ProcessStartInfo
                            {   FileName = path
                            ,   Arguments = null
                            };
                            Process.Start(startInfo);
                        }
                        catch { }
                    }
                }
            }
        }
        
        public void SelectPlayerPath() {
            if (InvokeRequired)
            {
                Invoke(new Action(() => {
                    SelectPlayerPath();
                }));
            }
            else
            {
                OpenFileDialog dialog = new OpenFileDialog{ Filter = "실행 파일|*.exe" };
                if (dialog.ShowDialog() == DialogResult.OK)
                {
                    Script("afterSelectPlayerPath", dialog.FileName);
                }
            }
        }

        public string afterInitAddon = "";
        public void SetAfterInitAddon(string func)
        {
            afterInitAddon = func;
        }
        public void LoadAddonSetting(string path)
        {
            string setting = "";
            try
            {   // addon 설정 파일 경로
                StreamReader sr = new StreamReader($"setting/addon_{path}", Encoding.UTF8);
                setting = sr.ReadToEnd();
                sr.Close();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                try
                {   // 구버전 addon 설정 파일 경로
                    StreamReader sr = new StreamReader($"view/addon/{path}", Encoding.UTF8);
                    setting = sr.ReadToEnd();
                    sr.Close();
                }
                catch (Exception e2)
                {
                    Console.WriteLine(e2);
                }
            }
            Script("afterLoadAddonSetting", setting.Replace("\r\n", "\n"));
        }
        public void SaveAddonSetting(string path, string text)
        {
            try
            {
                // 설정 폴더 없으면 생성
                DirectoryInfo di = new DirectoryInfo("setting");
                if (!di.Exists)
                {
                    di.Create();
                }

                StreamWriter sw = new StreamWriter($"setting/addon_{path}", false, Encoding.UTF8);
                sw.Write(text);
                sw.Close();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }
            Script("afterSaveAddonSetting");
        }
        #endregion

        #region 메뉴
        private void MouseDownInMenuStrip(object sender, MouseEventArgs e)
        {
            menuStrip.Focus();
        }
        private void KeyDownInMenuStrip(object sender, KeyEventArgs e)
        {   
            switch (e.KeyCode)
            {
                case Keys.Tab: // 안 먹힘...
                case Keys.Alt: // Alt로는 안 먹히고
                case Keys.Menu: // Menu로 먹힘
                case Keys.Escape:
                    e.Handled = true;
                    mainView.Focus();
                    break;
            }
        }
        private void EscapeMenuFocusAfterCheck(object sender, EventArgs e)
        {
            foreach (ToolStripMenuItem item in menuStrip.Items)
            {
                if (item.Checked) return;
            }
            mainView.Focus();
        }
        private void CloseMenuStrip(object sender, EventArgs e)
        {
            CloseMenuStrip();
        }
        private void CloseMenuStrip()
        {
            foreach (ToolStripMenuItem item in menuStrip.Items)
            {
                item.Checked = false;
                item.HideDropDown();
            }
        }

        public void SetMenus(string[][] menus)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { SetMenus(menus); }));
                return;
            }
            menuStrip.Items.Clear();
            foreach (string[] menu in menus)
            {
                string menuName = menu[0];
                ToolStripMenuItem menuItem = new ToolStripMenuItem
                {   Text = menuName
                ,   Name = menuName.Split('(')[0]
                ,   Size = new Size(60, 20)
                };
                menuItem.MouseDown += clickMenuStrip;
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
                                Script("eval", tmp[1]);
                            }));
                            menuItem.DropDownItems.Add(subMenuItem);
                        }
                    }
                }
            }
            ResizeAfterRefreshMenuStrip();
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
                // 메뉴에 포커스 주기
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
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Style", "IDE0060:사용하지 않는 매개 변수를 제거하세요.", Justification = "<보류 중>")]
        private void OverrideDrop(int x, int y)
        {
            try
            {
                foreach (string strFile in droppedFiles)
                {
                    if (strFile.ToUpper().EndsWith(".SMI") || strFile.ToUpper().EndsWith(".SRT"))
                    {
                        LoadFile(strFile);
                        break;
                    }
                }
            }
            catch { }
        }
        #endregion

        #region 파일

        private delegate void AfterGetString(string str);
        private AfterGetString afterGetFileName = null;
        protected override void WndProc(ref Message m)
        {
            // 파일명 말곤 수신할 일 없다는 가정
            if (player != null)
            {
                string path = player.AfterGetFileName(m);
                if (path != null)
                {
                    afterGetFileName?.Invoke(path);
                    Script("setVideo", new object[] { path });
                }
            }

            base.WndProc(ref m);
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
                OpenFileDialog dialog = new OpenFileDialog{ Filter = "지원되는 자막 파일|*.smi;*.srt" };
                if (dialog.ShowDialog() == DialogResult.OK)
                {
                    LoadFile(dialog.FileName);
                }
            }
        }
        public void OpenFileForVideo()
        {
            // 파일명 수신 시 동작 설정
            afterGetFileName = new AfterGetString(OpenFileAfterGetVideoFileName);
            // player에 현재 재생 중인 파일명 요청
            player.GetFileName();
        }
        private void OpenFileAfterGetVideoFileName(string path)
        {
            afterGetFileName = null;
            if (path != null && path.Length > 0)
            {
                int index = path.LastIndexOf('.');
                if (index > 0)
                {
                    LoadFile(path.Substring(0, index) + ".smi", true);
                }
            }
        }
        
        private void LoadFile(string path)
        {
            LoadFile(path, false);
        }
        private void LoadFile(string path, bool forVideo)
        {
            string text = "";
            StreamReader sr = null;
            try
            {
                sr = new StreamReader(path, DetectEncoding(path));
                text = sr.ReadToEnd();
            }
            catch
            {
                Script("alert", "파일을 열지 못했습니다.");
            }
            finally { sr?.Close(); }

            Script("openFile", new object[] { path, text, forVideo });
        }

        private string smiPath;
        public void CheckLoadVideoFile(string path)
        {
            // 파일명 수신 시 동작 설정
            afterGetFileName = new AfterGetString(CheckLoadVideoFileAfterGetVideoFileName);
            smiPath = path;
            // player에 현재 재생 중인 파일명 요청
            player.GetFileName();
        }
        private void CheckLoadVideoFileAfterGetVideoFileName(string path)
        {
            afterGetFileName = null;
            if (path != null && path.Length > 0)
            {
                string withoutExt = path.Substring(0, path.LastIndexOf('.'));
                string smiWithoutExt = smiPath.Substring(0, smiPath.LastIndexOf('.'));
                if (withoutExt.Equals(smiWithoutExt))
                {
                    // 현재 열려있는 동영상 파일이 자막과 일치 -> 추가동작 없음
                }
                else
                {
                    foreach (string ext in videoExts)
                    {
                        string videoPath = smiWithoutExt + "." + ext;
                        if (File.Exists(videoPath))
                        {
                            Script("confirmLoadVideo", videoPath);
                            return;
                        }
                    }
                }
            }
        }
        public void LoadVideoFile(string path)
        {
            player.OpenFile(path);
        }
        private string requestFramesPath = null;
        public void RequestFrames(string path)
        {
            // 아주 오래 걸리진 않는 작업
            // 키프레임 신뢰 버튼 쪽에 프로그레스
        	requestFramesPath = path;
            new Thread(() =>
            {
                try
                {
                    FileInfo info = new FileInfo(path);
                    string fkfName = $"{info.Name.Substring(0, info.Name.Length - info.Extension.Length)}.{info.Length}.fkf";

                    // 기존에 있으면 가져오기
                    try
                    {
                        DirectoryInfo di = new DirectoryInfo("temp");
                        if (di.Exists)
                        {
                            VideoInfo.FromFkfFile("temp/" + fkfName);
                            Script("Progress.set", new object[] { "#forFrameSync", 1 });
                            Script("loadFkf", new object[] { fkfName });
                            return;
                        }
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine(e);
                    }

                    // 없으면 새로 가져오기
                    new VideoInfo(path, (double ratio) => {
                        if (requestFramesPath == path)
                        {   // 중간에 다른 파일 불러왔을 수도 있음
                            Script("Progress.set", new object[] { "#forFrameSync", ratio });
                        }
                    }).RefreshInfo((VideoInfo videoInfo) =>
                    {
                        Script("Progress.set", new object[] { "#forFrameSync", 1 });
                        videoInfo.ReadKfs(true);
                        videoInfo.SaveFkf("temp/" + fkfName);
                        if (requestFramesPath == path)
                        {   // 중간에 다른 파일 불러왔을 수도 있음
                            Script("loadFkf", new object[] { fkfName });
                        }
                    });
                }
                catch (Exception e) { Console.WriteLine(e); }
            }).Start();
        }
        private bool isThumbnailsRendering = false;
        public void RenderThumbnails(string path, string paramsStr)
        {
            Console.WriteLine($"RenderThumbnails: {paramsStr}");
            isThumbnailsRendering = true;
            string[] list = paramsStr.Split('\n');
            new Thread(() =>
            {
                string exePath = Path.Combine(Directory.GetCurrentDirectory(), "ffmpeg");
                string exeFile = Path.Combine(exePath, "ffmpeg.exe");

                string dir = "temp/thumbnails";
                DirectoryInfo di = new DirectoryInfo(dir);
                if (!di.Exists)
                {
                    di.Create();
                }

                int didread;
                int offset = 0;
                byte[] buffer = new byte[sizeof(float) * (1024 + 1)];

                foreach (string paramStr in list)
                {
                    // 중간에 작업 끊은 경우
                    if (!isThumbnailsRendering)
                    {
                        //ClearThumbnails(); // 스레드 충돌 생김
                        break;
                    }
                    string[] param = paramStr.Split(',');
                    int time = int.Parse(param[0]);
                    double length = double.Parse(param[1]) / 1000;
                    int begin = int.Parse(param[2]);
                    int end = int.Parse(param[3]);
                    string flag = param[4];
                    double fps = (end - begin - 1) / length;

                    int ms = time % 60000;
                    int m = time / 60000;
                    int h = m / 60;
                    m %= 60;
                    string timeStr = ((100 + h) * 100 + m) * 100000 + ms + "";
                    timeStr = timeStr.Substring(1, 2) + ":" + timeStr.Substring(3, 2) + ":" + timeStr.Substring(5, 2) + "." + timeStr.Substring(7, 3);

                    string vf = "";
                    //if (flag == "b") vf = "-vf \"curves=r='0/0 0.1/0.9 1/1'\" ";
                    //else
                    //if (flag == "d") vf = "-vf \"curves=r='0/0 0.9/0.1 1/1'\" ";

                    string args = $"-ss {timeStr} -t {length} -i \"{path}\" -s 96x54 -qscale:v 2 -r {fps} {vf}-f image2 \"{dir}/{begin}{flag}_%d.jpg\"";

                    try
                    {
                        Process proc = new Process();
                        proc.StartInfo.UseShellExecute = false;
                        proc.StartInfo.CreateNoWindow = true;
                        proc.StartInfo.RedirectStandardOutput = true;
                        proc.StartInfo.RedirectStandardError = true;
                        proc.StartInfo.FileName = exeFile;
                        proc.StartInfo.Arguments = args;
                        proc.Start();
                        proc.BeginErrorReadLine();

                        Stream stream = proc.StandardOutput.BaseStream;

                        while ((didread = stream.Read(buffer, offset, sizeof(float) * 1024)) != 0)
                        {
                            Console.WriteLine(didread);
                        }

                        new Thread(() =>
                        {
                            Bitmap bLast = null;
                            for (int index = 0; index < (end - begin); index++)
                            {
                                // 위에서 만든 이미지 경로
                                string img0 = $"{dir}/{begin}{flag}_{index + 1}.jpg";

                                // 실제 필요한 이미지 경로
                                string img1 = $"{dir}/{begin + index}{flag}.jpg";
                                if (File.Exists(img1)) File.Delete(img1);
                                File.Move(img0, img1);

                                // 프레임 간 차이 이미지 경로
                                string img2 = $"{dir}/{begin + index}{flag}_.jpg";
                                if (File.Exists(img2)) File.Delete(img2);

                                // 밝기 변화 이미지 경로
                                string img3 = $"{dir}/{begin + index}{flag}~.jpg";
                                if (File.Exists(img3)) File.Delete(img3);

                                if (bLast != null)
                                {
                                    // 라이브러리 써보려고 했는데 결과물이 별로임
                                    // 96x54 정도는 직접 돌릴 만한 크기
                                    Bitmap bPrev = bLast;
                                    Bitmap bTrgt = bLast = new Bitmap(img1);

                                    bool isFade = (flag != "");
                                    int sum = 0;
                                    int dMax = 1; // 0이면 문제 생김

                                    // 각 픽셀 비교
                                    int[][][] aDiff = new int[54][][];
                                    for (int y = 0; y < 54; y++)
                                    {
                                        aDiff[y] = new int[96][];
                                        for (int x = 0; x < 96; x++)
                                        {
                                            Color p = bPrev.GetPixel(x, y);
                                            Color t = bTrgt.GetPixel(x, y);
                                            int r = t.R - p.R;
                                            int g = t.G - p.G;
                                            int b = t.B - p.B;
                                            aDiff[y][x] = new int[] { r, g, b };
                                            sum += r + g + b;
                                            if (isFade)
                                            {
                                                dMax = Math.Max(dMax, Math.Abs(r));
                                                dMax = Math.Max(dMax, Math.Abs(g));
                                                dMax = Math.Max(dMax, Math.Abs(b));
                                            }
                                        }
                                    }

                                    // 페이드 효과에 대해선 더 잘 보이도록
                                    double a = isFade ? 40 : 4;
                                    //double a = isFade ? Math.Max(8, 255.0 / dMax) : 4;
                                    int avg = Math.Abs(sum) / (96 * 54 * 3);

                                    Bitmap b2 = new Bitmap(96, 54);
                                    Bitmap b3 = new Bitmap(96, 54);

                                    for (int y = 0; y < 54; y++)
                                    {
                                        for (int x = 0; x < 96; x++)
                                        {
                                            // 이전 프레임과 차이
                                            b2.SetPixel(x, y, Color.FromArgb(255
                                                , Math.Min((int)(Math.Abs(aDiff[y][x][0]) * a), 255)
                                                , Math.Min((int)(Math.Abs(aDiff[y][x][1]) * a), 255)
                                                , Math.Min((int)(Math.Abs(aDiff[y][x][2]) * a), 255)
                                            ));

                                            // 밝기 변화
                                            //int v = (int)((aDiff[y][x][0] + aDiff[y][x][1] + aDiff[y][x][2]) * a);
                                            // RGB 모두 변화하는 것만 확인: 가장 조금 변화하는 것 확인
                                            int rgb = (Math.Abs(aDiff[y][x][0]) < Math.Abs(aDiff[y][x][1])) ? 0 : 1;
                                            rgb = (Math.Abs(aDiff[y][x][rgb]) < Math.Abs(aDiff[y][x][2])) ? rgb : 2;
                                            int v = (int)(aDiff[y][x][rgb] * a);
                                            b3.SetPixel(x, y, (v > 0)
                                                ? Color.FromArgb(255, Math.Min(v, 255), avg, 0)
                                                : Color.FromArgb(255, 0, avg, Math.Min(-v, 255))
                                            );
                                        }
                                    }

                                    b2.Save(img2, System.Drawing.Imaging.ImageFormat.Jpeg);
                                    b3.Save(img3, System.Drawing.Imaging.ImageFormat.Jpeg);

                                    Script("setDiff", new object[] { $"{begin + index}{flag}", sum });
                                }
                                else
                                {
                                    // 앞 프레임이 없음 = 첫 번째 이미지, 그냥 복사
                                    File.Copy(img1, img2);
                                    File.Copy(img1, img3);
                                    bLast = new Bitmap(img1);
                                }
                            }

                            Script("afterRenderThumbnails", new object[] { begin, end, flag });

                        }).Start();
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine(e.ToString());
                    }
                }

                isThumbnailsRendering = false;

            }).Start();
        }
        public void CancelRenderThumbnails()
        {
            if (isThumbnailsRendering)
            {
                isThumbnailsRendering = false;
                // 작업 중인 걸 끝낸 후에 섬네일 삭제해야 함
                // 스레드 종료 시점이 불분명해, 여기서 삭제 시키면 터질 수 있음
            }
            else
            {
                // 생성됐던 섬네일도 삭제
                //ClearThumbnails();
            }
        }
        public void ClearThumbnails()
        {
            new Thread(() =>
            {
                string dir = "temp/thumbnails";
                DirectoryInfo di = new DirectoryInfo(dir);
                if (di.Exists)
                {
                    FileInfo[] files = di.GetFiles();
                    foreach (FileInfo file in files)
                    {
                        file.Delete();
                    }
                }
            }).Start();
        }

        private int saveAfter = 0;
        private string textToSave = "";
        public void Save(string text, string path)
        {
            if (path == null || path.Length == 0)
            {
                // 파일명 수신 시 동작 설정
                saveAfter = 100;
                textToSave = text;
                afterGetFileName = new AfterGetString(SaveWithDialogAfterGetVideoFileName);
                // player에 현재 재생 중인 파일명 요청
                player.GetFileName();

                //SaveWithDialog(text, null);
                return;
            }

            StreamWriter sw = null;
            try
            {   // 무조건 UTF-8로 저장
                (sw = new StreamWriter(path, false, Encoding.UTF8)).Write(text);
                Script("afterSaveFile", path);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                Script("alert", "저장되지 않았습니다.");
            }
            finally
            {
                sw?.Close();
            }
        }
        public void SaveWithDialogAfterGetVideoFileName(string path)
        {
            afterGetFileName = null;
            if (path != null && path.Length > 0)
            {
                saveAfter = 0;
                SaveWithDialog(textToSave, path);
            }
        }
        public void SaveWithDialog(string text, string videoPath)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { SaveWithDialog(text, videoPath); }));
            }
            else
            {
                string directory = null;
                string filename = null;
                if (videoPath != null)
                {
                    videoPath = videoPath.Replace('/', '\\');
                    if (videoPath.IndexOf('\\') > 0)
                    {
                        directory = videoPath.Substring(0, videoPath.LastIndexOf('\\'));
                        filename = videoPath.Substring(directory.Length + 1);
                        if (filename.IndexOf('.') >= 0)
                        {
                            filename = filename.Substring(0, filename.LastIndexOf('.')) + ".smi";
                        }
                    }
                }

                SaveFileDialog dialog = new SaveFileDialog {
                    Filter = "SAMI 자막 파일|*.smi"
                ,   InitialDirectory = directory
                ,   FileName = filename
                };
                if (dialog.ShowDialog() != DialogResult.OK)
                {   // 저장 취소
                    return;
                }
                Save(text, dialog.FileName);
            }
        }
        public void SaveTemp(string text, string path)
        {   // 임시 파일 저장
            int index = path.LastIndexOf("\\");
            string filename = path.Substring(index + 1);

            try
            {   // 임시 파일 폴더 없으면 생성
                DirectoryInfo di = new DirectoryInfo("temp");
                if (!di.Exists)
                {
                    di.Create();
                }

                // 임시 파일 저장
                long now = DateTime.Now.Ticks;
                StreamWriter sw = new StreamWriter("temp/" + now + "_" + filename, false, Encoding.UTF8);
                sw.Write(text);
                sw.Close();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
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
            Script("SmiEditor.inputText", text);
        }

        public void AfterTransform(string text)
        {
            Script("SmiEditor.afterTransform", text);
        }
        #endregion
    }
}
