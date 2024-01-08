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

        public void MoveWindow(string target, int x, int y, int width, int height, bool resizable)
        {
            _.MoveWindow(target, x, y, width, height, resizable);
        }
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

        public void Save(string dir, string name, string text)
        {
            _.Save(dir, name, text);
        }
        public void DropFileToArea(int dropArea, string junk)
        {
            _.DropFileToArea(dropArea);
        }
        
        #region 팝업 통신
        public void Alert  (string target, string msg) { _.Alert  (target, msg); }
        public void Confirm(string target, string msg) { _.Confirm(target, msg); }
        #endregion
    }
}
