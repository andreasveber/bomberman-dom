package handlers

import (
	"bomberman/db/sqlite"
	"bomberman/middleware"
	"bomberman/security"
	"bomberman/structs"
	"encoding/json"
	"fmt"
	"net/http"
)

func Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		middleware.SendErrorResponse(w, "Method not allowed!", http.StatusMethodNotAllowed)
		return
	}
	var user structs.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		middleware.SendErrorResponse(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	fmt.Println(user)
	exists, err := sqlite.Db.NicknameExists(user.NickName)
	if err != nil {
		middleware.SendErrorResponse(w, "Cannot check nickname for existance in DB", http.StatusBadRequest)
		return
	}
	if exists {
		middleware.SendErrorResponse(w, "Nickname is already taken", http.StatusBadRequest)
		return
	}
	password := user.Password // assuming password comes from the same JSON body
	if len(password) < 4 {
		middleware.SendErrorResponse(w, "Password too short! Must be at least 4 characters", http.StatusBadRequest)
		return
	}
	hashedPw, err := security.HashPassword(password)
	if err != nil {
		middleware.SendErrorResponse(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	user.Password = string(hashedPw)
	err = sqlite.Db.SaveUser(user)
	if err != nil {
		middleware.SendErrorResponse(w, "Failed to insert into Users table: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success": true, "message": "User registered successfully"}`))

}
