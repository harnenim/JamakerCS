using Newtonsoft.Json;

namespace Jamaker
{
    class BaseBinder
    {
        private readonly MainForm _;

        public BaseBinder(MainForm webForm)
        {
            _ = webForm;
        }

        public static T ParseJson<T>(string input)
        {
            return JsonConvert.DeserializeObject<T>(input);
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

        public void ExitAfterSaveSetting(string setting)
        {
            _.ExitAfterSaveSetting(setting);
        }
        public void OpenFileDialog(int type, bool withSaveSkf, bool withKf)
        {
            _.OpenFileDialog(type, withSaveSkf, withKf);
        }
        public void InitOriginFiles(bool withSaveSkf)
        {
            _.InitOriginFiles(withSaveSkf);
        }
        public void DropOriginFile(bool withSaveSkf)
        {
            _.DropOriginFile(withSaveSkf);
        }
        public void DropTargetFile(bool withSaveSkf, bool withKf)
        {
            _.DropTargetFile(withSaveSkf, withKf);
        }
        public void SelectAudio(string map, bool isOrigin, bool withSaveSkf, bool withKf)
        {
            _.SelectAudio(map, isOrigin, withSaveSkf, withKf);
        }
        public void CalcShift(string ranges, string shifts)
        {
            _.CalcShift(ranges, shifts);
        }
        public void Save(string result, string operation)
        {
            _.Save(result, operation);
        }
        /*
        public void Exit()
        {
            _.Exit();
        }
        */
    }
}
