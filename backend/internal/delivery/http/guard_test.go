package http

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"school-management/backend/internal/middleware"
)

func init() { gin.SetMode(gin.TestMode) }

// ctxWithRole builds a gin context carrying an authenticated role/user, as the
// auth middleware would, for unit-testing the parent ownership guard.
func ctxWithRole(role, userID string) (*gin.Context, *httptest.ResponseRecorder) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("GET", "/parent/children/s1/grades", nil)
	c.Set(middleware.UserRoleKey, role)
	c.Set(middleware.UserIDKey, userID)
	return c, w
}

// Admins bypass the ownership check entirely (and so never touch the DB) — we
// can pass a nil *sql.DB safely to prove the short-circuit.
func TestGuardAllowsAdminWithoutDB(t *testing.T) {
	c, _ := ctxWithRole("admin", "admin-1")
	if !guardParentOwnsStudent(c, nil, "s1") {
		t.Fatal("admin should be allowed through")
	}
}

// A non-parent, non-admin role is rejected before any DB access.
func TestGuardRejectsNonParentRole(t *testing.T) {
	c, w := ctxWithRole("teacher", "t-1")
	if guardParentOwnsStudent(c, nil, "s1") {
		t.Fatal("teacher must not access parent endpoint")
	}
	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", w.Code)
	}
}

func TestParentOwnsStudentEmptyArgs(t *testing.T) {
	if parentOwnsStudent(nil, nil, "", "s1") {
		t.Fatal("empty parent id must not be considered an owner")
	}
	if parentOwnsStudent(nil, nil, "p1", "") {
		t.Fatal("empty student id must not be considered an owner")
	}
}
