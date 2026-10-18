@echo off
chcp 65001 > nul
title MoreHabit 로컬 서버
echo ========================================================
echo   🌱 MoreHabit 서버를 시작합니다...
echo ========================================================
echo.
echo [1] PC 브라우저 접속 주소:   http://localhost:5173
echo [2] 스마트폰 Wi-Fi 접속 주소: http://172.30.1.14:5173
echo.
echo * 스마트폰과 PC가 같은 Wi-Fi에 연결되어 있어야 합니다.
echo * 서버를 끄려면 이 창을 닫으시면 됩니다.
echo ========================================================
echo.

call npm.cmd run dev

pause
