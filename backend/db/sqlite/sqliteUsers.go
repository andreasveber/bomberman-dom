package sqlite

import (
	"bomberman/structs"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

func (d *Database) GetUserIdFromToken(session string) (int, error) {
	var userID int
	err := d.db.QueryRow("SELECT UserID FROM Sessions WHERE SessionToken = ?", session).Scan(&userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return -1, ErrNotExists
		}
		return -1, fmt.Errorf("failed to get user ID from token: %w", err)
	}
	return userID, nil
}

// DeleteSessionFromDB is clearing sessions from DB
func (d *Database) DeleteSessionFromDB(session string) error {
	stmt, err := d.db.Prepare("DELETE FROM Sessions WHERE SessionToken = ?")
	if err != nil {
		return err
	}
	result, err := stmt.Exec(session)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("no rows")
	}
	return nil
}

// GetUser is returning single user for user ID
func (d *Database) GetUser(userID int) (*structs.User, error) {
	var user structs.User
	// Execute the query
	err := d.db.QueryRow(`
		SELECT ID, NickName
		FROM Users 
		WHERE ID = ?
	`, userID).Scan(
		&user.ID,
		&user.NickName,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user with ID %d not found", userID)
		}
		return nil, fmt.Errorf("failed to query user: %w", err)
	}

	return &user, nil
}

// GetUsersByIDs is returning slice of users struct for slice of ID-s
func (d *Database) GetUsersByIDs(userIDs []int) ([]*structs.User, error) {

	if len(userIDs) == 0 {
		return nil, fmt.Errorf("no user IDs provided")
	}
	// Prepare a slice of interface{} to hold the IDs
	args := make([]interface{}, len(userIDs))
	for i, id := range userIDs {
		args[i] = id
	}
	// Dynamically build the query with the appropriate number of placeholders
	query := `
		SELECT ID, NickName
		FROM Users 
		WHERE ID IN (?` + strings.Repeat(",?", len(userIDs)-1) + `)
	`
	// Execute the query
	rows, err := d.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []*structs.User
	for rows.Next() {
		var user structs.User

		err := rows.Scan(
			&user.ID,
			&user.NickName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user row: %w", err)
		}
		users = append(users, &user)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error occurred while fetching users: %w", err)
	}
	return users, nil
}

func (d *Database) SaveUser(user structs.User) error {

	prep, err := d.db.Prepare(`
		INSERT INTO Users (NickName, Password)
		VALUES (?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer prep.Close()

	_, err = prep.Exec(
		user.NickName,
		user.Password,
	)
	if err != nil {
		return fmt.Errorf("failed to execute statement: %w", err)
	}
	fmt.Println("Successfully inserted to db!")
	return nil
}

func (d *Database) SaveSession(userID int, token string, exp time.Time) error {
	formattedExp := exp.UTC().Format("2006-01-02 15:04:05")
	_, err := d.db.Exec(`
		INSERT INTO Sessions (UserID, SessionToken, ExpiresAt) VALUES (?, ?, ?)
	`, userID, token, formattedExp)
	if err != nil {
		// Wrap the error with additional context
		return fmt.Errorf("failed to save session for user %d: %w", userID, err)
	}
	return nil
}
func (d *Database) GetUserByNick(nick string) (*structs.User, error) {
	var user structs.User

	// Execute the query
	err := d.db.QueryRow(`
		SELECT ID, NickName, Password 
		FROM Users 
		WHERE NickName = ?
	`, nick).Scan(
		&user.ID,
		&user.NickName,
		&user.Password,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user with Nickname %v not found: %w", nick, err)
		}
		return nil, fmt.Errorf("failed to query user: %w", err)
	}

	return &user, nil
}

// NicknameExists checks if a nickname exists in the Users table.
func (d *Database) NicknameExists(nick string) (bool, error) {
	var exists bool
	// Execute the query using COUNT to check for existence
	query := `SELECT COUNT(*) > 0 FROM Users WHERE NickName = ?`
	err := d.db.QueryRow(query, nick).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if nickname exists: %w", err)
	}
	return exists, nil
}
