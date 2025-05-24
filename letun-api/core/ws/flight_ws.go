package ws

import (
	"encoding/json"
	"io"
	"letun-api/core/models"
	"letun-api/core/repos"
	"letun-api/core/utils"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	upgrader  = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	Broadcast = make(chan []byte)
	clients   = make(map[*Client]bool)
	mu        sync.Mutex
)

type Client struct {
	Conn *websocket.Conn
	Send chan []byte
}

// Общая структура для определения типа
type GenericMsg struct {
	Type string `json:"type"`
}

type StartMsg struct {
	Type      string       `json:"type"`
	FlightID  int          `json:"flight_id"`
	DroneID   int          `json:"drone_id"`
	Route     [][2]float64 `json:"route"`
	Timestamp int64        `json:"timestamp"`
}

type TelemetryMsg struct {
	Type      string  `json:"type"`
	DroneID   int     `json:"drone_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Altitude  float64 `json:"altitude"`
	Speed     float64 `json:"speed"`
}

// Timestamp – float64, чтобы принять дробный (от Python)
type StopMsg struct {
	Type      string  `json:"type"`
	DroneID   int     `json:"drone_id"`
	Timestamp float64 `json:"timestamp"`
}

// HandleConnections — WS-эндпоинт
func HandleConnections(w http.ResponseWriter, r *http.Request) {
	wsConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ WS upgrade error: %v", err)
		return
	}
	defer wsConn.Close()

	client := &Client{Conn: wsConn, Send: make(chan []byte, 256)}
	mu.Lock()
	clients[client] = true
	mu.Unlock()

	go writeMessages(client)

	for {
		_, msg, err := wsConn.ReadMessage()
		if err != nil {
			mu.Lock()
			delete(clients, client)
			mu.Unlock()
			return
		}

		log.Printf("RAW WS msg: %s", msg)

		var g GenericMsg
		if err := json.Unmarshal(msg, &g); err != nil {
			log.Printf("❌ JSON unmarshal error: %v", err)
			continue
		}

		switch g.Type {
		case "start":
			var m StartMsg
			if err := json.Unmarshal(msg, &m); err == nil {
				log.Printf("▶️ Дрон %d стартовал, маршрут: %v", m.DroneID, m.Route)
			}
			Broadcast <- msg

		case "telemetry":
			var t TelemetryMsg
			if err := json.Unmarshal(msg, &t); err == nil {
				utils.Logger().Printf("📡 [Drone %d] %.6f, %.6f — alt %dm, %dkm/h",
					t.DroneID, t.Latitude, t.Longitude, t.Altitude, t.Speed,
				)

				telemetryRepo := repos.TelemetryRepo{}
				if err := telemetryRepo.Create(&models.Telemetry{
					Latitude:  t.Latitude,
					Longitude: t.Longitude,
					Altitude:  t.Altitude,
					Speed:     t.Speed,
				}); err == nil {
					log.Printf("✅ Телеметрия сохранена: drone_id=%d", t.DroneID)
				}
				// zones, _ := db.CheckZoneViolation(t.Longitude, t.Latitude)
				// for _, z := range zones {
				// 	log.Printf("🚨 Дрон %d нарушил зону: %s", t.DroneID, z.Name)
				// }
			}

			msg := "hello from drone"
			Broadcast <- []byte(msg)

		case "stop":
			var s StopMsg
			if err := json.Unmarshal(msg, &s); err == nil {
				log.Printf("⏹ Дрон %d остановился (WS)", s.DroneID)
			} else {
				log.Printf("❌ stop unmarshal error: %v", err)
			}
			Broadcast <- msg

		default:
			Broadcast <- msg
		}
	}
}

// HandleCommand — HTTP POST /command → ретрансляция в WS
func HandleCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	var g GenericMsg
	if err := json.Unmarshal(body, &g); err == nil {
		switch g.Type {
		case "start":
			var m StartMsg
			if err := json.Unmarshal(body, &m); err == nil {
				m.Timestamp = time.Now().Unix()
				log.Printf("▶️ [HTTP] Дрон %d стартовал, маршрут: %v", m.DroneID, m.Route)
			}
		case "stop":
			var m StopMsg
			if err := json.Unmarshal(body, &m); err == nil {
				log.Printf("⏹ [HTTP] Дрон %d остановился", m.DroneID)
			}
		}
	}
	Broadcast <- body
	w.Write([]byte("OK"))
}

// HandleBroadcast — рассылка всем подключённым WS-клиентам
func HandleBroadcast() {
	for msg := range Broadcast {
		mu.Lock()
		for c := range clients {
			select {
			case c.Send <- msg:
			default:
				close(c.Send)
				delete(clients, c)
			}
		}
		mu.Unlock()
	}
}

func writeMessages(c *Client) {
	for msg := range c.Send {
		if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			c.Conn.Close()
			mu.Lock()
			delete(clients, c)
			mu.Unlock()
			return
		}
	}
}
