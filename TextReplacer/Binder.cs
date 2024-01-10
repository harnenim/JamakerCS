using System.Collections.Generic;

namespace Jamaker
{
    class Binder
    {
        private readonly MainForm _;

        public Binder(MainForm mainForm)
        {
            _ = mainForm;
        }

        public void Focus(string target)
        {
            _.FocusWindow(target);
        }

        public void InitAfterLoad()
        {
            _.Init();
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

        public void AddFilesByDrag()
        {
            _.AddFilesByDrag();
        }
        public void LoadSettingByDrag()
        {
            _.LoadSettingByDrag();
        }

        public void Compare(string file, string[] froms, string[] tos)
        {
            _.Compare(file, froms, tos);
        }

        public void Replace(string[] files, string[] froms, string[] tos)
        {
            _.Replace(files, froms, tos);
        }

        public void ImportSetting()
        {
            _.ImportSetting();
        }

        public void ExportSetting(string setting)
        {
            _.ExportSetting(setting);
        }

        public void ExitAfterSaveSetting(string setting)
        {
            _.ExitAfterSaveSetting(setting);
        }
    }
}
