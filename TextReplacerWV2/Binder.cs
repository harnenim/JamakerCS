using Newtonsoft.Json;
using System;

namespace Jamaker
{
#pragma warning disable IDE1006 // 명명 스타일
    public class Binder(MainForm mainForm) : WebViewForm.BaseBinder(mainForm)
    {
        private readonly MainForm _ = mainForm;

        public void addFilesByDrag()
        {
            _.AddFilesByDrag();
        }
        public void loadSettingByDrag()
        {
            _.LoadSettingByDrag();
        }

        public void compare(string file, string froms, string tos)
        {
            _.Compare(file, ParseJson<string[]>(froms), ParseJson<string[]>(tos));
        }

        public void replace(string files, string froms, string tos)
        {
            _.Replace(ParseJson<string[]>(files), ParseJson<string[]>(froms), ParseJson<string[]>(tos));
        }

        public void importSetting()
        {
            _.ImportSetting();
        }

        public void exportSetting(string setting)
        {
            _.ExportSetting(setting);
        }

        public void exitAfterSaveSetting(string setting)
        {
            _.ExitAfterSaveSetting(setting);
        }
    }
}