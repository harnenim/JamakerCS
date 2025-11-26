SmiEditor.highlightText = (text, state=null) => {
	const previewLine = $("<span>");
	if (text.toUpperCase().startsWith("<SYNC ")) {
		previewLine.addClass("hljs-comment hljs-sync");
	}
	return previewLine.text(text);
}