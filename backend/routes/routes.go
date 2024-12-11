package routes

import (
	"bomberman/handlers"
	"bomberman/middleware"
	"bomberman/sockets"
	"net/http"
)

func SetupRoutes() *http.ServeMux {

	manager := sockets.GetManager()
	mux := http.NewServeMux()
	mux.HandleFunc("/register", handlers.Register)
	mux.HandleFunc("/login", handlers.Login)
	mux.HandleFunc("/ws", manager.Serve_WS)
	mux.HandleFunc("/game", manager.Serve_WS)
	mux.HandleFunc("/logout", handlers.Logout)
	mux.Handle("/getUserData", middleware.RequireLogin(http.HandlerFunc(handlers.GetUserData)))

	return mux
}
