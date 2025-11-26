using Newtonsoft.Json;
using System;

namespace Jamaker
{
#pragma warning disable IDE1006 // 명명 스타일
    public class Binder(MainForm mainForm) : WebViewForm.BaseBinder(mainForm)
    {
        private readonly MainForm _ = mainForm;

        public void moveWindow(string target, int x, int y, int width, int height, bool resizable)
        {
            _.MoveWindow(target, x, y, width, height, resizable);
        }
        public void setFollowWindow(bool follow)
        {
            _.SetFollowWindow(follow);
        }

        public void setMenus(string menus)
        {
            _.SetMenus(ParseJson<string[][]>(menus));
        }
        public void focusToMenu(int keyCode)
        {
            _.FocusToMenu(keyCode);
        }

        public void repairSetting()
        {
            _.RepairSetting();
        }
        public void saveSetting(string setting)
        {
            _.SaveSetting(setting);
        }
        public void setVideoExts(string exts)
        {
            _.SetVideoExts(exts);
        }
        public void setPlayer(string dll, string exe, bool withRun, bool useMove)
        {
            _.SetPlayer(dll, exe, withRun, useMove);
        }

        public void save(int tab, string text, string path, int type)
        {
            _.Save(tab, text, path, type);
        }
        public void saveTemp(string text, string path)
        {
            _.SaveTemp(text, path);
        }
        public void openFile()
        {
            _.OpenFile();
        }
        public void afterInit(int limit)
        {
            _.AfterInit(limit);
        }
        public void openFileForVideo()
        {
            _.OpenFileForVideo();
        }
        public void setPath(string smiPath)
        {
            _.SetPath(smiPath);
        }
        public void setPathAndCheckLoadVideoFile(string smiPath)
        {
            _.SetPath(smiPath);
            _.CheckLoadVideoFile();
        }
        public void loadVideoFile(string path)
        {
            _.LoadVideoFile(path);
        }
        public void requestFrames(string path)
        {
            _.RequestFrames(path);
        }
        public void setThumbnailSize(int width, int height)
        {
            _.SetThumbnailSize(width, height);
        }
        public void renderThumbnails(string path, string paramsStr)
        {
            _.RenderThumbnails(path, paramsStr);
        }
        public void cancelRenderThumbnails()
        {
            _.CancelRenderThumbnails();
        }
        public void doExit(bool resetPlayer, bool exitPlayer)
        {
            _.DoExit(resetPlayer, exitPlayer);
        }

        public void log(string msg)
        {
            _.Log(msg);
        }

        #region 팝업 통신
        // 이거 결국 finder 말곤 안 쓰나?
        public void sendMsg(string target, string msg)
        {
            _.SendMsg(target, msg);
        }
        // setting.html
        public void getWindows(string targets) { _.GetWindows(ParseJson<string[]>(targets)); }
        public void selectPlayerPath() { _.SelectPlayerPath(); }

        // addon 설정용
        public void setAfterInitAddon(string func) { _.SetAfterInitAddon(func); }
        public void loadAddonSetting(string path) { _.LoadAddonSetting(path); }
        public void saveAddonSetting(string path, string text) { _.SaveAddonSetting(path, text); }

        public void getSubDirs(string dir) { _.GetSubDirs(dir); }
        public void searchFiles(string dir, string query) { _.SearchFiles(dir, query); }

        // viewer/finder opener 못 쓰게 될 경우 고려
        public void updateViewerSetting() { _.UpdateViewerSetting(); }
        public void updateViewerLines(string lines) { _.UpdateViewerLines(lines); }

        public void onloadFinder(string last) { _.OnloadFinder(last); }
        public void runFind(string param) { _.RunFind(param); }
        public void runReplace(string param) { _.RunReplace(param); }
        public void runReplaceAll(string param) { _.RunReplaceAll(param); }
        #endregion

        #region 플레이어
        public void playOrPause() { _.player.PlayOrPause(); }
        public void play() { _.player.Play(); }
        public void stop() { _.player.Stop(); }
        public void moveTo(int time) { _.player.MoveTo(time); }
        #endregion

        #region 부가기능
        public void runColorPicker()
        {
            _.RunColorPicker();
        }
        #endregion
    }
}