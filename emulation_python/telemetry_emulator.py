import asyncio
import websockets
import json
import random
import time

ws_server_url = "ws://localhost:8081/ws"

test_commands = [
    {'drone_id': 1, 'route': [(51.1284, 71.4306), (51.1320, 71.4340)]},
    {'drone_id': 2, 'route': [(51.1330, 71.4350), (51.1360, 71.4380)]}
]

def generate_route(route):
    detailed_route = []
    for i in range(len(route) - 1):
        lat1, lon1 = route[i]
        lat2, lon2 = route[i + 1]
        steps = 25
        for step in range(steps):
            t = step / steps
            intermediate_lat = lat1 + (lat2 - lat1) * t
            intermediate_lon = lon1 + (lon2 - lon1) * t

            # Добавляем небольшое отклонение (джиттер)
            jitter_lat = random.uniform(-0.00005, 0.00005)
            jitter_lon = random.uniform(-0.00005, 0.00005)

            detailed_route.append((intermediate_lat + jitter_lat, intermediate_lon + jitter_lon))

    detailed_route.append(route[-1])  # Последнюю точку добавляем без отклонений
    return detailed_route

async def send_telemetry(websocket, drone_id, route, flight_id):
    for lat, lon in route:
        if random.random() < 0.1:  # 10% шанс потерять связь
            print(f"🛑 Drone {drone_id} LOST CONNECTION (skipping point). Sleeping 5s...")
            await asyncio.sleep(5)
            continue  # Пропустить отправку текущей точки

        telemetry_data = {
            'type': 'telemetry',
            'flight_id': flight_id,
            'latitude': lat,
            'longitude': lon,
            'altitude': random.randint(100, 120),
            'speed': random.randint(10, 20),
            'timestamp': time.time()
        }

        await websocket.send(json.dumps(telemetry_data))
        print(f"✅ Drone {drone_id} sent TELEMETRY: {telemetry_data}")
        await asyncio.sleep(1)

    stop_data = {
        'type': 'stop',
        'drone_id': drone_id,
        'flight_id': flight_id,
        'timestamp': time.time()
    }
    await websocket.send(json.dumps(stop_data))
    print(f"✅ Drone {drone_id} sent STOP: {stop_data}")

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
                flight_id = command['flight_id']
                detailed_route = generate_route(route)
                asyncio.create_task(send_telemetry(websocket, drone_id, detailed_route, flight_id))
            elif command.get('type') == 'stop':
                print(f"⛔️ Received STOP for drone {command['drone_id']}")

async def local_test():
    async with websockets.connect(ws_server_url) as websocket:
        tasks = []
        for command in test_commands:
            detailed_route = generate_route(command['route'])
            task = asyncio.create_task(send_telemetry(websocket, command['drone_id'], detailed_route, "local-test"))
            tasks.append(task)
        await asyncio.gather(*tasks)

if __name__ == '__main__':
    print("Ожидание команд или запуск локального теста...")
    asyncio.run(listen_with_retry())
    # asyncio.run(local_test())
