using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Text;
using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;
using System.Diagnostics;
using Jamaker.addon;
using System.Reflection;

namespace Jamaker
{
    public partial class MainForm : Form
    {
        public PlayerBridge.PlayerBridge player = null;

        private readonly Dictionary<string, int> windows = new Dictionary<string, int>();
        private readonly Dictionary<string, Popup> popups = new Dictionary<string, Popup>();

        private string strSettingJson = "불러오기 실패 예제";
        private string strBridgeList = "NoPlayer: (없음)"; // 기본값
        private Dictionary<string, string> bridgeDlls = new Dictionary<string, string>();

        public MainForm()
        {
            // 브라우저 설정
            CefSettings settings = new CefSettings
            {   Locale = "ko"
            ,   CachePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\CEF"
            };
            settings.CefCommandLineArgs.Add("disable-web-security");
            Cef.Initialize(settings);
            CefSharpSettings.ShutdownOnExit = false; // Release일 땐 false 해줘야 함

            InitializeComponent();
            menuStrip.MouseDown += (clickMenuStrip = new MouseEventHandler(MouseDownInMenuStrip)); // 디자이너에 넣으면 오류 발생

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
            mainView.RequestHandler = new RequestHandler(); // TODO: 팝업에서 이동을 막아야 되는데...

            timer.Interval = 10;
            timer.Enabled = true;
            timer.Tick += FollowWindow;
            timer.Tick += RefreshPlayer;
            timer.Tick += FocusIfRequested;
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

                    Script("init", strSettingJson); // C#에서 객체 그대로 못 보내주므로 json string 만드는 걸로
                    Script("setPlayerDlls", strBridgeList); // 플레이어 브리지 추가 가능토록
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
            /*
            */
            if ((LSH.useCustomPopup < 1 && name.Equals("viewer"))
             || (LSH.useCustomPopup < 2 && name.Equals("finder")))
            {
                WinAPI.SetTaskbarHide(hwnd);
            }
        }
        public void SetWindow(string name, int hwnd, Popup popup)
        {
            RemoveWindow(name); // 남아있을 수 있음
            windows.Add(name, hwnd);
            popups.Add(name, popup);
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
        public void SetFocus(int hwnd)
        {
            if (LSH.useCustomPopup > 0)
            {
                requestFocus = hwnd;
            }
            else if (InvokeRequired)
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
        private int GetHwnd(string target)
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
                            Script("setDpiBy", width);
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
        private string Script(string name) { return mainView.Script(name); }
        private string Script(string name, object arg) { return mainView.Script(name, arg); }

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

        readonly string msgTitle = "Jamaker";
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
        public void Prompt(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Prompt(target, msg); }));
            }
            else
            {
                Prompt prompt = new Prompt(GetHwnd(target), msg, msgTitle);
                DialogResult result = prompt.ShowDialog();
                if (result == DialogResult.OK)
                {
                    Script("afterPrompt", prompt.value);
                }
            }
        }
        #endregion

        #region 설정
        private void LoadSetting()
        {
        	StreamReader sr = null;
            try
            {
                sr = new StreamReader("view/setting.json", Encoding.UTF8);
                strSettingJson = sr.ReadToEnd();
                sr.Close();
                
                sr = new StreamReader("bridge/list.txt", Encoding.UTF8);
                strBridgeList = sr.ReadToEnd();
                sr.Close();
            }
            catch (Exception e) { Console.WriteLine(e); }
            finally { if (sr != null) sr.Close(); }

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

        public void SaveSetting(string strSettingJson)
        {
            this.strSettingJson = strSettingJson;

            try
            {
                StreamWriter sw = new StreamWriter("view/setting.json", false, Encoding.UTF8);
                sw.Write(strSettingJson);
                sw.Close();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            UpdateViewerSetting();
        }

        private string[] videoExts = new string[] { "mkv", "mp4", "avi", "m2ts", "ts" };
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
                    if (player != null)
                    {
                        player.SetEditorHwnd(Handle.ToInt32());
                    }
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

        public void LoadAddonSetting(string path)
        {
            string setting = "";
            try
            {
                StreamReader sr = new StreamReader($"view/addon/{path}", Encoding.UTF8);
                setting = sr.ReadToEnd();
                sr.Close();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }
            Script("afterLoadAddonSetting", setting.Replace("\r\n", "\n"));
        }
        public void SaveAddonSetting(string path, string text)
        {
            try
            {
                StreamWriter sw = new StreamWriter($"view/addon/{path}", false, Encoding.UTF8);
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
        public void ShowDragging()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { ShowDragging(); }));
            }
            else
            {
                layerForDrag.Visible = true;
                Script("setShowDrag", true);
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
                Script("setShowDrag", false);
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
        
        private delegate void AfterGetString(string str);
        private AfterGetString afterGetFileName = null;
        protected override void WndProc(ref Message m)
        {
            // 파일명 말곤 수신할 일 없다는 가정
            if (player != null && afterGetFileName != null)
            {
                string path = player.AfterGetFileName(m);
                afterGetFileName(path);
            }

            base.WndProc(ref m);
        }

        private void DropListFile(DragEventArgs e)
        {
            try
            {
                string[] strFiles = (string[])e.Data.GetData(DataFormats.FileDrop);
                foreach (string strFile in strFiles)
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
            if (path != null && path.Length > 0)
            {
                int index = path.LastIndexOf('.');
                if (index > 0)
                {
                    LoadFile(path.Substring(0, index) + ".smi", true);
                }
	            afterGetFileName = null;
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
                Encoding encoding = TextFile.BOM.DetectEncoding(path); // TODO: BOM 없으면 버그 있나...?
                //Console.WriteLine("encoding: " + encoding);
                sr = new StreamReader(path, encoding);
                text = sr.ReadToEnd();
            }
            catch
            {
                Script("alert", "파일을 열지 못했습니다.");
            }
            finally { if (sr != null) sr.Close(); }

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
                afterGetFileName = null;
            }
        }
        public void LoadVideoFile(string path)
        {
            player.OpenFile(path);
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
                if (sw != null) sw.Close();
            }
        }
        public void SaveWithDialogAfterGetVideoFileName(string path)
        {
            if (path != null && path.Length > 0)
            {
                saveAfter = 0;
                SaveWithDialog(textToSave, path);
                afterGetFileName = null;
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
                        filename = filename.Substring(0, filename.LastIndexOf('.')) + ".smi";
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
