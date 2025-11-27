using Newtonsoft.Json;
using System;

namespace Jamaker
{
    class BaseBinder
    {
        private readonly MainForm _;

        public static T ParseJson<T>(string input)
        {
            return JsonConvert.DeserializeObject<T>(input);
        }

        public BaseBinder(MainForm webForm)
        {
            _ = webForm;
        }

        public void Focus(string target)
        {
            _.FocusWindow(target);
        }

        public void InitAfterLoad(string title)
        {
            _.InitAfterLoad(title);
        }

        public void ShowDragging()
        {
            _.ShowDragging();
        }
        public void HideDragging()
        {
            _.HideDragging();
        }

        public void Alert(string target, string msg) { _.Alert(target, msg); }
        public void Confirm(string target, string msg) { _.Confirm(target, msg); }
        public void Prompt(string target, string msg, string def) { _.Prompt(target, msg, def); }
    }

    class Binder : BaseBinder
    {
        private readonly MainForm _;

        public Binder(MainForm mainForm) : base(mainForm)
        {
            _ = mainForm;
        }

        public void MoveWindow(string target, int x, int y, int width, int height, bool resizable)
        {
            _.MoveWindow(target, x, y, width, height, resizable);
        }
        public void SetFollowWindow(bool follow)
        {
            _.SetFollowWindow(follow);
        }

        public void RepairSetting()
        {
            _.RepairSetting();
        }
        public void SaveSetting(string setting)
        {
            _.SaveSetting(setting);
        }
        public void SetVideoExts(string exts)
        {
            _.SetVideoExts(exts);
        }
        public void SetPlayer(string dll, string exe, bool withRun, bool useMove)
        {
            _.SetPlayer(dll, exe, withRun, useMove);
        }

        public void Save(int tab, string text, string path, int type)
        {
            _.Save(tab, text, path, type);
        }
        public void SaveTemp(string text, string path)
        {
            _.SaveTemp(text, path);
        }
        public void OpenFile()
        {
            _.OpenFile();
        }
        public void AfterInit(int limit)
        {
            _.AfterInit(limit);
        }
        public void OpenFileForVideo()
        {
            _.OpenFileForVideo();
        }
        public void SetPath(string smiPath)
        {
            _.SetPath(smiPath);
        }
        public void SetPathAndCheckLoadVideoFile(string smiPath)
        {
            _.SetPath(smiPath);
            _.CheckLoadVideoFile();
        }
        public void LoadVideoFile(string path)
        {
            _.LoadVideoFile(path);
        }
        public void RequestFrames(string path)
        {
            _.RequestFrames(path);
        }
        public void SetThumbnailSize(int width, int height)
        {
            _.SetThumbnailSize(width, height);
        }
        public void RenderThumbnails(string path, string paramsStr)
        {
            _.RenderThumbnails(path, paramsStr);
        }
        public void CancelRenderThumbnails()
        {
            _.CancelRenderThumbnails();
        }
        public void DoExit(bool resetPlayer, bool exitPlayer)
        {
            _.DoExit(resetPlayer, exitPlayer);
        }

        public void Log(string msg)
        {
            // TODO: 로그 파일 저장 따로 만들어야 하나?
            _.Log(msg);
        }
        
        #region 팝업 통신
        // 이거 결국 finder 말곤 안 쓰나?
        public void SendMsg(string target, string msg) {
            _.SendMsg(target, msg);
        }
        // setting.html
        public void GetWindows(string targets) { _.GetWindows(ParseJson<string[]>(targets)); }
        public void SelectPlayerPath() { _.SelectPlayerPath(); }

        // addon 설정용
        public void SetAfterInitAddon(string func) { _.SetAfterInitAddon(func); }
        public void LoadAddonSetting(string path) { _.LoadAddonSetting(path); }
        public void SaveAddonSetting(string path, string text) { _.SaveAddonSetting(path, text); }

        public void GetSubDirs(string dir) { _.GetSubDirs(dir); }
        public void SearchFiles(string dir, string query) { _.SearchFiles(dir, query); }

        // viewer/finder opener 못 쓰게 될 경우 고려
        public void UpdateViewerSetting() { _.UpdateViewerSetting(); }
        public void UpdateViewerLines(string lines) { _.UpdateViewerLines(lines); }

        public void OnloadFinder (string last ) { _.OnloadFinder (last ); }
        public void RunFind      (string param) { _.RunFind      (param); }
        public void RunReplace   (string param) { _.RunReplace   (param); }
        public void RunReplaceAll(string param) { _.RunReplaceAll(param); }
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
        #endregion
    }
}