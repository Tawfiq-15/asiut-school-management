// Package logger provides a structured slog-based logger for the application.
// In development it emits human-readable text; in production it emits JSON
// suitable for ingestion by log aggregators (Datadog, ELK, Cloud Logging, etc.).
package logger

import (
	"context"
	"log/slog"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// Init sets up the global slog logger. Call once from main().
func Init() {
	level := slog.LevelDebug
	if os.Getenv("ENV") == "production" {
		level = slog.LevelInfo
	}

	var handler slog.Handler
	opts := &slog.HandlerOptions{Level: level}
	if os.Getenv("ENV") == "production" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	logger := slog.New(handler).With(
		slog.String("service", "school-management"),
		slog.String("env", getEnv("ENV", "development")),
	)
	slog.SetDefault(logger)
}

// RequestLogger returns a Gin middleware that emits one structured log line per request.
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		attrs := []slog.Attr{
			slog.String("method", c.Request.Method),
			slog.String("path", path),
			slog.Int("status", status),
			slog.Duration("latency", latency),
			slog.String("ip", c.ClientIP()),
			slog.String("request_id", c.GetString("requestID")),
		}
		if query != "" {
			attrs = append(attrs, slog.String("query", query))
		}
		if len(c.Errors) > 0 {
			attrs = append(attrs, slog.String("errors", c.Errors.String()))
		}

		level := slog.LevelInfo
		if status >= 500 {
			level = slog.LevelError
		} else if status >= 400 {
			level = slog.LevelWarn
		}
		if latency > 2*time.Second {
			attrs = append(attrs, slog.Bool("slow_request", true))
			level = slog.LevelWarn
		}

		slog.LogAttrs(context.Background(), level, "request", attrs...)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
