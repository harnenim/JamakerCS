using System;
using System.Drawing;
using System.IO;
using System.Text;
using System.Windows.Forms;
using CefSharp;
using System.Diagnostics;
using System.Threading;
using System.Collections.Generic;

namespace Jamaker
{
    public partial class MainForm : Form
    {
        private string settingJson = "{\"saveSkf\":{\"origin\":true,\"target\":true},\"separators\":\"&nbsp;&nbsp;\\n하느@harne_\"}";

        public MainForm()
        {
            WebForm("SyncShift");

            int[] rect = { 0, 0, 1280, 800 };
            StreamReader sr = null;
            try
            {   // 설정 파일 경로
                sr = new StreamReader("setting/SyncShift.txt", Encoding.UTF8);
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
                rect[0] = (SystemInformation.VirtualScreen.Width - 1280) / 2;
                rect[1] = (SystemInformation.VirtualScreen.Height - 800) / 2;
            }
            finally { sr?.Close(); }

            StartPosition = FormStartPosition.Manual;
            Location = new Point(rect[0], rect[1]);
            Size = new Size(rect[2], rect[3]);

            SetStyle(ControlStyles.SupportsTransparentBackColor, true);
            BackColor = Color.Transparent;
            AllowTransparency = true;

            mainView.LifeSpanHandler = new LSH(this);
            mainView.LoadUrl(Path.Combine(Directory.GetCurrentDirectory(), "view/AutoSyncShift.html"));
            mainView.JavascriptObjectRepository.Settings.LegacyBindingEnabled = true;
            mainView.JavascriptObjectRepository.Register("binder", new Binder(this), false, BindingOptions.DefaultBinder);
            mainView.RequestHandler = new RequestHandler(); // TODO: 팝업에서 이동을 막아야 되는데...

            FormClosing += new FormClosingEventHandler(BeforeExit);
            FormClosed += new FormClosedEventHandler(WebFormClosed);
        }
        public void OverrideInitAfterLoad()
        {
            Script("init", new object[] { settingJson });
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

            StreamWriter sw = null;
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

                sw = new StreamWriter("setting/SyncShift.txt", false, Encoding.UTF8);
                sw.Write(offset.left + "," + offset.top + "," + (offset.right - offset.left) + "," + (offset.bottom - offset.top) + ",\n" + setting);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
            finally
            {
                sw?.Close();
            }

            Process.GetCurrentProcess().Kill();
        }

        private void WebFormClosed(object sender, FormClosedEventArgs e)
        {

            Process.GetCurrentProcess().Kill();
        }

        private void OverrideDrop(int x, int y)
        {
            Script("drop", new object[] { x, y });
        }

        #region 파일
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
                sw?.Close();
            }
        }
        #endregion


        VideoInfo originVideoFile = null;
        VideoInfo originSubtitleFile = null;
        VideoInfo targetVideoFile = null;

        bool isOriginVideoFile = true;
        bool withSaveSkf = true;

        public void ShowProcessing(string message)
        {
            Script("showProcessing", new object[] { message });
        }
        public void SetProgress(string progress, double status)
        {
            Script("setProgress", new object[] { progress, status });
        }
        public void HideProcessing()
        {
            Script("hideProcessing");
        }

        VideoInfo readingVideoFile = null;
        public void ReadVideoFile(string path)
        {
            Console.WriteLine("ReadVideoFile: {0}", path);
            ShowProcessing("불러오는 중");
            var progress = isOriginVideoFile ? "#originVideo > .input" : "#targetVideo > .input";
            readingVideoFile = new VideoInfo(path, new WebProgress(this, progress));
            new Thread(new ThreadStart(() =>
            {
                readingVideoFile.RefreshInfo(AfterRefreshInfo);
            })).Start();
        }
        public void AfterRefreshInfo(VideoInfo video)
        {
            Console.WriteLine("AfterRefreshInfo");
            if (video.length > 0)
            {
                if (isOriginVideoFile)
                {
                    originVideoFile = video;
                    Script("setOriginVideoFile", new object[] { video.path });
                }
                else
                {
                    targetVideoFile = video;
                    Script("setTargetVideoFile", new object[] { video.path });
                }

                List<StreamAttr> streams = video.streams;

                List<int> audios = new List<int>();
                for (int i = 0; i < streams.Count; i++)
                {
                    StreamAttr stream = streams[i];
                    Console.WriteLine("Stream {0}: {1}({2})", i, stream.type, stream.language);
                    foreach (KeyValuePair<string, string> pair in stream.metadata)
                    {
                        Console.WriteLine("  {0}: {1}", pair.Key, pair.Value);
                    }
                    if (streams[i].type.Equals("audio"))
                    {
                        audios.Add(i);
                    }
                }
                Console.WriteLine("audios.Count: {0}", audios.Count);
                //this.streams = streams;
                switch (audios.Count)
                {
                    case 0:
                        Script("alert", "오디오 없음");
                        HideProcessing();
                        return;
                    case 1:
                        {
                            SelectAudio(audios[0]);
                            break;
                        }
                    default:
                        string data = null;
                        foreach (int index in audios)
                        {
                            string item = string.Format("{0}: [{1}] {2}", index, streams[index].language, streams[index].metadata["title"]);
                            data = data == null ? item : (data + "|" + item);
                        }
                        Script("showAudioSelector", new object[] { data });
                        break;
                }
            }
            else
            {
                video.progress.Set(0);
                HideProcessing();
            }
        }
        public void SelectAudio(int track)
        {
            Console.WriteLine("SelectAudio: {0}", track);
            if (isOriginVideoFile)
            {
                Script("refreshRangeAfterReadOriginVideoFile", new object[] { originVideoFile.length });
                new Thread(new ThreadStart(() =>
                {
                    originVideoFile.audioTrackIndex = track;
                    originVideoFile.RefreshSkf();
                    if (withSaveSkf)
                    {
                        originVideoFile.SaveSkf();
                    }
                    SetProgress("#originVideo > .input", 0);
                    HideProcessing();
                })).Start();
            }
            else
            {
                new Thread(new ThreadStart(() =>
                {
                    targetVideoFile.audioTrackIndex = track;
                    targetVideoFile.RefreshSkf();
                    if (withSaveSkf)
                    {
                        targetVideoFile.SaveSkf();
                    }
                    SetProgress("#targetVideo > .input", 0);
                    HideProcessing();
                })).Start();
            }
        }
        public void ReadSkfFile(string path)
        {
            Console.WriteLine("ReadSkfFile: {0}", path);
            ShowProcessing("불러오는 중");
            if (isOriginVideoFile)
            {
                Script("setOriginVideoFile", new object[] { path });
                originVideoFile = new VideoInfo(path);
                new Thread(new ThreadStart(() =>
                {
                    originVideoFile.RefreshSkf();
                    HideProcessing();
                })).Start();
            }
            else
            {
                Script("setTargetVideoFile", new object[] { path });
                targetVideoFile = new VideoInfo(path);
                new Thread(new ThreadStart(() =>
                {
                    targetVideoFile.RefreshSkf();
                    HideProcessing();
                })).Start();
            }
        }
        public void ReadSubtitleFile(string path)
        {
            Console.WriteLine("ReadSubtitleFile: {0}", path);
            StreamReader sr = null;
            try
            {
                Encoding encoding = TextFile.BOM.DetectEncoding(path); // TODO: BOM 없으면 버그 있나...?
                sr = new StreamReader(path, encoding);
                string text = sr.ReadToEnd();

                Script("setOriginSubtitleFile", new object[] { path, text });
            }
            catch
            {
                return;
            }
            finally { sr?.Close(); }
        }
        public void OpenFileDialog(int type, bool withSaveSkf)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() =>
                {
                    OpenFileDialog(type, withSaveSkf);
                }));
            }
            string filter = "지원되는 자막 파일|*.smi;*.srt;*.ass";
		    if (type % 10 == 0) {
                filter = "동영상 혹은 skf 파일|*.avi;*.mkv;*.mp4;*.ts;*.m2ts;*.skf";
            }
            OpenFileDialog dialog = new OpenFileDialog { Filter = filter };
            if (dialog.ShowDialog() == DialogResult.OK)
            {
                droppedFiles = new string[] { dialog.FileName };

                switch (type / 10)
                {
                    case 1:
                        {
                            DropOriginFile(withSaveSkf);
                            break;
                        }
                    case 2:
                        {
                            DropTargetFile(withSaveSkf);
                            break;
                        }
                }
}
	    }

        public void DropOriginFile(bool withSaveSkf)
        {
            Console.WriteLine("DropOriginFile: {0}", withSaveSkf);
            if (droppedFiles == null)
            {
                return;
            }

            var hasVideo = false;
            var hasSubtitle = false;
            foreach (string path in droppedFiles)
            {
                FileInfo file = new FileInfo(path);
                string ext = file.Extension;
                switch (ext)
                {
                    case ".avi":
                    case ".mkv":
                    case ".mp4":
                    case ".ts":
                    case ".m2ts":
                        {
                            if (hasVideo) break;
                            hasVideo = true;
                            isOriginVideoFile = true;
                            this.withSaveSkf = withSaveSkf;
                            ReadVideoFile(path);
                            break;
                        }
                    case ".skf":
                        {
                            if (hasVideo) break;
                            hasVideo = true;
                            isOriginVideoFile = true;
                            ReadSkfFile(path);
                            break;
                        }
                    case ".smi":
                    case ".ass":
                    case ".srt":
                        {
                            if (hasSubtitle) break;
                            hasSubtitle = true;
                            ReadSubtitleFile(path);
                            break;
                        }
                }
                if (hasVideo && hasSubtitle)
                {
                    break;
                }
            }
        }
        public void DropTargetFile(bool withSaveSkf)
        {
            Console.WriteLine("DropTargetFile: {0}", withSaveSkf);
            if (droppedFiles == null)
            {
                return;
            }

            foreach (string path in droppedFiles)
            {
                FileInfo file = new FileInfo(path);
                string ext = file.Extension;
                switch (ext)
                {
                    case ".avi":
                    case ".mkv":
                    case ".mp4":
                    case ".ts":
                    case ".m2ts":
                        {
                            isOriginVideoFile = false;
                            this.withSaveSkf = withSaveSkf;
                            ReadVideoFile(path);
                            break;
                        }
                    case ".skf":
                        {
                            isOriginVideoFile = false;
                            ReadSkfFile(path);
                            break;
                        }
                }
            }
        }

        public void CalcShift(string strRanges, string strShifts)
        {
            Console.WriteLine("CalcShift: {0}, {1}", strRanges, strShifts);

            if (originVideoFile == null || targetVideoFile == null)
            {
                Script("alert", "파일을 선택해주세요.");
            }

            ShowProcessing("작업 중");

            new Thread(new ThreadStart(() =>
            {
                string[] sRanges = strRanges.Length > 0 ? strRanges.Split('|') : new string[] { };
                string[] sShifts = strShifts.Length > 0 ? strShifts.Split('|') : new string[] { };
                List<Range> ranges = new List<Range>();

                if (sRanges.Length == 0)
                {
                    Script("addRange", new object[] { 0, originVideoFile.GetSfs().Count * 10 });
                    ranges.Add(new Range(0, originVideoFile.GetSfs().Count));
                }
                else
                {
                    List<Range> shifts = new List<Range>();
                    foreach (string sShift in sShifts)
                    {
                        string[] split = sShift.Split(':');
                        int start = int.Parse(split[0]) / 10;
                        int shift = int.Parse(split[1]) / 10;
                        shifts.Add(new Range(start, shift));
                    }

                    Range last = null;
                    foreach (string sRange in sRanges)
                    {
                        string[] split = sRange.Split('~');
                        int start = int.Parse(split[0]) / 10;
                        int end   = int.Parse(split[1]) / 10;
                        ranges.Add(last = new Range(start, end, last == null ? 0 : last.shift));

                        foreach (Range shift in shifts)
                        {
                            if (shift.start < start) continue;
                            if (shift.start >= end) break;

                            if (shift.start > start)
                            {
                                last.end = shift.start;
                                ranges.Add(last = new Range(shift.start, end, shift.shift));
                            }
                            else
                            {
                                last.shift = shift.shift;
                            }
                        }
                    }
                }

                List<SyncShift> result = SyncShift.GetShiftsForRanges(originVideoFile.GetSfs(), targetVideoFile.GetSfs(), ranges, new WebProgress(this, "#settingCalc"));

                foreach (SyncShift shift in result)
                {
                    Script("addShift", new object[] { shift.start * 10, shift.shift * 10 });
                }

                HideProcessing();
                SetProgress("#settingCalc", 0);
            })).Start();
        }
        public void Save(string text, string operation)
        {
            if (targetVideoFile == null)
            {
                Script("alert", new object[] { "목표 영상 파일을 선택해주세요." });
            }
            string path = targetVideoFile.path.Substring(0, targetVideoFile.path.Length - new FileInfo(targetVideoFile.path).Extension.Length) + "." + operation;

            StreamWriter sw = new StreamWriter(path, false, Encoding.UTF8);
            sw.Write(text);
            sw.Close();

            Script("alert", new object[] { "저장했습니다." });
        }
    }
    public class WebProgress
    {
        private MainForm main;
        private string selector;

        public WebProgress(MainForm main, string selector)
        {
            this.main = main;
            this.selector = selector;
        }
        public void Set(double ratio)
        {
            main.SetProgress(selector, ratio);
        }
    }

    public class Range
    {
        public int start;
        public int end;
        public int shift;
        public Range(int start, int end)
        {
            this.start = start;
            this.end = end;
            shift = 0;
        }
        public Range(int start, int end, int shift)
        {
            this.start = start;
            this.end = end;
            this.shift = shift;
        }
    }
}
