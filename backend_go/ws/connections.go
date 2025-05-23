package ws

import (
	"encoding/json"
	"letunbackend/db"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var (
	upgrader  = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	Broadcast = make(chan []byte)
	clients   = make(map[*Client]bool)
	clientsMu sync.Mutex
)

type Client struct {
	Conn *websocket.Conn
	Send chan []byte
}

func HandleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ WebSocket upgrade error: %v", err)
		return
	}
	client := &Client{Conn: ws, Send: make(chan []byte)}
	clientsMu.Lock()
	clients[client] = true
	clientsMu.Unlock()

	go writeMessages(client)

	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			clientsMu.Lock()
			delete(clients, client)
			clientsMu.Unlock()
			break
		}

		var telemetry db.Telemetry
		if err := json.Unmarshal(msg, &telemetry); err == nil && telemetry.Type == "telemetry" {
			log.Printf("📡 [Drone %d] %.6f, %.6f, %dm, %dkm/h",
				telemetry.DroneID,
				telemetry.Latitude,
				telemetry.Longitude,
				telemetry.Altitude,
				telemetry.Speed,
			)
			if err := db.SaveTelemetry(telemetry); err == nil {
				log.Printf("✅ Телеметрия сохранена: drone_id=%d, lat=%.5f, lon=%.5f",
					telemetry.DroneID,
					telemetry.Latitude,
					telemetry.Longitude,
				)
			}

			noFlyZones, err := db.CheckZoneViolation(telemetry.Longitude, telemetry.Latitude)
			if err != nil {
				log.Printf("❌ CheckZoneViolation error: %v", err)
			}
			for _, z := range noFlyZones {
				log.Printf("🚨 Дрон %d нарушил запретную зону: %s", telemetry.DroneID, z.Name)
			}
		}

		Broadcast <- msg
	}
}

func HandleBroadcast() {
	for {
		msg := <-Broadcast
		clientsMu.Lock()
		for client := range clients {
			select {
			case client.Send <- msg:
			default:
				close(client.Send)
				delete(clients, client)
			}
		}
		clientsMu.Unlock()
	}
}

func writeMessages(client *Client) {
	for msg := range client.Send {
		if err := client.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			client.Conn.Close()
			clientsMu.Lock()
			delete(clients, client)
			clientsMu.Unlock()
			break
		}
	}
}

func HandleCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	body := make([]byte, r.ContentLength)
	r.Body.Read(body)
	Broadcast <- body
	w.Write([]byte("OK"))
}
