package main

import (
    "log"
    "net/http"

    "letunbackend/db"
    "letunbackend/ws"
)

func main() {
    db.InitDB()
    go ws.HandleBroadcast()

    http.HandleFunc("/ws", ws.HandleConnections)
    http.HandleFunc("/command", ws.HandleCommand)

    log.Println("✅ Backend запущен на http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}