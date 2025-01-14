SmiEditor.highlightText = function(text, state=null) {
	const previewLine = $("<span>");
	if (text.toUpperCase().startsWith("<SYNC ")) {
		previewLine.addClass("hljs-comment");
	}
	return previewLine.text(text);
}