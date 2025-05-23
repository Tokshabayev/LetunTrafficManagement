import cv2
import asyncio
import websockets
import base64

RTSP_URL = "rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov" # захват видеопотока RTSP (камера на дроне)
WS_URL = "ws://localhost:8080/ws"  # адрес Go-сервера, куда будет отправляться видеопоток

async def stream_video():
    cap = cv2.VideoCapture(RTSP_URL)
    if not cap.isOpened():
        print("Ошибка: не удалось открыть поток")
        return

    async with websockets.connect(WS_URL) as websocket:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # уменьшим размер и сожмём в JPEG
            frame = cv2.resize(frame, (320, 240))
            _, buffer = cv2.imencode('.jpg', frame)
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')

            await websocket.send(jpg_as_text)
            await asyncio.sleep(0.1)  # 10 кадров в секунду

    cap.release()

asyncio.run(stream_video())
