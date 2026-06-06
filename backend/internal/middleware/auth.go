package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"school-management/backend/internal/auth"
)

const UserIDKey = "userID"
const UserRoleKey = "userRole"
const UserEmailKey = "userEmail"

// Authenticate validates the JWT bearer token in the Authorization header
func Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			return
		}

		claims, err := auth.ParseAccessToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		c.Set(UserIDKey, claims.UserID)
		c.Set(UserRoleKey, claims.Role)
		c.Set(UserEmailKey, claims.Email)
		c.Next()
	}
}

// RequireRoles restricts access to users with specific roles
func RequireRoles(roles ...string) gin.HandlerFunc {
	roleSet := make(map[string]bool, len(roles))
	for _, r := range roles {
		roleSet[r] = true
	}

	return func(c *gin.Context) {
		role, _ := c.Get(UserRoleKey)
		if role == nil || !roleSet[role.(string)] {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			return
		}
		c.Next()
	}
}

// GetUserID retrieves the authenticated user's ID from context
func GetUserID(c *gin.Context) string {
	id, _ := c.Get(UserIDKey)
	if id == nil {
		return ""
	}
	return id.(string)
}

// GetUserRole retrieves the authenticated user's role from context
func GetUserRole(c *gin.Context) string {
	role, _ := c.Get(UserRoleKey)
	if role == nil {
		return ""
	}
	return role.(string)
}
