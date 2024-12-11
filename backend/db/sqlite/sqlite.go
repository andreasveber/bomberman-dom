package sqlite

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	sqlitemigration "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

var (
	ErrDuplicate = errors.New("record already exists")
	ErrNotExists = errors.New("row does not exist")
	Db           *Database
)

type Database struct {
	db *sql.DB
}

func ConnectAndMigrateDb(migrationsPath string) (*Database, error) {
	// Open SQLite database connection
	db, err := OpenDatabase()
	if err != nil {
		return nil, err
	}

	fmt.Println("Database opened successfully")

	// Create a new SQLite driver instance
	driver, err := sqlitemigration.WithInstance(db.db, &sqlitemigration.Config{})
	if err != nil {
		db.db.Close() // Close the db if driver creation fails
		return nil, fmt.Errorf("failed to create SQLite driver: %w", err)
	}

	// Create a new migration instance
	m, err := migrate.NewWithDatabaseInstance(
		"file://"+migrationsPath,
		"sqlite3",
		driver,
	)
	if err != nil {
		db.db.Close() // Close the db if migration instance creation fails
		return nil, fmt.Errorf("failed to create migration instance: %w", err)
	}

	// Apply all migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		db.db.Close() // Close the db if migration fails
		return nil, fmt.Errorf("failed to apply migrations: %w", err)
	}

	// Assign to global variable
	Db = db

	return db, nil
}

// Close closes the database connection.
func (d *Database) Close() error {
	return d.db.Close()
}

// OpenDatabase opens the database and returns a Database instance.
func OpenDatabase() (*Database, error) {
	db, err := sql.Open("sqlite3", "./db/database.db")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	return &Database{db: db}, nil
}
