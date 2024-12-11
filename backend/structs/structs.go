package structs

type User struct {
	ID       int    `json:"ID,omitempty"`
	Password string `json:"password"`
	NickName string `json:"nickname"`
	Online   bool   `json:"online"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}

type Message struct {
	ID          int    `json:"id,omitempty"`
	Content     string `json:"content"`
	Created     string `json:"created"`
	RecipientID int    `json:"recipient"`
	SenderID    int    `json:"sender"`
}

type ChatMessage struct {
	Message []Message
	User    []*User
}

type Box struct {
	Height    string `json:"height"`
	Width     string `json:"width"`
	Breakable int    `json:"breakable"`
	ClassName string `json:"className"`
}

type Common struct {
	GameField []Box     `json:"gameField"`
	Rooms     GameRooms `json:"rooms,omitempty"`
}
type GameRooms struct {
	Game0 int `json:"game0"`
	Game1 int `json:"game1,omitempty"`
	Game2 int `json:"game2,omitempty"`
	Game3 int `json:"game3,omitempty"`
}
