package usecase

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	mrand "math/rand" //nolint:gosec // used only for non-security purposes (IDs)
	"net/url"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"school-management/backend/internal/domain"
	"school-management/backend/internal/repository"
	"school-management/backend/pkg/email"
)

// ─── Grade Service ────────────────────────────────────────────────────────────

type GradeService struct{ repo *repository.GradeRepository }

func NewGradeService(r *repository.GradeRepository) *GradeService { return &GradeService{repo: r} }

func (s *GradeService) List(ctx context.Context) ([]*domain.Grade, error) {
	return s.repo.List(ctx)
}
func (s *GradeService) GetByID(ctx context.Context, id string) (*domain.Grade, error) {
	return s.repo.FindByID(ctx, id)
}
func (s *GradeService) Create(ctx context.Context, g *domain.Grade) error {
	return s.repo.Create(ctx, g)
}
func (s *GradeService) Update(ctx context.Context, g *domain.Grade) error {
	return s.repo.Update(ctx, g)
}
func (s *GradeService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
func (s *GradeService) GetByTeacher(ctx context.Context, teacherID string) ([]*domain.Grade, error) {
	return s.repo.FindByTeacher(ctx, teacherID)
}

// ─── Subject Service ──────────────────────────────────────────────────────────

type SubjectService struct{ repo *repository.SubjectRepository }

func NewSubjectService(r *repository.SubjectRepository) *SubjectService { return &SubjectService{repo: r} }

func (s *SubjectService) List(ctx context.Context) ([]*domain.Subject, error) { return s.repo.List(ctx) }
func (s *SubjectService) GetByID(ctx context.Context, id string) (*domain.Subject, error) {
	return s.repo.FindByID(ctx, id)
}
func (s *SubjectService) GetByTeacher(ctx context.Context, tid string) ([]*domain.Subject, error) {
	return s.repo.FindByTeacher(ctx, tid)
}
func (s *SubjectService) Create(ctx context.Context, sub *domain.Subject) error {
	return s.repo.Create(ctx, sub)
}
func (s *SubjectService) Update(ctx context.Context, sub *domain.Subject) error {
	return s.repo.Update(ctx, sub)
}
func (s *SubjectService) Delete(ctx context.Context, id string) error { return s.repo.Delete(ctx, id) }

// ─── Schedule Service ─────────────────────────────────────────────────────────

type ScheduleService struct{ repo *repository.ScheduleRepository }

func NewScheduleService(r *repository.ScheduleRepository) *ScheduleService {
	return &ScheduleService{repo: r}
}

func (s *ScheduleService) DB() *sql.DB { return s.repo.DB() }

func (s *ScheduleService) List(ctx context.Context) ([]*domain.Schedule, error) {
	return s.repo.List(ctx)
}
func (s *ScheduleService) ByTeacher(ctx context.Context, tid string) ([]*domain.Schedule, error) {
	return s.repo.FindByTeacher(ctx, tid)
}
func (s *ScheduleService) ByGrade(ctx context.Context, gid string) ([]*domain.Schedule, error) {
	return s.repo.FindByGrade(ctx, gid)
}
func (s *ScheduleService) Create(ctx context.Context, sc *domain.Schedule) error {
	return s.repo.Create(ctx, sc)
}
func (s *ScheduleService) Update(ctx context.Context, sc *domain.Schedule) error {
	return s.repo.Update(ctx, sc)
}
func (s *ScheduleService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ─── Attendance Service ───────────────────────────────────────────────────────

type AttendanceService struct{ repo *repository.AttendanceRepository }

func NewAttendanceService(r *repository.AttendanceRepository) *AttendanceService {
	return &AttendanceService{repo: r}
}

func (s *AttendanceService) DB() *sql.DB { return s.repo.DB() }

func (s *AttendanceService) BulkMark(ctx context.Context, records []*domain.Attendance) error {
	return s.repo.BulkUpsert(ctx, records)
}
func (s *AttendanceService) ByStudent(ctx context.Context, studentID string, limit int) ([]*domain.Attendance, error) {
	return s.repo.FindByStudent(ctx, studentID, limit)
}
func (s *AttendanceService) Summary(ctx context.Context, studentID string) (int, int, int, error) {
	return s.repo.Summary(ctx, studentID)
}
func (s *AttendanceService) ListAll(ctx context.Context, p domain.PaginationParams) ([]*domain.Attendance, int64, error) {
	return s.repo.ListAll(ctx, p)
}
func (s *AttendanceService) ByTeacherAndDate(ctx context.Context, teacherUserID string, date string, subjectID string) ([]*domain.Attendance, error) {
	return s.repo.FindByTeacherAndDate(ctx, teacherUserID, date, subjectID)
}
func (s *AttendanceService) Update(ctx context.Context, a *domain.Attendance) error {
	return s.repo.Update(ctx, a)
}
func (s *AttendanceService) StudentIDFromUserID(ctx context.Context, userID string) (string, error) {
	return s.repo.StudentIDFromUserID(ctx, userID)
}
func (s *AttendanceService) TeacherIDFromUserID(ctx context.Context, userID string) (string, error) {
	return s.repo.TeacherIDFromUserID(ctx, userID)
}

// ─── Assignment Service ───────────────────────────────────────────────────────

type AssignmentService struct {
	repo             *repository.AssignmentRepository
	announcementRepo *repository.AnnouncementRepository
}

func NewAssignmentService(r *repository.AssignmentRepository, ar *repository.AnnouncementRepository) *AssignmentService {
	return &AssignmentService{repo: r, announcementRepo: ar}
}

func (s *AssignmentService) DB() *sql.DB { return s.repo.DB() }

func (s *AssignmentService) ListAll(ctx context.Context) ([]*domain.Assignment, error) {
	return s.repo.ListAll(ctx)
}
func (s *AssignmentService) ByTeacher(ctx context.Context, tid string) ([]*domain.Assignment, error) {
	return s.repo.ListByTeacher(ctx, tid)
}
func (s *AssignmentService) ByGrade(ctx context.Context, gid string) ([]*domain.Assignment, error) {
	return s.repo.ListByGrade(ctx, gid)
}
func (s *AssignmentService) GetByID(ctx context.Context, id string) (*domain.Assignment, error) {
	return s.repo.FindByID(ctx, id)
}
func (s *AssignmentService) Create(ctx context.Context, a *domain.Assignment) error {
	if err := s.repo.Create(ctx, a); err != nil {
		return err
	}

	// Get subject details to customize targeted notifications
	var gradeID, subjectName string
	err := s.repo.DB().QueryRowContext(ctx, `
		SELECT grade_id, name FROM subjects WHERE id = $1
	`, a.SubjectID).Scan(&gradeID, &subjectName)
	
	if err == nil && gradeID != "" {
		rows, err := s.repo.DB().QueryContext(ctx, `
			SELECT user_id FROM students WHERE grade_id = $1
		`, gradeID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var studentUserID string
				if err := rows.Scan(&studentUserID); err == nil {
					_, _ = s.repo.DB().ExecContext(ctx, `
						INSERT INTO notifications (user_id, title, message, type, link)
						VALUES ($1, $2, $3, 'info', '/student/assignments')
					`, studentUserID, "New Assignment: "+a.Title, "A new assignment has been posted for "+subjectName+". Due date: "+a.DueDate.Format("2006-01-02")+".")
				}
			}
		}
	}

	// Auto-create announcement for students
	announcement := &domain.Announcement{
		AuthorID:    a.TeacherID,
		Title:       "New Assignment: " + a.Title,
		Content:     "A new assignment has been posted. Due date: " + a.DueDate.Format("2006-01-02") + ". Please check your assignments dashboard for details.",
		TargetRoles: []string{"student"},
	}
	_ = s.announcementRepo.Create(ctx, announcement)

	return nil
}
func (s *AssignmentService) Update(ctx context.Context, a *domain.Assignment) error {
	return s.repo.Update(ctx, a)
}
func (s *AssignmentService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
func (s *AssignmentService) ListSubmissions(ctx context.Context, assignmentID string) ([]*domain.Submission, error) {
	return s.repo.ListSubmissions(ctx, assignmentID)
}
func (s *AssignmentService) Submit(ctx context.Context, sub *domain.Submission) error {
	return s.repo.CreateSubmission(ctx, sub)
}
func (s *AssignmentService) GradeSubmission(ctx context.Context, id string, marks float64, feedback string) error {
	return s.repo.GradeSubmission(ctx, id, marks, feedback)
}
func (s *AssignmentService) FindSubmission(ctx context.Context, assignmentID, studentID string) (*domain.Submission, error) {
	return s.repo.FindSubmission(ctx, assignmentID, studentID)
}

// ─── Exam Service ─────────────────────────────────────────────────────────────

type ExamService struct{ repo *repository.ExamRepository }

func NewExamService(r *repository.ExamRepository) *ExamService { return &ExamService{repo: r} }

func (s *ExamService) DB() *sql.DB { return s.repo.DB() }

func (s *ExamService) ListAll(ctx context.Context) ([]*domain.Exam, error) {
	return s.repo.ListAll(ctx)
}
func (s *ExamService) ByTeacher(ctx context.Context, tid string) ([]*domain.Exam, error) {
	return s.repo.ListByTeacher(ctx, tid)
}
func (s *ExamService) ByGrade(ctx context.Context, gid string) ([]*domain.Exam, error) {
	return s.repo.ListByGrade(ctx, gid)
}
func (s *ExamService) Create(ctx context.Context, e *domain.Exam) error { return s.repo.Create(ctx, e) }
func (s *ExamService) Update(ctx context.Context, e *domain.Exam) error { return s.repo.Update(ctx, e) }
func (s *ExamService) Delete(ctx context.Context, id string) error       { return s.repo.Delete(ctx, id) }
func (s *ExamService) ListResults(ctx context.Context, examID string) ([]*domain.ExamResult, error) {
	return s.repo.ListResults(ctx, examID)
}
func (s *ExamService) ResultsByStudent(ctx context.Context, studentID string) ([]*domain.ExamResult, error) {
	return s.repo.FindResultsByStudent(ctx, studentID)
}
func (s *ExamService) BulkSaveResults(ctx context.Context, results []*domain.ExamResult) error {
	return s.repo.BulkSaveResults(ctx, results)
}

// ─── Announcement Service ─────────────────────────────────────────────────────

type AnnouncementService struct{ repo *repository.AnnouncementRepository }

func NewAnnouncementService(r *repository.AnnouncementRepository) *AnnouncementService {
	return &AnnouncementService{repo: r}
}

func (s *AnnouncementService) List(ctx context.Context, role string) ([]*domain.Announcement, error) {
	return s.repo.List(ctx, role)
}
func (s *AnnouncementService) GetByID(ctx context.Context, id string) (*domain.Announcement, error) {
	return s.repo.FindByID(ctx, id)
}
func (s *AnnouncementService) Create(ctx context.Context, a *domain.Announcement) error {
	return s.repo.Create(ctx, a)
}
func (s *AnnouncementService) Update(ctx context.Context, a *domain.Announcement) error {
	return s.repo.Update(ctx, a)
}
func (s *AnnouncementService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// ─── Notification Service ─────────────────────────────────────────────────────

type NotificationService struct{ repo *repository.NotificationRepository }

func NewNotificationService(r *repository.NotificationRepository) *NotificationService {
	return &NotificationService{repo: r}
}

func (s *NotificationService) List(ctx context.Context, userID string) ([]*domain.Notification, error) {
	return s.repo.ListByUser(ctx, userID)
}
func (s *NotificationService) MarkRead(ctx context.Context, id, userID string) error {
	return s.repo.MarkRead(ctx, id, userID)
}
func (s *NotificationService) MarkAllRead(ctx context.Context, userID string) error {
	return s.repo.MarkAllRead(ctx, userID)
}

// ─── Message Service ──────────────────────────────────────────────────────────

type MessageService struct{ repo *repository.MessageRepository }

func NewMessageService(r *repository.MessageRepository) *MessageService {
	return &MessageService{repo: r}
}

func (s *MessageService) GetThread(ctx context.Context, userA, userB string) ([]*domain.Message, error) {
	return s.repo.GetThread(ctx, userA, userB)
}
func (s *MessageService) Send(ctx context.Context, m *domain.Message) error {
	return s.repo.Send(ctx, m)
}
func (s *MessageService) ListConversations(ctx context.Context, userID string) ([]map[string]interface{}, error) {
	return s.repo.ListConversations(ctx, userID)
}

// ─── Payment Service ──────────────────────────────────────────────────────────

type PaymentService struct{ repo *repository.PaymentRepository }

func NewPaymentService(r *repository.PaymentRepository) *PaymentService {
	return &PaymentService{repo: r}
}

func (s *PaymentService) DB() *sql.DB {
	return s.repo.DB()
}

func (s *PaymentService) List(ctx context.Context, p domain.PaginationParams) ([]*domain.Payment, int64, error) {
	return s.repo.List(ctx, p)
}
func (s *PaymentService) ByStudent(ctx context.Context, studentID string) ([]*domain.Payment, error) {
	return s.repo.FindByStudent(ctx, studentID)
}
func (s *PaymentService) Create(ctx context.Context, py *domain.Payment) error {
	return s.repo.Create(ctx, py)
}
func (s *PaymentService) GetByID(ctx context.Context, id string) (*domain.Payment, error) {
	return s.repo.FindByID(ctx, id)
}
func (s *PaymentService) UpdateStatus(ctx context.Context, id string, status domain.PaymentStatus) error {
	return s.repo.UpdateStatus(ctx, id, status)
}

// ─── Event Service ────────────────────────────────────────────────────────────

type EventService struct{ repo *repository.EventRepository }

func NewEventService(r *repository.EventRepository) *EventService { return &EventService{repo: r} }

func (s *EventService) List(ctx context.Context, publicOnly bool) ([]*domain.Event, error) {
	return s.repo.List(ctx, publicOnly)
}
func (s *EventService) GetByID(ctx context.Context, id string) (*domain.Event, error) {
	return s.repo.FindByID(ctx, id)
}
func (s *EventService) Create(ctx context.Context, e *domain.Event) error { return s.repo.Create(ctx, e) }
func (s *EventService) Update(ctx context.Context, e *domain.Event) error { return s.repo.Update(ctx, e) }
func (s *EventService) Delete(ctx context.Context, id string) error       { return s.repo.Delete(ctx, id) }

// ─── Admission Service ────────────────────────────────────────────────────────

type AdmissionService struct {
	repo        *repository.AdmissionRepository
	userRepo    *repository.UserRepository
	studentRepo *repository.StudentRepository
	gradeRepo   *repository.GradeRepository
}

func NewAdmissionService(r *repository.AdmissionRepository, ur *repository.UserRepository, sr *repository.StudentRepository, gr *repository.GradeRepository) *AdmissionService {
	return &AdmissionService{repo: r, userRepo: ur, studentRepo: sr, gradeRepo: gr}
}

func (s *AdmissionService) List(ctx context.Context, p domain.PaginationParams) ([]*domain.Admission, int64, error) {
	return s.repo.List(ctx, p)
}
func (s *AdmissionService) GetByID(ctx context.Context, id string) (*domain.Admission, error) {
	return s.repo.FindByID(ctx, id)
}
func (s *AdmissionService) Create(ctx context.Context, a *domain.Admission) error {
	existing, err := s.repo.FindByEmail(ctx, a.ParentEmail)
	if err != nil {
		return err
	}
	if existing != nil && existing.Status != domain.AdmissionRejected {
		return fmt.Errorf("an active admission application with this email already exists")
	}

	if err := s.repo.Create(ctx, a); err != nil {
		return err
	}

	// Fetch all admin users to notify them of the new admission application
	rows, err := s.repo.DB().QueryContext(ctx, `
		SELECT id FROM users WHERE role = 'admin'
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var adminUserID string
			if err := rows.Scan(&adminUserID); err == nil {
				applyingGradeStr := ""
				if a.ApplyingGrade != nil {
					applyingGradeStr = *a.ApplyingGrade
				}
				_, _ = s.repo.DB().ExecContext(ctx, `
					INSERT INTO notifications (user_id, title, message, type, link)
					VALUES ($1, $2, $3, 'info', '/admin/admissions')
				`, adminUserID, "New Admission Application", fmt.Sprintf("A new application for %s (Applying for Grade %s) is pending review.", a.StudentName, applyingGradeStr))
			}
		}
	}

	return nil
}
func (s *AdmissionService) UpdateStatus(ctx context.Context, id string, status domain.AdmissionStatus, reviewedBy string, notes *string) error {
	if err := s.repo.UpdateStatus(ctx, id, status, reviewedBy, notes); err != nil {
		return err
	}

	if status == "approved" {
		adm, err := s.repo.FindByID(ctx, id)
		if err == nil && adm != nil {
			parentPhoneStr := ""
			if adm.ParentPhone != nil {
				parentPhoneStr = *adm.ParentPhone
			}
			// Print beautifully formatted WhatsApp notification
			log.Printf("\n[ignoring loop detection]\n"+
				"=========================================================================\n"+
				"📱 SIMULATED WHATSAPP NOTIFICATION SENT TO APPLICANT PARENT\n"+
				"-------------------------------------------------------------------------\n"+
				"Recipient Phone: %s\n"+
				"Recipient Parent: %s\n"+
				"Student Name: %s\n"+
				"Message Content:\n"+
				"  \"Hello %s! We are thrilled to inform you that your admission application\n"+
				"  for %s has been APPROVED! Please continue your child's registration by\n"+
				"  completing the profile at http://localhost:3000/register?email=%s&name=%s\"\n"+
				"=========================================================================\n",
				parentPhoneStr, adm.ParentName, adm.StudentName, adm.ParentName, adm.StudentName, adm.ParentEmail, adm.StudentName)

			// Print beautifully formatted Email notification
			log.Printf("\n=========================================================================\n"+
				"📧 SIMULATED EMAIL NOTIFICATION SENT TO APPLICANT PARENT\n"+
				"-------------------------------------------------------------------------\n"+
				"Recipient Email: %s\n"+
				"Subject: Admission Approved - Continue Registration for %s\n"+
				"Body:\n"+
				"  Dear %s,\n\n"+
				"  Congratulations! The admission application for %s has been officially approved.\n"+
				"  To finalize the registration process, please set up your parent account and\n"+
				"  student portal by clicking the link below:\n\n"+
				"  👉 http://localhost:3000/register?email=%s&name=%s\n\n"+
				"  If you have any questions, please contact our administrative desk.\n"+
				"  Warm regards,\n"+
				"  School Admissions & Registration Office\n"+
				"=========================================================================\n",
				adm.ParentEmail, adm.StudentName, adm.ParentName, adm.StudentName, adm.ParentEmail, adm.StudentName)
		}
	}

	return nil
}

// EnrollResult holds everything the frontend needs after a successful enrollment.
type EnrollResult struct {
	Email        string `json:"email"`
	TempPassword string `json:"temp_password"`
	WhatsAppURL  string `json:"whatsapp_url,omitempty"`
	EmailSent    bool   `json:"email_sent"`
}

// EnrollStudent creates a student account from an approved admission record.
// It automatically sends the credentials to the parent via email and returns
// a WhatsApp deep-link so the admin can optionally also notify via WhatsApp.
func (s *AdmissionService) EnrollStudent(ctx context.Context, id string) (*EnrollResult, error) {
	adm, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("admission not found: %w", err)
	}

	nameParts := strings.Split(strings.TrimSpace(adm.StudentName), " ")
	firstName := strings.ToLower(nameParts[0])
	lastName := "student"
	if len(nameParts) > 1 {
		lastName = strings.ToLower(nameParts[len(nameParts)-1])
	}
	studentEmail := fmt.Sprintf("%s.%s.%d@student.school.com", firstName, lastName, mrand.Intn(9999))

	password, err := generateSecurePassword(16)
	if err != nil {
		return nil, fmt.Errorf("failed to generate password: %w", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &domain.User{
		Email:        studentEmail,
		PasswordHash: string(hash),
		Role:         domain.RoleStudent,
		FirstName:    firstName,
		LastName:     lastName,
		IsActive:     true,
		IsVerified:   true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	student := &domain.Student{
		UserID:       user.ID,
		AdmissionNo:  fmt.Sprintf("ADM-%d", mrand.Intn(999999)),
		DateOfBirth:  adm.DateOfBirth,
		Gender:       adm.Gender,
		Address:      adm.Address,
		GuardianName: &adm.ParentName,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Link the student to their class by matching applying_grade against grades table.
	if adm.ApplyingGrade != nil && *adm.ApplyingGrade != "" {
		grades, err := s.gradeRepo.List(ctx)
		if err == nil {
			applying := strings.ToLower(strings.TrimSpace(*adm.ApplyingGrade))
			for _, g := range grades {
				section := ""
				if g.Section != nil {
					section = strings.ToLower(strings.TrimSpace(*g.Section))
				}
				name := strings.ToLower(strings.TrimSpace(g.Name))
				// Match "10-A", "Grade 10-A", "10 A", or just the name/section
				combined := name + "-" + section
				combinedSpace := name + " " + section
				if applying == name || applying == section || applying == combined ||
					applying == combinedSpace || strings.Contains(applying, name) || strings.Contains(applying, section) {
					id := g.ID
					student.GradeID = &id
					break
				}
			}
		}
	}
	if err := s.studentRepo.Create(ctx, student); err != nil {
		return nil, fmt.Errorf("failed to create student: %w", err)
	}

	if err := s.repo.UpdateStatus(ctx, id, domain.AdmissionEnrolled, "System", nil); err != nil {
		log.Printf("warn: failed to update admission status: %v", err)
	}

	// ── Send credentials via email ──────────────────────────────────────────
	emailSent := s.sendCredentialEmail(adm.ParentEmail, adm.ParentName, studentEmail, password)

	// ── Build WhatsApp deep-link ────────────────────────────────────────────
	waURL := buildCredentialWhatsAppURL(adm.ParentPhone, adm.ParentName, studentEmail, password)

	return &EnrollResult{
		Email:        studentEmail,
		TempPassword: password,
		WhatsAppURL:  waURL,
		EmailSent:    emailSent,
	}, nil
}

// sendCredentialEmail sends login credentials to the parent via SMTP.
// Returns true if the email was delivered successfully.
func (s *AdmissionService) sendCredentialEmail(parentEmail, parentName, studentEmail, password string) bool {
	subject := "Student Account Created — Login Credentials"
	body := fmt.Sprintf(
		"Dear %s,\n\n"+
			"The student account has been created successfully.\n\n"+
			"Login Email:        %s\n"+
			"Temporary Password: %s\n\n"+
			"Please log in at http://localhost:3000/auth/login and change the password immediately after the first login.\n\n"+
			"Regards,\nSchool Admissions & Registration Office",
		parentName, studentEmail, password,
	)

	if err := email.Send(parentEmail, subject, body); err != nil {
		log.Printf("warn: credential email to %s failed: %v", parentEmail, err)
		return false
	}
	log.Printf("info: credential email sent to %s", parentEmail)
	return true
}

// buildCredentialWhatsAppURL creates a wa.me deep-link pre-filled with credentials.
func buildCredentialWhatsAppURL(phone *string, parentName, studentEmail, password string) string {
	if phone == nil || *phone == "" {
		return ""
	}
	p := strings.ReplaceAll(*phone, " ", "")
	p = strings.ReplaceAll(p, "-", "")
	p = strings.ReplaceAll(p, "+", "")
	if strings.HasPrefix(p, "0") {
		p = "20" + p[1:] // Egypt country code
	}
	msg := fmt.Sprintf(
		"Dear %s,\n\nThe student account has been created.\n\n"+
			"Login Email: %s\nTemporary Password: %s\n\n"+
			"Login at: http://localhost:3000/auth/login\nPlease change the password after first login.",
		parentName, studentEmail, password,
	)
	return fmt.Sprintf("https://wa.me/%s?text=%s", p, url.QueryEscape(msg))
}

// generateSecurePassword returns a random password of the given length using
// crypto/rand so the result is suitable for one-time use as a temporary credential.
func generateSecurePassword(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*"
	buf := make([]byte, length)
	for i := range buf {
		n := make([]byte, 1)
		if _, err := rand.Read(n); err != nil {
			return "", err
		}
		buf[i] = charset[int(n[0])%len(charset)]
	}
	return string(buf), nil
}

// CommunicateResult holds the outcome of a Communicate call.
type CommunicateResult struct {
	Channel     string `json:"channel"`
	Sent        bool   `json:"sent"`
	WhatsAppURL string `json:"whatsapp_url,omitempty"` // only for "whatsapp" channel
}

// Communicate sends a message to the parent of an admission applicant.
//
//   - "email"    → delivers a real SMTP email (requires SMTP_* env vars).
//   - "whatsapp" → returns a wa.me deep-link that opens WhatsApp Web pre-filled
//     with the message; no Business API credentials required.
func (s *AdmissionService) Communicate(ctx context.Context, id, commType, subject, message string) (*CommunicateResult, error) {
	adm, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if adm == nil {
		return nil, fmt.Errorf("admission application not found")
	}

	switch commType {
	case "email":
		body := fmt.Sprintf("Dear %s,\n\n%s\n\nWarm regards,\nSchool Admissions & Registration Office", adm.ParentName, message)
		if err := email.Send(adm.ParentEmail, subject, body); err != nil {
			// If SMTP is not configured, log and return a clear error so the
			// frontend can display an actionable message to the admin.
			log.Printf("warn: email to %s failed: %v", adm.ParentEmail, err)
			return nil, fmt.Errorf("email delivery failed: %w", err)
		}
		log.Printf("info: email sent to %s (subject: %q)", adm.ParentEmail, subject)
		return &CommunicateResult{Channel: "email", Sent: true}, nil

	case "whatsapp":
		phone := ""
		if adm.ParentPhone != nil {
			// Normalise: strip spaces/dashes, convert Egyptian local 0XX → 20XX
			phone = strings.ReplaceAll(*adm.ParentPhone, " ", "")
			phone = strings.ReplaceAll(phone, "-", "")
			phone = strings.ReplaceAll(phone, "+", "")
			if strings.HasPrefix(phone, "0") {
				phone = "20" + phone[1:]
			}
		}
		if phone == "" {
			return nil, fmt.Errorf("no phone number on file for this applicant — cannot open WhatsApp")
		}
		waURL := fmt.Sprintf("https://wa.me/%s?text=%s", phone, url.QueryEscape(message))
		log.Printf("info: WhatsApp link generated for %s (%s)", adm.ParentName, phone)
		return &CommunicateResult{Channel: "whatsapp", Sent: false, WhatsAppURL: waURL}, nil

	default:
		return nil, fmt.Errorf("unsupported channel %q: must be 'email' or 'whatsapp'", commType)
	}
}

// ─── Library Service ──────────────────────────────────────────────────────────

type LibraryService struct{ repo *repository.LibraryRepository }

func NewLibraryService(r *repository.LibraryRepository) *LibraryService {
	return &LibraryService{repo: r}
}

func (s *LibraryService) ListBooks(ctx context.Context) ([]*domain.Book, error) {
	return s.repo.ListBooks(ctx)
}
func (s *LibraryService) CreateBook(ctx context.Context, b *domain.Book) error {
	return s.repo.CreateBook(ctx, b)
}
func (s *LibraryService) UpdateBook(ctx context.Context, b *domain.Book) error {
	return s.repo.UpdateBook(ctx, b)
}
func (s *LibraryService) DeleteBook(ctx context.Context, id string) error {
	return s.repo.DeleteBook(ctx, id)
}
func (s *LibraryService) ListLoans(ctx context.Context) ([]map[string]interface{}, error) {
	return s.repo.ListLoans(ctx)
}
func (s *LibraryService) CreateLoan(ctx context.Context, bookID, studentID, dueDate string) error {
	return s.repo.CreateLoan(ctx, bookID, studentID, dueDate)
}
func (s *LibraryService) ReturnBook(ctx context.Context, loanID string) error {
	return s.repo.ReturnBook(ctx, loanID)
}

// ─── Leave Service ────────────────────────────────────────────────────────────

type LeaveService struct{ repo *repository.LeaveRepository }

func NewLeaveService(r *repository.LeaveRepository) *LeaveService { return &LeaveService{repo: r} }

func (s *LeaveService) DB() *sql.DB { return s.repo.DB() }

func (s *LeaveService) List(ctx context.Context) ([]*domain.LeaveRequest, error) {
	return s.repo.List(ctx)
}
func (s *LeaveService) ByStudent(ctx context.Context, studentID string) ([]*domain.LeaveRequest, error) {
	return s.repo.FindByStudent(ctx, studentID)
}
func (s *LeaveService) Create(ctx context.Context, lr *domain.LeaveRequest) error {
	return s.repo.Create(ctx, lr)
}
func (s *LeaveService) UpdateStatus(ctx context.Context, id, status, reviewedBy string) error {
	return s.repo.UpdateStatus(ctx, id, status, reviewedBy)
}

// ─── Analytics Service ────────────────────────────────────────────────────────

type AnalyticsService struct{ db *sql.DB }

func NewAnalyticsService(db *sql.DB) *AnalyticsService { return &AnalyticsService{db: db} }

func (s *AnalyticsService) Overview(ctx context.Context) (map[string]interface{}, error) {
	var totalStudents, totalTeachers, totalParents, totalClasses, pendingAdmissions int64
	var totalRevenue, pendingPayments float64

	query := `
		SELECT 
			(SELECT COUNT(*) FROM students),
			(SELECT COUNT(*) FROM teachers),
			(SELECT COUNT(*) FROM parents),
			(SELECT COUNT(*) FROM grades),
			(SELECT COUNT(*) FROM admissions WHERE status = 'pending'),
			(SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid'),
			(SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'pending')
	`

	err := s.db.QueryRowContext(ctx, query).Scan(
		&totalStudents,
		&totalTeachers,
		&totalParents,
		&totalClasses,
		&pendingAdmissions,
		&totalRevenue,
		&pendingPayments,
	)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_students":     totalStudents,
		"total_teachers":     totalTeachers,
		"total_parents":      totalParents,
		"total_classes":      totalClasses,
		"pending_admissions": pendingAdmissions,
		"total_revenue":      totalRevenue,
		"pending_payments":   pendingPayments,
	}, nil
}

func (s *AnalyticsService) AttendanceTrend(ctx context.Context) ([]map[string]interface{}, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT date::date, 
		       COUNT(*) FILTER (WHERE status='present') as present,
		       COUNT(*) FILTER (WHERE status='absent') as absent,
		       COUNT(*) FILTER (WHERE status='late') as late
		FROM attendance
		WHERE date >= NOW() - INTERVAL '30 days'
		GROUP BY date::date ORDER BY date::date
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var date interface{}
		var present, absent, late int
		if err := rows.Scan(&date, &present, &absent, &late); err != nil {
			return nil, err
		}
		result = append(result, map[string]interface{}{
			"date": date, "present": present, "absent": absent, "late": late,
		})
	}
	return result, nil
}

func (s *AnalyticsService) GradeDistribution(ctx context.Context) ([]map[string]interface{}, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT g.name, g.section, COUNT(s.id) as student_count
		FROM grades g
		LEFT JOIN students s ON s.grade_id = g.id
		GROUP BY g.id, g.name, g.section ORDER BY g.name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var name string
		var section *string
		var count int
		if err := rows.Scan(&name, &section, &count); err != nil {
			return nil, err
		}
		result = append(result, map[string]interface{}{
			"grade": name, "section": section, "students": count,
		})
	}
	return result, nil
}

// RecentActivity returns the most recent notable events across the system for
// the admin dashboard feed. Each row carries a machine-readable `type` plus the
// structured fields the frontend needs to render a localized message, so no
// human text is produced server-side (keeps i18n on the client).
func (s *AnalyticsService) RecentActivity(ctx context.Context, limit int) ([]map[string]interface{}, error) {
	if limit <= 0 || limit > 50 {
		limit = 15
	}
	rows, err := s.db.QueryContext(ctx, `
		(
			SELECT 'admission' AS type, a.id::text AS ref, a.student_name AS label,
			       NULL::numeric AS amount, a.status AS status, a.applied_at AS at
			FROM admissions a
		)
		UNION ALL
		(
			SELECT 'payment' AS type, p.id::text AS ref,
			       (u.first_name || ' ' || u.last_name) AS label,
			       p.amount AS amount, p.status AS status,
			       COALESCE(p.paid_at, p.created_at) AS at
			FROM payments p
			JOIN students s ON s.id = p.student_id
			JOIN users u ON u.id = s.user_id
		)
		UNION ALL
		(
			SELECT 'exam' AS type, e.id::text AS ref, e.title AS label,
			       NULL::numeric AS amount, NULL AS status, e.created_at AS at
			FROM exams e
		)
		UNION ALL
		(
			SELECT 'leave' AS type, lr.id::text AS ref,
			       (u.first_name || ' ' || u.last_name) AS label,
			       NULL::numeric AS amount, lr.status AS status, lr.created_at AS at
			FROM leave_requests lr
			JOIN students s ON s.id = lr.student_id
			JOIN users u ON u.id = s.user_id
		)
		ORDER BY at DESC NULLS LAST
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]map[string]interface{}, 0, limit)
	for rows.Next() {
		var typ, ref, label string
		var amount *float64
		var status *string
		var at *time.Time
		if err := rows.Scan(&typ, &ref, &label, &amount, &status, &at); err != nil {
			return nil, err
		}
		result = append(result, map[string]interface{}{
			"type":       typ,
			"ref":        ref,
			"label":      label,
			"amount":     amount,
			"status":     status,
			"created_at": at,
		})
	}
	return result, rows.Err()
}
