using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

namespace PlayerBridge
{
    public class WebPlayer : PlayerBridge
    {
        #region 초기화

        const int WM_USER = 0x0400;
        const int WM_COPYDATA = 0x004A;

        // 플레이어 명령
        /*
        const int POT_COMMAND = WM_USER;
        const int POT_GET_VOLUME = 0x5000; // 0 ~ 100
        const int POT_SET_VOLUME = 0x5001; // 0 ~ 100
        const int POT_GET_TOTAL_TIME = 0x5002; // ms unit
        const int POT_GET_PROGRESS_TIME = 0x5003; // ms unit
        const int POT_GET_CURRENT_TIME = 0x5004; // ms unit
        const int POT_SET_CURRENT_TIME = 0x5005; // ms unit
        const int POT_GET_PLAY_STATUS = 0x5006; // 0:Stopped, 1:Paused, 2:Running
        const int POT_SET_PLAY_STATUS = 0x5007; // 0:Toggle, 1:Paused, 2:Running
        const int POT_SET_PLAY_ORDER = 0x5008; // 0:Prev, 1:Next
        const int POT_SET_PLAY_CLOSE = 0x5009;
        const int POT_SEND_VIRTUAL_KEY = 0x5010; // Virtual Key(VK_UP, VK_DOWN....)

        const int POT_GET_AVISYNTH_USE = 0x6000;
        const int POT_SET_AVISYNTH_USE = 0x6001; // 0: off, 1:on
        const int POT_GET_VAPOURSYNTH_USE = 0x6010;
        const int POT_SET_VAPOURSYNTH_USE = 0x6011; // 0: off, 1:on
        const int POT_GET_VIDEO_WIDTH = 0x6030;
        const int POT_GET_VIDEO_HEIGHT = 0x6031;
        const int POT_GET_VIDEO_FPS = 0x6032; // scale by 1000

        // String getting
        const int POT_GET_AVISYNTH_SCRIPT = 0x6002;
        const int POT_GET_VAPOURSYNTH_SCRIPT = 0x6012;
        const int POT_GET_PLAYFILE_NAME = 0x6020;

        // String setting... Using WM_COPYDATA
        const int POT_SET_AVISYNTH_SCRIPT = 0x6003;
        const int POT_SET_VAPOURSYNTH_SCRIPT = 0x6013;
        const int POT_SET_SHOW_MESSAGE = 0x6040;
        const int POT_SET_PLAYFILE = 1000; // UTF-16 Unicode
        */
        const int POT_COMMAND = WM_USER;
        const int POT_GET_CURRENT_TIME = 0x5004; // ms unit
        const int POT_SET_CURRENT_TIME = 0x5005; // ms unit
        const int POT_SET_PLAY_STATUS = 0x5007; // 0:Toggle, 1:Paused, 2:Running
        const int POT_SET_PLAY_CLOSE = 0x5009;

        const int POT_GET_VIDEO_FPS = 0x6032; // scale by 1000

        const int POT_GET_PLAYFILE_NAME = 0x6020;
        // String setting... Using WM_COPYDATA
        const int POT_SET_PLAYFILE = 1000; // UTF-16 Unicode

        #endregion

        public override int OpenFile(string path)
        {
            COPYUNICODESTRUCT cds = new COPYUNICODESTRUCT
            {   dwData = new IntPtr(POT_SET_PLAYFILE)
            ,   cbData = Encoding.Unicode.GetBytes(path).Length
            ,   lpData = path
            };
            return WinAPI.SendMessage(hwnd, WM_COPYDATA, hwnd, ref cds);
        }
        public override int GetFileName()
        {
            return WinAPI.SendMessage(hwnd, POT_COMMAND, POT_GET_PLAYFILE_NAME, ownerHwnd);
        }
        public override string AfterGetFileName(Message m)
        {
            if (m.Msg == WM_COPYDATA)
            {
                try
                {
                    byte[] buff = new byte[Marshal.ReadInt32(m.LParam, IntPtr.Size)];
                    IntPtr dataPtr = Marshal.ReadIntPtr(m.LParam, IntPtr.Size * 2);
                    Marshal.Copy(dataPtr, buff, 0, buff.Length);
                    return Encoding.UTF8.GetString(buff);
                }
                finally { }
            }
            return null;
        }

        public override int GetFps() { return SendMessage(POT_COMMAND, POT_GET_VIDEO_FPS, 0); }
        public override int PlayOrPause() { return SendMessage(POT_COMMAND, POT_SET_PLAY_STATUS, 0); }
        public override int Pause() { return SendMessage(POT_COMMAND, POT_SET_PLAY_STATUS, 1); }
        public override int Play() { return SendMessage(POT_COMMAND, POT_SET_PLAY_STATUS, 2); }
        public override int Stop() { return SendMessage(POT_COMMAND, POT_SET_PLAY_CLOSE, 0); }
        public override int GetTime() { return SendMessage(POT_COMMAND, POT_GET_CURRENT_TIME, 1); }
        public override int MoveTo(int time) { return SendMessage(POT_COMMAND, POT_SET_CURRENT_TIME, time); }
    }
}
