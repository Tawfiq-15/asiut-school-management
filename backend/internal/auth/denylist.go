package auth

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// TokenDenylist tracks revoked refresh-token IDs (jti) so that a logged-out
// refresh token can no longer be used to mint new access tokens. It is backed
// by Redis with a TTL equal to the remaining lifetime of the token, so entries
// expire on their own and the set never grows unbounded.
//
// When Redis is unavailable (rdb == nil) the denylist degrades to a no-op:
// logout still succeeds client-side, but server-side revocation is skipped.
// This mirrors the rest of the codebase, which treats Redis as optional.
type TokenDenylist struct {
	rdb *redis.Client
}

func NewTokenDenylist(rdb *redis.Client) *TokenDenylist {
	return &TokenDenylist{rdb: rdb}
}

const denylistPrefix = "revoked_refresh:"

// Revoke records a refresh token's jti as revoked until its natural expiry.
func (d *TokenDenylist) Revoke(ctx context.Context, jti string, exp time.Time) error {
	if d == nil || d.rdb == nil || jti == "" {
		return nil
	}
	ttl := time.Until(exp)
	if ttl <= 0 {
		return nil // already expired; nothing to revoke.
	}
	return d.rdb.Set(ctx, denylistPrefix+jti, "1", ttl).Err()
}

// IsRevoked reports whether a refresh token's jti has been revoked. On Redis
// error it fails open (returns false) to avoid locking everyone out if the
// cache hiccups — the token's own expiry remains the backstop.
func (d *TokenDenylist) IsRevoked(ctx context.Context, jti string) bool {
	if d == nil || d.rdb == nil || jti == "" {
		return false
	}
	n, err := d.rdb.Exists(ctx, denylistPrefix+jti).Result()
	if err != nil {
		return false
	}
	return n > 0
}
