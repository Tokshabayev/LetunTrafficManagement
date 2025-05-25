# RTSP → HLS Видео Поток для Браузера

Этот проект позволяет получать RTSP-видеопоток (например, от дрона или камеры), конвертировать его в HLS-формат и воспроизводить в браузере с помощью HTML + hls.js. Реализовано с использованием FFmpeg и встроенного Python-сервера.

---

## 📁 Состав проекта

```
rtsp_hls_project/
├── hls_output/                # Здесь FFmpeg сохраняет .m3u8 и .ts файлы
├── index.html                 # HTML-страница с видео-плеером (hls.js)
├── start_stream.sh            # Скрипт запуска FFmpeg (RTSP → HLS)
└── run_webserver.py           # Встроенный Python HTTP-сервер для отдачи HTML + HLS
```

---

## 🔧 Требования

- **FFmpeg**
- **Python 3.7+**
- **RTSP-источник** (напр. `rtsp://localhost:8554/drone1`)

---

## 🚀 Быстрый старт

1. **Запусти RTSP-сервер** (например: `rtsp-simple-server`):

```bash
docker run --rm -it -p 8554:8554 aler9/rtsp-simple-server
```

2. **Запусти FFmpeg-конвертер**:

```bash
chmod +x start_stream.sh
./start_stream.sh
```

3. **Запусти локальный веб-сервер**:

```bash
python run_webserver.py
```

4. **Открой браузер**:

```
http://localhost:8000
```

---

## 📂 Описание файлов

### `start_stream.sh`
- **Вход**: RTSP-ссылка
- **Выход**: HLS-файлы (`.m3u8` и `.ts`) в `hls_output/`
- **Примечания**:
  - Источник должен быть доступен по сети
  - Используется `-c:v copy`, кодеки должны поддерживаться браузером

### `run_webserver.py`
- **Назначение**: простой HTTP-сервер для раздачи видео и HTML
- **Порт**: 8000
- **Примечания**: запускается из корня проекта

### `index.html`
- **Плеер** на основе `hls.js`
- Загружает поток `hls_output/stream.m3u8`

---

## 🧪 Тестовая RTSP-ссылка

Можно протестировать с открытым RTSP-потоком:

```
rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov
```

---

## 📌 Советы

- Для нескольких потоков создавайте отдельные `.m3u8` файлы
- HLS имеет задержку ~5–10 секунд — это норма

---


STEPS TO LAUNCH:
#1. docker run --rm -it -p 8554:8554 aler9/rtsp-simple-server
1. cd C:\Users\yabawr\Desktop\gitshit\LetunTrafficManagement\videostreaming
2. ffmpeg -f dshow -i video="FHD Camera" -an -vf scale=640:360 -c:v libx264 -b:v 800k -preset veryfast -tune zerolatency -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments hls_output/stream.m3u8
3. "
cd C:\Users\yabawr\Desktop\gitshit\LetunTrafficManagement
.\.venv\Scripts\activate
cd videostreaming
python -m http.server 8000
"