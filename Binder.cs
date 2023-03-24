using System.Collections.Generic;
using Subtitle;

namespace SmiEdit
{
    class Binder
    {
        private readonly MainForm _;

        public Binder(MainForm mainForm)
        {
            _ = mainForm;
        }

        public void InitAfterLoad()
        {
            _.InitAfterLoad();
        }
        public void SetMenus(string[][] menus)
        {
            _.SetMenus(menus);
        }

        public void MoveWindow(string target, int x, int y, int width, int height, bool resizable)
        {
            _.MoveWindow(target, x, y, width, height, resizable);
        }
        public void Focus(string target)
        {
            _.FocusWindow(target);
        }
        public void SetFollowWindow(bool follow)
        {
            _.SetFollowWindow(follow);
        }
        public void GetWindows(string[] targets)
        {
            _.GetWindows(targets);
        }

        public void ShowDragging()
        {
            _.ShowDragging();
        }
        public void HideDragging()
        {
            _.HideDragging();
        }

        public void FocusToMenu(int keyCode)
        {
            _.FocusToMenu(keyCode);
        }

        public void SaveSetting(string setting)
        {
            _.SaveSetting(setting);
        }
        public void SetVideoExts(string exts)
        {
            _.SetVideoExts(exts);
        }
        public void SetPlayer(string dll, string exe, bool withRun)
        {
            _.SetPlayer(dll, exe, withRun);
        }

        public void Save(string text, string path)
        {
            _.Save(text, path);
        }
        public void OpenFile()
        {
            _.OpenFile();
        }
        public void CheckLoadVideoFile(string smiPath)
        {
            _.CheckLoadVideoFile(smiPath);
        }
        public void LoadVideoFile(string path)
        {
            _.LoadVideoFile(path);
        }
        public void DoExit(bool resetPlayer, bool exitPlayer)
        {
            _.DoExit(resetPlayer, exitPlayer);
        }
        
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

        #region 부가기능
        public void RunColorPicker()
        {
            _.RunColorPicker();
        }
        public void Normalize(string text)
        {
            // TODO: 기능 수정 필요. 문법 바꾸고 싶어짐...
            List<Smi> input = new SmiFile().FromTxt(text).body;
            Smi.Normalize(input);
            string output = new SmiFile() { body = input }.ToTxt().Trim();
            _.AfterTransform(output);
        }
        public void FillSync(string text)
        {
            List<Smi> input = new SmiFile().FromTxt(text).body;
            Smi.FillEmptySync(input);
            string output = new SmiFile() { body = input }.ToTxt().Trim();
            _.AfterTransform(output);
        }
        #endregion

        public void Test(object obj)
        {
            _.Test(obj);
        }
    }
}
