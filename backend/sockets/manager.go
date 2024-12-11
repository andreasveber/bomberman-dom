package sockets

import (
	"bomberman/db/sqlite"
	"bomberman/middleware"
	"bomberman/security"
	"bomberman/structs"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

var WebsocketUpgrader = websocket.Upgrader{
	CheckOrigin:     checkOrigin,
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

var (
	ErrEventNotSupported = errors.New("this event type is not supported")
)

type Manager struct {
	Clients ClientList
	sync.RWMutex
	ClientsByUserID map[int]map[string]*Client
	handlers        map[string]EventHandler
}

// NewManager creates new Manager
func NewManager() *Manager {
	m := &Manager{
		Clients:         make(ClientList),
		ClientsByUserID: make(map[int]map[string]*Client),
		handlers:        make(map[string]EventHandler),
	}
	m.setupEventHandlers()
	return m
}

var (
	managerInstance *Manager
	once            sync.Once
	u               *structs.User
	game            = "game"
	chat            = "chat"
	Common          structs.Common
)

// GetManager returns the singleton instance of the Manager
func GetManager() *Manager {
	once.Do(func() {
		managerInstance = NewManager()
	})
	return managerInstance
}

// setupEventHandlers adds Event handlers to handlers Map
func (m *Manager) setupEventHandlers() {
	m.handlers[EventMessage] = m.handleMessages
	m.handlers[EventUpload] = m.handleUpload
	m.handlers[EventStatus] = m.HandleClientStatus
	m.handlers[EventGameJoin] = m.handleJoinGame
	m.handlers[EventPlayground] = m.GetGameField
	m.handlers[EventPlayerMove] = m.handlePlayerMove
	m.handlers[EventSetBomb] = m.handleBombPlaced
	m.handlers[EventLeftGame] = m.HandleClientStatus
	m.handlers[EventTimer] = m.handleTimers
	m.handlers[EventFieldUpdate] = m.handleFieldUpdate
	m.handlers[EventBombExploded] = m.handleBombExploded
	m.handlers[EventPlayerHit] = m.handlePlayerHit
	m.handlers[EventPowerupSpawned] = m.handlePowerupSpawned
	m.handlers[EventPowerupCollected] = m.handlePowerupCollected
	m.handlers[EventRestart] = m.handleRestart
	m.handlers[EventPlayerGone] = m.handleGone
}
func (m *Manager) GetGameField(e *Event, c *Client) error {
	err := json.Unmarshal(e.Payload, &Common)
	if err != nil {
		return errors.New("error unmarshalling the gameField")
	}
	return nil
}

// handleTimers forwards timers for all clients
func (m *Manager) handleTimers(e *Event, c *Client) error {
	timerEvent := NewEvent(EventTimer, e.Payload, c.sessionToken)
	for client := range m.Clients {
		client.egress <- *timerEvent
	}
	return nil
}

// handleTimers forwards timers for all clients
func (m *Manager) handleRestart(e *Event, c *Client) error {
	Common.Rooms = structs.GameRooms{}
	var restart = struct {
		TimerType     string `json:"timerType"`
		RemainingTime int    `json:"remainingTime"`
	}{
		TimerType:     "waiting",
		RemainingTime: 10,
	}
	dataJson, err := json.Marshal(&restart)
	if err != nil {
		log.Println("error marshaling gamefield: ", err)
		return err
	}

	restartEvent := NewEvent(EventTimer, dataJson, c.sessionToken)
	for client := range m.Clients {
		if c.clientId != client.clientId {
			client.egress <- *restartEvent
		}
	}
	return nil
}

func (m *Manager) handleGone(e *Event, c *Client) error {

	goneEvent := NewEvent(EventPlayerGone, e.Payload, c.sessionToken)
	for client := range m.Clients {
		if c.clientId != client.clientId {
			client.egress <- *goneEvent
		}
	}
	return nil
}

func (m *Manager) handleJoinGame(e *Event, c *Client) error {

	// getting online users IDs slice
	clientIDs := m.GetOnlineUserIDs(game)

	if len(clientIDs) == 1 {
		Common.Rooms = structs.GameRooms{}
		Common.Rooms.Game0 = c.clientId
		updatJSON, err := json.Marshal(&Common.Rooms)
		if err != nil {
			log.Println("error marshaling first user startus: ", err)
			return err
		}
		firstPlayerEvent := NewEvent(EventGameJoin, updatJSON, c.sessionToken)
		c.egress <- *firstPlayerEvent
		return nil

	} else if len(clientIDs) > 1 {
		switch len(clientIDs) {
		case 2:
			Common.Rooms.Game1 = c.clientId
		case 3:
			Common.Rooms.Game2 = c.clientId
		case 4:
			Common.Rooms.Game3 = c.clientId
		}

		commonJSON, err := json.Marshal(&Common)
		if err != nil {
			log.Println("error marshaling gamefield: ", err)
			return err
		}
		gameFieldEvent := NewEvent(EventPlayground, commonJSON, c.sessionToken)
		for client := range m.Clients {
			client.egress <- *gameFieldEvent
		}
	}
	return nil
}

func (m *Manager) handlePlayerMove(e *Event, c *Client) error {
	moveEvent := NewEvent(EventPlayerMove, e.Payload, c.sessionToken)
	for client := range m.Clients {
		if c.clientId != client.clientId {
			client.egress <- *moveEvent
		}
	}
	return nil
}

func (m *Manager) handleBombPlaced(e *Event, c *Client) error {
	bombEvent := NewEvent(EventSetBomb, e.Payload, c.sessionToken)
	for client := range m.Clients {
		if c.clientId != client.clientId {
			client.egress <- *bombEvent
		}
	}
	return nil
}

func (m *Manager) handleUpload(e *Event, c *Client) error {
	if e.Type == EventUpload {
		token := c.sessionToken
		if token == "" {
			return fmt.Errorf("session token is missing")
		}
		clientIDs := m.GetOnlineUserIDs(chat)
		// Fetch messages and users list from messages from DB
		common, err := sqlite.Db.FetchMessAndUsers(c.clientId, clientIDs)
		if err != nil {
			log.Println("Error fetching messages and users list from messages from DB IDs:", err)
			return err
		}
		for _, userID := range clientIDs {
			for _, usr := range common.User {
				if usr.ID == userID {
					usr.Online = true
				}
			}
		}
		// Marshal the response to JSON
		dataJSON, err := json.Marshal(&common)
		if err != nil {
			log.Println("error marshaling messages: ", err)
			return err
		}
		// Create the response event for regular chat upload
		updateEvent := NewEvent(EventUpload, dataJSON, token)
		// Send the response to the correct client
		c.egress <- *updateEvent

		updatJSON, err := json.Marshal(u)
		if err != nil {
			log.Println("error marshaling user startus: ", err)
			return err
		}
		//sends status update for all clients
		statusEvent := NewEvent(EventStatus, updatJSON, c.sessionToken)
		for client := range m.Clients {
			client.egress <- *statusEvent
		}
		return nil
	}
	return fmt.Errorf("unexpected event type: %s", e.Type)
}

// handleMessages takes care of sent messages, save later to DB here
func (m *Manager) handleMessages(e *Event, c *Client) error {
	var message structs.Message
	if e.Type == EventMessage {
		fmt.Printf("Handling %v event\n", e.Type)
		err := json.Unmarshal(e.Payload, &message)
		if err != nil {
			return errors.New("error unmarshalling the payload of the newPM event")
		}
		_, err = sqlite.Db.SaveMessage(&message)
		if err != nil {
			log.Println("error saving PM into db: ", err)
		}
		updateEvent := NewEvent(EventMessage, e.Payload, e.SessionToken)

		if recipientClient, ok := m.ClientsByUserID[message.RecipientID][chat]; ok {
			recipientClient.egress <- *updateEvent
		}
		return nil
	}
	return fmt.Errorf("unexpected event type: %s", e.Type)
}

func (m *Manager) HandleClientStatus(e *Event, c *Client) error {
	for client := range m.Clients {
		client.egress <- *e
	}
	return nil
}

func (m *Manager) handleFieldUpdate(e *Event, c *Client) error {
	fieldEvent := NewEvent(EventFieldUpdate, e.Payload, c.sessionToken)
	for client := range m.Clients {
		if c.clientId != client.clientId {
			client.egress <- *fieldEvent
		}
	}
	return nil
}

func (m *Manager) handleBombExploded(e *Event, c *Client) error {
	bombEvent := NewEvent(EventBombExploded, e.Payload, c.sessionToken)
	for client := range m.Clients {
		if c.clientId != client.clientId {
			client.egress <- *bombEvent
		}
	}
	return nil
}

func (m *Manager) handlePlayerHit(e *Event, c *Client) error {
	hitEvent := NewEvent(EventPlayerHit, e.Payload, c.sessionToken)
	for client := range m.Clients {
		if c.clientId != client.clientId {
			client.egress <- *hitEvent
		}
	}
	return nil
}

func (m *Manager) handlePowerupSpawned(e *Event, c *Client) error {
	// Ensure payload is valid JSON before broadcasting
	var payload map[string]interface{}
	if err := json.Unmarshal(e.Payload, &payload); err != nil {
		return err
	}

	powerupEvent := NewEvent(EventPowerupSpawned, e.Payload, c.sessionToken)
	for client := range m.Clients {
		if c.clientId != client.clientId {
			client.egress <- *powerupEvent
		}
	}
	return nil
}

func (m *Manager) handlePowerupCollected(e *Event, c *Client) error {
	// Ensure payload is valid JSON before broadcasting
	var payload map[string]interface{}
	if err := json.Unmarshal(e.Payload, &payload); err != nil {
		return err
	}

	collectedEvent := NewEvent(EventPowerupCollected, e.Payload, c.sessionToken)
	for client := range m.Clients {
		if c.clientId != client.clientId {
			client.egress <- *collectedEvent
		}
	}
	return nil
}

// routeEvent routing Events to appropriate handler
func (m *Manager) routeEvent(event *Event, c *Client) error {
	switch event.Type {
	case EventMessage:
		return m.handleMessages(event, c)
	case EventUpload:
		return m.handleUpload(event, c)
	case EventStatus:
		return m.HandleClientStatus(event, c)
	case EventGameJoin:
		return m.handleJoinGame(event, c)
	case EventPlayground:
		return m.GetGameField(event, c)
	case EventPlayerMove:
		return m.handlePlayerMove(event, c)
	case EventSetBomb:
		return m.handleBombPlaced(event, c)
	case EventLeftGame:
		return m.HandleClientStatus(event, c)
	case EventTimer:
		return m.handleTimers(event, c)
	case EventFieldUpdate:
		return m.handleFieldUpdate(event, c)
	case EventBombExploded:
		return m.handleBombExploded(event, c)
	case EventPlayerHit:
		return m.handlePlayerHit(event, c)
	case EventPowerupSpawned:
		return m.handlePowerupSpawned(event, c)
	case EventPowerupCollected:
		return m.handlePowerupCollected(event, c)
	case EventRestart:
		return m.handleRestart(event, c)
	case EventPlayerGone:
		return m.handleGone(event, c)
	default:
		return fmt.Errorf("this event type is not supported %s", event.Type)
	}
}

// Serve_WS upgrading regular http connection into websocket
func (m *Manager) Serve_WS(w http.ResponseWriter, r *http.Request) {
	nickname := r.URL.Query().Get("nickname")

	connType := r.URL.Path
	if connType == "/ws" {
		connType = chat
	} else if connType == "/game" {
		connType = game
	}

	if nickname == "" {
		middleware.SendErrorResponse(w, "Nickname not provided", http.StatusBadRequest)
		return
	}

	cookie, err := r.Cookie("session_" + nickname)
	if err != nil {
		middleware.SendErrorResponse(w, "Error getting token"+err.Error(), http.StatusBadRequest)
		return
	}
	sessionToken := cookie.Value
	if !security.ValidateSession(sessionToken) {
		middleware.SendErrorResponse(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	userID, err := middleware.GetUserId(cookie.Value)
	if err != nil {
		middleware.SendErrorResponse(w, "Error getting user ID: "+err.Error(), http.StatusBadRequest)
		return
	}
	user, err := middleware.GetUser(userID)
	if err != nil {
		middleware.SendErrorResponse(w, "Error getting User with userID: "+err.Error(), http.StatusBadRequest)
		return
	}
	user.Online = true
	u = user
	// Begin by upgrading the HTTP request
	conn, err := WebsocketUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	// Create New Client
	client := NewClient(conn, m)
	client.ConnType = connType
	client.clientId = userID
	client.sessionToken = sessionToken

	// Add the newly created client to the manager
	m.addClient(client, connType)
	go client.readMessages()
	go client.writeMessages()
}

// addClient is concurrently adding client to manager (w/mutex)
func (m *Manager) addClient(client *Client, connType string) {
	m.Lock()
	defer m.Unlock()

	// Check if the user already has a connection map; if not, create it
	if _, ok := m.ClientsByUserID[client.clientId]; !ok {
		m.ClientsByUserID[client.clientId] = make(map[string]*Client)
	}

	// Add the new client under the correct connection type
	m.ClientsByUserID[client.clientId][connType] = client

	// Add to global client list
	m.Clients[client] = true
}

// removeClient concurrently safely (w/mutex) removing client

func (m *Manager) RemoveClient(client *Client) {
	m.Lock()
	defer m.Unlock()

	userID := client.clientId
	connType := client.ConnType

	// Check if the user has a connection of this type and remove it
	if _, ok := m.ClientsByUserID[userID][connType]; ok {
		client.connection.Close()
		delete(m.ClientsByUserID[userID], connType)
		delete(m.Clients, client)

		// Optionally, you can remove the user's entry entirely if no connections remain
		if len(m.ClientsByUserID[userID]) == 0 {
			delete(m.ClientsByUserID, userID)
		}
	}
}

// checkOrigin will check origin and return true if it's allowed
func checkOrigin(r *http.Request) bool {
	// Grab the request origin
	origin := r.Header.Get("Origin")
	if origin == "" {
		return false
	}
	// Parse the origin to extract the host and port
	u, err := url.Parse(origin)
	if err != nil {
		return false
	}
	hostParts := strings.Split(u.Host, ":")
	if len(hostParts) != 2 {
		return false
	}
	port, err := strconv.Atoi(hostParts[1])
	if err != nil {
		return false
	}
	// Allow localhost with port range 3000-3010 or specific other origins
	if (hostParts[0] == "localhost" && port >= 3000 && port <= 3010) || origin == "http://localhost:8080" {

		return true
	}
	return false
}
func (m *Manager) GetOnlineUserIDs(ConnType string) []int {
	m.RLock()
	defer m.RUnlock()
	userIDs := make([]int, 0, len(m.ClientsByUserID))
	for userID := range m.ClientsByUserID {
		_, ok := m.ClientsByUserID[userID][ConnType]
		if ok {
			userIDs = append(userIDs, userID)
		}
	}
	return userIDs
}
