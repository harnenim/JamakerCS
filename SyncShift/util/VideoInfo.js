/*
public class StreamAttr
{
    public string type;
    public string language;
    public Dictionary<string, string> metadata = new Dictionary<string, string>();
}
*/	
function VideoInfo(file, progress) {
	this.file = file;
    this.duration = 0;
    this.streams = [];
    this.length = 0;
	if (progress) {
		this.progress = progress;
		this.isSkf = false;
	} else {
		this.progress = null;
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
	var sfs = this.sfs = [];
	var kfs = this.kfs = [];
	
	var fr = new FileReader();
	fr.onload = function(e) {
		var buffer = e.target.result;
		
		var info = new Int32Array(buffer);
	    var sfsLength = info[0];
	    var kfsLength = info[1];
	    
	    var view = new DataView(buffer.slice(8, 8 + (sfsLength * 8)));
	    for (var i = 0; i < sfsLength; i++) {
	    	sfs.push(view.getFloat64(i * 8, true));
	    }
	    view = new DataView(buffer.slice(8 + (sfsLength * 8), 8 + ((sfsLength + kfsLength) * 8)));
	    for (var i = 0; i < kfsLength; i++) {
	    	kfs.push(view.getFloat64((sfsLength + i) * 8));
	    }
	}
	fr.readAsArrayBuffer(this.file);
}
