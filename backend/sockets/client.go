package sockets

import (
	"encoding/json"
	"io"
	"log"

	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

type ClientList map[*Client]bool

type Client struct {
	connection   *websocket.Conn
	manager      *Manager
	egress       chan Event
	clientId     int
	sessionToken string
	ConnType     string
}

func NewClient(conn *websocket.Conn, manager *Manager) *Client {
	return &Client{
		connection: conn,
		manager:    manager,
		egress:     make(chan Event),
	}
}

// readMessages reads all possible traffic from WS
func (c *Client) readMessages() {
	//var event Event
	defer func() {
		c.manager.RemoveClient(c)
	}()
	for {
		messageType, reader, err := c.connection.NextReader()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error reading message: %v\n", err)
			}
			break
		}
		if messageType != websocket.TextMessage {
			log.Println("unsupported message type")
			continue
		}
		payload, err := io.ReadAll(reader)
		if err != nil {
			log.Println("error reading WebSocket message:", err)
			continue
		}
		var event Event
		if err := json.Unmarshal(payload, &event); err != nil {
			log.Println("error unmarshalling JSON:", err, string(payload))
			continue
		}
		if err := c.manager.routeEvent(&event, c); err != nil {
			log.Println("error handling message:", err, event.Type)
		}
	}
}

// writeMessages writes messages to client
func (c *Client) writeMessages() {
	defer func() {
		c.manager.RemoveClient(c)
	}()
	for message := range c.egress {
		data, err := json.Marshal(message)
		if err != nil {
			log.Println("error marshaling message:", err)
			continue
		}
		if err := c.connection.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("failed to send message: %v", err)
			continue
		}
		//log.Println("Message sent:", message.Type)
	}
	if err := c.connection.WriteMessage(websocket.CloseMessage, nil); err != nil {
		log.Println("error closing connection:", err)
		return
	}
}
