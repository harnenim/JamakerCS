/*
public class StreamAttr
{
	public string type;
	public string language;
	public Dictionary<string, string> metadata = new Dictionary<string, string>();
}
*/	
function VideoInfo(file, setProgress) {
	this.file = file;
	this.duration = 0;
	this.streams = [];
	this.length = 0;
	if (setProgress) {
		this.setProgress = setProgress;
		this.isSkf = false;
	} else {
		this.setProgress = null;
		this.isSkf = true;
	}

	this.audioTrackIndexes = [];
	this.audioTrackIndex = 0;
	this.sfs = null;
	this.kfs = null;
}

VideoInfo.prototype.RefreshInfo = function(afterRefreshInfo) {
	this.RefreshVideoInfo();
	this.RefreshVideoLength();
	if (afterRefreshInfo) {
		afterRefreshInfo(this);
	}
}

VideoInfo.prototype.RefreshVideoInfo = function() {
}

VideoInfo.prototype.RefreshVideoLength = function() {
}

VideoInfo.prototype.RefreshSkf = function() {
	if (this.isSkf) {
		this.LoadSkf();
	} else {
		this.GetSfs();
		this.GetKfs();
	}
}

VideoInfo.prototype.GetSfs = function() {
	if (this.sfs != null) {
		return this.sfs;
	}
	if (this.isSkf) {
		return null;
	}
	
	return [];
}
VideoInfo.prototype.GetKfs = function() {
	if (this.kfs != null) {
		return this.kfs;
	}
	if (this.isSkf) {
		return null;
	}
	
	return [];
}

VideoInfo.prototype.SaveSkf = function() {
	return 0;
}
VideoInfo.prototype.LoadSkf = function() {
	const sfs = this.sfs = [];
	const kfs = this.kfs = [];
	
	const fr = new FileReader();
	fr.onload = function(e) {
		const buffer = e.target.result;
		
		const info = new Int32Array(buffer);
		const sfsLength = info[0];
		const kfsLength = info[1];
		
		{	const view = new DataView(buffer.slice(8, 8 + (sfsLength * 8)));
			for (let i = 0; i < sfsLength; i++) {
				sfs.push(view.getFloat64(i * 8, true));
			}
		}
		{	const view = new DataView(buffer.slice(8 + (sfsLength * 8), 8 + (sfsLength * 8 + kfsLength * 4)));
			for (let i = 0; i < kfsLength; i++) {
				kfs.push(view.getInt32(i * 4, true));
			}
		}
	}
	fr.readAsArrayBuffer(this.file);
}
