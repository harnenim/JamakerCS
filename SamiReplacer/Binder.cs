namespace Jamaker
{
    class BaseBinder
    {
        private readonly MainForm _;

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
    }

    class Binder : BaseBinder
    {
        private readonly MainForm _;

        public Binder(MainForm mainForm) : base(mainForm)
        {
            _ = mainForm;
        }

        public void AddFilesByDrag()
        {
            _.AddFilesByDrag();
        }

        public void StartReplace(string[] files)
        {
            _.StartReplace(files);
        }
        public void SaveAndReplaceNext(int index, string text)
        {
            _.SaveAndReplaceNext(index, text);
        }

        public void ExitAfterSaveSetting(string setting)
        {
            _.ExitAfterSaveSetting(setting);
        }
    }
}
