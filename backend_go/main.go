package main

import (
	"letunbackend/db"
	"letunbackend/handlers"
	"letunbackend/ws"
	"log"
	"net/http"
)

func main() {
	db.Init()
	ws.Broadcast = make(chan []byte)
	handlers.Broadcast = ws.Broadcast

	http.HandleFunc("/ws", ws.HandleConnections)
	http.HandleFunc("/command", handlers.HandleCommand)

	go ws.HandleBroadcast()

	log.Println("✅ Go backend запущен на http://localhost:8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
