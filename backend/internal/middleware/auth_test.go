package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"school-management/backend/internal/auth"
)

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)
	os.Setenv("JWT_SECRET", "test-secret-that-is-long-enough-1234567890")
	os.Exit(m.Run())
}

func newRouter() *gin.Engine {
	r := gin.New()
	return r
}

func TestAuthenticateRejectsMissingHeader(t *testing.T) {
	r := newRouter()
	r.GET("/x", Authenticate(), func(c *gin.Context) { c.Status(200) })

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/x", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuthenticateRejectsBadScheme(t *testing.T) {
	r := newRouter()
	r.GET("/x", Authenticate(), func(c *gin.Context) { c.Status(200) })

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/x", nil)
	req.Header.Set("Authorization", "Token abc")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAuthenticateAcceptsValidToken(t *testing.T) {
	tok, _ := auth.GenerateAccessToken("u1", "a@b.com", "teacher")
	r := newRouter()
	r.GET("/x", Authenticate(), func(c *gin.Context) {
		c.JSON(200, gin.H{"role": GetUserRole(c), "uid": GetUserID(c)})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/x", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d (%s)", w.Code, w.Body.String())
	}
}

func TestRequireRoles(t *testing.T) {
	cases := []struct {
		name      string
		tokenRole string
		allowed   []string
		wantCode  int
	}{
		{"admin allowed", "admin", []string{"admin"}, 200},
		{"teacher denied admin route", "teacher", []string{"admin"}, 403},
		{"admin allowed on teacher route", "admin", []string{"admin", "teacher"}, 200},
		{"parent denied", "parent", []string{"admin", "teacher"}, 403},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			tok, _ := auth.GenerateAccessToken("u1", "a@b.com", tc.tokenRole)
			r := newRouter()
			r.GET("/x", Authenticate(), RequireRoles(tc.allowed...), func(c *gin.Context) { c.Status(200) })

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/x", nil)
			req.Header.Set("Authorization", "Bearer "+tok)
			r.ServeHTTP(w, req)

			if w.Code != tc.wantCode {
				t.Fatalf("got %d, want %d", w.Code, tc.wantCode)
			}
		})
	}
}
