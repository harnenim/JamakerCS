namespace Jamaker
{
#pragma warning disable IDE1006 // 명명 스타일
    public class BaseBinder
    {
        private readonly MainForm _;

        public BaseBinder(MainForm webForm)
        {
            _ = webForm;
        }

        public void focus(string target)
        {
            _.FocusWindow(target);
        }

        public void showDragging()
        {
            _.ShowDragging();
        }
        public void hideDragging()
        {
            _.HideDragging();
        }

        public void initAfterLoad(string title)
        {
            _.InitAfterLoad(title);
        }

        public void alert(string target, string msg) { _.Alert(target, msg); }
        public void confirm(string target, string msg) { _.Confirm(target, msg); }
        public void Prompt(string target, string msg, string def) { _.Prompt(target, msg, def); }
    }
}