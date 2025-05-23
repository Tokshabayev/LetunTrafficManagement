import asyncio
import json
import websockets.server
import time

# Храним клиентов и данные о связи
drone_clients = set()
last_message_time = {}
connection_lost = {}
monitoring_tasks = {}

async def handle_client(websocket: websockets.server.WebSocketServerProtocol):
    print("Клиент подключен")
    drone_clients.add(websocket)
    try:
        async for message in websocket:
            data = json.loads(message)
            drone_id = data.get("drone_id")
            if drone_id:
                if data.get("type") == "stop":
                    print(f"[Drone {drone_id}] Передача завершена. Остановка отслеживания.")
                    monitoring_task = monitoring_tasks.get(drone_id)
                    if monitoring_task:
                        monitoring_task.cancel()
                    continue

                last_message_time[drone_id] = time.time()
                print("Получено от клиента:", data)
    except websockets.ConnectionClosed:
        print("Клиент отключился")
    finally:
        drone_clients.remove(websocket)

async def monitor_connection(drone_id):
    try:
        while True:
            await asyncio.sleep(1)
            now = time.time()
            elapsed = now - last_message_time.get(drone_id, 0)
            if elapsed > 2 and not connection_lost.get(drone_id, False):
                print(f"[Drone {drone_id}] Потеряна связь! Последнее сообщение было {elapsed:.1f} секунд назад.")
                connection_lost[drone_id] = True
            elif elapsed <= 2 and connection_lost.get(drone_id, False):
                print(f"[Drone {drone_id}] Связь восстановлена.")
                connection_lost[drone_id] = False
    except asyncio.CancelledError:
        print(f"[Drone {drone_id}] Мониторинг остановлен.")

async def input_command_loop():
    loop = asyncio.get_running_loop()
    while True:
        await loop.run_in_executor(None, input, "\nНажмите Enter для отправки следующей команды...")

        drone_id = 1 if 1 not in last_message_time else 2
        route = [
            [51.1284 + drone_id * 0.004, 71.4306 + drone_id * 0.004],
            [51.1300 + drone_id * 0.004, 71.4320 + drone_id * 0.004],
            [51.1320 + drone_id * 0.004, 71.4340 + drone_id * 0.004]
        ]

        command = {
            "type": "start",
            "drone_id": drone_id,
            "route": route
        }

        for ws in drone_clients:
            await ws.send(json.dumps(command))

        print(f"Команда отправлена для дрона {drone_id}")
        last_message_time[drone_id] = time.time()
        connection_lost[drone_id] = False
        task = asyncio.create_task(monitor_connection(drone_id))
        monitoring_tasks[drone_id] = task

async def main():
    print("Сервер запускается...")
    async with websockets.server.serve(handle_client, "localhost", 8080):
        print("WebSocket-сервер запущен на ws://localhost:8080/")
        asyncio.create_task(input_command_loop())
        await asyncio.Future()  # вечный цикл

if __name__ == "__main__":
    asyncio.run(main())