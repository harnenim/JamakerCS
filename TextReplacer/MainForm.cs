using System;
using System.Drawing;
using System.IO;
using System.Text;
using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;
using System.Diagnostics;
using System.Collections.Generic;
using static System.Net.Mime.MediaTypeNames;
using TextFile;
using static System.Net.WebRequestMethods;

namespace Jamaker
{
    public partial class MainForm : Form
    {
        #region 공통 기능... class 따로 만들어야?
        private string Script(string name) { return mainView.Script(name); }
        private string Script(string name, object arg) { return mainView.Script(name, arg); }

        public void Alert(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Alert(target, msg); }));
            }
            else
            {
                MessageBoxEx.Show(GetHwnd(target), msg, msgTitle);
            }
        }
        public void Confirm(string target, string msg)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Confirm(target, msg); }));
            }
            else
            {
                if (MessageBoxEx.Show(GetHwnd(target), msg, msgTitle, MessageBoxButtons.YesNo) == DialogResult.Yes)
                {
                    Script("afterConfirmYes");
                }
                else
                {
                    Script("afterConfirmNo");
                }
            }
        }

        public void ShowDragging()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { ShowDragging(); }));
            }
            else
            {
                layerForDrag.Visible = true;
                Script("showDragging");
            }
        }
        public void HideDragging()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { HideDragging(); }));
            }
            else
            {
                layerForDrag.Visible = false;
                Script("hideDragging");
            }
        }
        string[] droppedFiles = null;
        protected void DragLeaveMain(object sender, EventArgs e) { HideDragging(); }
        protected void DragOverMain(object sender, DragEventArgs e)
        {
            try { e.Effect = DragDropEffects.All; } catch { }
            Script("dragover", new object[] { e.X - Location.X, e.Y - Location.Y });
        }
        protected void DragDropMain(object sender, DragEventArgs e)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { DragDropMain(sender, e); }));
            }
            else
            {
                droppedFiles = (string[])e.Data.GetData(DataFormats.FileDrop);
                HideDragging();
                Script("drop", new object[] { e.X - Location.X, e.Y - Location.Y });
            }
        }
        #endregion

        readonly string msgTitle = "TextReplacer";

        private string settingJson = "{\"filters\":\"*.txt, *.smi, *.ass\",\"replacers\":[{\"use\":true,\"from\":\"다시 한번\",\"to\":\"다시 한 번\"},{\"use\":true,\"from\":\"그리고 보니\",\"to\":\"그러고 보니\"},{\"use\":true,\"from\":\"뒤쳐\",\"to\":\"뒤처\"},{\"use\":true,\"from\":\"제 정신\",\"to\":\"제정신\"},{\"use\":true,\"from\":\"스탠드 얼론\",\"to\":\"스탠드얼론\"},{\"use\":true,\"from\":\"멘테넌스\",\"to\":\"메인터넌스\"},{\"use\":true,\"from\":\"뒷처리\",\"to\":\"뒤처리\"},{\"use\":true,\"from\":\"스탭도\",\"to\":\"스태프도\"},{\"use\":true,\"from\":\"등 져선\",\"to\":\"등져선\"},{\"use\":true,\"from\":\"타코이즈\",\"to\":\"터쿼이즈\"},{\"use\":true,\"from\":\"쓰레드\",\"to\":\"스레드\"},{\"use\":true,\"from\":\"져버리지\",\"to\":\"저버리지\"},{\"use\":true,\"from\":\"글러먹\",\"to\":\"글러 먹\"}]}";

        public MainForm()
        {
            // 브라우저 설정
            CefSettings settings = new CefSettings
            { Locale = "ko"
            , CachePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\CEF"
            };
            settings.CefCommandLineArgs.Add("disable-web-security");
            Cef.Initialize(settings);
            CefSharpSettings.ShutdownOnExit = true; // Release일 땐 false 해줘야 함

            InitializeComponent();

            int[] rect = { 0, 0, 1280, 800 };
            StreamReader sr = null;
            try
            {   // 설정 파일 경로
                sr = new StreamReader("setting/TextReplacer.txt", Encoding.UTF8);
                string strSetting = sr.ReadToEnd();
                string[] strRect = strSetting.Split(',');
                if (strRect.Length >= 4)
                {
                    rect[0] = Convert.ToInt32(strRect[0]);
                    rect[1] = Convert.ToInt32(strRect[1]);
                    rect[2] = Convert.ToInt32(strRect[2]);
                    rect[3] = Convert.ToInt32(strRect[3]);
                }
                if (strSetting.IndexOf('\n') > 0)
                {
                    settingJson = strSetting.Substring(strSetting.IndexOf('\n') + 1);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                rect[0] = (System.Windows.Forms.SystemInformation.VirtualScreen.Width - 1280) / 2;
                rect[1] = (System.Windows.Forms.SystemInformation.VirtualScreen.Height - 800) / 2;
            }
            finally { if (sr != null) sr.Close(); }

            StartPosition = FormStartPosition.Manual;
            Location = new Point(rect[0], rect[1]);
            Size = new Size(rect[2], rect[3]);

            SetStyle(ControlStyles.SupportsTransparentBackColor, true);
            BackColor = Color.Transparent;
            AllowTransparency = true;

            mainView.LifeSpanHandler = new LSH(this);
            mainView.LoadUrl(Path.Combine(Directory.GetCurrentDirectory(), "view/TextReplacer.html"));
            mainView.JavascriptObjectRepository.Settings.LegacyBindingEnabled = true;
            mainView.JavascriptObjectRepository.Register("binder", new Binder(this), false, BindingOptions.DefaultBinder);
            mainView.RequestHandler = new RequestHandler(); // TODO: 팝업에서 이동을 막아야 되는데...

            FormClosing += new FormClosingEventHandler(BeforeExit);
            FormClosed += new FormClosedEventHandler(WebFormClosed);

            windows.Add("editor", Handle.ToInt32());
        }

        private void BeforeExit(object sender, FormClosingEventArgs e)
        {
            e.Cancel = true;
            Script("beforeExit");
        }

        public void ExitAfterSaveSetting(string setting)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { ExitAfterSaveSetting(setting); }));
                return;
            }
            try
            {
                RECT offset = new RECT();
                WinAPI.GetWindowRect(Handle.ToInt32(), ref offset);

                // 설정 폴더 없으면 생성
                DirectoryInfo di = new DirectoryInfo("setting");
                if (!di.Exists)
                {
                    di.Create();
                }

                StreamWriter sw = new StreamWriter("setting/TextReplacer.txt", false, Encoding.UTF8);
                sw.Write(offset.left + "," + offset.top + "," + (offset.right - offset.left) + "," + (offset.bottom - offset.top) + ",\n" + setting);
                sw.Close();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

            Process.GetCurrentProcess().Kill();
        }

        private void WebFormClosed(object sender, FormClosedEventArgs e)
        {
            Process.GetCurrentProcess().Kill();
        }

        #region 창 조작
        private readonly Dictionary<string, int> windows = new Dictionary<string, int>();
        public void SetWindow(string name, int hwnd)
        {
            RemoveWindow(name); // 남아있을 수 있음
            windows.Add(name, hwnd);
        }
        public void RemoveWindow(string name)
        {
            windows.Remove(name);
        }
        // window.open 시에 브라우저에 커서 가도록
        public void SetFocus(int hwnd)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { SetFocus(hwnd); }));
            }
            else
            {
                mainView.Focus();
            }
        }
        private int GetHwnd(string target)
        {
            try
            {
                return windows[target];
            }
            catch { }
            return 0;
        }

        public void FocusWindow(string target)
        {
            if (target.Equals("player"))
            {
                return;
            }
            int hwnd = GetHwnd(target);
            WinAPI.SetForegroundWindow(hwnd);

            // 에디터 활성화할 땐 커서까지 포커싱
            if (target.Equals("editor"))
            {
                delayFocusing = 10; // 창 전환 후 바로 호출하면 꼬임
                timer.Tick += FocusEditor;
            }
        }
        private int delayFocusing = 0;
        private void FocusEditor(object sender, EventArgs e)
        {
            if (--delayFocusing == 0)
            {
                mainView.Focus();
                timer.Tick -= FocusEditor;
            }
        }
        #endregion

        public void Init()
        {
            Script("init", new object[] { settingJson });
        }

        public void Compare(string file, string[] froms, string[] tos)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Compare(file, froms, tos); }));
                return;
            }

            Replaced result = GetReplacedWithPreview(file, froms, tos);
            if (result == null) return;


        }
        public void Replace(string[] files, string[] froms, string[] tos)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { Replace(files, froms, tos); }));
                return;
            }

            StreamWriter sw = null;
            foreach (string file in files)
            {
                string result = GetReplaced(file, froms, tos);
                if (result == null) continue;

                try
                {
                    // 원본 파일의 인코딩대로 저장
                    sw = new StreamWriter(file, false, BOM.DetectEncoding(file));
                    sw.Write(result);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                }
                finally
                {
                    sw?.Close();
                }
            }

            Script("alert", new object[] { "작업이 완료됐습니다." });
        }
        private string GetReplaced(string file, string[] froms, string[] tos)
        {
            StreamReader sr = null;
            string text = null;
            try
            {
                sr = new StreamReader(file, BOM.DetectEncoding(file));
                text = sr.ReadToEnd();
            }
            catch { }
            finally { sr?.Close(); }

            if (text == null) return null;

            for (int i = 0; i < froms.Length; i++)
            {
                text = text.Replace(froms[i], tos[i]);
            }
            return text;
        }
        private Replaced GetReplacedWithPreview(string file, string[] froms, string[] tos)
        {
            Replaced result = null;

            StreamReader sr = null;
            try
            {
                sr = new StreamReader(file, BOM.DetectEncoding(file));

                // 모두 불러온 대로 초기화
                result = new Replaced(sr.ReadToEnd());
            }
            catch { }
            finally { sr?.Close(); }

            if (result == null) return null;

            // 미리보기 html escape
            result.originPreview = System.Security.SecurityElement.Escape(result.originPreview);
            result.resultPreview = System.Security.SecurityElement.Escape(result.resultPreview);

            // 각각의 변환 대상 문자열 쌍에 대해 변환
            for (int i = 0; i < froms.Length; i++)
            {
                // 원본 미리보기(하이라이트 태그만 씌움) / 결과 / 결과 미리보기 각각 변환
                result.originPreview = result.originPreview.Replace(froms[i], "<span class='highlight'>" + froms[i] + "</span>");
                result.result = result.result.Replace(froms[i], tos[i]);
                result.resultPreview = result.resultPreview.Replace(froms[i], "<span class='highlight'>" + tos[i] + "</span>");
                //result.count++;
                // 태그가 붙은 replacedPreview는 2번째 이후 변환값에 대해 문제가 생길 가능성이 있어 보임
                // 뜯어고쳐야 함... 이런 식으로 하지 말고 모든 변환 위치를 기억해둬야 할 것 같음...
                // 아니 근데 솔직히 변환 기능이랑 별개로 그냥 미리보기 하나 만들자고 구조 뜯어고치는 것도 뻘짓 같은데
            }

            return result;
        }
        private class Replaced
        {
            public string origin = null;
            public string originPreview = null;
            public string result = null;
            public string resultPreview = null;
            public int count = 0;
            public Replaced(string text)
            {
                origin = originPreview = result = resultPreview = text;
            }
        }

        public void ImportSetting()
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { ImportSetting(); }));
                return;
            }
            OpenFileDialog dialog = new OpenFileDialog { Filter = "JSON 파일|*.json" };
            if (dialog.ShowDialog() == DialogResult.OK)
            {
                string path = dialog.FileName;
                string text = "";
                StreamReader sr = null;
                try
                {
                    Encoding encoding = TextFile.BOM.DetectEncoding(path);
                    sr = new StreamReader(path, encoding);
                    text = sr.ReadToEnd();
                }
                catch
                {
                    Script("alert", "파일을 열지 못했습니다.");
                }
                finally { sr?.Close(); }

                Script("init", new object[] { settingJson = text });
            }
        }

        public void ExportSetting(string setting)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { ExportSetting(setting); }));
                return;
            }
            SaveFileDialog dialog = new SaveFileDialog{ Filter = "JSON 파일|*.json" };
            if (dialog.ShowDialog() != DialogResult.OK)
            {   // 저장 취소
                return;
            }
            string path = dialog.FileName;
            StreamWriter sw = null;
            try
            {   // 무조건 UTF-8로 저장
                (sw = new StreamWriter(path, false, Encoding.UTF8)).Write(setting);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                Script("alert", "저장되지 않았습니다.");
            }
            finally
            {
                sw?.Close();
            }
        }

        #region 파일
        public void AddFilesByDrag()
        {
            foreach (string file in droppedFiles)
            {
                Script("addFile", new object[] { file });
            }
        }
        public void LoadSettingByDrag()
        {
            StreamReader sr = null;
            try
            {
                Encoding encoding = TextFile.BOM.DetectEncoding(droppedFiles[0]); // TODO: BOM 없으면 버그 있나...?
                sr = new StreamReader(droppedFiles[0], encoding);
                Script("init", sr.ReadToEnd());
            }
            catch
            {
                Script("alert", "파일을 열지 못했습니다.");
            }
            finally { sr?.Close(); }
        }

        public void Save(string dir, string name, string text)
        {
            StreamWriter sw = null;
            try
            {   // 무조건 UTF-8로 저장
                (sw = new StreamWriter(dir + "/" + name, false, Encoding.UTF8)).Write(text);
                Script("alert", "저장했습니다.");
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                Script("alert", "저장되지 않았습니다.");
            }
            finally
            {
                if (sw != null) sw.Close();
            }
        }
        #endregion
    }
}
