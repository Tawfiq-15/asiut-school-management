package http

import (
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"school-management/backend/internal/middleware"
	"school-management/backend/internal/domain"
	"school-management/backend/internal/usecase"
)

// ─── Announcement Handler ─────────────────────────────────────────────────────

type AnnouncementHandler struct{ svc *usecase.AnnouncementService }

func NewAnnouncementHandler(svc *usecase.AnnouncementService) *AnnouncementHandler {
	return &AnnouncementHandler{svc: svc}
}

func (h *AnnouncementHandler) List(c *gin.Context) {
	role := middleware.GetUserRole(c)
	list, err := h.svc.List(c.Request.Context(), role)
	respondOrError(c, list, err)
}

func (h *AnnouncementHandler) ListPublic(c *gin.Context) {
	list, err := h.svc.List(c.Request.Context(), "")
	respondOrError(c, list, err)
}

func (h *AnnouncementHandler) GetByID(c *gin.Context) {
	a, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	respondOrError(c, a, err)
}

func (h *AnnouncementHandler) Create(c *gin.Context) {
	var a domain.Announcement
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	a.AuthorID = middleware.GetUserID(c)
	if len(a.TargetRoles) == 0 {
		a.TargetRoles = []string{"admin", "teacher", "student", "parent"}
	}
	if err := h.svc.Create(c.Request.Context(), &a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, a)
}

func (h *AnnouncementHandler) Update(c *gin.Context) {
	var a domain.Announcement
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	a.ID = c.Param("id")

	existing, err := h.svc.GetByID(c.Request.Context(), a.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}

	role := middleware.GetUserRole(c)
	userID := middleware.GetUserID(c)
	if role != "admin" && existing.AuthorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to update this announcement"})
		return
	}

	a.AuthorID = existing.AuthorID
	respondOrError(c, &a, h.svc.Update(c.Request.Context(), &a))
}

func (h *AnnouncementHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Announcement deleted"})
}

// ─── Notification Handler ─────────────────────────────────────────────────────

type NotificationHandler struct{ svc *usecase.NotificationService }

func NewNotificationHandler(svc *usecase.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

func (h *NotificationHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	list, err := h.svc.List(c.Request.Context(), userID)
	respondOrError(c, list, err)
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if err := h.svc.MarkRead(c.Request.Context(), c.Param("id"), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Marked as read"})
}

func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if err := h.svc.MarkAllRead(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

// ─── Message Handler ──────────────────────────────────────────────────────────

type MessageHandler struct{ svc *usecase.MessageService }

func NewMessageHandler(svc *usecase.MessageService) *MessageHandler {
	return &MessageHandler{svc: svc}
}

func (h *MessageHandler) GetThread(c *gin.Context) {
	userID := middleware.GetUserID(c)
	other := c.Param("userId")
	msgs, err := h.svc.GetThread(c.Request.Context(), userID, other)
	respondOrError(c, msgs, err)
}

func (h *MessageHandler) Send(c *gin.Context) {
	var body struct {
		ReceiverID string `json:"receiver_id" binding:"required"`
		Content    string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	msg := &domain.Message{
		SenderID:   middleware.GetUserID(c),
		ReceiverID: body.ReceiverID,
		Content:    body.Content,
	}
	if err := h.svc.Send(c.Request.Context(), msg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, msg)
}

func (h *MessageHandler) ListConversations(c *gin.Context) {
	userID := middleware.GetUserID(c)
	list, err := h.svc.ListConversations(c.Request.Context(), userID)
	respondOrError(c, list, err)
}

// ─── Payment Handler ──────────────────────────────────────────────────────────

type PaymentHandler struct{ svc *usecase.PaymentService }

func NewPaymentHandler(svc *usecase.PaymentService) *PaymentHandler {
	return &PaymentHandler{svc: svc}
}

func (h *PaymentHandler) List(c *gin.Context) {
	var p domain.PaginationParams
	c.ShouldBindQuery(&p)
	list, total, err := h.svc.List(c.Request.Context(), p)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list, "total": total})
}

func (h *PaymentHandler) MyPayments(c *gin.Context) {
	userID := middleware.GetUserID(c)
	// Look up student profile ID from user ID
	var studentID string
	if err := h.svc.DB().QueryRowContext(c.Request.Context(),
		`SELECT id FROM students WHERE user_id = $1`, userID,
	).Scan(&studentID); err != nil {
		c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
		return
	}
	list, err := h.svc.ByStudent(c.Request.Context(), studentID)
	respondOrError(c, list, err)
}

func (h *PaymentHandler) MyChildrenPayments(c *gin.Context) {
	userID := middleware.GetUserID(c)
	// Get all children student IDs via parent_students join
	rows, err := h.svc.DB().QueryContext(c.Request.Context(), `
		SELECT s.id FROM students s
		JOIN parent_students ps ON ps.student_id = s.id
		JOIN parents p ON p.id = ps.parent_id
		WHERE p.user_id = $1
	`, userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
		return
	}
	defer rows.Close()
	var all []interface{}
	for rows.Next() {
		var sid string
		if rows.Scan(&sid) == nil {
			if list, err := h.svc.ByStudent(c.Request.Context(), sid); err == nil {
				for _, p := range list {
					all = append(all, p)
				}
			}
		}
	}
	if all == nil {
		all = []interface{}{}
	}
	c.JSON(http.StatusOK, gin.H{"data": all})
}

func (h *PaymentHandler) GetByID(c *gin.Context) {
	py, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	respondOrError(c, py, err)
}

func (h *PaymentHandler) Create(c *gin.Context) {
	var py domain.Payment
	if err := c.ShouldBindJSON(&py); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Create(c.Request.Context(), &py); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, py)
}

func (h *PaymentHandler) UpdateStatus(c *gin.Context) {
	var body struct{ Status string `json:"status" binding:"required"` }
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.UpdateStatus(c.Request.Context(), c.Param("id"), domain.PaymentStatus(body.Status)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Payment status updated"})
}

// ─── Event Handler ────────────────────────────────────────────────────────────

type EventHandler struct{ svc *usecase.EventService }

func NewEventHandler(svc *usecase.EventService) *EventHandler { return &EventHandler{svc: svc} }

func (h *EventHandler) List(c *gin.Context) {
	publicOnly := middleware.GetUserID(c) == ""
	events, err := h.svc.List(c.Request.Context(), publicOnly)
	respondOrError(c, events, err)
}

func (h *EventHandler) GetByID(c *gin.Context) {
	e, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	respondOrError(c, e, err)
}

func (h *EventHandler) Create(c *gin.Context) {
	var e domain.Event
	if err := c.ShouldBindJSON(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID := middleware.GetUserID(c)
	e.CreatedBy = &userID
	if err := h.svc.Create(c.Request.Context(), &e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, e)
}

func (h *EventHandler) Update(c *gin.Context) {
	var e domain.Event
	if err := c.ShouldBindJSON(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	e.ID = c.Param("id")
	respondOrError(c, &e, h.svc.Update(c.Request.Context(), &e))
}

func (h *EventHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event deleted"})
}

// ─── Admission Handler ────────────────────────────────────────────────────────

type AdmissionHandler struct{ svc *usecase.AdmissionService }

func NewAdmissionHandler(svc *usecase.AdmissionService) *AdmissionHandler {
	return &AdmissionHandler{svc: svc}
}

func (h *AdmissionHandler) List(c *gin.Context) {
	var p domain.PaginationParams
	c.ShouldBindQuery(&p)
	list, total, err := h.svc.List(c.Request.Context(), p)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list, "total": total})
}

func (h *AdmissionHandler) GetByID(c *gin.Context) {
	a, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	respondOrError(c, a, err)
}

func (h *AdmissionHandler) Create(c *gin.Context) {
	var a domain.Admission
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Create(c.Request.Context(), &a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Application submitted successfully", "id": a.ID})
}

func (h *AdmissionHandler) UpdateStatus(c *gin.Context) {
	var body struct {
		Status string  `json:"status" binding:"required"`
		Notes  *string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	reviewedBy := middleware.GetUserID(c)
	if err := h.svc.UpdateStatus(c.Request.Context(), c.Param("id"), domain.AdmissionStatus(body.Status), reviewedBy, body.Notes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Status updated"})
}

func (h *AdmissionHandler) Communicate(c *gin.Context) {
	var body struct {
		Type    string `json:"type"    binding:"required"`
		Subject string `json:"subject"`
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.svc.Communicate(c.Request.Context(), c.Param("id"), body.Type, body.Subject, body.Message)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Communication processed",
		"data":    result,
	})
}

func (h *AdmissionHandler) Enroll(c *gin.Context) {
	result, err := h.svc.EnrollStudent(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ─── Analytics Handler ────────────────────────────────────────────────────────

type AnalyticsHandler struct{ svc *usecase.AnalyticsService }

func NewAnalyticsHandler(svc *usecase.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc}
}

func (h *AnalyticsHandler) Overview(c *gin.Context) {
	data, err := h.svc.Overview(c.Request.Context())
	respondOrError(c, data, err)
}

func (h *AnalyticsHandler) AttendanceTrend(c *gin.Context) {
	data, err := h.svc.AttendanceTrend(c.Request.Context())
	respondOrError(c, data, err)
}

func (h *AnalyticsHandler) GradeDistribution(c *gin.Context) {
	data, err := h.svc.GradeDistribution(c.Request.Context())
	respondOrError(c, data, err)
}

func (h *AnalyticsHandler) RecentActivity(c *gin.Context) {
	data, err := h.svc.RecentActivity(c.Request.Context(), 15)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// ─── Library Handler ──────────────────────────────────────────────────────────

type LibraryHandler struct{ svc *usecase.LibraryService }

func NewLibraryHandler(svc *usecase.LibraryService) *LibraryHandler {
	return &LibraryHandler{svc: svc}
}

func (h *LibraryHandler) ListBooks(c *gin.Context) {
	books, err := h.svc.ListBooks(c.Request.Context())
	respondOrError(c, books, err)
}

func (h *LibraryHandler) CreateBook(c *gin.Context) {
	var b domain.Book
	if err := c.ShouldBindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.CreateBook(c.Request.Context(), &b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, b)
}

func (h *LibraryHandler) UpdateBook(c *gin.Context) {
	var b domain.Book
	if err := c.ShouldBindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	b.ID = c.Param("id")
	respondOrError(c, &b, h.svc.UpdateBook(c.Request.Context(), &b))
}

func (h *LibraryHandler) DeleteBook(c *gin.Context) {
	if err := h.svc.DeleteBook(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Book deleted"})
}

func (h *LibraryHandler) ListLoans(c *gin.Context) {
	loans, err := h.svc.ListLoans(c.Request.Context())
	respondOrError(c, loans, err)
}

func (h *LibraryHandler) CreateLoan(c *gin.Context) {
	var body struct {
		BookID    string `json:"book_id" binding:"required"`
		StudentID string `json:"student_id" binding:"required"`
		DueDate   string `json:"due_date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.CreateLoan(c.Request.Context(), body.BookID, body.StudentID, body.DueDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Book loaned successfully"})
}

func (h *LibraryHandler) ReturnBook(c *gin.Context) {
	if err := h.svc.ReturnBook(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Book returned"})
}

// ─── Leave Handler ────────────────────────────────────────────────────────────

type LeaveHandler struct{ svc *usecase.LeaveService }

func NewLeaveHandler(svc *usecase.LeaveService) *LeaveHandler { return &LeaveHandler{svc: svc} }

func (h *LeaveHandler) List(c *gin.Context) {
	list, err := h.svc.List(c.Request.Context())
	respondOrError(c, list, err)
}

func (h *LeaveHandler) MyRequests(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var studentID string
	err := h.svc.DB().QueryRowContext(c.Request.Context(),
		`SELECT id FROM students WHERE user_id = $1`, userID,
	).Scan(&studentID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
		return
	}
	list, err := h.svc.ByStudent(c.Request.Context(), studentID)
	respondOrError(c, list, err)
}

func (h *LeaveHandler) Create(c *gin.Context) {
	var lr domain.LeaveRequest
	if err := c.ShouldBindJSON(&lr); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID := middleware.GetUserID(c)
	var studentID string
	err := h.svc.DB().QueryRowContext(c.Request.Context(),
		`SELECT id FROM students WHERE user_id = $1`, userID,
	).Scan(&studentID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "student profile not found"})
		return
	}
	lr.StudentID = studentID
	if err := h.svc.Create(c.Request.Context(), &lr); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, lr)
}

func (h *LeaveHandler) UpdateStatus(c *gin.Context) {
	var body struct{ Status string `json:"status" binding:"required"` }
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	reviewedBy := middleware.GetUserID(c)
	if err := h.svc.UpdateStatus(c.Request.Context(), c.Param("id"), body.Status, reviewedBy); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Leave request updated"})
}

// ─── Upload Handler ───────────────────────────────────────────────────────────

type UploadHandler struct {
	db *sql.DB
}

func NewUploadHandler(db *sql.DB) *UploadHandler { return &UploadHandler{db: db} }

func (h *UploadHandler) UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	isAvatar := c.FullPath() == "/api/v1/me/avatar"

	allowed := false
	if isAvatar {
		allowedExtensions := map[string]bool{
			".png": true, ".jpg": true, ".jpeg": true, ".gif": true,
		}
		allowed = allowedExtensions[ext]
	} else {
		allowedExtensions := map[string]bool{
			".pdf": true, ".ppt": true, ".pptx": true, ".doc": true, ".docx": true,
		}
		allowed = allowedExtensions[ext]
	}

	if !allowed {
		if isAvatar {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Only image files (png, jpg, jpeg, gif) are allowed for avatar"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Only document files (pdf, ppt, pptx, doc, docx) are allowed"})
		}
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	mimeType := "application/octet-stream"
	switch ext {
	case ".pdf":
		mimeType = "application/pdf"
	case ".ppt":
		mimeType = "application/vnd.ms-powerpoint"
	case ".pptx":
		mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	case ".doc":
		mimeType = "application/msword"
	case ".docx":
		mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".png":
		mimeType = "image/png"
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".gif":
		mimeType = "image/gif"
	}

	var id string
	err = h.db.QueryRowContext(c.Request.Context(), `
		INSERT INTO uploaded_files (filename, mime_type, size, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, header.Filename, mimeType, header.Size, fileBytes).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file in database: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":      "/api/v1/public/files/" + id,
		"filename": header.Filename,
		"size":     header.Size,
	})
}

func (h *UploadHandler) UploadAvatar(c *gin.Context) {
	// Upload the image and get its public URL.
	// We capture the response by delegating to UploadFile, then update users.avatar_url.
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only image files (png, jpg, jpeg, gif, webp) are allowed"})
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	mimeType := "image/jpeg"
	switch ext {
	case ".png":  mimeType = "image/png"
	case ".gif":  mimeType = "image/gif"
	case ".webp": mimeType = "image/webp"
	}

	var fileID string
	if err := h.db.QueryRowContext(c.Request.Context(), `
		INSERT INTO uploaded_files (filename, mime_type, size, content)
		VALUES ($1, $2, $3, $4) RETURNING id
	`, header.Filename, mimeType, header.Size, fileBytes).Scan(&fileID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	avatarURL := "/api/v1/public/files/" + fileID

	// Persist avatar URL on the user record.
	userID := middleware.GetUserID(c)
	if _, err := h.db.ExecContext(c.Request.Context(),
		`UPDATE users SET avatar_url=$1, updated_at=NOW() WHERE id=$2`,
		avatarURL, userID,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update avatar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": avatarURL, "filename": header.Filename})
}

func (h *UploadHandler) GetFile(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ID is required"})
		return
	}

	var filename string
	var mimeType string
	var size int64
	var content []byte

	err := h.db.QueryRowContext(c.Request.Context(), `
		SELECT filename, mime_type, size, content
		FROM uploaded_files
		WHERE id = $1
	`, id).Scan(&filename, &mimeType, &size, &content)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Type", mimeType)
	c.Header("Content-Length", fmt.Sprintf("%d", size))
	c.Data(http.StatusOK, mimeType, content)
}

