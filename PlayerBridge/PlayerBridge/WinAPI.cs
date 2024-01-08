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
    }
}
