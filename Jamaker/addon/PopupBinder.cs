namespace Jamaker
{
    class PopupBinder
    {
        private readonly Popup _;

        public PopupBinder(Popup popup)
        {
            _ = popup;
        }

        public void OnloadViewer() { _.OnloadViewer(); }

        public void OnloadFinder() { _.OnloadFinder(); }

        public void RunFind(string param) { _.RunFind(param); }
        public void RunReplace(string param) { _.RunReplace(param); }
        public void RunReplaceAll(string param) { _.RunReplaceAll(param); }

        public void Alert(string target, string msg) { _.Alert(msg); }
        public void Confirm(string target, string msg) { _.Confirm(msg); }

        /*
        #region 팝업 통신 (opener 못 쓰는 경우)
        public void SendMsg(string target, string msg) {
            _.SendMsg(target, msg);
        }
        public void UpdateViewerSetting() { _.UpdateViewerSetting(); }
        public void UpdateViewerLines(string lines) { _.UpdateViewerLines(lines); }

        public void OnloadFinder (string last ) { _.OnloadFinder (last ); }
        public void RunFind      (string param) { _.RunFind      (param); }
        public void RunReplace   (string param) { _.RunReplace   (param); }
        public void RunReplaceAll(string param) { _.RunReplaceAll(param); }

        public void Alert  (string target, string msg) { _.Alert  (target, msg); }
        public void Confirm(string target, string msg) { _.Confirm(target, msg); }
        #endregion

        #region 플레이어
        public void PlayOrPause() { _.player.PlayOrPause(); }
        public void Play() { _.player.Play(); }
        public void Stop() { _.player.Stop(); }
        public void MoveTo(int time) { _.player.MoveTo(time); }
        #endregion
        */
    }
}
