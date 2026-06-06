package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimit applies per-IP rate limiting using Redis sliding window counter
func RateLimit(rdb *redis.Client) gin.HandlerFunc {
	maxRequests, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_REQUESTS"))
	if maxRequests == 0 {
		maxRequests = 100
	}

	windowMin, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_WINDOW_MINUTES"))
	if windowMin == 0 {
		windowMin = 15
	}

	window := time.Duration(windowMin) * time.Minute

	return func(c *gin.Context) {
		if rdb == nil {
			c.Next()
			return
		}

		ip := c.ClientIP()
		key := fmt.Sprintf("rl:%s", ip)
		ctx := context.Background()

		count, err := rdb.Incr(ctx, key).Result()
		if err != nil {
			// Redis error — fail open
			c.Next()
			return
		}

		if count == 1 {
			rdb.Expire(ctx, key, window)
		}

		if count > int64(maxRequests) {
			c.Header("Retry-After", strconv.Itoa(windowMin*60))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests. Please try again later.",
			})
			return
		}

		c.Header("X-RateLimit-Limit", strconv.Itoa(maxRequests))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(int64(maxRequests)-count, 10))
		c.Next()
	}
}
