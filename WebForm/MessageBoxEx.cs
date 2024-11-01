using System;
using System.Windows.Forms;
using System.Drawing;
using System.Runtime.InteropServices;

namespace Jamaker
{
	public class MessageBoxEx
	{
		private static int _owner;
		private static HookProc _hookProc;
		private static IntPtr _hHook;

		public static DialogResult Show(int ownerHwnd, string text, string caption)
		{
			_owner = ownerHwnd;
			Initialize();
			return MessageBox.Show(NativeWindow.FromHandle(new IntPtr(ownerHwnd)), text, caption);
		}

		public static DialogResult Show(int ownerHwnd, string text, string caption, MessageBoxButtons buttons)
		{
			_owner = ownerHwnd;
			Initialize();
			return MessageBox.Show(NativeWindow.FromHandle(new IntPtr(ownerHwnd)), text, caption, buttons);
		}

		public delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);

		public delegate void TimerProc(IntPtr hWnd, uint uMsg, UIntPtr nIDEvent, uint dwTime);

		public const int WH_CALLWNDPROCRET = 12;

		public enum CbtHookAction : int
		{
			HCBT_MOVESIZE = 0,
			HCBT_MINMAX = 1,
			HCBT_QS = 2,
			HCBT_CREATEWND = 3,
			HCBT_DESTROYWND = 4,
			HCBT_ACTIVATE = 5,
			HCBT_CLICKSKIPPED = 6,
			HCBT_KEYSKIPPED = 7,
			HCBT_SYSCOMMAND = 8,
			HCBT_SETFOCUS = 9
		}

		[DllImport("user32.dll")]
		public static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hInstance, int threadId);

		[DllImport("user32.dll")]
		public static extern int UnhookWindowsHookEx(IntPtr idHook);

		[DllImport("user32.dll")]
		public static extern IntPtr CallNextHookEx(IntPtr idHook, int nCode, IntPtr wParam, IntPtr lParam);

		[DllImport("kernel32.dll")]
		static extern uint GetCurrentThreadId();

		[StructLayout(LayoutKind.Sequential)]
		public struct CWPRETSTRUCT
		{
			public IntPtr lResult;
			public IntPtr lParam;
			public IntPtr wParam;
			public uint message;
			public IntPtr hwnd;
		};

		static MessageBoxEx()
		{
			_hookProc = new HookProc(MessageBoxHookProc);
			_hHook = IntPtr.Zero;
		}

		private static void Initialize()
		{
			if (_hHook != IntPtr.Zero)
			{
				Console.WriteLine("multiple calls are not supported");
				throw new NotSupportedException("multiple calls are not supported");
			}

			_hHook = SetWindowsHookEx(WH_CALLWNDPROCRET, _hookProc, IntPtr.Zero, /*AppDomain.GetCurrentThreadId()*/(int)GetCurrentThreadId());
		}

		private static IntPtr MessageBoxHookProc(int nCode, IntPtr wParam, IntPtr lParam)
		{
			if (nCode < 0)
			{
				return CallNextHookEx(_hHook, nCode, wParam, lParam);
			}

			CWPRETSTRUCT msg = (CWPRETSTRUCT)Marshal.PtrToStructure(lParam, typeof(CWPRETSTRUCT));
			IntPtr hook = _hHook;

			if (msg.message == (int)CbtHookAction.HCBT_ACTIVATE)
			{
				try
				{
					CenterWindow(msg.hwnd);
				}
				finally
				{
					UnhookWindowsHookEx(_hHook);
					_hHook = IntPtr.Zero;
				}
			}

			return CallNextHookEx(hook, nCode, wParam, lParam);
		}

		private static void CenterWindow(IntPtr hChildWnd)
		{
			RECT recChild = new RECT();
			WinAPI.GetWindowRect(hChildWnd.ToInt32(), ref recChild);

			int width = recChild.right - recChild.left;
			int height = recChild.bottom - recChild.top;

			RECT recParent = new RECT();
			WinAPI.GetWindowRect(_owner, ref recParent);

			Point ptCenter = new Point(0, 0);
			ptCenter.X = recParent.left + ((recParent.right - recParent.left) / 2);
			ptCenter.Y = recParent.top + ((recParent.bottom - recParent.top) / 2);


			Point ptStart = new Point(0, 0);
			ptStart.X = (ptCenter.X - (width / 2));
			ptStart.Y = (ptCenter.Y - (height / 2));

			ptStart.X = (ptStart.X < 0) ? 0 : ptStart.X;
			ptStart.Y = (ptStart.Y < 0) ? 0 : ptStart.Y;

			WinAPI.MoveWindow(hChildWnd.ToInt32(), ptStart.X, ptStart.Y, width, height, false);
		}
	}
}
