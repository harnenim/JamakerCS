using System.Runtime.InteropServices;

namespace WebViewForm
{
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
        public static extern bool SetForegroundWindow(int hwnd);

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
        private static RECT shadow = new();
        public static RECT GetWindowShadow(int hwnd)
        {
            RECT defaults = new();
            _ = GetWindowRect(hwnd, ref defaults);
            _ = GetWindowRectWithoutShadow(hwnd, ref shadow);
            shadow.top -= defaults.top;
            shadow.left -= defaults.left;
            shadow.right -= defaults.right;
            shadow.bottom -= defaults.bottom;
            return shadow;
        }

        [DllImport("user32.dll", EntryPoint = "GetWindowLong")]
        public static extern UIntPtr GetWindowLongPtr(int hwnd, int nIndex);

        [DllImport("user32.dll", EntryPoint = "SetWindowLongW")]
        public static extern UIntPtr SetWindowLongPtr32(int hwnd, int nIndex, UIntPtr dwNewLong);

        public static void SetTaskbarHide(int hwnd)
        {
            uint style = GetWindowLongPtr(hwnd, -20).ToUInt32();
            style |= 0x00000080;
            style |= 0x80880000;
            SetWindowLongPtr32(hwnd, -20, new UIntPtr(style));
            /*
            */
        }

        public static void DisableResize(int hwnd)
        {
            uint style = GetWindowLongPtr(hwnd, -20).ToUInt32();
            style &= ~(uint)0x00040000;
            SetWindowLongPtr32(hwnd, -20, new UIntPtr(style));
            /*
            */
        }

        public static void MoveWindow(int hwnd, int x, int y, ref RECT offset)
        {
            GetWindowRect(hwnd, ref offset);
            offset.left += x;
            offset.top += y;
            offset.right += x;
            offset.bottom += y;
            MoveWindow(hwnd
                , offset.left
                , offset.top
                , offset.right - offset.left
                , offset.bottom - offset.top
                , true
            );
        }

        [DllImport("user32.dll")]
        public static extern bool EnableWindow(IntPtr hWnd, bool enable);
    }
}
