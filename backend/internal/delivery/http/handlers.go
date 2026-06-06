package http

import (
	"context"
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"school-management/backend/internal/auth"
	"school-management/backend/internal/middleware"
	"school-management/backend/internal/domain"
	"school-management/backend/internal/usecase"
)

type AuthHandler struct {
	svc      *usecase.AuthService
	denylist *auth.TokenDenylist
}

func NewAuthHandler(svc *usecase.AuthService, denylist *auth.TokenDenylist) *AuthHandler {
	return &AuthHandler{svc: svc, denylist: denylist}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input usecase.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user, err := h.svc.Login(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	accessToken, err := auth.GenerateAccessToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}
	refreshToken, _, err := auth.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          user,
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input usecase.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user, err := h.svc.Register(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Registration successful. Please verify your email.", "user_id": user.ID})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var body struct{ Email string `json:"email" binding:"required,email"` }
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Token returned here; in production, send via email
	_, _ = h.svc.ForgotPassword(c.Request.Context(), body.Email)
	c.JSON(http.StatusOK, gin.H{"message": "If an account exists, a reset link has been sent."})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var body struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.ResetPassword(c.Request.Context(), body.Token, body.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Password reset successful"})
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var body struct{ Token string `json:"token" binding:"required"` }
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.VerifyEmail(c.Request.Context(), body.Token); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Email verified successfully"})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var body struct{ RefreshToken string `json:"refresh_token" binding:"required"` }
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	claims, err := auth.ParseRefreshToken(body.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}
	if h.denylist.IsRevoked(c.Request.Context(), claims.JTI) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token has been revoked"})
		return
	}
	user, err := h.svc.GetUserByID(c.Request.Context(), claims.UserID)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}
	accessToken, err := auth.GenerateAccessToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"access_token": accessToken})
}

// Logout revokes the supplied refresh token so it can no longer be used to mint
// new access tokens. Access tokens are short-lived and stateless, so they are
// allowed to expire naturally. Idempotent: invalid/expired tokens still return
// 200 so the client can clear local state.
func (h *AuthHandler) Logout(c *gin.Context) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.ShouldBindJSON(&body)
	if body.RefreshToken != "" {
		if claims, err := auth.ParseRefreshToken(body.RefreshToken); err == nil {
			_ = h.denylist.Revoke(c.Request.Context(), claims.JTI, claims.ExpiresAt)
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	user, err := h.svc.GetUserByID(c.Request.Context(), userID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	var body struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Phone     string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID := middleware.GetUserID(c)
	user, err := h.svc.GetUserByID(c.Request.Context(), userID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if body.FirstName != "" {
		user.FirstName = body.FirstName
	}
	if body.LastName != "" {
		user.LastName = body.LastName
	}
	if body.Phone != "" {
		user.Phone = &body.Phone
	}
	if err := h.svc.UpdateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully", "user": user})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var body struct {
		// Accept both naming conventions from the frontend.
		CurrentPassword string `json:"current_password"`
		OldPassword     string `json:"old_password"`
		NewPassword     string `json:"new_password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Prefer current_password; fall back to old_password.
	oldPw := body.CurrentPassword
	if oldPw == "" {
		oldPw = body.OldPassword
	}
	if oldPw == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "current_password is required"})
		return
	}
	userID := middleware.GetUserID(c)
	if err := h.svc.ChangePassword(c.Request.Context(), userID, oldPw, body.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// ─── Student Handler ──────────────────────────────────────────────────────────

type StudentHandler struct{ svc *usecase.StudentService }

func NewStudentHandler(svc *usecase.StudentService) *StudentHandler { return &StudentHandler{svc: svc} }

func (h *StudentHandler) List(c *gin.Context) {
	var p domain.PaginationParams
	c.ShouldBindQuery(&p)
	result, err := h.svc.List(c.Request.Context(), p)
	respondOrError(c, result, err)
}

func (h *StudentHandler) GetByID(c *gin.Context) {
	student, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	respondOrError(c, student, err)
}

func (h *StudentHandler) MyProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	student, err := h.svc.GetByUserID(c.Request.Context(), userID)
	respondOrError(c, student, err)
}

func (h *StudentHandler) Create(c *gin.Context) {
	var input usecase.CreateStudentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	student, err := h.svc.Create(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, student)
}

func (h *StudentHandler) Update(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	student, err := h.svc.Update(c.Request.Context(), c.Param("id"), body)
	respondOrError(c, student, err)
}

func (h *StudentHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Student deleted"})
}

func (h *StudentHandler) ListByTeacher(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var p domain.PaginationParams
	c.ShouldBindQuery(&p)
	p.Normalize()
	// Use teacher's user ID as a filter — the service can query students in teacher's grades
	result, err := h.svc.ListByTeacher(c.Request.Context(), userID, p)
	respondOrError(c, result, err)
}

// ─── Teacher Handler ──────────────────────────────────────────────────────────

type TeacherHandler struct{ svc *usecase.TeacherService }

func NewTeacherHandler(svc *usecase.TeacherService) *TeacherHandler { return &TeacherHandler{svc: svc} }

func (h *TeacherHandler) List(c *gin.Context) {
	var p domain.PaginationParams
	c.ShouldBindQuery(&p)
	result, err := h.svc.List(c.Request.Context(), p)
	respondOrError(c, result, err)
}

func (h *TeacherHandler) GetByID(c *gin.Context) {
	t, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	respondOrError(c, t, err)
}

func (h *TeacherHandler) MyProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	t, err := h.svc.GetByUserID(c.Request.Context(), userID)
	respondOrError(c, t, err)
}

func (h *TeacherHandler) Create(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	t, err := h.svc.Create(c.Request.Context(), body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, t)
}

func (h *TeacherHandler) Update(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	t, err := h.svc.Update(c.Request.Context(), c.Param("id"), body)
	respondOrError(c, t, err)
}

func (h *TeacherHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Teacher deleted"})
}

// ─── Parent Handler ───────────────────────────────────────────────────────────

type ParentHandler struct{ svc *usecase.ParentService }

func NewParentHandler(svc *usecase.ParentService) *ParentHandler { return &ParentHandler{svc: svc} }

func (h *ParentHandler) List(c *gin.Context) {
	var p domain.PaginationParams
	c.ShouldBindQuery(&p)
	result, err := h.svc.List(c.Request.Context(), p)
	respondOrError(c, result, err)
}

func (h *ParentHandler) GetByID(c *gin.Context) {
	pa, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	respondOrError(c, pa, err)
}

func (h *ParentHandler) Create(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pa, err := h.svc.Create(c.Request.Context(), body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, pa)
}

func (h *ParentHandler) Update(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pa, err := h.svc.Update(c.Request.Context(), c.Param("id"), body)
	respondOrError(c, pa, err)
}

func (h *ParentHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Parent deleted"})
}

func (h *ParentHandler) MyChildren(c *gin.Context) {
	userID := middleware.GetUserID(c)
	parent, err := h.svc.GetByUserID(c.Request.Context(), userID)
	if err != nil || parent == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "parent not found"})
		return
	}
	children, err := h.svc.GetChildren(c.Request.Context(), parent.ID)
	respondOrError(c, children, err)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// guardParentOwnsStudent enforces that the authenticated parent is actually
// linked (via parent_students) to the student referenced by the :studentId URL
// param. It writes the appropriate error response and returns false when access
// must be denied, so callers can `if !guardParentOwnsStudent(...) { return }`.
//
// Admins are allowed through unconditionally (they may legitimately inspect any
// student). Any other role, or a parent with no link to the student, gets 403.
func guardParentOwnsStudent(c *gin.Context, db *sql.DB, studentID string) bool {
	role := middleware.GetUserRole(c)
	if role == "admin" {
		return true
	}
	if role != "parent" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return false
	}

	parentUserID := middleware.GetUserID(c)
	if !parentOwnsStudent(c.Request.Context(), db, parentUserID, studentID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this student's records"})
		return false
	}
	return true
}

// parentOwnsStudent reports whether a parent (identified by their user_id) is
// linked to a given student (students.id) through the parent_students table.
func parentOwnsStudent(ctx context.Context, db *sql.DB, parentUserID, studentID string) bool {
	if parentUserID == "" || studentID == "" {
		return false
	}
	var exists bool
	err := db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM parent_students ps
			JOIN parents p ON p.id = ps.parent_id
			WHERE p.user_id = $1 AND ps.student_id = $2
		)
	`, parentUserID, studentID).Scan(&exists)
	return err == nil && exists
}

func respondOrError(c *gin.Context, data interface{}, err error) {
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if data == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, data)
}
