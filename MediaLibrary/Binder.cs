namespace MovieLog
{
#pragma warning disable IDE1006 // 명명 스타일
    public class BaseBinder
    {
        private readonly MainForm _;

        public BaseBinder(MainForm webForm)
        {
            _ = webForm;
        }

        /*
        public void Focus(string target)
        {
            _.FocusWindow(target);
        }

        public void ShowDragging()
        {
            _.ShowDragging();
        }
        public void HideDragging()
        {
            _.HideDragging();
        }
        */

        public void initAfterLoad(string title)
        {
            _.InitAfterLoad(title);
        }

        public void alert(string target, string msg) { _.Alert(target, msg); }
        public void confirm(string target, string msg) { _.Confirm(target, msg); }
//        public void Prompt(string target, string msg, string def) { _.Prompt(target, msg, def); }
    }

    public class Binder : BaseBinder
    {
        private readonly MainForm _;

        public Binder(MainForm mainForm) : base(mainForm)
        {
            _ = mainForm;
        }

        public void openFolder(string path)
        {
            _.OpenFolder(path);
        }
        public void openExplorer(string path)
        {
            _.OpenExplorer(path);
        }
        public void runVideo(string path)
        {
            _.RunVideo(path);
        }
        public void runBDMV(string path)
        {
            _.RunBDMV(path);
        }
        public void selectFolders(string after)
        {
            _.SelectFolders(after);
        }
        public void selectFolder(string after)
        {
            _.SelectFolder(after);
        }
        public void saveSetting(string setting)
        {
            _.SaveSetting(setting);
        }
        public void commit(string base64)
        {
            _.Commit(base64);
        }
    }
}