@echo off
chcp 65001 > nul
title De Che Via He - Local Game Server
echo ====================================================
echo    Đang khởi động Đế Chế Vỉa Hè (Local Server)...
echo ====================================================
start "" http://localhost:3000/play/
node server.js
pause
