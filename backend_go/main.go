// backend_go/main.go
package main

import (
	"letunbackend/db"
	"letunbackend/ws"
	"log"
	"net/http"
)

func main() {
	// 1) Инициализируем пул
	db.InitDB()
	defer db.Pool.Close()

	// 2) Запускаем горутину для рассылки Broadcast
	go ws.HandleBroadcast()

	// 3) Регистрируем WS-хендлер
	http.HandleFunc("/ws", ws.HandleConnections)
	http.HandleFunc("/command", ws.HandleCommand)

	log.Println("✅ Backend running on http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
