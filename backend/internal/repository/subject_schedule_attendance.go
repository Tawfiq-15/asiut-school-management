package repository

import (
	"context"
	"database/sql"
	"fmt"
	"school-management/backend/internal/domain"
)

// ─── Subject Repository ──────────────────────────────────────────────────────

type SubjectRepository struct{ db *sql.DB }

func NewSubjectRepository(db *sql.DB) *SubjectRepository { return &SubjectRepository{db: db} }

func (r *SubjectRepository) List(ctx context.Context) ([]*domain.Subject, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT s.id, s.name, s.code, s.grade_id, s.teacher_id, s.description, s.credits, s.created_at, s.updated_at,
		       g.name, t.id, u.first_name, u.last_name
		FROM subjects s
		LEFT JOIN grades g ON g.id = s.grade_id
		LEFT JOIN teachers t ON t.id = s.teacher_id
		LEFT JOIN users u ON u.id = t.user_id
		WHERE s.deleted_at IS NULL
		ORDER BY s.name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subjects []*domain.Subject
	for rows.Next() {
		s := &domain.Subject{}
		var gradeName, teacherID, teacherFirst, teacherLast *string
		err := rows.Scan(
			&s.ID, &s.Name, &s.Code, &s.GradeID, &s.TeacherID, &s.Description, &s.Credits, &s.CreatedAt, &s.UpdatedAt,
			&gradeName, &teacherID, &teacherFirst, &teacherLast,
		)
		if err != nil {
			return nil, err
		}
		if gradeName != nil {
			s.Grade = &domain.Grade{Name: *gradeName}
		}
		if teacherID != nil {
			s.Teacher = &domain.Teacher{ID: *teacherID, User: &domain.User{}}
			if teacherFirst != nil {
				s.Teacher.User.FirstName = *teacherFirst
			}
			if teacherLast != nil {
				s.Teacher.User.LastName = *teacherLast
			}
		}
		subjects = append(subjects, s)
	}
	return subjects, nil
}

func (r *SubjectRepository) FindByID(ctx context.Context, id string) (*domain.Subject, error) {
	s := &domain.Subject{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, code, grade_id, teacher_id, description, credits, created_at, updated_at
		FROM subjects WHERE id=$1 AND deleted_at IS NULL
	`, id).Scan(&s.ID, &s.Name, &s.Code, &s.GradeID, &s.TeacherID, &s.Description, &s.Credits, &s.CreatedAt, &s.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return s, err
}

func (r *SubjectRepository) FindByTeacher(ctx context.Context, teacherID string) ([]*domain.Subject, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT s.id, s.name, s.code, s.grade_id, s.teacher_id, s.description, s.credits, s.created_at, s.updated_at, g.name
		FROM subjects s
		LEFT JOIN grades g ON g.id = s.grade_id
		WHERE s.teacher_id = COALESCE(
			(SELECT id FROM teachers WHERE user_id = $1::uuid),
			$1::uuid
		) ORDER BY s.name
	`, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var subjects []*domain.Subject
	for rows.Next() {
		s := &domain.Subject{}
		var gradeName sql.NullString
		err := rows.Scan(&s.ID, &s.Name, &s.Code, &s.GradeID, &s.TeacherID, &s.Description, &s.Credits, &s.CreatedAt, &s.UpdatedAt, &gradeName)
		if err != nil {
			return nil, err
		}
		if gradeName.Valid {
			s.Grade = &domain.Grade{Name: gradeName.String}
		}
		subjects = append(subjects, s)
	}
	return subjects, nil
}

func (r *SubjectRepository) Create(ctx context.Context, s *domain.Subject) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO subjects (name, code, grade_id, teacher_id, description, credits)
		VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at, updated_at
	`, s.Name, s.Code, s.GradeID, s.TeacherID, s.Description, s.Credits).Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)
}

func (r *SubjectRepository) Update(ctx context.Context, s *domain.Subject) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE subjects SET name=$1, code=$2, grade_id=$3, teacher_id=$4, description=$5, credits=$6, updated_at=NOW()
		WHERE id=$7
	`, s.Name, s.Code, s.GradeID, s.TeacherID, s.Description, s.Credits, s.ID)
	return err
}

func (r *SubjectRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE subjects SET deleted_at = NOW() WHERE id=$1`, id)
	return err
}

// ─── Schedule Repository ─────────────────────────────────────────────────────

type ScheduleRepository struct{ db *sql.DB }

func NewScheduleRepository(db *sql.DB) *ScheduleRepository { return &ScheduleRepository{db: db} }

func (r *ScheduleRepository) DB() *sql.DB { return r.db }

func (r *ScheduleRepository) FindByGrade(ctx context.Context, gradeID string) ([]*domain.Schedule, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT sc.id, sc.grade_id, sc.subject_id, sc.teacher_id, sc.day_of_week, sc.start_time, sc.end_time, sc.room, sc.created_at,
		       sub.name, sub.code, u.first_name, u.last_name
		FROM schedules sc
		LEFT JOIN subjects sub ON sub.id = sc.subject_id
		LEFT JOIN teachers t ON t.id = COALESCE(sc.teacher_id, sub.teacher_id)
		LEFT JOIN users u ON u.id = t.user_id
		WHERE sc.grade_id=$1
		ORDER BY sc.day_of_week, sc.start_time
	`, gradeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSchedules(rows)
}

func (r *ScheduleRepository) FindByTeacher(ctx context.Context, teacherID string) ([]*domain.Schedule, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT sc.id, sc.grade_id, sc.subject_id, sc.teacher_id, sc.day_of_week, sc.start_time, sc.end_time, sc.room, sc.created_at,
		       sub.name, sub.code, u.first_name, u.last_name
		FROM schedules sc
		LEFT JOIN subjects sub ON sub.id = sc.subject_id
		LEFT JOIN teachers t ON t.id = COALESCE(sc.teacher_id, sub.teacher_id)
		LEFT JOIN users u ON u.id = t.user_id
		WHERE sc.teacher_id = COALESCE(
			(SELECT id FROM teachers WHERE user_id = $1::uuid),
			$1::uuid
		)
		ORDER BY sc.day_of_week, sc.start_time
	`, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSchedules(rows)
}

func scanSchedules(rows *sql.Rows) ([]*domain.Schedule, error) {
	var schedules []*domain.Schedule
	for rows.Next() {
		s := &domain.Schedule{}
		var subName, subCode, teacherFirst, teacherLast *string
		err := rows.Scan(
			&s.ID, &s.GradeID, &s.SubjectID, &s.TeacherID,
			&s.DayOfWeek, &s.StartTime, &s.EndTime, &s.Room, &s.CreatedAt,
			&subName, &subCode, &teacherFirst, &teacherLast,
		)
		if err != nil {
			return nil, err
		}
		if subName != nil {
			s.Subject = &domain.Subject{Name: *subName}
			if subCode != nil {
				s.Subject.Code = *subCode
			}
		}
		if teacherFirst != nil {
			s.Teacher = &domain.Teacher{User: &domain.User{FirstName: *teacherFirst}}
			if teacherLast != nil {
				s.Teacher.User.LastName = *teacherLast
			}
		}
		schedules = append(schedules, s)
	}
	return schedules, nil
}

func (r *ScheduleRepository) List(ctx context.Context) ([]*domain.Schedule, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT sc.id, sc.grade_id, sc.subject_id, sc.teacher_id, sc.day_of_week, sc.start_time, sc.end_time, sc.room, sc.created_at,
		       sub.name, sub.code, u.first_name, u.last_name
		FROM schedules sc
		LEFT JOIN subjects sub ON sub.id = sc.subject_id
		LEFT JOIN teachers t ON t.id = COALESCE(sc.teacher_id, sub.teacher_id)
		LEFT JOIN users u ON u.id = t.user_id
		ORDER BY sc.grade_id, sc.day_of_week, sc.start_time
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSchedules(rows)
}

func (r *ScheduleRepository) Create(ctx context.Context, s *domain.Schedule) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO schedules (grade_id, subject_id, teacher_id, day_of_week, start_time, end_time, room)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at
	`, s.GradeID, s.SubjectID, s.TeacherID, s.DayOfWeek, s.StartTime, s.EndTime, s.Room).Scan(&s.ID, &s.CreatedAt)
}

func (r *ScheduleRepository) Update(ctx context.Context, s *domain.Schedule) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE schedules SET grade_id=$1, subject_id=$2, teacher_id=$3, day_of_week=$4, start_time=$5, end_time=$6, room=$7
		WHERE id=$8
	`, s.GradeID, s.SubjectID, s.TeacherID, s.DayOfWeek, s.StartTime, s.EndTime, s.Room, s.ID)
	return err
}

func (r *ScheduleRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM schedules WHERE id=$1`, id)
	return err
}

// ─── Attendance Repository ────────────────────────────────────────────────────

type AttendanceRepository struct{ db *sql.DB }

func NewAttendanceRepository(db *sql.DB) *AttendanceRepository { return &AttendanceRepository{db: db} }

func (r *AttendanceRepository) DB() *sql.DB { return r.db }

func (r *AttendanceRepository) BulkUpsert(ctx context.Context, records []*domain.Attendance) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Two prepared statements: one for when subject_id is set (uses unique constraint),
	// one for when it is NULL (PostgreSQL NULLs are never equal so the constraint can't match).
	stmtWithSubject, err := tx.PrepareContext(ctx, `
		INSERT INTO attendance (student_id, subject_id, date, status, marked_by, notes)
		VALUES ($1,$2,$3,$4,$5,$6)
		ON CONFLICT (student_id, date, subject_id) DO UPDATE
		SET status=EXCLUDED.status, notes=EXCLUDED.notes, marked_by=EXCLUDED.marked_by
	`)
	if err != nil {
		return err
	}
	defer stmtWithSubject.Close()

	stmtNoSubject, err := tx.PrepareContext(ctx, `
		INSERT INTO attendance (student_id, subject_id, date, status, marked_by, notes)
		VALUES ($1, NULL, $2, $3, $4, $5)
		ON CONFLICT (student_id, date) WHERE subject_id IS NULL DO UPDATE
		SET status=EXCLUDED.status, notes=EXCLUDED.notes, marked_by=EXCLUDED.marked_by
	`)
	if err != nil {
		return err
	}
	defer stmtNoSubject.Close()

	for _, a := range records {
		if a.SubjectID != nil && *a.SubjectID != "" {
			if _, err := stmtWithSubject.ExecContext(ctx, a.StudentID, a.SubjectID, a.Date, a.Status, a.MarkedBy, a.Notes); err != nil {
				return err
			}
		} else {
			if _, err := stmtNoSubject.ExecContext(ctx, a.StudentID, a.Date, a.Status, a.MarkedBy, a.Notes); err != nil {
				return err
			}
		}
	}
	return tx.Commit()
}

func (r *AttendanceRepository) FindByStudent(ctx context.Context, studentID string, limit int) ([]*domain.Attendance, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, student_id, subject_id, date, status, marked_by, notes, created_at
		FROM attendance WHERE student_id=$1
		ORDER BY date DESC LIMIT $2
	`, studentID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAttendance(rows)
}

func (r *AttendanceRepository) Summary(ctx context.Context, studentID string) (present, absent, late int, err error) {
	err = r.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE status='present'),
			COUNT(*) FILTER (WHERE status='absent'),
			COUNT(*) FILTER (WHERE status='late')
		FROM attendance WHERE student_id=$1
	`, studentID).Scan(&present, &absent, &late)
	return
}

func scanAttendance(rows *sql.Rows) ([]*domain.Attendance, error) {
	var records []*domain.Attendance
	for rows.Next() {
		a := &domain.Attendance{}
		err := rows.Scan(&a.ID, &a.StudentID, &a.SubjectID, &a.Date, &a.Status, &a.MarkedBy, &a.Notes, &a.CreatedAt)
		if err != nil {
			return nil, err
		}
		records = append(records, a)
	}
	return records, nil
}

func (r *AttendanceRepository) FindByTeacherAndDate(ctx context.Context, teacherUserID string, date string, subjectID string) ([]*domain.Attendance, error) {
	var rows *sql.Rows
	var err error
	if subjectID != "" {
		// Find all students in the grade this subject belongs to, left-join attendance for that date+subject.
		// This is reliable regardless of whether schedules.teacher_id is set.
		rows, err = r.db.QueryContext(ctx, `
			SELECT DISTINCT s.id, s.admission_no, u.first_name, u.last_name,
			       COALESCE(a.status::text, ''), COALESCE(a.id::text, '')
			FROM students s
			JOIN users u ON u.id = s.user_id
			JOIN subjects sub ON sub.id = $2 AND sub.grade_id = s.grade_id
			LEFT JOIN attendance a ON a.student_id = s.id
			    AND DATE(a.date) = $1::date
			    AND a.subject_id = $2
			ORDER BY u.first_name
		`, date, subjectID)
	} else {
		// No subject selected: show all students in any grade where this teacher has subjects assigned.
		rows, err = r.db.QueryContext(ctx, `
			SELECT DISTINCT s.id, s.admission_no, u.first_name, u.last_name,
			       COALESCE(a.status::text, ''), COALESCE(a.id::text, '')
			FROM students s
			JOIN users u ON u.id = s.user_id
			JOIN subjects sub ON sub.grade_id = s.grade_id
			JOIN teachers t ON t.id = sub.teacher_id AND t.user_id = $1
			LEFT JOIN attendance a ON a.student_id = s.id
			    AND DATE(a.date) = $2::date
			ORDER BY u.first_name
		`, teacherUserID, date)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []*domain.Attendance
	for rows.Next() {
		a := &domain.Attendance{Student: &domain.Student{User: &domain.User{}}}
		var status string
		var attID string
		err := rows.Scan(
			&a.StudentID, &a.Student.AdmissionNo, &a.Student.User.FirstName, &a.Student.User.LastName,
			&status, &attID,
		)
		if err != nil {
			return nil, err
		}
		if status != "" {
			a.Status = domain.AttendanceStatus(status)
		}
		if attID != "" {
			a.ID = attID
		}
		// Set subject_id if we filtered by it
		if subjectID != "" {
			a.SubjectID = &subjectID
		}
		records = append(records, a)
	}
	return records, nil
}

func (r *AttendanceRepository) ListAll(ctx context.Context, p domain.PaginationParams) ([]*domain.Attendance, int64, error) {
	p.Normalize()

	query := `
		SELECT a.id, a.student_id, a.subject_id, a.date, a.status, a.marked_by, a.notes, a.created_at
		FROM attendance a
	`
	countQuery := `SELECT COUNT(*) FROM attendance a`
	args := []interface{}{}
	argIdx := 1

	// Optional grade filter via students join
	if p.GradeID != "" {
		join := ` JOIN students s ON s.id = a.student_id`
		where := fmt.Sprintf(` WHERE s.grade_id = $%d`, argIdx)
		args = append(args, p.GradeID)
		argIdx++
		query += join + where
		countQuery += join + where
	}

	query += fmt.Sprintf(` ORDER BY a.date DESC LIMIT $%d OFFSET $%d`, argIdx, argIdx+1)
	args = append(args, p.PageSize, p.Offset())

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	records, err := scanAttendance(rows)
	if err != nil {
		return nil, 0, err
	}

	var total int64
	countArgs := args[:argIdx-1] // exclude LIMIT/OFFSET
	if err := r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, err
	}
	return records, total, nil
}

func (r *AttendanceRepository) Update(ctx context.Context, a *domain.Attendance) error {
	_, err := r.db.ExecContext(ctx, `UPDATE attendance SET status=$1, notes=$2 WHERE id=$3`, a.Status, a.Notes, a.ID)
	return err
}

func (r *AttendanceRepository) StudentIDFromUserID(ctx context.Context, userID string) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx, `SELECT id FROM students WHERE user_id = $1`, userID).Scan(&id)
	if err != nil {
		return "", err
	}
	return id, nil
}

func (r *AttendanceRepository) TeacherIDFromUserID(ctx context.Context, userID string) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx, `SELECT id FROM teachers WHERE user_id = $1`, userID).Scan(&id)
	if err != nil {
		return "", err
	}
	return id, nil
}

// ─── Parent Repository ───────────────────────────────────────────────────────

type ParentRepository struct{ db *sql.DB }

func NewParentRepository(db *sql.DB) *ParentRepository { return &ParentRepository{db: db} }

func (r *ParentRepository) List(ctx context.Context, p domain.PaginationParams) ([]*domain.Parent, int64, error) {
	p.Normalize()
	rows, err := r.db.QueryContext(ctx, `
		SELECT p.id, p.user_id, p.occupation, p.address, p.created_at, p.updated_at,
		       u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active
		FROM parents p JOIN users u ON u.id = p.user_id
		WHERE p.deleted_at IS NULL AND ($1 = '' OR u.first_name ILIKE $1 OR u.last_name ILIKE $1)
		ORDER BY u.first_name LIMIT $2 OFFSET $3
	`, "%"+p.Search+"%", p.PageSize, p.Offset())
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var parents []*domain.Parent
	for rows.Next() {
		pa := &domain.Parent{User: &domain.User{}}
		err := rows.Scan(
			&pa.ID, &pa.UserID, &pa.Occupation, &pa.Address, &pa.CreatedAt, &pa.UpdatedAt,
			&pa.User.Email, &pa.User.FirstName, &pa.User.LastName, &pa.User.Phone, &pa.User.AvatarURL, &pa.User.IsActive,
		)
		if err != nil {
			return nil, 0, err
		}
		parents = append(parents, pa)
	}
	var total int64
	if err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM parents p JOIN users u ON u.id = p.user_id
		WHERE p.deleted_at IS NULL AND ($1 = '' OR u.first_name ILIKE $1 OR u.last_name ILIKE $1)
	`, "%"+p.Search+"%").Scan(&total); err != nil {
		return nil, 0, err
	}
	return parents, total, nil
}

func (r *ParentRepository) FindByID(ctx context.Context, id string) (*domain.Parent, error) {
	pa := &domain.Parent{User: &domain.User{}}
	err := r.db.QueryRowContext(ctx, `
		SELECT p.id, p.user_id, p.occupation, p.address, p.created_at, p.updated_at,
		       u.email, u.first_name, u.last_name, u.phone, u.avatar_url
		FROM parents p JOIN users u ON u.id = p.user_id WHERE p.id=$1 AND p.deleted_at IS NULL
	`, id).Scan(&pa.ID, &pa.UserID, &pa.Occupation, &pa.Address, &pa.CreatedAt, &pa.UpdatedAt,
		&pa.User.Email, &pa.User.FirstName, &pa.User.LastName, &pa.User.Phone, &pa.User.AvatarURL)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return pa, err
}

func (r *ParentRepository) FindByUserID(ctx context.Context, userID string) (*domain.Parent, error) {
	pa := &domain.Parent{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, occupation, address, created_at, updated_at FROM parents WHERE user_id=$1
	`, userID).Scan(&pa.ID, &pa.UserID, &pa.Occupation, &pa.Address, &pa.CreatedAt, &pa.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return pa, err
}

func (r *ParentRepository) Create(ctx context.Context, p *domain.Parent) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO parents (user_id, occupation, address) VALUES ($1,$2,$3)
		RETURNING id, created_at, updated_at
	`, p.UserID, p.Occupation, p.Address).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *ParentRepository) Update(ctx context.Context, p *domain.Parent) error {
	_, err := r.db.ExecContext(ctx, `UPDATE parents SET occupation=$1, address=$2, updated_at=NOW() WHERE id=$3`, p.Occupation, p.Address, p.ID)
	return err
}

func (r *ParentRepository) Delete(ctx context.Context, id string) error {
	if _, err := r.db.ExecContext(ctx, `
		UPDATE users SET deleted_at = NOW(), is_active = false
		WHERE id = (SELECT user_id FROM parents WHERE id = $1) AND deleted_at IS NULL
	`, id); err != nil {
		return err
	}
	_, err := r.db.ExecContext(ctx, `UPDATE parents SET deleted_at = NOW() WHERE id=$1`, id)
	return err
}

func (r *ParentRepository) GetChildren(ctx context.Context, parentID string) ([]*domain.Student, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT s.id, s.user_id, s.admission_no, s.grade_id, s.date_of_birth,
		       s.gender, s.created_at, s.updated_at,
		       u.email, u.first_name, u.last_name, u.avatar_url
		FROM students s
		JOIN parent_students ps ON ps.student_id = s.id AND ps.parent_id=$1
		JOIN users u ON u.id = s.user_id
	`, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s := &domain.Student{User: &domain.User{}}
		err := rows.Scan(
			&s.ID, &s.UserID, &s.AdmissionNo, &s.GradeID, &s.DateOfBirth,
			&s.Gender, &s.CreatedAt, &s.UpdatedAt,
			&s.User.Email, &s.User.FirstName, &s.User.LastName, &s.User.AvatarURL,
		)
		if err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, nil
}
