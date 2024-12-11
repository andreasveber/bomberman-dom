package handlers

import (
	"bomberman/db/sqlite"
	"bomberman/middleware"
	"bomberman/security"
	"bomberman/structs"
	//"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
)

func Login(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		middleware.SendErrorResponse(w, "Method not allowed!", http.StatusMethodNotAllowed)
		return
	}
	var req structs.User
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		middleware.SendErrorResponse(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	nickname := req.NickName
	password := req.Password

	user, err := sqlite.Db.GetUserByNick(nickname)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			middleware.SendErrorResponse(w, "User nickname is not found", http.StatusBadRequest)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	err = security.CheckPassword([]byte(user.Password), []byte(password))
	if err != nil {
		middleware.SendErrorResponse(w, "Wrong password", http.StatusBadRequest)
		return
	}
	user.Password = ""
	// Set both user nickname and ID in the context
	// ctx := context.WithValue(r.Context(), middleware.NicknameKey, user.NickName)
	// ctx = context.WithValue(ctx, middleware.UserIDKey, user.ID)
	token := security.NewSession("session_"+nickname, user.ID, w)

	// Protect UserMap with write lock
	middleware.UserMapLock.Lock()
	middleware.UserMap[user.ID] = *user
	middleware.UserMapLock.Unlock()

	// Prepare the response with authentication status and token
	response := map[string]interface{}{
		"authenticated": true,
		"token":         token,
		"user": map[string]interface{}{
			"id":       user.ID,
			"nickname": user.NickName,
		},
	}
	jsonData, err := json.Marshal(response)
	if err != nil {
		middleware.SendErrorResponse(w, "Error marshalling user data to JSON", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonData)
}
