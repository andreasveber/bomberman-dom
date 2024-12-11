package sockets

import "encoding/json"

type Event struct {
	Type         string          `json:"type"`
	Payload      json.RawMessage `json:"payload"`
	SessionToken string          `json:"sessionToken,omitempty"`
}

type EventHandler func(event *Event, c *Client) error

// NewEvent will be used to create Events for sending to FrontEnd(if any)
func NewEvent(t string, p json.RawMessage, s string) *Event {
	return &Event{
		Type:         t,
		Payload:      p,
		SessionToken: s,
	}
}

const (
	EventMessage          = "chat_message"
	EventUpload           = "initial_upload"
	EventStatus           = "status"
	EventGameJoin         = "player_joined"
	EventPlayerMove       = "player_moved"
	EventSetBomb          = "bomb_placed"
	EventLeftGame         = "player_left"
	EventPlayground       = "playground"
	EventTimer            = "timer_start"
	EventGameStart        = "game_start"
	EventFieldUpdate      = "field_update"
	EventBombExploded     = "bomb_exploded"
	EventPlayerHit        = "player_hit"
	EventPowerupSpawned   = "powerup_spawned"
	EventPowerupCollected = "powerup_collected"
	EventRestart          = "game_start"
	EventPlayerGone       = "player_gone"
)
