using CefSharp;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace Jamaker
{
    public partial class MainForm : Form
    {
        private readonly string settingJson = "{\"saveSkf\":{\"origin\":true,\"target\":true},\"separators\":\"&nbsp;&nbsp;\\n하느@harne_\",\"maxBlank\":30}";
        private string[] args;

        public MainForm(string[] args)
        {
            string ProcName = Process.GetCurrentProcess().ProcessName;
            if (Process.GetProcessesByName(ProcName).Length > 1)
            {
                MessageBox.Show($"{ProcName}는 이미 실행 중입니다.");
                Process.GetCurrentProcess().Kill();
            }

            WebForm("SyncShift");

            int[] rect = { 0, 0, 1280, 800 };
            StreamReader sr = null;
            try
            {   // 설정 파일 경로
                sr = new StreamReader(Path.Combine(Application.StartupPath, "setting/SyncShift.txt"), Encoding.UTF8);
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
            mainView.LoadUrl(Path.Combine(Application.StartupPath, "view/AutoSyncShift.html"));
            mainView.JavascriptObjectRepository.Settings.LegacyBindingEnabled = true;
            mainView.JavascriptObjectRepository.Register("binder", new Binder(this), false, BindingOptions.DefaultBinder);
            mainView.RequestHandler = new RequestHandler(); // TODO: 팝업에서 이동을 막아야 되는데...

            this.args = args;

            FormClosing += new FormClosingEventHandler(BeforeExit);
            FormClosed += new FormClosedEventHandler(WebFormClosed);
        }
        public void OverrideInitAfterLoad()
        {
            Script("init", settingJson);
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
                DirectoryInfo di = new DirectoryInfo(Path.Combine(Application.StartupPath, "setting"));
                if (!di.Exists)
                {
                    di.Create();
                }

                sw = new StreamWriter(Path.Combine(Application.StartupPath, "setting/SyncShift.txt"), false, Encoding.UTF8);
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
            Script("drop", x, y);
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
        VideoInfo targetVideoFile = null;
        
        public void ShowProcessing(string message)
        {
            Script("showProcessing", message);
        }
        public void SetProgress(string progress, double status)
        {
            Script("Progress.set", progress, status);
        }
        public void HideProcessing()
        {
            Script("hideProcessing");
        }

        VideoInfo readingVideoFile = null;
        public void ReadVideoFile(string path, bool isOrigin, bool withSaveSkf, bool withKf)
        {
            Console.WriteLine("ReadVideoFile: {0}", path);
            if ((VideoInfo.CheckFFmpeg() & 3) != 3) return;

            ShowProcessing("불러오는 중");
            var progress = isOrigin ? "#originVideo > .input" : "#targetVideo > .input";
            readingVideoFile = new VideoInfo(path, (double ratio) =>
            {
                SetProgress(progress, ratio);
            });
            new Thread(new ThreadStart(() =>
            {
                readingVideoFile.RefreshInfo((VideoInfo video) => {
                	AfterRefreshInfo(video, isOrigin, withSaveSkf, withKf);
                });
            })).Start();
        }
        private List<StreamAttr> audios = new List<StreamAttr>();
        public void AfterRefreshInfo(VideoInfo video, bool isOrigin, bool withSaveSkf, bool withKf)
        {
            Console.WriteLine("AfterRefreshInfo");
            if (video.duration > 0)
            {
                if (isOrigin)
                {
                    Script("setOriginVideoFile", (originVideoFile = video).path);
                }
                else
                {
                    Script("setTargetVideoFile", (targetVideoFile = video).path);
                }

                List<StreamAttr> streams = video.streams;

                audios = new List<StreamAttr>();
                for (int i = 0; i < streams.Count; i++)
                {
                    StreamAttr stream = streams[i];
                    Console.WriteLine("Stream {0}: {1}({2})", stream.map, stream.type, stream.language);
                    foreach (KeyValuePair<string, string> pair in stream.metadata)
                    {
                        Console.WriteLine("  {0}: {1}", pair.Key, pair.Value);
                    }
                    if (streams[i].type.Equals("audio"))
                    {
                        audios.Add(stream);
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
                            SelectAudio(audios[0], isOrigin, withSaveSkf, withKf);
                            break;
                        }
                    default:
                        string data = null;
                        foreach (StreamAttr audio in audios)
                        {
                            string title = audio.metadata.ContainsKey("title") ? audio.metadata["title"] : "이름 없음";
                            string item = string.Format("{0}ː[{1}] {2}", audio.map, audio.language, title);
                            data = data == null ? item : (data + "|" + item);
                        }
                        Script("showAudioSelector", data, isOrigin, withSaveSkf, withKf);
                        break;
                }
            }
            else
            {
                video.setProgress(0);
                HideProcessing();
            }
        }
        public void SelectAudio(string map, bool isOrigin, bool withSaveSkf, bool withKf)
        {
            foreach (StreamAttr audio in audios)
            {
                if (audio.map == map)
                {
                    SelectAudio(audio, isOrigin, withSaveSkf, withKf);
                    break;
                }
            }
        }
        public void SelectAudio(StreamAttr stream, bool isOrigin, bool withSaveSkf, bool withKf)
        {
            Console.WriteLine("SelectAudio: {0}", stream.map);
            VideoInfo video = originVideoFile;
            string progress = "#originVideo > .input";
            
            if (isOrigin)
            {
                Script("refreshRangeAfterReadOriginVideoFile", video.duration);
            }
            else
            {
            	video = targetVideoFile;
            	progress = "#targetVideo > .input";
            }
            
            new Thread(new ThreadStart(() =>
            {
            	video.audioMap = stream.map;
                video.audioStart = stream.startTime;
            	video.RefreshSkf(withSaveSkf, withKf);
            	SetProgress(progress, 0);
            	HideProcessing();
            })).Start();
        }
        public void ReadSkfFile(string path, bool isOrigin)
        {
            Console.WriteLine("ReadSkfFile: {0}", path);
            ShowProcessing("불러오는 중");
            if (isOrigin)
            {
                Script("setOriginVideoFile", path);
                originVideoFile = VideoInfo.FromSkfFile(path);
                new Thread(new ThreadStart(() =>
                {
                    HideProcessing();
                })).Start();
            }
            else
            {
                Script("setTargetVideoFile", path);
                targetVideoFile = VideoInfo.FromSkfFile(path);
                new Thread(new ThreadStart(() =>
                {
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
                sr = new StreamReader(path, DetectEncoding(path));
                string text = sr.ReadToEnd();

                Script("setOriginSubtitleFile", path, text);
            }
            catch
            {
                return;
            }
            finally { sr?.Close(); }
        }
        public void OpenFileDialog(int type, bool withSaveSkf, bool withKf)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() =>
                {
                    OpenFileDialog(type, withSaveSkf, withKf);
                }));
            }
            string filter = "지원되는 자막 파일|*.smi;*.sami;*.srt;*.ass;*.jmk";
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
                            DropTargetFile(withSaveSkf, withKf);
                            break;
                        }
                }
}
	    }

        public void InitOriginFiles(bool withSaveSkf)
        {
            LoadOriginFiles(args, withSaveSkf);
        }
        public void DropOriginFile(bool withSaveSkf)
        {
            Console.WriteLine("DropOriginFile: {0}", withSaveSkf);
            if (droppedFiles == null)
            {
                return;
            }
            LoadOriginFiles(droppedFiles, withSaveSkf);
        }
        public void LoadOriginFiles(string[] files, bool withSaveSkf)
        {
            var hasVideo = false;
            var hasSubtitle = false;
            foreach (string path in files)
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
                            ReadVideoFile(path, true, withSaveSkf, false);
                            break;
                        }
                    case ".skf":
                        {
                            if (hasVideo) break;
                            hasVideo = true;
                            ReadSkfFile(path, true);
                            break;
                        }
                    case ".smi":
                    case ".sami":
                    case ".ass":
                    case ".srt":
                    case ".jmk":
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
        public void DropTargetFile(bool withSaveSkf, bool withKf)
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
                            ReadVideoFile(path, false, withSaveSkf, withKf);
                            break;
                        }
                    case ".skf":
                        {
                            ReadSkfFile(path, false);
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
                return;
            }

            ShowProcessing("작업 중");

            new Thread(new ThreadStart(() =>
            {
                string[] sRanges = strRanges.Length > 0 ? strRanges.Split('|') : new string[] { };
                string[] sShifts = strShifts.Length > 0 ? strShifts.Split('|') : new string[] { };
                List<Range> ranges = new List<Range>();

                if (sRanges.Length == 0)
                {
                    Script("addRange", 0, originVideoFile.GetSfs().Count * 10);
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
                    Script("addShift", shift.start * 10, shift.shift * 10);
                }

                List<int> kfs = targetVideoFile.GetKfs();
                string strKfs = null;
                foreach (int kf in kfs)
                {
                    if (strKfs == null)
                        strKfs = "[" + kf;
                    else
                        strKfs += "," + kf;
                }
                strKfs += "]";
                Script("setKfs", strKfs);

                HideProcessing();
                SetProgress("#settingCalc", 0);
            })).Start();
        }
        public void Save(string text, string operation)
        {
            if (targetVideoFile == null)
            {
                Script("alert", "목표 영상 파일을 선택해주세요.");
            }
            string path = targetVideoFile.path.Substring(0, targetVideoFile.path.Length - new FileInfo(targetVideoFile.path).Extension.Length) + "." + operation;

            StreamWriter sw = new StreamWriter(path, false, Encoding.UTF8);
            sw.Write(text);
            sw.Close();

            Script("alert", "저장했습니다.");
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
