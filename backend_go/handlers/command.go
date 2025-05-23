
package handlers

import (
	"io"
	"log"
	"net/http"
)

var Broadcast chan []byte

func HandleCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Ошибка чтения тела запроса", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	log.Printf("📤 Команда от фронта: %s", string(body))
	Broadcast <- body
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
