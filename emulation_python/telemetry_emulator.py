import asyncio
import websockets
import json
import random
import time

# Конфигурация
ws_server_url = 'ws://localhost:8080/'

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

async def send_telemetry(websocket, drone_id, route):
    for lat, lon in route:
        telemetry_data = {
            'type': 'telemetry',
            'drone_id': drone_id,
            'latitude': lat,
            'longitude': lon,
            'altitude': random.randint(100, 120),
            'speed': random.randint(10, 20),
            'timestamp': time.time()
        }

        await websocket.send(json.dumps(telemetry_data))
        print(f"Drone {drone_id} sent data: {telemetry_data}")

        if random.random() < 0.2:
            print(f"Drone {drone_id} connection lost! Emulating no data transfer for 5 seconds...")
            await asyncio.sleep(5)

        await asyncio.sleep(1)

    stop_data = {'type': 'stop', 'drone_id': drone_id, 'timestamp': time.time()}
    await websocket.send(json.dumps(stop_data))
    print(f"Drone {drone_id} завершил передачу.")

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

            if command.get('type') == 'start':
                drone_id = command['drone_id']
                route = command['route']
                detailed_route = generate_route(route)
                asyncio.create_task(send_telemetry(websocket, drone_id, detailed_route))

# Для локального тестирования
async def local_test():
    async with websockets.connect(ws_server_url) as websocket:
        tasks = []
        for command in test_commands:
            detailed_route = generate_route(command['route'])
            task = asyncio.create_task(send_telemetry(websocket, command['drone_id'], detailed_route))
            tasks.append(task)
        await asyncio.gather(*tasks)

if __name__ == '__main__':
    print("Ожидание команд...")
    asyncio.run(listen_with_retry())
    # Для локального тестирования используйте:
    # asyncio.run(local_test())
