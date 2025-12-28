SmiEditor.highlightText = (text, state=null) => {
	const previewLine = document.createElement("span");
	if (text.toUpperCase().startsWith("<SYNC ")) {
		previewLine.classList.add("hljs-comment", "hljs-sync");
	}
	return previewLine.text(text);
}