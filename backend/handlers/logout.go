package handlers

import (
	"bomberman/db/sqlite"
	"bomberman/middleware"
	"bomberman/security"
	"bomberman/sockets"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

func Logout(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Nick string `json:"nickname"`
	}
	var response struct {
		PlayerId int `json:"playerId"`
	}
	if r.Method != http.MethodPost {
		middleware.SendErrorResponse(w, "Method not allowed!", http.StatusMethodNotAllowed)
		return
	}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		middleware.SendErrorResponse(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	cookie, err := r.Cookie("session_" + req.Nick)
	if err != nil {
		middleware.SendErrorResponse(w, "Error getting token"+err.Error(), http.StatusBadRequest)
		return
	}
	userID, err := middleware.GetUserId(cookie.Value)
	if err != nil {
		middleware.SendErrorResponse(w, "Error getting ID from session token", http.StatusInternalServerError)
		return
	}
	user, err := middleware.GetUser(userID)
	if err != nil {
		middleware.SendErrorResponse(w, "Error getting ID from session token", http.StatusInternalServerError)
		return
	}
	user.Online = false
	dataJSON, err := json.Marshal(&user)
	if err != nil {
		middleware.SendErrorResponse(w, "Error marshalling logging out User", http.StatusBadRequest)
		return
	}

	//send via WS to all client that user offline
	manager := sockets.GetManager()

	client, ok := manager.ClientsByUserID[userID]
	if !ok {
		log.Printf("User with ID %d not connected", userID)
		return
	}
	//getting connection types from map
	conn := make([]string, len(client))
	i := 0
	for k := range client {
		conn[i] = k
		i++
	}

	for _, conType := range conn {
		if conType == "chat" {
			event := sockets.NewEvent(sockets.EventStatus, dataJSON, cookie.Value)
			if err := sockets.GetManager().HandleClientStatus(event, client[conType]); err != nil {
				middleware.SendErrorResponse(w, "Error failed to send logout status via WS", http.StatusBadRequest)
			}
		} else {
			response.PlayerId = userID
			datJSON, err := json.Marshal(&response)
			evnt := sockets.NewEvent(sockets.EventLeftGame, datJSON, cookie.Value)
			if err != nil {
				middleware.SendErrorResponse(w, "Error marshalling leaving userID", http.StatusBadRequest)
				return
			}
			if err := sockets.GetManager().HandleClientStatus(evnt, client[conType]); err != nil {
				middleware.SendErrorResponse(w, "Error failed to send logout status via WS", http.StatusBadRequest)
			}
		}

	}
	// Remove session from the database
	if err := sqlite.Db.DeleteSessionFromDB(cookie.Value); err != nil {
		if err != sql.ErrNoRows {
			middleware.SendErrorResponse(w, "Error deleting from database: "+err.Error(), http.StatusInternalServerError)
			return
		}
		middleware.SendErrorResponse(w, "Session not found in database", http.StatusBadRequest)
		return
	}
	//remove WS client a bit later, let last 'status' message to broadcast
	for _, conType := range conn {
		manager.RemoveClient(client[conType])
	}
	// Check if session exists in memory and remove it
	if session, ok := security.DbSessions[cookie.Value]; ok {
		// Lock user map before deleting the user's session
		middleware.UserMapLock.Lock()
		delete(middleware.UserMap, session.UserID)
		middleware.UserMapLock.Unlock()
	}
	// Remove the session from the in-memory map
	security.RemoveSession(cookie.Value)

	// Clear the session cookie on the client side
	http.SetCookie(w, &http.Cookie{
		Name:     cookie.Name,
		Path:     "/",
		Value:    "",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
	})

	// Respond with success status
	w.WriteHeader(http.StatusOK)
}
