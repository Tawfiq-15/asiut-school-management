package main

import (
	"log"

	"github.com/joho/godotenv"
	"school-management/backend/pkg/database"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	db, err := database.Connect()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := database.SeedDemoUsers(db); err != nil {
		log.Fatal(err)
	}
	log.Println("Seeding complete")
}
