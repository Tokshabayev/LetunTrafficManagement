package main

import (
    "fmt"
    "log"
    "net/http"

    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

func handler(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Print("upgrade:", err)
        return
    }
    defer conn.Close()

    for {
        _, message, err := conn.ReadMessage()
        if err != nil {
            log.Println("read:", err)
            break
        }
        fmt.Println("Получен кадр длиной:", len(message))
    }
}

func main() {
    http.HandleFunc("/ws", handler)
    log.Println("Сервер запущен на порту :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
