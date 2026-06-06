package auth

import (
	"os"
	"testing"
	"time"
)

func withSecret(t *testing.T, secret string) {
	t.Helper()
	old := os.Getenv("JWT_SECRET")
	os.Setenv("JWT_SECRET", secret)
	t.Cleanup(func() { os.Setenv("JWT_SECRET", old) })
}

func TestAccessTokenRoundTrip(t *testing.T) {
	withSecret(t, "test-secret-that-is-long-enough-1234567890")

	tok, err := GenerateAccessToken("u1", "a@b.com", "admin")
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	claims, err := ParseAccessToken(tok)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if claims.UserID != "u1" || claims.Email != "a@b.com" || claims.Role != "admin" {
		t.Fatalf("unexpected claims: %+v", claims)
	}
}

func TestAccessTokenRejectsTamper(t *testing.T) {
	withSecret(t, "test-secret-that-is-long-enough-1234567890")
	tok, _ := GenerateAccessToken("u1", "a@b.com", "admin")
	if _, err := ParseAccessToken(tok + "x"); err == nil {
		t.Fatal("expected error for tampered token")
	}
}

func TestAccessTokenRejectsWrongSecret(t *testing.T) {
	withSecret(t, "secret-one-that-is-long-enough-1234567890")
	tok, _ := GenerateAccessToken("u1", "a@b.com", "admin")
	withSecret(t, "secret-two-that-is-long-enough-1234567890")
	if _, err := ParseAccessToken(tok); err == nil {
		t.Fatal("expected error when secret changes")
	}
}

func TestRefreshTokenCarriesJTI(t *testing.T) {
	withSecret(t, "test-secret-that-is-long-enough-1234567890")
	tok, claims, err := GenerateRefreshToken("u1")
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	if claims.JTI == "" {
		t.Fatal("expected non-empty jti")
	}
	parsed, err := ParseRefreshToken(tok)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if parsed.UserID != "u1" {
		t.Fatalf("expected subject u1, got %q", parsed.UserID)
	}
	if parsed.JTI != claims.JTI {
		t.Fatalf("jti mismatch: %q vs %q", parsed.JTI, claims.JTI)
	}
	if parsed.ExpiresAt.Before(time.Now()) {
		t.Fatal("expected future expiry")
	}
}

func TestUniqueJTIs(t *testing.T) {
	withSecret(t, "test-secret-that-is-long-enough-1234567890")
	_, a, _ := GenerateRefreshToken("u1")
	_, b, _ := GenerateRefreshToken("u1")
	if a.JTI == b.JTI {
		t.Fatal("expected unique jti per token")
	}
}

func TestValidateSecret(t *testing.T) {
	cases := []struct {
		name    string
		secret  string
		prod    bool
		wantErr bool
	}{
		{"dev empty ok", "", false, false},
		{"prod empty fails", "", true, true},
		{"prod weak placeholder fails", "change-me-in-production", true, true},
		{"prod short fails", "tooshort", true, true},
		{"prod strong ok", "this-is-a-sufficiently-long-secret-value-123", true, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			withSecret(t, tc.secret)
			err := ValidateSecret(tc.prod)
			if (err != nil) != tc.wantErr {
				t.Fatalf("ValidateSecret(prod=%v) err=%v wantErr=%v", tc.prod, err, tc.wantErr)
			}
		})
	}
}
