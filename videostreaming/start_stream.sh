#!/bin/bash

INPUT="rtsp://localhost:8554/drone1"
OUTPUT_DIR="hls_output"

mkdir -p $OUTPUT_DIR

#!/bin/bash
ffmpeg -f dshow -i video="FHD Camera" -an -vf scale=640:360 -c:v libx264 -b:v 800k -preset veryfast -tune zerolatency -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments hls_output/stream.m3u8



# Добавить права исполнения файлу
# chmod +x start_stream.sh

# Запуск скрипта
# ./start_stream.sh