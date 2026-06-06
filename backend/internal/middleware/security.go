package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders injects production security response headers on every request.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Generate a unique request ID for tracing
		id := newRequestID()
		c.Set("requestID", id)
		c.Header("X-Request-ID", id)

		// Prevent MIME-type sniffing
		c.Header("X-Content-Type-Options", "nosniff")
		// Deny framing (clickjacking protection)
		c.Header("X-Frame-Options", "DENY")
		// Legacy XSS filter
		c.Header("X-XSS-Protection", "1; mode=block")
		// Referrer policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		// Disable unused browser features
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
		// Hide server identity
		c.Header("Server", "")

		if os.Getenv("ENV") == "production" {
			// Force HTTPS for 1 year, include subdomains
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}

		c.Next()
	}
}

func newRequestID() string {
	b := make([]byte, 8)
	rand.Read(b) //nolint:errcheck // always succeeds on supported platforms
	return hex.EncodeToString(b)
}

// ─── Auth-specific IP rate limiter ───────────────────────────────────────────
//
// Provides a lightweight in-process rate limiter for authentication endpoints
// (login, forgot-password, register). Falls back gracefully when Redis is
// unavailable. Limits each IP to `maxAttempts` requests per `window`.

const (
	authMaxAttempts = 10
	authWindow      = 15 * time.Minute
)

type ipEntry struct {
	count   int
	resetAt time.Time
}

type ipLimiter struct {
	mu      sync.Mutex
	entries map[string]*ipEntry
}

var authLimiter = &ipLimiter{entries: make(map[string]*ipEntry)}

// AuthRateLimit limits authentication endpoint requests to authMaxAttempts per IP per window.
func AuthRateLimit() gin.HandlerFunc {
	// Background cleanup to avoid unbounded memory growth
	go func() {
		t := time.NewTicker(5 * time.Minute)
		for range t.C {
			authLimiter.mu.Lock()
			now := time.Now()
			for ip, e := range authLimiter.entries {
				if now.After(e.resetAt) {
					delete(authLimiter.entries, ip)
				}
			}
			authLimiter.mu.Unlock()
		}
	}()

	return func(c *gin.Context) {
		ip := c.ClientIP()

		authLimiter.mu.Lock()
		e, ok := authLimiter.entries[ip]
		now := time.Now()
		if !ok || now.After(e.resetAt) {
			authLimiter.entries[ip] = &ipEntry{count: 1, resetAt: now.Add(authWindow)}
			authLimiter.mu.Unlock()
			c.Next()
			return
		}
		e.count++
		if e.count > authMaxAttempts {
			authLimiter.mu.Unlock()
			c.AbortWithStatusJSON(429, gin.H{
				"error":       "Too many attempts. Please try again later.",
				"retry_after": int(time.Until(e.resetAt).Seconds()),
			})
			return
		}
		authLimiter.mu.Unlock()
		c.Next()
	}
}
