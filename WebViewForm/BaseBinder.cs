using Newtonsoft.Json;
using System.Runtime.InteropServices;

namespace WebViewForm
{
#pragma warning disable IDE1006 // 명명 스타일
    [ComVisible(true)]
    public class BaseBinder(WebForm webForm)
    {
        private readonly WebForm _ = webForm;

        public static T ParseJson<T>(string input)
        {
            return JsonConvert.DeserializeObject<T>(input)!;
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
        public void prompt(string target, string msg, string def) { _.Prompt(target, msg, def); }
    }
}