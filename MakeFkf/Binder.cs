using Newtonsoft.Json;

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

        public void MakeFkfs(string files)
        {
            _.MakeFkfs(ParseJson<string[]>(files));
        }
    }
}
