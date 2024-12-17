using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;

namespace Jamaker
{
    public class StreamAttr
    {
        public string map;
        public string type;
        public string language;
        public Dictionary<string, string> metadata = new Dictionary<string, string>();
    }
	
    public class VideoInfo
    {
        public enum Type
        {
            VIDEO, SKF, FKF
        }

        public static string exePath = Path.Combine(Directory.GetCurrentDirectory(), "ffmpeg");

        // 원래 키프레임도 보려고 했는데...
        // 생각보다 키프레임이 화면전환에 안 맞는 경우가 많음
    	public static bool WITH_KEYFRAME = false;

        public string path;
        public int duration;
        public List<StreamAttr> streams;
        public Type type = Type.VIDEO;

        public delegate void SetProgress(double ratio);
        public SetProgress setProgress = (double ratio) => { };

        public delegate void AfterRefreshInfo(VideoInfo video);

        private VideoInfo(string path)
        {
            this.path = path;
        }
        public VideoInfo(string path, SetProgress setProgress)
        {
            this.path = path;
            this.setProgress = setProgress;
        }
        public static VideoInfo FromSkfFile(string path)
        {
            VideoInfo info = new VideoInfo(path);
            info.type = Type.SKF;
            info.LoadSkf();
            return info;
        }
        public static VideoInfo FromFkfFile(string path)
        {
            VideoInfo info = new VideoInfo(path);
            info.type = Type.FKF;
            info.LoadFkf();
            return info;
        }
        public void RefreshInfo(AfterRefreshInfo afterRefreshInfo)
        {
            RefreshVideoInfo();
            afterRefreshInfo(this);
        }
        
        private static Process GetProcess(string exe)
        {
            return GetProcess(exe, false);
        }
        private static Process GetProcess(string exe, bool withStandardError)
        {
        	Process proc = new Process();
        	proc.StartInfo.UseShellExecute = false;
        	proc.StartInfo.CreateNoWindow = true;
        	proc.StartInfo.RedirectStandardOutput = true;
        	proc.StartInfo.RedirectStandardError = withStandardError;
        	proc.StartInfo.FileName = Path.Combine(exePath, exe);
        	return proc;
        }

        private void RefreshVideoInfo()
        {
            Process proc = GetProcess("ffprobe.exe", true);
            proc.StartInfo.Arguments = "\"" + path + "\"";
            proc.Start();

            streams = new List<StreamAttr>();
            duration = 10000000;
            
            StreamAttr lastStream = null;
            bool isMetadata = false;
            string[] lines = proc.StandardError.ReadToEnd().Split(new char[] { '\n', '\r' });
            foreach (string line in lines)
            {
                //Console.WriteLine(line);
                if (line.Trim().Length == 0) continue;
                if (lastStream != null && line.Equals("    Metadata:"))
                {
                    isMetadata = true;
                    continue;
                }
                if (lastStream != null && isMetadata)
                {
                    string pattern = "^      (.*): (.*)$";
                    System.Text.RegularExpressions.Match m = System.Text.RegularExpressions.Regex.Match(line, pattern);
                    if (m.Success)
                    {
                        System.Text.RegularExpressions.GroupCollection groups = m.Groups;
                        lastStream.metadata[groups[1].Value.Trim()] = groups[2].Value.Trim();
                        continue;
                    }
                    else
                    {
                        isMetadata = false;
                    }
                }
                if (line.StartsWith("  Duration: "))
                {
                    string dur = line.Substring(12, line.IndexOf(',', 12) - 12);
                    string[] vs = dur.Split(':');

                    double v = 0;
                    for (int i = 0; i < vs.Length; i++)
                    {
                        v = v * 60 + Convert.ToDouble(vs[i]);
                    }
                    duration = (int)(v * 1000);
                    //Console.WriteLine("duration: {0}", duration);
                }
                else if (line.StartsWith("    Stream #"))
                {
                    string pattern = "Stream #([0-9]+:[0-9])+\\((.*)\\): (.*): ";
                    System.Text.RegularExpressions.Match m = System.Text.RegularExpressions.Regex.Match(line, pattern);
                    System.Text.RegularExpressions.GroupCollection groups = m.Groups;
                    streams.Add(lastStream = new StreamAttr()
                    {   map = groups[1].Value
                      , type = groups[3].Value.ToLower()
                      , language = groups[2].Value
                    });
                }
                else if (lastStream != null && line.StartsWith("      title           : "))
                {
                    //lastStream.metadata["title"] = line.Substring(24);
                }
            }
            proc.Close();

            Console.WriteLine("RefreshVideoLength");
            proc = GetProcess("ffprobe.exe");
            proc.StartInfo.Arguments = "-hide_banner -show_format -show_streams -pretty \"" + path + "\"";
            proc.Start();
            lines = proc.StandardOutput.ReadToEnd().Split(new char[] { '\n', '\r' });
            foreach (string line in lines)
            {
                Console.WriteLine(line);
            }
            proc.Close();
        }

        public List<int> audioTrackIndexes = new List<int>();
        public string audioMap = null;
        private List<double> sfs = null;
        private List<int> kfs = null;
        private List<int> vfs = null;

        public void RefreshSkf()
        {
            RefreshSkf(false, WITH_KEYFRAME);
        }
        public void RefreshSkf(bool withSaveSkf)
        {
            RefreshSkf(withSaveSkf, WITH_KEYFRAME);
        }
        public void RefreshSkf(bool withSaveSkf, bool withKeyframe)
        {
            Console.WriteLine("RefreshSkf");
            if (type != Type.VIDEO) return;

            ReadSfs(withKeyframe);
            ReadKfs(withKeyframe);
            if (withSaveSkf) SaveSkf();
        }

        public List<double> GetSfs()
        {
            if (sfs == null) sfs = new List<double>();
            return sfs;
        }
        public List<double> ReadSfs(bool withKeyframe)
        {
            sfs = new List<double>();

            Process proc = GetProcess("ffmpeg.exe", true);
            proc.StartInfo.Arguments = string.Format($"-i \"{path}\" -vn -map {audioMap} -ar 44100 -ac 1 -f f32le -");
            proc.ErrorDataReceived += new DataReceivedEventHandler(Proc_ErrorDataReceived);
            proc.Start();
            proc.BeginErrorReadLine();

            Stream stream = proc.StandardOutput.BaseStream;

            int didread;
            int offset = 0;
            byte[] buffer = new byte[sizeof(float) * (1024 + 1)];

            int length, residual_length;

            int count = 0;
            double sum = 0;

            setProgress(0);

            double ratio = withKeyframe ? 0.3 : 1;

            while ((didread = stream.Read(buffer, offset, sizeof(float) * 1024)) != 0)
            {
                length = offset + didread;
                residual_length = length % sizeof(float);

                length -= residual_length;

                for (int index = 0; index < length; index += sizeof(float))
                {
                    float value = BitConverter.ToSingle(buffer, index);
                    sum += Math.Abs(value);

                    if (++count % 441 == 0)
                    {
                        sfs.Add(sum / count);
                        sum = 0;
                        if (count % 441000 == 0)
                        {
                            setProgress(ratio * (count / (duration * 44.1)));
                        }
                    }
                }
            }
            proc.Close();

            setProgress(ratio);

            return sfs;
        }
        public List<int> GetKfs()
        {
            if (kfs == null) kfs = new List<int>();
            return kfs;
        }
        public List<int> GetVfs()
        {
            if (vfs == null) vfs = new List<int>();
            return vfs;
        }
        public List<int> ReadKfs(bool withKeyframe)
        {
            if (kfs != null)
            {
                return kfs;
            }
            vfs = new List<int>();
            kfs = new List<int>();

            if (withKeyframe)
            {
            	Process proc = GetProcess("ffprobe.exe", true);
                proc.StartInfo.Arguments = $"-loglevel error -select_streams v:0 -show_entries packet=pts_time,flags -of csv=print_section=0 \"{path}\"";
                proc.ErrorDataReceived += new DataReceivedEventHandler(Proc_ErrorDataReceived);
                proc.Start();
                proc.BeginErrorReadLine();

                setProgress(0);

                StreamReader sr = new StreamReader(proc.StandardOutput.BaseStream);
                string line;
                while ((line = sr.ReadLine()) != null)
                {
                    try
                    {
                        string[] values = line.Split(',');
                        int time = (int) Math.Round(double.Parse(values[0]) * 1000);
                        vfs.Add(time);
                        if (values[1].StartsWith("K"))
                        {
                            kfs.Add(time);
                        }
                        setProgress((double) time / duration);
                    }
                    catch (Exception) { }
                }
                proc.Close();

                vfs.Sort();
                kfs.Sort();

                setProgress(0);
            }

            return kfs;
        }

        public int SaveSkf()
        {
            return SaveSkf(path.Substring(0, path.Length - new FileInfo(path).Extension.Length) + ".skf");
        }
        public int SaveSkf(string path)
        {
            int length = 0;

            byte[] buffer;
            FileStream fs = new FileStream(path, FileMode.Create);

            buffer = BitConverter.GetBytes(sfs.Count);
            fs.Write(buffer, 0, buffer.Length);
            length += buffer.Length;

            buffer = BitConverter.GetBytes(kfs.Count);
            fs.Write(buffer, 0, buffer.Length);
            length += buffer.Length;

            foreach (double sf in sfs)
            {
                buffer = BitConverter.GetBytes(sf);
                fs.Write(buffer, 0, buffer.Length);
                length += buffer.Length;
            }

            foreach (int kf in kfs)
            {
                buffer = BitConverter.GetBytes(kf);
                fs.Write(buffer, 0, buffer.Length);
                length += buffer.Length;
            }

            fs.Close();

            //Console.Write("save length: " + length);

            return length;
        }
        public void LoadSkf()
        {
            sfs = new List<double>();
            kfs = new List<int>();

            FileStream fs = new FileStream(path, FileMode.Open);

            int didread;
            byte[] buffer = new byte[sizeof(double) * (1024 + 1)];

            int length, residual_length;

            fs.Read(buffer, 0, sizeof(int) * 2);
            int sfsLength = BitConverter.ToInt32(buffer, 0);
            //int kfsLength = BitConverter.ToInt32(buffer, sizeof(int));

            while ((didread = fs.Read(buffer, 0, sizeof(double) * 1024)) != 0)
            {
                length = didread;
                residual_length = length % sizeof(double);

                length -= residual_length;

                for (int index = 0; index < length; )
                {
                    if (sfs.Count < sfsLength)
                    {
                        sfs.Add(BitConverter.ToDouble(buffer, index));
                        index += sizeof(double);
                    }
                    else
                    {
                        kfs.Add(BitConverter.ToInt32(buffer, index));
                        index += sizeof(int);
                    }
                }
            }

            fs.Close();

            //Console.WriteLine(sfs.Count + "/" + sfsLength + ", " + kfs.Count + "/" + kfsLength);
        }
        public int SaveFkf(string path)
        {
            int length = 0;

            byte[] buffer;
            FileStream fs = new FileStream(path, FileMode.Create);

            buffer = BitConverter.GetBytes(vfs.Count);
            fs.Write(buffer, 0, buffer.Length);
            length += buffer.Length;

            buffer = BitConverter.GetBytes(kfs.Count);
            fs.Write(buffer, 0, buffer.Length);
            length += buffer.Length;

            foreach (int vf in vfs)
            {
                buffer = BitConverter.GetBytes(vf);
                fs.Write(buffer, 0, buffer.Length);
                length += buffer.Length;
            }

            foreach (int kf in kfs)
            {
                buffer = BitConverter.GetBytes(kf);
                fs.Write(buffer, 0, buffer.Length);
                length += buffer.Length;
            }

            fs.Close();

            //Console.Write("save length: " + length);

            return length;
        }
        public void LoadFkf()
        {
            vfs = new List<int>();
            kfs = new List<int>();

            FileStream fs = new FileStream(path, FileMode.Open);

            int didread;
            byte[] buffer = new byte[sizeof(int) * (1024 + 1)];

            int length, residual_length;

            fs.Read(buffer, 0, sizeof(int) * 2);
            int vfsLength = BitConverter.ToInt32(buffer, 0);

            while ((didread = fs.Read(buffer, 0, sizeof(int) * 1024)) != 0)
            {
                length = didread;
                residual_length = length % sizeof(int);

                length -= residual_length;

                for (int index = 0; index < length;)
                {
                    if (vfs.Count < vfsLength)
                    {
                        vfs.Add(BitConverter.ToInt32(buffer, index));
                        index += sizeof(int);
                    }
                    else
                    {
                        kfs.Add(BitConverter.ToInt32(buffer, index));
                        index += sizeof(int);
                    }
                }
            }

            fs.Close();
        }

        public static void Proc_ErrorDataReceived(object sender, DataReceivedEventArgs e)
        {
            if (e.Data != null)
            {
                Console.WriteLine(e.Data);
                // do nothing
            }
        }
    }
}
