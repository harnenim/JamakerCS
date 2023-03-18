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
        public void SetPlayer(string dll)
        {
            _.SetPlayer(dll);
        }
        public void RunPlayer(string path)
        {
            _.RunPlayer(path);
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

        #region 플레이어
        public void PlayOrPause() { _.player.PlayOrPause(); }
        public void Play() { _.player.Play(); }
        public void Stop() { _.player.Stop(); }
        public void MoveTo(int time) { _.player.MoveTo(time); }
        #endregion
    }
}
