@echo off
cd /d C:\github\nairbinod\wellness-ai
echo ---- %date% %time% ---- >> scripts\sync-sender-resume.log
call npm run sync:sender >> scripts\sync-sender-resume.log 2>&1
