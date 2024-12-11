package sqlite

import (
	"bomberman/structs"
	"errors"
	"fmt"

	sqlite3 "github.com/mattn/go-sqlite3"
)

// SaveMessage is saving chat messages into Messages table.
func (d *Database) SaveMessage(message *structs.Message) (*structs.Message, error) {
	// Step 1: Insert the message into the Messages table with sender and recipient
	res, err := d.db.Exec(
		"INSERT INTO Messages (time_created, content, fromuser, toUser) VALUES(?,?,?,?)",
		message.Created, message.Content, message.SenderID, message.RecipientID, // Use toUser for the recipient
	)
	if err != nil {
		var sqliteErr sqlite3.Error
		if errors.As(err, &sqliteErr) {
			if errors.Is(sqliteErr.ExtendedCode, sqlite3.ErrConstraintUnique) {
				return nil, ErrDuplicate
			}
		}
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	message.ID = int(id)

	return message, nil
}

// FetchMessages is returning all messages sent and received with userID
func (d *Database) FetchMessages(userID int) ([]structs.Message, error) {
	// Fetch messages where the user is either the sender or the recipient
	rows, err := d.db.Query(`
        SELECT m.ID, m.content, m.time_created, m.fromuser, m.toUser
        FROM Messages m
        WHERE m.fromuser = ? OR m.toUser = ?
    `, userID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch messages: %w", err)
	}
	defer rows.Close()

	var messages []structs.Message

	for rows.Next() {
		var message structs.Message

		if err := rows.Scan(&message.ID, &message.Content, &message.Created, &message.SenderID, &message.RecipientID); err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}

		messages = append(messages, message)
	}
	return messages, nil
}

func (d *Database) FetchMessAndUsers(userID int, clientIDs []int) (*structs.ChatMessage, error) {

	// Fetch messages where the user is either the sender or the recipient
	rows, err := d.db.Query(`
SELECT m.ID, m.content, m.time_created, m.fromuser, m.toUser
FROM Messages m
WHERE m.fromuser = ? OR m.toUser = ?
`, userID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch messages: %w", err)
	}
	defer rows.Close()

	var messages []structs.Message
	uniqueUserIDs := make(map[int]struct{})

	for rows.Next() {
		var message structs.Message

		// Scan message data
		if err := rows.Scan(&message.ID, &message.Content, &message.Created, &message.SenderID, &message.RecipientID); err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}

		messages = append(messages, message)

		// Add unique user IDs, current user ID will be there
		uniqueUserIDs[message.SenderID] = struct{}{}
		uniqueUserIDs[message.RecipientID] = struct{}{}
	}

	// Convert map keys to a slice of user IDs
	var userIDs []int
	for id := range uniqueUserIDs {
		userIDs = append(userIDs, id)
	}
	//concat clientsIDs with userIDs in case user do not have messages
	slice := concatUnique(userIDs, clientIDs)

	users, err := d.GetUsersByIDs(slice)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch users: %w", err)
	}

	// Return ChatMessage struct with messages and users
	return &structs.ChatMessage{
		Message: messages,
		User:    users,
	}, nil
}
func concatUnique(slice1, slice2 []int) []int {
	uniqueMap := make(map[int]bool)
	var result []int

	// Add elements from the first slice
	for _, elem := range slice1 {
		if !uniqueMap[elem] {
			uniqueMap[elem] = true
			result = append(result, elem)
		}
	}

	// Add elements from the second slice
	for _, elem := range slice2 {
		if !uniqueMap[elem] {
			uniqueMap[elem] = true
			result = append(result, elem)
		}
	}

	return result
}
