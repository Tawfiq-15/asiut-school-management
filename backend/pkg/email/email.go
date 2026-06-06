// Package email provides SMTP email delivery.
//
// Environment variables:
//
//	SMTP_HOST     – smtp.gmail.com
//	SMTP_PORT     – 587 (STARTTLS, default) | 465 (implicit TLS)
//	SMTP_USER     – full Gmail address
//	SMTP_PASSWORD – 16-char Gmail App Password (no spaces)
//	SMTP_FROM     – "Display Name <address@gmail.com>"
//
// Mock mode: set SMTP_PASSWORD=mock to print emails to stdout without sending.
package email

import (
	"bytes"
	"crypto/tls"
	"errors"
	"fmt"
	"html"
	"mime/quotedprintable"
	"net"
	"net/smtp"
	"os"
	"strings"
	"time"
)

// ErrNotConfigured is returned when SMTP_HOST is empty.
var ErrNotConfigured = errors.New("SMTP not configured — set SMTP_HOST in .env")

// Send delivers a plain-text + HTML email to `to`.
func Send(to, subject, body string) error {
	cfg := loadConfig()
	if cfg.host == "" {
		return ErrNotConfigured
	}

	// Mock mode: print to stdout, don't actually send.
	if cfg.password == "mock" {
		fmt.Printf("\n[EMAIL MOCK] To: %s | Subject: %s\n%s\n", to, subject, body)
		return nil
	}

	raw, err := buildMessage(cfg.from, to, subject, body)
	if err != nil {
		return fmt.Errorf("build email: %w", err)
	}

	if cfg.port == "465" {
		return sendTLS(cfg, to, raw)
	}
	return sendSTARTTLS(cfg, to, raw)
}

// ─── STARTTLS (port 587) ──────────────────────────────────────────────────────

func sendSTARTTLS(cfg smtpConfig, to string, raw []byte) error {
	addr := cfg.host + ":587"
	auth := smtp.PlainAuth("", cfg.user, cfg.password, cfg.host)
	if err := smtp.SendMail(addr, auth, cfg.fromAddr, []string{to}, raw); err != nil {
		return fmt.Errorf("smtp send: %w", err)
	}
	return nil
}

// ─── Implicit TLS (port 465) ──────────────────────────────────────────────────

func sendTLS(cfg smtpConfig, to string, raw []byte) error {
	tlsCfg := &tls.Config{ServerName: cfg.host}
	conn, err := tls.Dial("tcp", cfg.host+":465", tlsCfg)
	if err != nil {
		return fmt.Errorf("tls dial: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, cfg.host)
	if err != nil {
		return fmt.Errorf("smtp client: %w", err)
	}
	defer client.Close()

	auth := smtp.PlainAuth("", cfg.user, cfg.password, cfg.host)
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("smtp auth: %w", err)
	}
	if err := client.Mail(cfg.fromAddr); err != nil {
		return fmt.Errorf("smtp MAIL FROM: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("smtp RCPT TO: %w", err)
	}
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp DATA: %w", err)
	}
	if _, err := w.Write(raw); err != nil {
		return fmt.Errorf("smtp write: %w", err)
	}
	w.Close()
	return client.Quit()
}

// ─── Config ───────────────────────────────────────────────────────────────────

type smtpConfig struct {
	host, port, user, password, from, fromAddr string
}

func loadConfig() smtpConfig {
	host     := os.Getenv("SMTP_HOST")
	port     := os.Getenv("SMTP_PORT")
	user     := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASSWORD")
	from     := os.Getenv("SMTP_FROM")

	if port == "" {
		port = "587"
	}
	if from == "" {
		from = user
	}
	fromAddr := from
	if i := strings.Index(from, "<"); i >= 0 {
		fromAddr = strings.Trim(from[i:], "<> ")
	}
	return smtpConfig{host: host, port: port, user: user, password: password, from: from, fromAddr: fromAddr}
}

// TestConnection dials the SMTP server and returns a human-readable result.
// Call from a /health or diagnostic endpoint to verify credentials.
func TestConnection() string {
	cfg := loadConfig()
	if cfg.host == "" {
		return "SMTP_HOST not configured"
	}
	if cfg.password == "mock" {
		return "SMTP is in mock mode — emails are printed to stdout"
	}

	addr := cfg.host + ":" + cfg.port
	conn, err := net.DialTimeout("tcp", addr, 5*time.Second)
	if err != nil {
		return fmt.Sprintf("cannot reach %s: %v", addr, err)
	}
	conn.Close()
	return fmt.Sprintf("TCP connection to %s OK — credentials not verified here (send a test email to check auth)", addr)
}

// ─── Message builder ──────────────────────────────────────────────────────────

func buildMessage(from, to, subject, body string) ([]byte, error) {
	const boundary = "====schoolmgmt===="
	var b bytes.Buffer

	b.WriteString("From: " + from + "\r\n")
	b.WriteString("To: " + to + "\r\n")
	b.WriteString("Subject: " + subject + "\r\n")
	b.WriteString("Date: " + time.Now().Format(time.RFC1123Z) + "\r\n")
	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString(`Content-Type: multipart/alternative; boundary="` + boundary + `"` + "\r\n\r\n")

	// Plain text
	b.WriteString("--" + boundary + "\r\n")
	b.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	b.WriteString("Content-Transfer-Encoding: quoted-printable\r\n\r\n")
	qp := quotedprintable.NewWriter(&b)
	qp.Write([]byte(body))
	qp.Close()
	b.WriteString("\r\n")

	// HTML
	b.WriteString("--" + boundary + "\r\n")
	b.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	b.WriteString("Content-Transfer-Encoding: quoted-printable\r\n\r\n")
	qpH := quotedprintable.NewWriter(&b)
	qpH.Write([]byte(plainToHTML(body)))
	qpH.Close()
	b.WriteString("\r\n")

	b.WriteString("--" + boundary + "--\r\n")
	return b.Bytes(), nil
}

func plainToHTML(text string) string {
	escaped := html.EscapeString(text)
	escaped = strings.ReplaceAll(escaped, "\r\n", "<br>")
	escaped = strings.ReplaceAll(escaped, "\n", "<br>")
	return fmt.Sprintf(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
<table width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;max-width:600px;">
<tr><td style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:20px;">Assiut Metals Technical School</h1></td></tr>
<tr><td style="padding:32px;">
  <p style="color:#0f172a;font-size:15px;line-height:1.8;margin:0;">%s</p></td></tr>
<tr><td style="padding:16px 32px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
  <p style="color:#94a3b8;font-size:12px;margin:0;">This message was sent from the School Management System.</p>
</td></tr></table></td></tr></table></body></html>`, escaped)
}
