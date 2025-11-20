using System;
using System.Drawing;
using System.IO;
using System.Text;
using System.Windows.Forms;
using CefSharp;
using System.Diagnostics;

namespace Jamaker
{
    public partial class MainForm : Form
    {
        private string[] args;

        public MainForm(string[] args)
        {
            string ProcName = Process.GetCurrentProcess().ProcessName;
            if (Process.GetProcessesByName(ProcName).Length > 1)
            {
                MessageBox.Show($"{ProcName}는 이미 실행 중입니다.");
                Process.GetCurrentProcess().Kill();
            }

            WebForm("AssSyncOptimizer");

            int[] rect = { 0, 0, 1280, 800 };
            StreamReader sr = null;
            try
            {   // 설정 파일 경로
                sr = new StreamReader(Path.Combine(Application.StartupPath, "setting/AssSyncOptimizer.txt"), Encoding.UTF8);
                string strSetting = sr.ReadToEnd();
                string[] strRect = strSetting.Split(',');
                if (strRect.Length >= 4)
                {
                    rect[0] = Convert.ToInt32(strRect[0]);
                    rect[1] = Convert.ToInt32(strRect[1]);
                    rect[2] = Convert.ToInt32(strRect[2]);
                    rect[3] = Convert.ToInt32(strRect[3]);
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
            mainView.LoadUrl(Path.Combine(Application.StartupPath, "view/AssSyncOptimizer.html"));
            mainView.JavascriptObjectRepository.Settings.LegacyBindingEnabled = true;
            mainView.JavascriptObjectRepository.Register("binder", new Binder(this), false, BindingOptions.DefaultBinder);
            mainView.RequestHandler = new RequestHandler(); // TODO: 팝업에서 이동을 막아야 되는데...

            this.args = args;

            FormClosed += new FormClosedEventHandler(WebFormClosed);
        }
        public void OverrideInitAfterLoad() {
            LoadFiles(args);
        }

        private void WebFormClosed(object sender, FormClosedEventArgs e)
        {
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

                StreamWriter sw = new StreamWriter(Path.Combine(Application.StartupPath, "setting/AssSyncOptimizer.txt"), false, Encoding.UTF8);
                sw.Write(offset.left + "," + offset.top + "," + (offset.right - offset.left) + "," + (offset.bottom - offset.top));
                sw.Close();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

            Process.GetCurrentProcess().Kill();
        }

        private void OverrideDrop(int x, int y)
        {
            Script("drop", new object[] { x, y });
        }

        public void CheckAndMakeFkf(string path)
        {
            try
            {
                string selector = "#labelVideo";
                FileInfo info = new FileInfo(path);
                string fkfName = $"{info.Name.Substring(0, info.Name.Length - info.Extension.Length)}.{info.Length}.fkf";

                // 기존에 있으면 가져오기
                try
                {
                    DirectoryInfo di = new DirectoryInfo(Path.Combine(Application.StartupPath, "temp"));
                    if (di.Exists)
                    {
                        VideoInfo.FromFkfFile(Path.Combine(Application.StartupPath, "temp/fkf/" + fkfName));
                        Script("Progress.set", new object[] { selector, 0 });
                        Script("setFkfFile", fkfName);
                        return;
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                }

                if ((VideoInfo.CheckFFmpeg() & 3) == 3)
                {
                    // 없으면 새로 가져오기
                    new VideoInfo(path, (double ratio) =>
                    {
                        Script("Progress.set", new object[] { selector, ratio });
                    }).RefreshInfo((VideoInfo videoInfo) =>
                    {
                        videoInfo.ReadKfs(true);
                        videoInfo.SaveFkf(Path.Combine(Application.StartupPath, "temp/fkf/" + fkfName));
                        Script("Progress.set", new object[] { selector, 0 });
                        Script("setFkfFile", fkfName);
                    });
                }
            }
            catch (Exception e) { Console.WriteLine(e); }
        }

        #region 파일
        public void DropFiles()
        {
            LoadFiles(droppedFiles);
        }
        public void LoadFiles(string[] files)
        {
            bool hasAss = false;
            bool hasVideo = false;
            foreach (string file in files)
            {
                string ext = file.ToLower();

                if (ext.EndsWith(".ass"))
                {
                    if (hasAss) continue;

                    StreamReader sr = null;
                    try
                    {
                        sr = new StreamReader(file, DetectEncoding(file));
                        string text = sr.ReadToEnd();

                        hasAss = true;
                        Script("setAssFile", new object[] { file, text });

                        string[] lines = text.Split('\n');
                        // TODO: 비디오 파일 정보 있을 때 처리
                    }
                    catch
                    {
                        return;
                    }
                    finally { sr?.Close(); }

                }
                else if (ext.EndsWith(".avi")
                      || ext.EndsWith(".mp4")
                      || ext.EndsWith(".mkv")
                      || ext.EndsWith(".ts")
                      || ext.EndsWith(".m2ts"))
                {
                    if (hasVideo) continue;
                    hasVideo = true;
                    Script("setVideoFile", file);
                    CheckAndMakeFkf(file);
                }
                else if (ext.EndsWith(".fkf"))
                {
                    if (hasVideo) continue;
                    hasVideo = true;
                    Script("setVideoFile", file);
                    Script("setFkfFile", file);
                }
            }
            droppedFiles = null;
        }
        public void Save(string path, string text)
        {
            StreamWriter sw = null;
            try
            {   // 무조건 UTF-8로 저장
                (sw = new StreamWriter(path, false, Encoding.UTF8)).Write(text);
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
    }
}
