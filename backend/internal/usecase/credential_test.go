package usecase

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestGenerateTempPasswordIsRandom(t *testing.T) {
	a := GenerateTempPassword()
	b := GenerateTempPassword()
	if a == b {
		t.Fatal("expected distinct passwords")
	}
	if len(a) < 12 {
		t.Fatalf("password too short: %q", a)
	}
}

func TestResolveCredentialGeneratesWhenEmpty(t *testing.T) {
	hash, plaintext, mustChange, err := resolveCredential("")
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	if plaintext == "" {
		t.Fatal("expected a generated plaintext password")
	}
	if !mustChange {
		t.Fatal("expected mustChange=true for generated password")
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(plaintext)) != nil {
		t.Fatal("hash does not match generated plaintext")
	}
}

func TestResolveCredentialUsesSupplied(t *testing.T) {
	hash, plaintext, mustChange, err := resolveCredential("MyPassw0rd!")
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	if plaintext != "" {
		t.Fatal("supplied password must not be echoed back as generated")
	}
	if mustChange {
		t.Fatal("supplied password should not force a change")
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte("MyPassw0rd!")) != nil {
		t.Fatal("hash does not match supplied password")
	}
}
