using System.Windows.Forms;

namespace PlayerBridge
{
    public abstract class PlayerBridge
    {
        public int hwnd;
        protected string exe = "-";
        protected int ownerHwnd;

        /// <summary>
        /// 현재 가지고 있는 hwnd 값으로 SendMessage를 수행합니다.
        /// </summary>
        /// <param name="wMsg">wMsg</param>
        /// <param name="wParam">wParam</param>
        /// <param name="lParam">lParam</param>
        /// <returns>윈도우 메시지 리턴값</returns>
        public int SendMessage(int wMsg, int wParam, int lParam)
        {
            return (hwnd > 0) ? WinAPI.SendMessage(hwnd, wMsg, wParam, lParam) : 0;
        }

        /// <summary>
        /// 브리지를 생성할 경우 현재 켜져있는 플레이어가 있는지를 찾습니다.
        /// </summary>
        protected PlayerBridge()
        {
            FindPlayer();
        }

        /// <summary>
        /// 현재 플레이어가 연결된 상태인지를 반환하고
        /// 연결이 안 돼있을 경우 켜져있는 플레이어를 찾습니다.
        /// </summary>
        /// <returns>연결 여부</returns>
        public virtual bool CheckAndRerfreshPlayer()
        {
            if (hwnd > 0)
            {   // 플레이어 값 존재
                if (WinAPI.IsWindow(hwnd))
                {   // 플레이어 살아있음
                    return true;
                }
                else
                {   // 플레이어 종료됨
                    hwnd = 0;
                    initialOffset.top = 0;
                    initialOffset.left = 0;
                    initialOffset.right = 0;
                    initialOffset.bottom = 0;
                }
            }
            else
            {   // 플레이어 스캔
                FindPlayer();
            }
            return false;
        }

        /// <summary>
        /// 프로그램에서 건드리기 전
        /// 플레이어 창의 원래 위치를 기억합니다.
        /// </summary>
        public RECT initialOffset = new RECT();

        /// <summary>
        /// 프로그램과 연결된 후 플레이어 창의 현재 위치입니다.
        /// </summary>
        public RECT currentOffset = new RECT();

        /// <summary>
        /// 프로그램에서 건드리기 전
        /// 플레이어 창의 원래 위치를 기억합니다.
        /// 상하 크기가 100보다 작을 경우 렌더링이 끝나지 않은 것으로 보고 무시합니다.
        /// </summary>
        /// <returns>최초 창의 위치</returns>
        public RECT? GetWindowInitialPosition()
        {
            WinAPI.GetWindowRect(hwnd, ref initialOffset);
            return (initialOffset.top + 100 < initialOffset.bottom) ? initialOffset : (RECT?)null;
        }
        /// <summary>
        /// 현재 창의 위치를 가져옵니다.
        /// </summary>
        /// <returns>현재 창의 위치</returns>
        public RECT GetWindowPosition()
        {
            WinAPI.GetWindowRect(hwnd, ref currentOffset);
            return currentOffset;
        }

        /// <summary>
        /// 프로그램 종료 전에 창을 원래 위치로 되돌립니다.
        /// </summary>
        public void ResetPosition()
        {
            if (initialOffset.top + 100 < initialOffset.bottom)
            {
                WinAPI.MoveWindow(hwnd, initialOffset.left, initialOffset.top, initialOffset.right - initialOffset.left, initialOffset.bottom - initialOffset.top, true);
            }
        }

        /// <summary>
        /// 프로그램에서 설정한 창 위치로 창을 옮깁니다.
        /// 여기에서 값을 지정하지 않고
        /// 프로그램에서 currentOffset을 조작한 후 호출합니다.
        /// </summary>
        public void MoveWindow()
        {
            if (currentOffset.top + 100 < currentOffset.bottom)
            {
                WinAPI.MoveWindow(hwnd, currentOffset.left, currentOffset.top, currentOffset.right - currentOffset.left, currentOffset.bottom - currentOffset.top, true);
            }
        }

        /// <summary>
        /// 지정한 좌표만큼 창을 옮깁니다.
        /// </summary>
        /// <param name="x">X 좌표 이동값</param>
        /// <param name="y">Y 좌표 이동값</param>
        public void MoveWindow(int x, int y)
        {
            currentOffset.left += x;
            currentOffset.top += y;
            currentOffset.right += x;
            currentOffset.bottom += y;
            MoveWindow();
        }

        /// <summary>
        /// 플레이어에 종료 요청을 보냅니다.
        /// </summary>
        public void DoExit()
        {
            WinAPI.PostMessage(hwnd, 0x0010/*WM_CLOSE*/, 0, 0);
        }

        /// <summary>
        /// 플레이어를 호출하는 프로그램의 hwnd를 기억합니다.
        /// 플레이어에 원래 프로그램의 hwnd를 보내야 하는 경우가 있습니다.
        /// </summary>
        /// <param name="hwnd">프로그램의 윈도우 핸들</param>
        public void SetEditorHwnd(int hwnd)
        {
            ownerHwnd = hwnd;
        }

        /// <summary>
        /// 열려있는 플레이어를 찾습니다.
        /// </summary>
        /// <returns>플레이어의 윈도우 핸들</returns>
        private int FindPlayer()
        {
            return hwnd = WinAPI.FindWindow(exe, null);
        }

        /// <summary>
        /// 플레이어의 실행파일명을 지정한 후
        /// 열려있는 플레이어를 찾습니다.
        /// </summary>
        /// <param name="exe">실행파일명</param>
        /// <returns>플레이어의 윈도우 핸들</returns>
        public int FindPlayer(string exe)
        {
            this.exe = (exe.Length > 4) ? exe.Substring(0, exe.Length - 4) : "-";
            return FindPlayer();
        }

        #region 파일 제어
        /// <summary>
        /// 플레이어에 해당 경로의 파일을 열도록 요청합니다.
        /// </summary>
        /// <param name="path">파일 경로</param>
        /// <returns>윈도우 메시지 리턴값</returns>
        public abstract int OpenFile(string path);

        /// <summary>
        /// 플레이어에 파일명 요청을 보냅니다.
        /// </summary>
        /// <returns>윈도우 메시지 리턴값</returns>
        public abstract int GetFileName();

        /// <summary>
        /// 플레이어에서 파일명을 SendMessage로 보내줬을 때 메시지를 해석합니다.
        /// </summary>
        /// <param name="m">윈도우 메시지</param>
        /// <returns>파일 경로</returns>
        public abstract string AfterGetFileName(Message m);
        #endregion

        #region 재생 제어
        /// <summary>
        /// 현재 동영상의 FPS 값을 구합니다.
        /// </summary>
        /// <returns>FPS</returns>
        public abstract int GetFps();

        /// <summary>
        /// 플레이어의 재생/일시정지를 토글합니다.
        /// </summary>
        /// <returns>윈도우 메시지 리턴값</returns>
        public abstract int PlayOrPause();

        /// <summary>
        /// 플레이어를 일시정지합니다.
        /// </summary>
        /// <returns>윈도우 메시지 리턴값</returns>
        public abstract int Pause();

        /// <summary>
        /// 플레이어를 재생시킵니다.
        /// </summary>
        /// <returns>윈도우 메시지 리턴값</returns>
        public abstract int Play();

        /// <summary>
        /// 플레이어를 정지합니다.
        /// </summary>
        /// <returns>윈도우 메시지 리턴값</returns>
        public abstract int Stop();

        /// <summary>
        /// 현재 재생 위치를 구합니다.
        /// </summary>
        /// <returns>재생 위치</returns>
        public abstract int GetTime();

        /// <summary>
        /// 재생 위치를 이동시킵니다.
        /// </summary>
        /// <param name="time">재생 위치</param>
        /// <returns>윈도우 메시지 리턴값</returns>
        public abstract int MoveTo(int time);
        #endregion
    }
}
