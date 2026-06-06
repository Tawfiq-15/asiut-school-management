package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

const devFallbackSecret = "change-me-in-production"

// knownWeakSecrets are values that must never be used to sign tokens in
// production — they have appeared in committed .env files / examples.
var knownWeakSecrets = map[string]bool{
	devFallbackSecret: true,
	"edumanage_super_secret_jwt_key_2025_change_in_production": true,
	"your_super_secret_jwt_key_change_in_production":           true,
	"secret":  true,
	"changeme": true,
}

// ValidateSecret enforces JWT_SECRET hygiene. In production an empty, weak, or
// short secret is a hard error; in development we tolerate the fallback but the
// caller is expected to warn loudly. Returns nil when the secret is acceptable.
func ValidateSecret(isProduction bool) error {
	secret := os.Getenv("JWT_SECRET")

	if !isProduction {
		return nil // dev: jwtSecret() supplies a fallback; caller warns.
	}

	if strings.TrimSpace(secret) == "" {
		return errors.New("JWT_SECRET must be set in production")
	}
	if knownWeakSecrets[secret] {
		return errors.New("JWT_SECRET is a known weak/placeholder value; set a unique strong secret")
	}
	if len(secret) < 32 {
		return fmt.Errorf("JWT_SECRET must be at least 32 characters (got %d)", len(secret))
	}
	return nil
}

// UsingDevFallbackSecret reports whether token signing will fall back to the
// insecure development default (i.e. JWT_SECRET is unset). Used to emit a
// startup warning in development.
func UsingDevFallbackSecret() bool {
	return strings.TrimSpace(os.Getenv("JWT_SECRET")) == ""
}

func jwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = devFallbackSecret
	}
	return []byte(secret)
}

// newJTI returns a random token identifier used to make refresh tokens
// individually revocable via the denylist.
func newJTI() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		// rand.Read failing is catastrophic; fall back to a timestamp so we
		// never sign a token with an empty jti.
		return fmt.Sprintf("t-%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

// GenerateAccessToken creates a short-lived access token (15 min default)
func GenerateAccessToken(userID, email, role string) (string, error) {
	expiry := 15 * time.Minute
	if d := os.Getenv("JWT_ACCESS_EXPIRY"); d != "" {
		if parsed, err := time.ParseDuration(d); err == nil {
			expiry = parsed
		}
	}

	claims := &Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret())
}

// RefreshClaims is the parsed content of a refresh token.
type RefreshClaims struct {
	UserID    string
	JTI       string
	ExpiresAt time.Time
}

// GenerateRefreshToken creates a long-lived refresh token (7d default). It
// returns the signed token plus the generated claims (notably the jti, which
// callers persist so the token can later be revoked via a denylist).
func GenerateRefreshToken(userID string) (string, RefreshClaims, error) {
	expiry := 7 * 24 * time.Hour
	if d := os.Getenv("JWT_REFRESH_EXPIRY"); d != "" {
		if parsed, err := time.ParseDuration(d); err == nil {
			expiry = parsed
		}
	}

	exp := time.Now().Add(expiry)
	jti := newJTI()
	claims := &jwt.RegisteredClaims{
		Subject:   userID,
		ID:        jti,
		ExpiresAt: jwt.NewNumericDate(exp),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(jwtSecret())
	if err != nil {
		return "", RefreshClaims{}, err
	}
	return signed, RefreshClaims{UserID: userID, JTI: jti, ExpiresAt: exp}, nil
}

// ParseAccessToken validates and parses an access token
func ParseAccessToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret(), nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("invalid token")
}

// ParseRefreshToken validates a refresh token and returns its claims (subject,
// jti and expiry). The jti lets callers check the revocation denylist.
func ParseRefreshToken(tokenStr string) (RefreshClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &jwt.RegisteredClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret(), nil
	})
	if err != nil {
		return RefreshClaims{}, err
	}

	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		rc := RefreshClaims{UserID: claims.Subject, JTI: claims.ID}
		if claims.ExpiresAt != nil {
			rc.ExpiresAt = claims.ExpiresAt.Time
		}
		return rc, nil
	}
	return RefreshClaims{}, errors.New("invalid refresh token")
}
