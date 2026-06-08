package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"school-management/backend/internal/domain"
)

type UserRepository struct{ db *sql.DB }

func NewUserRepository(db *sql.DB) *UserRepository { return &UserRepository{db: db} }

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	u := &domain.User{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, email, password_hash, role, first_name, last_name,
		       phone, avatar_url, is_active, is_verified, verify_token,
		       reset_token, reset_token_expires, last_login, created_at, updated_at
		FROM users WHERE email = $1 AND deleted_at IS NULL
	`, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role,
		&u.FirstName, &u.LastName, &u.Phone, &u.AvatarURL,
		&u.IsActive, &u.IsVerified, &u.VerifyToken,
		&u.ResetToken, &u.ResetTokenExpires, &u.LastLogin,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	u := &domain.User{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, email, password_hash, role, first_name, last_name,
		       phone, avatar_url, is_active, is_verified, verify_token,
		       reset_token, reset_token_expires, last_login, created_at, updated_at
		FROM users WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role,
		&u.FirstName, &u.LastName, &u.Phone, &u.AvatarURL,
		&u.IsActive, &u.IsVerified, &u.VerifyToken,
		&u.ResetToken, &u.ResetTokenExpires, &u.LastLogin,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (r *UserRepository) Create(ctx context.Context, u *domain.User) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO users (email, password_hash, role, first_name, last_name, phone, verify_token, is_verified, must_change_password)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`, u.Email, u.PasswordHash, u.Role, u.FirstName, u.LastName, u.Phone, u.VerifyToken, u.IsVerified, u.MustChangePassword,
	).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
}

func (r *UserRepository) Update(ctx context.Context, u *domain.User) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE users SET first_name=$1, last_name=$2, phone=$3, avatar_url=$4, updated_at=NOW()
		WHERE id=$5
	`, u.FirstName, u.LastName, u.Phone, u.AvatarURL, u.ID)
	return err
}

func (r *UserRepository) UpdatePassword(ctx context.Context, userID, hash string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE users SET password_hash=$1, reset_token=NULL, reset_token_expires=NULL, updated_at=NOW() WHERE id=$2`,
		hash, userID,
	)
	return err
}

func (r *UserRepository) SetVerified(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE users SET is_verified=true, verify_token=NULL, updated_at=NOW() WHERE id=$1`,
		userID,
	)
	return err
}

func (r *UserRepository) SetResetToken(ctx context.Context, userID, token string, expires time.Time) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE users SET reset_token=$1, reset_token_expires=$2, updated_at=NOW() WHERE id=$3`,
		token, expires, userID,
	)
	return err
}

func (r *UserRepository) FindByResetToken(ctx context.Context, token string) (*domain.User, error) {
	u := &domain.User{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, email, password_hash, role, first_name, last_name,
		       phone, avatar_url, is_active, is_verified, verify_token,
		       reset_token, reset_token_expires, last_login, created_at, updated_at
		FROM users WHERE reset_token=$1 AND reset_token_expires > NOW()
	`, token).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role,
		&u.FirstName, &u.LastName, &u.Phone, &u.AvatarURL,
		&u.IsActive, &u.IsVerified, &u.VerifyToken,
		&u.ResetToken, &u.ResetTokenExpires, &u.LastLogin,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (r *UserRepository) FindByVerifyToken(ctx context.Context, token string) (*domain.User, error) {
	u := &domain.User{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, email, role, first_name, last_name, is_verified
		FROM users WHERE verify_token=$1
	`, token).Scan(&u.ID, &u.Email, &u.Role, &u.FirstName, &u.LastName, &u.IsVerified)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return u, err
}

func (r *UserRepository) UpdateLastLogin(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE users SET last_login=NOW() WHERE id=$1`, userID,
	)
	return err
}

func (r *UserRepository) UpdateAvatar(ctx context.Context, userID, avatarURL string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE users SET avatar_url=$1, updated_at=NOW() WHERE id=$2`, avatarURL, userID,
	)
	return err
}

// ─── Student Repository ────────────────────────────────────────────────────────

type StudentRepository struct{ db *sql.DB }

func NewStudentRepository(db *sql.DB) *StudentRepository { return &StudentRepository{db: db} }

func (r *StudentRepository) List(ctx context.Context, p domain.PaginationParams) ([]*domain.Student, int64, error) {
	p.Normalize()
	query := `
		SELECT s.id, s.user_id, s.admission_no, s.grade_id, s.date_of_birth,
		       s.gender, s.address, s.blood_group, s.nationality, s.religion,
		       s.guardian_name, s.admission_date, s.created_at, s.updated_at,
		       u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active,
		       g.name as grade_name, g.section as grade_section
		FROM students s
		JOIN users u ON u.id = s.user_id
		LEFT JOIN grades g ON g.id = s.grade_id
	`
	args := []interface{}{}
	argIdx := 1
	whereClauses := []string{"s.deleted_at IS NULL"}

	if p.Search != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("(u.first_name ILIKE $%d OR u.last_name ILIKE $%d OR s.admission_no ILIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, "%"+p.Search+"%")
		argIdx++
	}

	if p.GradeID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("s.grade_id = $%d", argIdx))
		args = append(args, p.GradeID)
		argIdx++
	}

	query += " WHERE " + strings.Join(whereClauses, " AND ")

	query += fmt.Sprintf(" ORDER BY u.first_name %s LIMIT $%d OFFSET $%d", p.SortDir, argIdx, argIdx+1)
	args = append(args, p.PageSize, p.Offset())

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s := &domain.Student{User: &domain.User{}, Grade: &domain.Grade{}}
		var gradeName, gradeSection *string
		err := rows.Scan(
			&s.ID, &s.UserID, &s.AdmissionNo, &s.GradeID, &s.DateOfBirth,
			&s.Gender, &s.Address, &s.BloodGroup, &s.Nationality, &s.Religion,
			&s.GuardianName, &s.AdmissionDate, &s.CreatedAt, &s.UpdatedAt,
			&s.User.Email, &s.User.FirstName, &s.User.LastName, &s.User.Phone, &s.User.AvatarURL, &s.User.IsActive,
			&gradeName, &gradeSection,
		)
		if err != nil {
			return nil, 0, err
		}
		if gradeName != nil {
			s.Grade.Name = *gradeName
		}
		if gradeSection != nil {
			s.Grade.Section = gradeSection
		}
		students = append(students, s)
	}

	var total int64
	countQuery := "SELECT COUNT(*) FROM students s JOIN users u ON u.id = s.user_id"
	countArgs := []interface{}{}
	countWhereClauses := []string{"s.deleted_at IS NULL"}
	countIdx := 1

	if p.Search != "" {
		countWhereClauses = append(countWhereClauses, fmt.Sprintf("(u.first_name ILIKE $%d OR u.last_name ILIKE $%d OR s.admission_no ILIKE $%d)", countIdx, countIdx, countIdx))
		countArgs = append(countArgs, "%"+p.Search+"%")
		countIdx++
	}

	if p.GradeID != "" {
		countWhereClauses = append(countWhereClauses, fmt.Sprintf("s.grade_id = $%d", countIdx))
		countArgs = append(countArgs, p.GradeID)
		countIdx++
	}

	countQuery += " WHERE " + strings.Join(countWhereClauses, " AND ")

	err = r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		total = 0
	}

	return students, total, nil
}

func (r *StudentRepository) FindByID(ctx context.Context, id string) (*domain.Student, error) {
	s := &domain.Student{User: &domain.User{}, Grade: &domain.Grade{}}
	var gradeName, gradeSection *string
	err := r.db.QueryRowContext(ctx, `
		SELECT s.id, s.user_id, s.admission_no, s.grade_id, s.date_of_birth,
		       s.gender, s.address, s.blood_group, s.nationality, s.religion,
		       s.guardian_name, s.admission_date, s.created_at, s.updated_at,
		       u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active, u.is_verified,
		       g.name, g.section
		FROM students s
		JOIN users u ON u.id = s.user_id
		LEFT JOIN grades g ON g.id = s.grade_id
		WHERE s.id = $1 AND s.deleted_at IS NULL
	`, id).Scan(
		&s.ID, &s.UserID, &s.AdmissionNo, &s.GradeID, &s.DateOfBirth,
		&s.Gender, &s.Address, &s.BloodGroup, &s.Nationality, &s.Religion,
		&s.GuardianName, &s.AdmissionDate, &s.CreatedAt, &s.UpdatedAt,
		&s.User.Email, &s.User.FirstName, &s.User.LastName, &s.User.Phone, &s.User.AvatarURL, &s.User.IsActive, &s.User.IsVerified,
		&gradeName, &gradeSection,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if gradeName != nil {
		s.Grade.Name = *gradeName
	}
	if gradeSection != nil {
		s.Grade.Section = gradeSection
	}
	return s, err
}

func (r *StudentRepository) FindByUserID(ctx context.Context, userID string) (*domain.Student, error) {
	s := &domain.Student{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, admission_no, grade_id, date_of_birth,
		       gender, address, blood_group, nationality, religion,
		       guardian_name, admission_date, created_at, updated_at
		FROM students WHERE user_id = $1
	`, userID).Scan(
		&s.ID, &s.UserID, &s.AdmissionNo, &s.GradeID, &s.DateOfBirth,
		&s.Gender, &s.Address, &s.BloodGroup, &s.Nationality, &s.Religion,
		&s.GuardianName, &s.AdmissionDate, &s.CreatedAt, &s.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return s, err
}

func (r *StudentRepository) Create(ctx context.Context, s *domain.Student) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO students (user_id, admission_no, grade_id, date_of_birth, gender, address, blood_group, nationality, religion, guardian_name)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		RETURNING id, created_at, updated_at
	`, s.UserID, s.AdmissionNo, s.GradeID, s.DateOfBirth, s.Gender, s.Address, s.BloodGroup, s.Nationality, s.Religion, s.GuardianName,
	).Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)
}

func (r *StudentRepository) Update(ctx context.Context, s *domain.Student) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE students SET grade_id=$1, date_of_birth=$2, gender=$3, address=$4,
		       blood_group=$5, nationality=$6, religion=$7, guardian_name=$8, updated_at=NOW()
		WHERE id=$9
	`, s.GradeID, s.DateOfBirth, s.Gender, s.Address, s.BloodGroup, s.Nationality, s.Religion, s.GuardianName, s.ID)
	return err
}

// Delete soft-deletes a student and its backing user account so historical
// records (attendance, results, payments) are preserved while the student no
// longer appears in listings and can no longer log in.
func (r *StudentRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE users SET deleted_at = NOW(), is_active = false
		WHERE id = (SELECT user_id FROM students WHERE id = $1) AND deleted_at IS NULL
	`, id)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx, `UPDATE students SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *StudentRepository) CountByGrade(ctx context.Context, gradeID string) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM students WHERE grade_id=$1`, gradeID).Scan(&count)
	return count, err
}

func (r *StudentRepository) ListByTeacherGrades(ctx context.Context, teacherUserID string, p domain.PaginationParams) ([]*domain.Student, int64, error) {
	p.Normalize()

	// Resolve user_id → teacher profile_id in a single subquery per call.
	resolvedID := `COALESCE((SELECT id FROM teachers WHERE user_id = $1::uuid), $1::uuid)`

	query := fmt.Sprintf(`
		SELECT DISTINCT s.id, s.user_id, s.admission_no, s.grade_id,
		       u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active,
		       g.name as grade_name, g.section as grade_section
		FROM students s
		JOIN users u ON u.id = s.user_id
		LEFT JOIN grades g ON g.id = s.grade_id
		WHERE s.grade_id IN (
			SELECT DISTINCT sub.grade_id FROM subjects sub WHERE sub.teacher_id = %s
		)
	`, resolvedID)
	args := []interface{}{teacherUserID}
	argIdx := 2

	if p.GradeID != "" {
		query += fmt.Sprintf(" AND s.grade_id = $%d", argIdx)
		args = append(args, p.GradeID)
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY u.first_name LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, p.PageSize, p.Offset())

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s := &domain.Student{User: &domain.User{}, Grade: &domain.Grade{}}
		var gradeName, gradeSection *string
		err := rows.Scan(
			&s.ID, &s.UserID, &s.AdmissionNo, &s.GradeID,
			&s.User.Email, &s.User.FirstName, &s.User.LastName, &s.User.Phone, &s.User.AvatarURL, &s.User.IsActive,
			&gradeName, &gradeSection,
		)
		if err != nil {
			return nil, 0, err
		}
		if gradeName != nil {
			s.Grade.Name = *gradeName
		}
		if gradeSection != nil {
			s.Grade.Section = gradeSection
		}
		students = append(students, s)
	}

	var total int64
	countQuery := fmt.Sprintf(`
		SELECT COUNT(DISTINCT s.id) FROM students s
		WHERE s.grade_id IN (SELECT DISTINCT sub.grade_id FROM subjects sub WHERE sub.teacher_id = %s)
	`, resolvedID)
	countArgs := []interface{}{teacherUserID}
	if p.GradeID != "" {
		countQuery += " AND s.grade_id = $2"
		countArgs = append(countArgs, p.GradeID)
	}
	if err := r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, err
	}

	return students, total, nil
}

// ─── Teacher Repository ─────────────────────────────────────────────────────────

type TeacherRepository struct{ db *sql.DB }

func NewTeacherRepository(db *sql.DB) *TeacherRepository { return &TeacherRepository{db: db} }

func (r *TeacherRepository) List(ctx context.Context, p domain.PaginationParams) ([]*domain.Teacher, int64, error) {
	p.Normalize()
	rows, err := r.db.QueryContext(ctx, `
		SELECT t.id, t.user_id, t.employee_no, t.qualification, t.specialization,
		       t.joining_date, t.salary, t.department, t.created_at, t.updated_at,
		       u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active
		FROM teachers t JOIN users u ON u.id = t.user_id
		WHERE t.deleted_at IS NULL AND ($1 = '' OR u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR t.employee_no ILIKE $1)
		ORDER BY u.first_name `+p.SortDir+`
		LIMIT $2 OFFSET $3
	`, "%"+p.Search+"%", p.PageSize, p.Offset())
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var teachers []*domain.Teacher
	for rows.Next() {
		t := &domain.Teacher{User: &domain.User{}}
		err := rows.Scan(
			&t.ID, &t.UserID, &t.EmployeeNo, &t.Qualification, &t.Specialization,
			&t.JoiningDate, &t.Salary, &t.Department, &t.CreatedAt, &t.UpdatedAt,
			&t.User.Email, &t.User.FirstName, &t.User.LastName, &t.User.Phone, &t.User.AvatarURL, &t.User.IsActive,
		)
		if err != nil {
			return nil, 0, err
		}
		teachers = append(teachers, t)
	}

	var total int64
	if err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM teachers t JOIN users u ON u.id = t.user_id
		WHERE t.deleted_at IS NULL AND ($1 = '' OR u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR t.employee_no ILIKE $1)
	`, "%"+p.Search+"%").Scan(&total); err != nil {
		return nil, 0, err
	}

	return teachers, total, nil
}

func (r *TeacherRepository) FindByID(ctx context.Context, id string) (*domain.Teacher, error) {
	t := &domain.Teacher{User: &domain.User{}}
	err := r.db.QueryRowContext(ctx, `
		SELECT t.id, t.user_id, t.employee_no, t.qualification, t.specialization,
		       t.joining_date, t.salary, t.department, t.created_at, t.updated_at,
		       u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active
		FROM teachers t JOIN users u ON u.id = t.user_id
		WHERE t.id = $1 AND t.deleted_at IS NULL
	`, id).Scan(
		&t.ID, &t.UserID, &t.EmployeeNo, &t.Qualification, &t.Specialization,
		&t.JoiningDate, &t.Salary, &t.Department, &t.CreatedAt, &t.UpdatedAt,
		&t.User.Email, &t.User.FirstName, &t.User.LastName, &t.User.Phone, &t.User.AvatarURL, &t.User.IsActive,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return t, err
}

func (r *TeacherRepository) FindByUserID(ctx context.Context, userID string) (*domain.Teacher, error) {
	t := &domain.Teacher{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, employee_no, qualification, specialization,
		       joining_date, salary, department, created_at, updated_at
		FROM teachers WHERE user_id = $1
	`, userID).Scan(
		&t.ID, &t.UserID, &t.EmployeeNo, &t.Qualification, &t.Specialization,
		&t.JoiningDate, &t.Salary, &t.Department, &t.CreatedAt, &t.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return t, err
}

func (r *TeacherRepository) Create(ctx context.Context, t *domain.Teacher) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO teachers (user_id, employee_no, qualification, specialization, joining_date, salary, department)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, created_at, updated_at
	`, t.UserID, t.EmployeeNo, t.Qualification, t.Specialization, t.JoiningDate, t.Salary, t.Department,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
}

func (r *TeacherRepository) Update(ctx context.Context, t *domain.Teacher) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE teachers SET qualification=$1, specialization=$2, salary=$3, department=$4, updated_at=NOW()
		WHERE id=$5
	`, t.Qualification, t.Specialization, t.Salary, t.Department, t.ID)
	return err
}

// Delete soft-deletes a teacher and its user account. Subjects referencing the
// teacher keep their FK (SET NULL on hard delete is preserved logically by the
// teacher simply no longer appearing).
func (r *TeacherRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE users SET deleted_at = NOW(), is_active = false
		WHERE id = (SELECT user_id FROM teachers WHERE id = $1) AND deleted_at IS NULL
	`, id)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx, `UPDATE teachers SET deleted_at = NOW() WHERE id = $1`, id)
	return err
}

// ─── Grade Repository ─────────────────────────────────────────────────────────

type GradeRepository struct{ db *sql.DB }

func NewGradeRepository(db *sql.DB) *GradeRepository { return &GradeRepository{db: db} }

func (r *GradeRepository) List(ctx context.Context) ([]*domain.Grade, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT g.id, g.name, g.section, g.capacity, g.class_teacher_id, g.room, g.created_at, g.updated_at,
		       COUNT(s.id) as student_count
		FROM grades g
		LEFT JOIN students s ON s.grade_id = g.id AND s.deleted_at IS NULL
		WHERE g.deleted_at IS NULL
		GROUP BY g.id
		ORDER BY g.name, g.section
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var grades []*domain.Grade
	for rows.Next() {
		g := &domain.Grade{}
		err := rows.Scan(&g.ID, &g.Name, &g.Section, &g.Capacity, &g.ClassTeacherID, &g.Room, &g.CreatedAt, &g.UpdatedAt, &g.StudentCount)
		if err != nil {
			return nil, err
		}
		grades = append(grades, g)
	}
	return grades, nil
}

func (r *GradeRepository) FindByID(ctx context.Context, id string) (*domain.Grade, error) {
	g := &domain.Grade{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, name, section, capacity, class_teacher_id, room, created_at, updated_at
		FROM grades WHERE id=$1 AND deleted_at IS NULL
	`, id).Scan(&g.ID, &g.Name, &g.Section, &g.Capacity, &g.ClassTeacherID, &g.Room, &g.CreatedAt, &g.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return g, err
}

func (r *GradeRepository) Create(ctx context.Context, g *domain.Grade) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO grades (name, section, capacity, class_teacher_id, room)
		VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at, updated_at
	`, g.Name, g.Section, g.Capacity, g.ClassTeacherID, g.Room).Scan(&g.ID, &g.CreatedAt, &g.UpdatedAt)
}

func (r *GradeRepository) Update(ctx context.Context, g *domain.Grade) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE grades SET name=$1, section=$2, capacity=$3, class_teacher_id=$4, room=$5, updated_at=NOW()
		WHERE id=$6
	`, g.Name, g.Section, g.Capacity, g.ClassTeacherID, g.Room, g.ID)
	return err
}

func (r *GradeRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE grades SET deleted_at = NOW() WHERE id=$1`, id)
	return err
}

func (r *GradeRepository) FindByTeacher(ctx context.Context, teacherID string) ([]*domain.Grade, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT DISTINCT g.id, g.name, g.section, g.capacity, g.class_teacher_id, g.room, g.created_at, g.updated_at
		FROM grades g
		JOIN subjects sub ON sub.grade_id = g.id
		WHERE sub.teacher_id = COALESCE(
			(SELECT id FROM teachers WHERE user_id = $1::uuid),
			$1::uuid
		)
		ORDER BY g.name
	`, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var grades []*domain.Grade
	for rows.Next() {
		g := &domain.Grade{}
		err := rows.Scan(&g.ID, &g.Name, &g.Section, &g.Capacity, &g.ClassTeacherID, &g.Room, &g.CreatedAt, &g.UpdatedAt)
		if err != nil {
			return nil, err
		}
		grades = append(grades, g)
	}
	return grades, nil
}

// ─── Monthly Mark Repository ──────────────────────────────────────────────────

type MonthlyMarkRepository struct{ db *sql.DB }

func NewMonthlyMarkRepository(db *sql.DB) *MonthlyMarkRepository { return &MonthlyMarkRepository{db: db} }

func (r *MonthlyMarkRepository) ListBySubjectAndMonth(ctx context.Context, subjectID string, month string) ([]*domain.MonthlyMark, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT m.id, m.student_id, m.subject_id, m.month, m.activity, m.behavior,
		       m.project, m.midterm, m.final, m.attendance, m.practical, m.created_at, m.updated_at,
		       u.first_name, u.last_name, s.admission_no
		FROM monthly_marks m
		JOIN students s ON s.id = m.student_id
		JOIN users u ON u.id = s.user_id
		WHERE m.subject_id = $1 AND m.month = $2
		ORDER BY u.first_name
	`, subjectID, month)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var marks []*domain.MonthlyMark
	for rows.Next() {
		m := &domain.MonthlyMark{Student: &domain.Student{User: &domain.User{}}}
		err := rows.Scan(
			&m.ID, &m.StudentID, &m.SubjectID, &m.Month, &m.Activity, &m.Behavior,
			&m.Project, &m.Midterm, &m.Final, &m.Attendance, &m.Practical, &m.CreatedAt, &m.UpdatedAt,
			&m.Student.User.FirstName, &m.Student.User.LastName, &m.Student.AdmissionNo,
		)
		if err != nil {
			return nil, err
		}
		marks = append(marks, m)
	}
	return marks, nil
}

func (r *MonthlyMarkRepository) Upsert(ctx context.Context, m *domain.MonthlyMark) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO monthly_marks (student_id, subject_id, month, activity, behavior, project, midterm, final, attendance, practical)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (student_id, subject_id, month) DO UPDATE SET
			activity = EXCLUDED.activity,
			behavior = EXCLUDED.behavior,
			project = EXCLUDED.project,
			midterm = EXCLUDED.midterm,
			final = EXCLUDED.final,
			attendance = EXCLUDED.attendance,
			practical = EXCLUDED.practical,
			updated_at = NOW()
	`, m.StudentID, m.SubjectID, m.Month, m.Activity, m.Behavior, m.Project, m.Midterm, m.Final, m.Attendance, m.Practical)
	return err
}

func (r *MonthlyMarkRepository) BulkUpsert(ctx context.Context, marks []*domain.MonthlyMark) error {
	if len(marks) == 0 {
		return nil
	}
	// Build a single multi-row INSERT … ON CONFLICT upsert.
	query := `INSERT INTO monthly_marks
		(student_id, subject_id, month, activity, behavior, project, midterm, final, attendance, practical)
		VALUES `
	args := make([]interface{}, 0, len(marks)*10)
	for i, m := range marks {
		base := i * 10
		if i > 0 {
			query += ","
		}
		query += fmt.Sprintf("($%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d,$%d)",
			base+1, base+2, base+3, base+4, base+5, base+6, base+7, base+8, base+9, base+10)
		args = append(args, m.StudentID, m.SubjectID, m.Month,
			m.Activity, m.Behavior, m.Project, m.Midterm, m.Final, m.Attendance, m.Practical)
	}
	query += ` ON CONFLICT (student_id, subject_id, month) DO UPDATE SET
		activity = EXCLUDED.activity, behavior = EXCLUDED.behavior,
		project = EXCLUDED.project, midterm = EXCLUDED.midterm,
		final = EXCLUDED.final, attendance = EXCLUDED.attendance,
		practical = EXCLUDED.practical, updated_at = NOW()`
	_, err := r.db.ExecContext(ctx, query, args...)
	return err
}
