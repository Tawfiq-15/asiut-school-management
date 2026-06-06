package http

import (
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"school-management/backend/pkg/email"
)

type PublicHandler struct {
	db *sql.DB
}

func NewPublicHandler(db *sql.DB) *PublicHandler {
	return &PublicHandler{db: db}
}

func (h *PublicHandler) Contact(c *gin.Context) {
	var input struct {
		Name    string `json:"name" binding:"required"`
		Email   string `json:"email" binding:"required,email"`
		Subject string `json:"subject" binding:"required"`
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data"})
		return
	}

	// Persist the message so it is never lost even if email delivery fails.
	if _, err := h.db.ExecContext(c.Request.Context(), `
		INSERT INTO contact_messages (name, email, subject, message)
		VALUES ($1, $2, $3, $4)
	`, input.Name, input.Email, input.Subject, input.Message); err != nil {
		slog.Error("failed to persist contact message", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not submit your message. Please try again."})
		return
	}

	// Notify the school inbox. Email failure must not fail the request — the
	// message is already saved — so we send asynchronously and log errors.
	inbox := os.Getenv("CONTACT_INBOX")
	if inbox == "" {
		inbox = os.Getenv("SMTP_USER")
	}
	if inbox != "" {
		body := fmt.Sprintf(
			"New contact form submission:\n\nName: %s\nEmail: %s\nSubject: %s\n\nMessage:\n%s",
			input.Name, input.Email, input.Subject, input.Message,
		)
		go func() {
			if err := email.Send(inbox, "[Contact] "+input.Subject, body); err != nil {
				slog.Warn("contact notification email failed", "error", err)
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Message received successfully",
		"status":  "success",
	})
}
