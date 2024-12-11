package main

import (
	"bomberman/db/sqlite"
	"bomberman/middleware"
	"bomberman/routes"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	migrationsPath := "./db/migrations/sqlite"

	_, err := sqlite.ConnectAndMigrateDb(migrationsPath)
	if err != nil {
		log.Fatalf("Failed to connect or migrate the database: %v", err)
	}
	defer sqlite.Db.Close()

	mux := routes.SetupRoutes()

	server := &http.Server{
		Addr:    ":8080",
		Handler: middleware.CorsMiddleWare(mux),
	}

	// Channel to listen for interrupt or terminate signals.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		fmt.Println("Starting server on: http://localhost:8080\nCtrl+c for exit")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Could not listen on :8080: %v\n", err)
		}
	}()

	// Blocking until a signal is received.
	<-quit
	fmt.Println("\nShutting down server...")

	// Gracefully shutdown the server, allowing 5 seconds for current operations to complete.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	fmt.Println("Server exiting gracefully")
}
