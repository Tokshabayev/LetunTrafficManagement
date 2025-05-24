import asyncio
import websockets
import json
import random
import time

# Конфигурация
ws_server_url = "ws://localhost:8080/ws"

# Тестовые данные для локальной проверки
test_commands = [
    {'drone_id': 1, 'route': [(51.1284, 71.4306), (51.1320, 71.4340)]},
    {'drone_id': 2, 'route': [(51.1330, 71.4350), (51.1360, 71.4380)]}
]

# Функция генерации промежуточных точек между узловыми точками маршрута
def generate_route(route):
    detailed_route = []
    for i in range(len(route) - 1):
        lat1, lon1 = route[i]
        lat2, lon2 = route[i + 1]
        steps = 10
        for step in range(steps):
            intermediate_lat = lat1 + (lat2 - lat1) * step / steps
            intermediate_lon = lon1 + (lon2 - lon1) * step / steps
            detailed_route.append((intermediate_lat, intermediate_lon))
    detailed_route.append(route[-1])
    return detailed_route

async def send_telemetry(websocket, drone_id, route, flight_id):
    # --- отправляем команду START ---

    # --- отправляем телеметрию по маршруту ---
    for lat, lon in route:
        telemetry_data = {
            'type': 'telemetry',
            'flight_id' : flight_id,
            'latitude': lat,
            'longitude': lon,
            'altitude': random.randint(100, 120),
            'speed': random.randint(10, 20),
            'timestamp': time.time()
        }
        await websocket.send(json.dumps(telemetry_data))
        print(f"Drone {drone_id} sent TELEMETRY: {telemetry_data}")

        # эмуляция потери связи
        if random.random() < 0.1:
            print(f"Drone {drone_id} connection lost! Sleeping 5s...")
            await asyncio.sleep(5)

        await asyncio.sleep(1)

    # --- отправляем команду STOP ---
    stop_data = {
        'type': 'stop',
        'drone_id': drone_id,
        'timestamp': time.time()
    }
    await websocket.send(json.dumps(stop_data))
    print(f"Drone {drone_id} sent STOP: {stop_data}")

async def listen_with_retry():
    while True:
        try:
            await listen_for_commands()
        except Exception as e:
            print(f"Ошибка подключения: {e}. Повтор через 5 секунд...")
            await asyncio.sleep(5)

async def listen_for_commands():
    async with websockets.connect(ws_server_url) as websocket:
        while True:
            message = await websocket.recv()
            command = json.loads(message)
            print(command)
            # если сервер прислал команду START — запускаем отправку телеметрии
            if command.get('type') == 'start':
                drone_id = command['drone_id']
                route = command['route']
                flight_id = command['flight_id']
                detailed_route = generate_route(route)
                asyncio.create_task(send_telemetry(websocket, drone_id, detailed_route, flight_id))
            # если прислал STOP — можно логировать на клиенте
            elif command.get('type') == 'stop':
                print(f"Received STOP for drone {command['drone_id']}")

# Для локального тестирования (без сервера команд)
async def local_test():
    async with websockets.connect(ws_server_url) as websocket:
        tasks = []
        for command in test_commands:
            detailed_route = generate_route(command['route'])
            task = asyncio.create_task(send_telemetry(websocket, command['drone_id'], detailed_route))
            tasks.append(task)
        await asyncio.gather(*tasks)

if __name__ == '__main__':
    print("Ожидание команд или запуск локального теста...")
    # чтобы слушать сервер команд:
    asyncio.run(listen_with_retry())
    # или для самостоятельного теста маршрутов:
    # asyncio.run(local_test())