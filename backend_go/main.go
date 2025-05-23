package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// WebSocket клиент
type Client struct {
	Conn *websocket.Conn
	Send chan []byte
}

var (
	clients   = make(map[*Client]bool)
	clientsMu sync.Mutex
	broadcast = make(chan []byte)
)

// Структура телеметрии
type TelemetryData struct {
	Type      string  `json:"type"`
	DroneID   int     `json:"drone_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Altitude  int     `json:"altitude"`
	Speed     int     `json:"speed"`
	Timestamp float64 `json:"timestamp"`
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Ошибка подключения: %v", err)
		return
	}
	defer ws.Close()

	client := &Client{Conn: ws, Send: make(chan []byte)}
	clientsMu.Lock()
	clients[client] = true
	clientsMu.Unlock()

	log.Println("Новое подключение к WebSocket")
	go writeMessages(client)

	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Printf("Ошибка чтения: %v", err)
			clientsMu.Lock()
			delete(clients, client)
			clientsMu.Unlock()
			break
		}

		// Пробуем распарсить телеметрию
		var telemetry TelemetryData
		if err := json.Unmarshal(msg, &telemetry); err == nil && telemetry.Type == "telemetry" {
			log.Printf("📡 [Drone %d] %f, %f, %dm, %dkm/h", telemetry.DroneID, telemetry.Latitude, telemetry.Longitude, telemetry.Altitude, telemetry.Speed)
		}

		broadcast <- msg
	}
}

func writeMessages(client *Client) {
	for msg := range client.Send {
		err := client.Conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Printf("Ошибка отправки: %v", err)
			client.Conn.Close()
			clientsMu.Lock()
			delete(clients, client)
			clientsMu.Unlock()
			break
		}
	}
}

func handleBroadcast() {
	for {
		msg := <-broadcast
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

func main() {
	http.HandleFunc("/ws", handleConnections)
	go handleBroadcast()

	log.Println("Сервер запущен на :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Ошибка сервера: %v", err)
	}
}
