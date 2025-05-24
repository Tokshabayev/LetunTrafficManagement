#!/bin/bash

INPUT="rtsp://localhost:8554/drone1"
OUTPUT_DIR="hls_output"

mkdir -p $OUTPUT_DIR

ffmpeg -i $INPUT -c:v copy -f hls \
-hls_time 2 -hls_list_size 5 -hls_flags delete_segments \
$OUTPUT_DIR/stream.m3u8

# Добавить права исполнения файлу
# chmod +x start_stream.sh

# Запуск скрипта
# ./start_stream.sh