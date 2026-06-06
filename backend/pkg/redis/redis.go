package redis

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

func Connect() *redis.Client {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	ctx := context.Background()
	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Printf("⚠️  Redis not available: %v (continuing without cache)", err)
		rdb.Close()
		return nil
	} else {
		log.Println("✅ Connected to Redis")
	}

	return rdb
}
