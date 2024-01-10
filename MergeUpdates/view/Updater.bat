@echo off
start /D"C:\Program Files\Google\Chrome\Application\" chrome.exe ^
--disable-web-security ^
--allow-file-access-from-files ^
--user-data-dir=C:/ProgramData/ssh/temp ^
--disable-popup-blocking ^
--lang=kr ^
--app=file:///D:/workspace/VisualStudio/Jamaker/SamiUpdater/view/Updater.html ^
--new-window ^
--app-window-size=800,600