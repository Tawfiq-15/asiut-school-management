package auth

import (
	"context"
	"testing"
	"time"
)

// With a nil Redis client the denylist must degrade gracefully: Revoke is a
// no-op and IsRevoked always reports false, so auth keeps working without cache.
func TestDenylistNilRedisIsNoOp(t *testing.T) {
	d := NewTokenDenylist(nil)
	if err := d.Revoke(context.Background(), "jti-1", time.Now().Add(time.Hour)); err != nil {
		t.Fatalf("Revoke with nil redis should not error: %v", err)
	}
	if d.IsRevoked(context.Background(), "jti-1") {
		t.Fatal("IsRevoked must be false when redis is unavailable")
	}
}

func TestDenylistEmptyJTI(t *testing.T) {
	d := NewTokenDenylist(nil)
	if d.IsRevoked(context.Background(), "") {
		t.Fatal("empty jti should never be considered revoked")
	}
}
