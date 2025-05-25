@echo off
title Letun Camera Stream Launcher
echo Starting RTSP server in Docker...
start cmd /k "docker run --rm -it -p 8554:8554 aler9/rtsp-simple-server"

timeout /t 3 >nul
echo Launching FFmpeg camera stream...
start cmd /k "cd /d C:\Users\yabawr\Desktop\gitshit\LetunTrafficManagement\videostreaming && ffmpeg -f dshow -i video=\"FHD Camera\" -an -vf scale=640:360 -c:v libx264 -b:v 800k -preset veryfast -tune zerolatency -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments hls_output/stream.m3u8"

timeout /t 2 >nul
echo Launching local Python webserver...
start cmd /k "cd /d C:\Users\yabawr\Desktop\gitshit\LetunTrafficManagement && .\.venv\Scripts\activate && cd videostreaming && python -m http.server 8000"

echo All components launched.
pause
