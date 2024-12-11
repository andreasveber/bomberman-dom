package handlers

import (
	"bomberman/middleware"
	"encoding/json"
	"net/http"
)

func GetUserData(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Nick string `json:"nickname"`
	}
	if r.Method != http.MethodGet {
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
	// Retrieve user ID from the session token stored in the cookie
	userID, err := middleware.GetUserId(cookie.Value)
	if err != nil {
		middleware.SendErrorResponse(w, "Error getting ID from session token", http.StatusInternalServerError)
		return
	}
	// Fetch user details from the database
	user, err := middleware.GetUser(userID)
	if err != nil {
		middleware.SendErrorResponse(w, "Error querying user data: "+err.Error(), http.StatusInternalServerError)
		return
	}
	// Marshal the user data into JSON and send the response
	jsonData, err := json.Marshal(user)
	if err != nil {
		middleware.SendErrorResponse(w, "Error marshalling user data to JSON", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonData)
}
