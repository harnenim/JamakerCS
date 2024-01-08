using System;
using System.Windows.Forms;

namespace PlayerBridge
{
    public class NoPlayer : PlayerBridge
    {
        private static long GetNow()
        {
            return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        }

        public NoPlayer()
        {
            initialOffset.top = 0;
            initialOffset.left = 0;
            initialOffset.right = 1920;
            initialOffset.bottom = 1080;
            begin = paused = GetNow();
        }

        public override bool CheckAndRerfreshPlayer()
        {
            return true;
        }

        public override int GetFps()
        {
            return 23976;
        }
        private long begin = 0;
        private long paused = 0;

        public override int GetTime()
        {
            return (int)((paused != 0 ? paused : GetNow()) - begin);
        }

        public override int MoveTo(int time)
        {
            if (time < 0) time = 0;
            long now = GetNow();
            begin = now - time;
            if (paused != 0) paused = now;
            return 0;
        }

        public override int OpenFile(string path)
        {
            return 0;
        }
        public override int GetFileName()
        {
            return 0;
        }
        public override string AfterGetFileName(Message m)
        {
            return null;
        }

        public override int Pause()
        {
            if (paused == 0) paused = GetNow();
            return 0;
        }

        public override int Play()
        {
            if (paused == 0) return 0;
            if (paused < begin)
            {   // 정지 상태
                begin = GetNow();
            }
            else
            {   // 일시정지 상태
                begin += GetNow() - paused;
            }
            paused = 0;
            return 0;
        }

        public override int PlayOrPause()
        {
            return paused != 0 ? Play() : Pause();
        }

        public override int Stop()
        {
            begin = paused = GetNow();
            return 0;
        }
    }
}
