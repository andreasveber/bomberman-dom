package middleware

import (
	"bomberman/db/sqlite"
	"bomberman/security"
	"bomberman/structs"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"sync"
)

// Creating local variable for storing users online.
var (
	UserMap     = make(map[int]structs.User)
	UserMapLock sync.RWMutex // Mutex to protect UserMap
)

type contextKey string

const (
	NicknameKey contextKey = "nickname"
	UserIDKey   contextKey = "userID"
)

// CorsMiddleWare allows CORS from specific origins in the range 3000-3010
func CorsMiddleWare(front http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if isAllowedOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}
		}
		front.ServeHTTP(w, r)
	})
}

// isAllowedOrigin checks if the origin is allowed based on the specified port range
func isAllowedOrigin(origin string) bool {
	if origin == "" {
		return false
	}
	u, err := url.Parse(origin)
	if err != nil {
		return false
	}
	port := u.Port()
	if port == "" {
		// Default to port 80 for http and 443 for https
		if u.Scheme == "http" {
			port = "80"
		} else {
			port = "443"
		}
	}
	portInt, err := strconv.Atoi(port)
	if err != nil {
		return false
	}
	return portInt >= 3000 && portInt <= 3010
}

func RequireLogin(front http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nickname, ok := r.Context().Value(NicknameKey).(string)
		if !ok {
			SendErrorResponse(w, "Nickname not found in context", http.StatusUnauthorized)
			return
		}
		cookie, err := r.Cookie(nickname)
		if err != nil {

			SendErrorResponse(w, "Invalid session. Please log in.", http.StatusUnauthorized)
			return
		}
		// Validate the session
		if !security.ValidateSession(cookie.Value) {
			SendErrorResponse(w, "Please log in.", http.StatusUnauthorized)
			return
		}
		front.ServeHTTP(w, r)
	})
}

func SendErrorResponse(w http.ResponseWriter, message string, code int) {
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(structs.ErrorResponse{Message: message})
}

// GetUserId is getting user ID with token, either from sessions map or from DB
func GetUserId(token string) (int, error) {
	// Acquire a read lock before accessing the shared map
	security.SessionLock.RLock()
	session, ok := security.DbSessions[token]
	security.SessionLock.RUnlock()

	if ok {
		return session.UserID, nil
	}

	// Fall back to database lookup if not found in in-memory store
	userID, err := sqlite.Db.GetUserIdFromToken(token)
	if err != nil {
		return -1, fmt.Errorf("error getting ID from session token: %w", err)
	}
	return userID, nil
}

// GetUser is getting user with user ID, either from User map or from DB
func GetUser(id int) (*structs.User, error) {
	var (
		user *structs.User
		err  error
	)
	UserMapLock.RLock()
	u, ok := UserMap[id]
	UserMapLock.RUnlock()

	if ok {
		user = &u
	} else {
		// Fall back to database lookup if not found in in-memory store
		user, err = sqlite.Db.GetUser(id)
		if err != nil {
			return nil, fmt.Errorf("error querying user data to struct:  %w", err)
		}
	}
	return user, nil
}
