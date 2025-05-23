package ws

func HandleBroadcast() {
	for {
		msg := <-Broadcast
		ClientsMu.Lock()
		for client := range Clients {
			select {
			case client.Send <- msg:
			default:
				close(client.Send)
				delete(Clients, client)
			}
		}
		ClientsMu.Unlock()
	}
}
