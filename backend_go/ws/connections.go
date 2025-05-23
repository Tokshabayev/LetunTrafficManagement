package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"letunbackend/db"
	"letunbackend/models"

	"github.com/gorilla/websocket"
)

var (
	Clients   = make(map[*Client]bool)
	ClientsMu sync.Mutex
	Broadcast chan []byte
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	Conn *websocket.Conn
	Send chan []byte
}

func HandleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Ошибка подключения: %v", err)
		return
	}
	defer ws.Close()

	client := &Client{Conn: ws, Send: make(chan []byte)}
	ClientsMu.Lock()
	Clients[client] = true
	ClientsMu.Unlock()

	log.Println("🟢 WebSocket подключение установлено")
	go writeMessages(client)

	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Printf("🔌 Ошибка чтения или отключение: %v", err)
			ClientsMu.Lock()
			delete(Clients, client)
			ClientsMu.Unlock()
			break
		}

		var telemetry models.TelemetryData
		if err := json.Unmarshal(msg, &telemetry); err == nil && telemetry.Type == "telemetry" {
			log.Printf("📡 [Drone %d] %.6f, %.6f, %dm, %dkm/h",
				telemetry.DroneID, telemetry.Latitude, telemetry.Longitude, telemetry.Altitude, telemetry.Speed)

			// Сохраняем телеметрию
			err := db.SaveTelemetry(telemetry)
			if err != nil {
				log.Printf("❌ Ошибка записи в БД: %v", err)
			}

			// Проверка на влет в запретную зону
			zones, err := db.CheckZoneViolation(telemetry.Latitude, telemetry.Longitude)
			if err == nil && len(zones) > 0 {
				log.Printf("🚫 Дрон %d нарушил запретную зону: %s", telemetry.DroneID, zones[0].Name)
				// TODO: отправить предупреждение фронту через WebSocket
			}
		}

		// Рассылаем телеметрию всем клиентам
		Broadcast <- msg
	}
}

func writeMessages(client *Client) {
	for msg := range client.Send {
		err := client.Conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Printf("❌ Ошибка отправки: %v", err)
			client.Conn.Close()
			ClientsMu.Lock()
			delete(Clients, client)
			ClientsMu.Unlock()
			break
		}
	}
}
