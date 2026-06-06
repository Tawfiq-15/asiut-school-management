package repository

import (
	"context"
	"database/sql"
	"fmt"
	"school-management/backend/internal/domain"
)

// ─── Announcement Repository ──────────────────────────────────────────────────

type AnnouncementRepository struct{ db *sql.DB }

func NewAnnouncementRepository(db *sql.DB) *AnnouncementRepository {
	return &AnnouncementRepository{db: db}
}

func (r *AnnouncementRepository) List(ctx context.Context, role string) ([]*domain.Announcement, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT a.id, a.author_id, a.title, a.content, a.target_roles, a.is_pinned, a.created_at, a.updated_at,
		       u.first_name, u.last_name, u.avatar_url, u.role
		FROM announcements a
		JOIN users u ON u.id = a.author_id
		WHERE ($1 = '' OR $1 = ANY(a.target_roles))
		ORDER BY a.is_pinned DESC, a.created_at DESC
		LIMIT 50
	`, role)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAnnouncements(rows)
}

func (r *AnnouncementRepository) Create(ctx context.Context, a *domain.Announcement) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO announcements (author_id, title, content, target_roles, is_pinned)
		VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at, updated_at
	`, a.AuthorID, a.Title, a.Content, a.TargetRoles, a.IsPinned).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
}

func (r *AnnouncementRepository) Update(ctx context.Context, a *domain.Announcement) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE announcements SET title=$1, content=$2, target_roles=$3, is_pinned=$4, updated_at=NOW() WHERE id=$5
	`, a.Title, a.Content, a.TargetRoles, a.IsPinned, a.ID)
	return err
}

func (r *AnnouncementRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM announcements WHERE id=$1`, id)
	return err
}

func (r *AnnouncementRepository) FindByID(ctx context.Context, id string) (*domain.Announcement, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT a.id, a.author_id, a.title, a.content, a.target_roles, a.is_pinned, a.created_at, a.updated_at,
		       u.first_name, u.last_name, u.avatar_url, u.role
		FROM announcements a JOIN users u ON u.id = a.author_id WHERE a.id=$1
	`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list, err := scanAnnouncements(rows)
	if err != nil || len(list) == 0 {
		return nil, err
	}
	return list[0], nil
}

func scanAnnouncements(rows *sql.Rows) ([]*domain.Announcement, error) {
	var list []*domain.Announcement
	for rows.Next() {
		a := &domain.Announcement{Author: &domain.User{}}
		err := rows.Scan(
			&a.ID, &a.AuthorID, &a.Title, &a.Content, &a.TargetRoles, &a.IsPinned, &a.CreatedAt, &a.UpdatedAt,
			&a.Author.FirstName, &a.Author.LastName, &a.Author.AvatarURL, &a.Author.Role,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, nil
}

// ─── Notification Repository ──────────────────────────────────────────────────

type NotificationRepository struct{ db *sql.DB }

func NewNotificationRepository(db *sql.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) ListByUser(ctx context.Context, userID string) ([]*domain.Notification, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, title, message, type, is_read, link, created_at
		FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*domain.Notification
	for rows.Next() {
		n := &domain.Notification{}
		err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Message, &n.Type, &n.IsRead, &n.Link, &n.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, n)
	}
	return list, nil
}

func (r *NotificationRepository) Create(ctx context.Context, n *domain.Notification) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO notifications (user_id, title, message, type, link)
		VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at
	`, n.UserID, n.Title, n.Message, n.Type, n.Link).Scan(&n.ID, &n.CreatedAt)
}

func (r *NotificationRepository) MarkRead(ctx context.Context, id, userID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}

func (r *NotificationRepository) MarkAllRead(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE notifications SET is_read=true WHERE user_id=$1`, userID)
	return err
}

// ─── Message Repository ───────────────────────────────────────────────────────

type MessageRepository struct{ db *sql.DB }

func NewMessageRepository(db *sql.DB) *MessageRepository { return &MessageRepository{db: db} }

func (r *MessageRepository) GetThread(ctx context.Context, userA, userB string) ([]*domain.Message, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
		       su.first_name, su.last_name, su.avatar_url,
		       ru.first_name, ru.last_name, ru.avatar_url
		FROM messages m
		JOIN users su ON su.id = m.sender_id
		JOIN users ru ON ru.id = m.receiver_id
		WHERE (m.sender_id=$1 AND m.receiver_id=$2) OR (m.sender_id=$2 AND m.receiver_id=$1)
		ORDER BY m.created_at
	`, userA, userB)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []*domain.Message
	for rows.Next() {
		m := &domain.Message{Sender: &domain.User{}, Receiver: &domain.User{}}
		err := rows.Scan(
			&m.ID, &m.SenderID, &m.ReceiverID, &m.Content, &m.IsRead, &m.CreatedAt,
			&m.Sender.FirstName, &m.Sender.LastName, &m.Sender.AvatarURL,
			&m.Receiver.FirstName, &m.Receiver.LastName, &m.Receiver.AvatarURL,
		)
		if err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, nil
}

func (r *MessageRepository) Send(ctx context.Context, m *domain.Message) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1,$2,$3) RETURNING id, created_at
	`, m.SenderID, m.ReceiverID, m.Content).Scan(&m.ID, &m.CreatedAt)
}

func (r *MessageRepository) ListConversations(ctx context.Context, userID string) ([]map[string]interface{}, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT DISTINCT ON (other_user)
		       CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END as other_user,
		       m.content as last_message, m.created_at,
		       u.first_name, u.last_name, u.avatar_url, u.role
		FROM messages m
		JOIN users u ON u.id = CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END
		WHERE m.sender_id=$1 OR m.receiver_id=$1
		ORDER BY other_user, m.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var otherUser, content, firstName, lastName, role string
		var avatarURL *string
		var createdAt interface{}
		if err := rows.Scan(&otherUser, &content, &createdAt, &firstName, &lastName, &avatarURL, &role); err != nil {
			return nil, err
		}
		list = append(list, map[string]interface{}{
			"user_id":      otherUser,
			"first_name":   firstName,
			"last_name":    lastName,
			"avatar_url":   avatarURL,
			"role":         role,
			"last_message": content,
			"last_seen":    createdAt,
		})
	}
	return list, nil
}

// ─── Payment Repository ───────────────────────────────────────────────────────

type PaymentRepository struct{ db *sql.DB }

func NewPaymentRepository(db *sql.DB) *PaymentRepository { return &PaymentRepository{db: db} }

func (r *PaymentRepository) DB() *sql.DB { return r.db }

func (r *PaymentRepository) List(ctx context.Context, p domain.PaginationParams) ([]*domain.Payment, int64, error) {
	p.Normalize()
	rows, err := r.db.QueryContext(ctx, `
		SELECT py.id, py.student_id, py.amount, py.payment_type, py.payment_method, py.status,
		       py.due_date, py.paid_at, py.transaction_id, py.notes, py.created_at,
		       u.first_name, u.last_name, s.admission_no
		FROM payments py
		JOIN students s ON s.id = py.student_id
		JOIN users u ON u.id = s.user_id
		ORDER BY py.created_at DESC LIMIT $1 OFFSET $2
	`, p.PageSize, p.Offset())
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []*domain.Payment
	for rows.Next() {
		py := &domain.Payment{Student: &domain.Student{User: &domain.User{}}}
		err := rows.Scan(
			&py.ID, &py.StudentID, &py.Amount, &py.PaymentType, &py.PaymentMethod, &py.Status,
			&py.DueDate, &py.PaidAt, &py.TransactionID, &py.Notes, &py.CreatedAt,
			&py.Student.User.FirstName, &py.Student.User.LastName, &py.Student.AdmissionNo,
		)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, py)
	}
	var total int64
	r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM payments`).Scan(&total) // payments has no search filter
	return list, total, nil
}

func (r *PaymentRepository) FindByStudent(ctx context.Context, studentID string) ([]*domain.Payment, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, student_id, amount, payment_type, payment_method, status, due_date, paid_at, transaction_id, notes, created_at
		FROM payments WHERE student_id=$1 ORDER BY created_at DESC
	`, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*domain.Payment
	for rows.Next() {
		py := &domain.Payment{}
		err := rows.Scan(&py.ID, &py.StudentID, &py.Amount, &py.PaymentType, &py.PaymentMethod, &py.Status, &py.DueDate, &py.PaidAt, &py.TransactionID, &py.Notes, &py.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, py)
	}
	return list, nil
}

func (r *PaymentRepository) Create(ctx context.Context, py *domain.Payment) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO payments (student_id, amount, payment_type, payment_method, status, due_date, notes)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at
	`, py.StudentID, py.Amount, py.PaymentType, py.PaymentMethod, py.Status, py.DueDate, py.Notes,
	).Scan(&py.ID, &py.CreatedAt)
}

func (r *PaymentRepository) UpdateStatus(ctx context.Context, id string, status domain.PaymentStatus) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE payments SET status=$1, paid_at=CASE WHEN $1='paid' THEN NOW() ELSE paid_at END WHERE id=$2
	`, status, id)
	return err
}

func (r *PaymentRepository) FindByID(ctx context.Context, id string) (*domain.Payment, error) {
	py := &domain.Payment{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, student_id, amount, payment_type, payment_method, status, due_date, paid_at, transaction_id, notes, created_at
		FROM payments WHERE id=$1
	`, id).Scan(&py.ID, &py.StudentID, &py.Amount, &py.PaymentType, &py.PaymentMethod, &py.Status, &py.DueDate, &py.PaidAt, &py.TransactionID, &py.Notes, &py.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return py, err
}

// ─── Event Repository ─────────────────────────────────────────────────────────

type EventRepository struct{ db *sql.DB }

func NewEventRepository(db *sql.DB) *EventRepository { return &EventRepository{db: db} }

func (r *EventRepository) List(ctx context.Context, publicOnly bool) ([]*domain.Event, error) {
	q := `SELECT id, title, description, event_date, end_date, location, image_url, is_public, created_by, created_at FROM events`
	if publicOnly {
		q += ` WHERE is_public=true`
	}
	q += ` ORDER BY event_date DESC LIMIT 50`
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*domain.Event
	for rows.Next() {
		e := &domain.Event{}
		err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.EventDate, &e.EndDate, &e.Location, &e.ImageURL, &e.IsPublic, &e.CreatedBy, &e.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}

func (r *EventRepository) FindByID(ctx context.Context, id string) (*domain.Event, error) {
	e := &domain.Event{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, title, description, event_date, end_date, location, image_url, is_public, created_by, created_at FROM events WHERE id=$1
	`, id).Scan(&e.ID, &e.Title, &e.Description, &e.EventDate, &e.EndDate, &e.Location, &e.ImageURL, &e.IsPublic, &e.CreatedBy, &e.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return e, err
}

func (r *EventRepository) Create(ctx context.Context, e *domain.Event) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO events (title, description, event_date, end_date, location, image_url, is_public, created_by)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, created_at
	`, e.Title, e.Description, e.EventDate, e.EndDate, e.Location, e.ImageURL, e.IsPublic, e.CreatedBy,
	).Scan(&e.ID, &e.CreatedAt)
}

func (r *EventRepository) Update(ctx context.Context, e *domain.Event) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE events SET title=$1, description=$2, event_date=$3, end_date=$4, location=$5, image_url=$6, is_public=$7 WHERE id=$8
	`, e.Title, e.Description, e.EventDate, e.EndDate, e.Location, e.ImageURL, e.IsPublic, e.ID)
	return err
}

func (r *EventRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM events WHERE id=$1`, id)
	return err
}

// ─── Admission Repository ─────────────────────────────────────────────────────

type AdmissionRepository struct{ db *sql.DB }

func NewAdmissionRepository(db *sql.DB) *AdmissionRepository { return &AdmissionRepository{db: db} }

func (r *AdmissionRepository) DB() *sql.DB { return r.db }

func (r *AdmissionRepository) List(ctx context.Context, p domain.PaginationParams) ([]*domain.Admission, int64, error) {
	p.Normalize()

	query := `
		SELECT id, student_name, date_of_birth, gender, applying_grade, parent_name, parent_email,
		       parent_phone, address, previous_school, status, notes, applied_at, reviewed_at, reviewed_by
		FROM admissions`
	countQuery := `SELECT COUNT(*) FROM admissions`

	var args []interface{}
	var countArgs []interface{}

	if p.Status != "" {
		query += " WHERE status = $1"
		countQuery += " WHERE status = $1"
		args = append(args, p.Status)
		countArgs = append(countArgs, p.Status)

		query += fmt.Sprintf(" ORDER BY applied_at %s LIMIT $%d OFFSET $%d", p.SortDir, len(args)+1, len(args)+2)
		args = append(args, p.PageSize, p.Offset())
	} else {
		query += fmt.Sprintf(" ORDER BY applied_at %s LIMIT $1 OFFSET $2", p.SortDir)
		args = append(args, p.PageSize, p.Offset())
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []*domain.Admission
	for rows.Next() {
		a := &domain.Admission{}
		err := rows.Scan(&a.ID, &a.StudentName, &a.DateOfBirth, &a.Gender, &a.ApplyingGrade,
			&a.ParentName, &a.ParentEmail, &a.ParentPhone, &a.Address, &a.PreviousSchool,
			&a.Status, &a.Notes, &a.AppliedAt, &a.ReviewedAt, &a.ReviewedBy)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, a)
	}

	var total int64
	err = r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *AdmissionRepository) FindByID(ctx context.Context, id string) (*domain.Admission, error) {
	a := &domain.Admission{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, student_name, date_of_birth, gender, applying_grade, parent_name, parent_email,
		       parent_phone, address, previous_school, status, notes, applied_at, reviewed_at, reviewed_by
		FROM admissions WHERE id=$1
	`, id).Scan(&a.ID, &a.StudentName, &a.DateOfBirth, &a.Gender, &a.ApplyingGrade,
		&a.ParentName, &a.ParentEmail, &a.ParentPhone, &a.Address, &a.PreviousSchool,
		&a.Status, &a.Notes, &a.AppliedAt, &a.ReviewedAt, &a.ReviewedBy)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return a, err
}

func (r *AdmissionRepository) FindByEmail(ctx context.Context, email string) (*domain.Admission, error) {
	a := &domain.Admission{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, student_name, date_of_birth, gender, applying_grade, parent_name, parent_email,
		       parent_phone, address, previous_school, status, notes, applied_at, reviewed_at, reviewed_by
		FROM admissions WHERE parent_email=$1 LIMIT 1
	`, email).Scan(&a.ID, &a.StudentName, &a.DateOfBirth, &a.Gender, &a.ApplyingGrade,
		&a.ParentName, &a.ParentEmail, &a.ParentPhone, &a.Address, &a.PreviousSchool,
		&a.Status, &a.Notes, &a.AppliedAt, &a.ReviewedAt, &a.ReviewedBy)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return a, err
}

func (r *AdmissionRepository) Create(ctx context.Context, a *domain.Admission) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO admissions (student_name, date_of_birth, gender, applying_grade, parent_name, parent_email, parent_phone, address, previous_school)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, applied_at
	`, a.StudentName, a.DateOfBirth, a.Gender, a.ApplyingGrade, a.ParentName, a.ParentEmail, a.ParentPhone, a.Address, a.PreviousSchool,
	).Scan(&a.ID, &a.AppliedAt)
}

func (r *AdmissionRepository) UpdateStatus(ctx context.Context, id string, status domain.AdmissionStatus, reviewedBy string, notes *string) error {
	var reviewedByVal interface{}
	if reviewedBy != "" && reviewedBy != "System" {
		reviewedByVal = reviewedBy
	}
	_, err := r.db.ExecContext(ctx, `
		UPDATE admissions SET status=$1, reviewed_by=$2, reviewed_at=NOW(), notes=COALESCE($3, notes) WHERE id=$4
	`, status, reviewedByVal, notes, id)
	return err
}

// ─── Library Repository ───────────────────────────────────────────────────────

type LibraryRepository struct{ db *sql.DB }

func NewLibraryRepository(db *sql.DB) *LibraryRepository { return &LibraryRepository{db: db} }

func (r *LibraryRepository) ListBooks(ctx context.Context) ([]*domain.Book, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id, title, author, isbn, category, total_copies, available, published_at, created_at FROM books WHERE deleted_at IS NULL ORDER BY title`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*domain.Book
	for rows.Next() {
		b := &domain.Book{}
		if err := rows.Scan(&b.ID, &b.Title, &b.Author, &b.ISBN, &b.Category, &b.TotalCopies, &b.Available, &b.PublishedAt, &b.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, b)
	}
	return list, nil
}

func (r *LibraryRepository) CreateBook(ctx context.Context, b *domain.Book) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO books (title, author, isbn, category, total_copies, available, published_at)
		VALUES ($1,$2,$3,$4,$5,$5,$6) RETURNING id, created_at
	`, b.Title, b.Author, b.ISBN, b.Category, b.TotalCopies, b.PublishedAt).Scan(&b.ID, &b.CreatedAt)
}

func (r *LibraryRepository) UpdateBook(ctx context.Context, b *domain.Book) error {
	_, err := r.db.ExecContext(ctx, `UPDATE books SET title=$1, author=$2, isbn=$3, category=$4, total_copies=$5 WHERE id=$6`, b.Title, b.Author, b.ISBN, b.Category, b.TotalCopies, b.ID)
	return err
}

func (r *LibraryRepository) DeleteBook(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE books SET deleted_at = NOW() WHERE id=$1`, id)
	return err
}

func (r *LibraryRepository) ListLoans(ctx context.Context) ([]map[string]interface{}, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT bl.id, bl.book_id, bl.student_id, bl.loaned_at, bl.due_date, bl.returned_at, bl.status,
		       b.title, u.first_name, u.last_name
		FROM book_loans bl
		JOIN books b ON b.id = bl.book_id
		JOIN students s ON s.id = bl.student_id
		JOIN users u ON u.id = s.user_id
		ORDER BY bl.loaned_at DESC LIMIT 100
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []map[string]interface{}
	for rows.Next() {
		var id, bookID, studentID, status, bookTitle, firstName, lastName string
		var loanedAt, dueDate, returnedAt interface{}
		if err := rows.Scan(&id, &bookID, &studentID, &loanedAt, &dueDate, &returnedAt, &status, &bookTitle, &firstName, &lastName); err != nil {
			return nil, err
		}
		list = append(list, map[string]interface{}{
			"id": id, "book_id": bookID, "student_id": studentID,
			"loaned_at": loanedAt, "due_date": dueDate, "returned_at": returnedAt,
			"status": status, "book_title": bookTitle,
			"student_name": firstName + " " + lastName,
		})
	}
	return list, nil
}

func (r *LibraryRepository) CreateLoan(ctx context.Context, bookID, studentID, dueDate string) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO book_loans (book_id, student_id, due_date) VALUES ($1,$2,$3)
	`, bookID, studentID, dueDate)
	if err == nil {
		r.db.ExecContext(ctx, `UPDATE books SET available=available-1 WHERE id=$1 AND available>0`, bookID)
	}
	return err
}

func (r *LibraryRepository) ReturnBook(ctx context.Context, loanID string) error {
	var bookID string
	if err := r.db.QueryRowContext(ctx,
		`UPDATE book_loans SET returned_at=NOW(), status='returned' WHERE id=$1 RETURNING book_id`,
		loanID,
	).Scan(&bookID); err != nil {
		return fmt.Errorf("return book loan: %w", err)
	}
	if _, err := r.db.ExecContext(ctx,
		`UPDATE books SET available=available+1 WHERE id=$1`, bookID,
	); err != nil {
		return fmt.Errorf("restore book availability: %w", err)
	}
	return nil
}

// ─── Leave Repository ─────────────────────────────────────────────────────────

type LeaveRepository struct{ db *sql.DB }

func NewLeaveRepository(db *sql.DB) *LeaveRepository { return &LeaveRepository{db: db} }

func (r *LeaveRepository) DB() *sql.DB { return r.db }

func (r *LeaveRepository) List(ctx context.Context) ([]*domain.LeaveRequest, error) {
	return r.ListFiltered(ctx, "", 200, 0)
}

func (r *LeaveRepository) ListFiltered(ctx context.Context, status string, limit, offset int) ([]*domain.LeaveRequest, error) {
	query := `
		SELECT lr.id, lr.student_id, lr.from_date, lr.to_date, lr.reason, lr.status, lr.reviewed_by, lr.reviewed_at, lr.created_at,
		       u.first_name, u.last_name
		FROM leave_requests lr
		JOIN students s ON s.id = lr.student_id
		JOIN users u ON u.id = s.user_id
	`
	args := []interface{}{}
	if status != "" {
		query += " WHERE lr.status = $1"
		args = append(args, status)
		query += fmt.Sprintf(" ORDER BY lr.created_at DESC LIMIT $2 OFFSET $3")
	} else {
		query += " ORDER BY lr.created_at DESC LIMIT $1 OFFSET $2"
	}
	if limit <= 0 {
		limit = 50
	}
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanLeaveRequests(rows)
}

func (r *LeaveRepository) FindByStudent(ctx context.Context, studentID string) ([]*domain.LeaveRequest, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT lr.id, lr.student_id, lr.from_date, lr.to_date, lr.reason, lr.status, lr.reviewed_by, lr.reviewed_at, lr.created_at,
		       u.first_name, u.last_name
		FROM leave_requests lr
		JOIN students s ON s.id = lr.student_id
		JOIN users u ON u.id = s.user_id
		WHERE lr.student_id=$1 ORDER BY lr.created_at DESC
	`, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanLeaveRequests(rows)
}

func scanLeaveRequests(rows *sql.Rows) ([]*domain.LeaveRequest, error) {
	var list []*domain.LeaveRequest
	for rows.Next() {
		lr := &domain.LeaveRequest{Student: &domain.Student{User: &domain.User{}}}
		err := rows.Scan(
			&lr.ID, &lr.StudentID, &lr.FromDate, &lr.ToDate, &lr.Reason, &lr.Status,
			&lr.ReviewedBy, &lr.ReviewedAt, &lr.CreatedAt,
			&lr.Student.User.FirstName, &lr.Student.User.LastName,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, lr)
	}
	return list, nil
}

func (r *LeaveRepository) Create(ctx context.Context, lr *domain.LeaveRequest) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO leave_requests (student_id, from_date, to_date, reason) VALUES ($1,$2,$3,$4) RETURNING id, created_at
	`, lr.StudentID, lr.FromDate, lr.ToDate, lr.Reason).Scan(&lr.ID, &lr.CreatedAt)
}

func (r *LeaveRepository) UpdateStatus(ctx context.Context, id, status, reviewedBy string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE leave_requests SET status=$1, reviewed_by=$2, reviewed_at=NOW() WHERE id=$3`, status, reviewedBy, id)
	return err
}
