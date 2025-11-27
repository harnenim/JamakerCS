using System;
using System.Runtime.InteropServices;

namespace PlayerBridge
{
    public struct COPYUTF8STRUCT
    {
        public IntPtr dwData;
        public int cbData;
        [MarshalAs(UnmanagedType.LPUTF8Str)]
        public string lpData;
    }
    public struct COPYUNICODESTRUCT
    {
        public IntPtr dwData;
        public int cbData;
        [MarshalAs(UnmanagedType.LPWStr)]
        public string lpData;
    }
    public struct RECT
    {
        public int left;
        public int top;
        public int right;
        public int bottom;
    }

    public class WinAPI
    {
        [DllImport("user32.dll")]
        public static extern bool IsWindow(int hwnd);

        [DllImport("user32.dll")]
        public static extern int FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        public static extern int SendMessage(int hwnd, int wMsg, int wParam, int lParam);
        /*
        [DllImport("user32.dll")]
        public static extern int SendMessage(int hwnd, int wMsg, int wParam, ref COPYUTF8STRUCT lParam);
        */
        [DllImport("user32.dll")]
        public static extern int SendMessage(int hwnd, int wMsg, int wParam, ref COPYUNICODESTRUCT lParam);

        [DllImport("user32.dll")]
        public static extern int PostMessage(int hwnd, int wMsg, int wParam, int lParam);

        [DllImport("user32.dll")]
        public static extern int GetWindowRect(int hwnd, ref RECT lpRect);
        // TODO: DwmGetWindowAttribute

        [DllImport("user32.dll")]
        public static extern int MoveWindow(int hwnd, int x, int y, int nWidth, int nHeight, bool bRepaint);
        // TODO: DwmSetWindowAttribute

        [DllImport("dwmapi.dll")]
        private static extern int DwmGetWindowAttribute(int hwnd, int attr, out RECT rect, int size);
        public static int GetWindowRectWithoutShadow(int hwnd, ref RECT rect)
        {
            return DwmGetWindowAttribute(hwnd, 9/*DWMWA_EXTENDED_FRAME_BOUNDS*/, out rect, Marshal.SizeOf(typeof(RECT)));
        }
        private static RECT shadow = new RECT();
        public static RECT GetWindowShadow(int hwnd)
        {
            RECT defaults = new RECT();
            _ = GetWindowRect(hwnd, ref defaults);
            _ = GetWindowRectWithoutShadow(hwnd, ref shadow);
            shadow.top -= defaults.top;
            shadow.left -= defaults.left;
            shadow.right -= defaults.right;
            shadow.bottom -= defaults.bottom;
            return shadow;
        }
    }
}
