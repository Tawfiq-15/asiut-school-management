package repository

import (
	"context"
	"database/sql"
	"fmt"
	"school-management/backend/internal/domain"
)

// ─── Assignment Repository ────────────────────────────────────────────────────

type AssignmentRepository struct{ db *sql.DB }

func NewAssignmentRepository(db *sql.DB) *AssignmentRepository { return &AssignmentRepository{db: db} }

func (r *AssignmentRepository) DB() *sql.DB { return r.db }

func (r *AssignmentRepository) ListByTeacher(ctx context.Context, teacherID string) ([]*domain.Assignment, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT a.id, a.subject_id, a.teacher_id, a.title, a.description, a.due_date, a.total_marks, a.file_url, a.is_published, a.created_at, a.updated_at,
		       s.name, s.code
		FROM assignments a
		LEFT JOIN subjects s ON s.id = a.subject_id
		WHERE a.teacher_id = COALESCE(
			(SELECT id FROM teachers WHERE user_id = $1::uuid),
			$1::uuid
		)
		ORDER BY a.due_date DESC
	`, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAssignments(rows)
}

func (r *AssignmentRepository) ListByGrade(ctx context.Context, gradeID string) ([]*domain.Assignment, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT a.id, a.subject_id, a.teacher_id, a.title, a.description, a.due_date, a.total_marks, a.file_url, a.is_published, a.created_at, a.updated_at,
		       s.name, s.code
		FROM assignments a
		JOIN subjects s ON s.id = a.subject_id AND s.grade_id=$1
		WHERE a.is_published=true
		ORDER BY a.due_date DESC
	`, gradeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAssignments(rows)
}

func scanAssignments(rows *sql.Rows) ([]*domain.Assignment, error) {
	var list []*domain.Assignment
	for rows.Next() {
		a := &domain.Assignment{Subject: &domain.Subject{}}
		err := rows.Scan(
			&a.ID, &a.SubjectID, &a.TeacherID, &a.Title, &a.Description, &a.DueDate,
			&a.TotalMarks, &a.FileURL, &a.IsPublished, &a.CreatedAt, &a.UpdatedAt,
			&a.Subject.Name, &a.Subject.Code,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, nil
}

func (r *AssignmentRepository) ListAll(ctx context.Context) ([]*domain.Assignment, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT a.id, a.subject_id, a.teacher_id, a.title, a.description, a.due_date, a.total_marks, a.file_url, a.is_published, a.created_at, a.updated_at,
		       s.name, s.code
		FROM assignments a
		LEFT JOIN subjects s ON s.id = a.subject_id
		ORDER BY a.due_date DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAssignments(rows)
}

func (r *AssignmentRepository) FindByID(ctx context.Context, id string) (*domain.Assignment, error) {
	a := &domain.Assignment{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, subject_id, teacher_id, title, description, due_date, total_marks, file_url, is_published, created_at, updated_at
		FROM assignments WHERE id=$1
	`, id).Scan(&a.ID, &a.SubjectID, &a.TeacherID, &a.Title, &a.Description, &a.DueDate, &a.TotalMarks, &a.FileURL, &a.IsPublished, &a.CreatedAt, &a.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return a, err
}

func (r *AssignmentRepository) Create(ctx context.Context, a *domain.Assignment) error {
	// Resolve user_id → teacher profile id inline.
	if err := r.db.QueryRowContext(ctx,
		`SELECT COALESCE((SELECT id FROM teachers WHERE user_id = $1::uuid), $1::uuid)`,
		a.TeacherID,
	).Scan(&a.TeacherID); err != nil {
		return fmt.Errorf("resolve teacher id: %w", err)
	}
	return r.db.QueryRowContext(ctx, `
		INSERT INTO assignments (subject_id, teacher_id, title, description, due_date, total_marks, file_url, is_published)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, created_at, updated_at
	`, a.SubjectID, a.TeacherID, a.Title, a.Description, a.DueDate, a.TotalMarks, a.FileURL, a.IsPublished,
	).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
}

func (r *AssignmentRepository) Update(ctx context.Context, a *domain.Assignment) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE assignments SET title=$1, description=$2, due_date=$3, total_marks=$4, file_url=$5, is_published=$6, updated_at=NOW()
		WHERE id=$7
	`, a.Title, a.Description, a.DueDate, a.TotalMarks, a.FileURL, a.IsPublished, a.ID)
	return err
}

func (r *AssignmentRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM assignments WHERE id=$1`, id)
	return err
}

func (r *AssignmentRepository) ListSubmissions(ctx context.Context, assignmentID string) ([]*domain.Submission, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT sub.id, sub.assignment_id, sub.student_id, sub.file_url, sub.content,
		       sub.marks_obtained, sub.feedback, sub.is_late, sub.submitted_at, sub.graded_at,
		       u.first_name, u.last_name, s.admission_no
		FROM submissions sub
		JOIN students s ON s.id = sub.student_id
		JOIN users u ON u.id = s.user_id
		WHERE sub.assignment_id=$1
		ORDER BY sub.submitted_at
	`, assignmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*domain.Submission
	for rows.Next() {
		s := &domain.Submission{Student: &domain.Student{User: &domain.User{}}}
		err := rows.Scan(
			&s.ID, &s.AssignmentID, &s.StudentID, &s.FileURL, &s.Content,
			&s.MarksObtained, &s.Feedback, &s.IsLate, &s.SubmittedAt, &s.GradedAt,
			&s.Student.User.FirstName, &s.Student.User.LastName, &s.Student.AdmissionNo,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *AssignmentRepository) FindSubmission(ctx context.Context, assignmentID, studentID string) (*domain.Submission, error) {
	s := &domain.Submission{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, assignment_id, student_id, file_url, content, marks_obtained, feedback, is_late, submitted_at, graded_at
		FROM submissions WHERE assignment_id=$1 AND student_id=$2
	`, assignmentID, studentID).Scan(
		&s.ID, &s.AssignmentID, &s.StudentID, &s.FileURL, &s.Content,
		&s.MarksObtained, &s.Feedback, &s.IsLate, &s.SubmittedAt, &s.GradedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return s, err
}

func (r *AssignmentRepository) CreateSubmission(ctx context.Context, s *domain.Submission) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO submissions (assignment_id, student_id, file_url, content, is_late)
		VALUES ($1,$2,$3,$4,$5)
		ON CONFLICT (assignment_id, student_id) DO UPDATE
		SET file_url=EXCLUDED.file_url, content=EXCLUDED.content, is_late=EXCLUDED.is_late
		RETURNING id, submitted_at
	`, s.AssignmentID, s.StudentID, s.FileURL, s.Content, s.IsLate).Scan(&s.ID, &s.SubmittedAt)
}

func (r *AssignmentRepository) GradeSubmission(ctx context.Context, id string, marks float64, feedback string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE submissions SET marks_obtained=$1, feedback=$2, graded_at=NOW() WHERE id=$3
	`, marks, feedback, id)
	return err
}

// ─── Exam Repository ──────────────────────────────────────────────────────────

type ExamRepository struct{ db *sql.DB }

func NewExamRepository(db *sql.DB) *ExamRepository { return &ExamRepository{db: db} }

func (r *ExamRepository) DB() *sql.DB { return r.db }

func (r *ExamRepository) ListByTeacher(ctx context.Context, teacherID string) ([]*domain.Exam, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT e.id, e.subject_id, e.title, e.exam_type, e.date, e.duration_min, e.total_marks, e.pass_marks, e.instructions, e.created_at,
		       s.name, s.code
		FROM exams e
		JOIN subjects s ON s.id = e.subject_id
		WHERE s.teacher_id = COALESCE(
			(SELECT id FROM teachers WHERE user_id = $1::uuid),
			$1::uuid
		)
		ORDER BY e.date DESC
	`, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanExams(rows)
}

func (r *ExamRepository) ListByGrade(ctx context.Context, gradeID string) ([]*domain.Exam, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT e.id, e.subject_id, e.title, e.exam_type, e.date, e.duration_min, e.total_marks, e.pass_marks, e.instructions, e.created_at,
		       s.name, s.code
		FROM exams e
		JOIN subjects s ON s.id = e.subject_id AND s.grade_id=$1
		ORDER BY e.date DESC
	`, gradeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanExams(rows)
}

func scanExams(rows *sql.Rows) ([]*domain.Exam, error) {
	var list []*domain.Exam
	for rows.Next() {
		e := &domain.Exam{Subject: &domain.Subject{}}
		err := rows.Scan(
			&e.ID, &e.SubjectID, &e.Title, &e.ExamType, &e.Date, &e.DurationMin,
			&e.TotalMarks, &e.PassMarks, &e.Instructions, &e.CreatedAt,
			&e.Subject.Name, &e.Subject.Code,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}

func (r *ExamRepository) ListAll(ctx context.Context) ([]*domain.Exam, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT e.id, e.subject_id, e.title, e.exam_type, e.date, e.duration_min, e.total_marks, e.pass_marks, e.instructions, e.created_at,
		       s.name, s.code
		FROM exams e
		LEFT JOIN subjects s ON s.id = e.subject_id
		ORDER BY e.date DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanExams(rows)
}

func (r *ExamRepository) Create(ctx context.Context, e *domain.Exam) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO exams (subject_id, title, exam_type, date, duration_min, total_marks, pass_marks, instructions)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, created_at
	`, e.SubjectID, e.Title, e.ExamType, e.Date, e.DurationMin, e.TotalMarks, e.PassMarks, e.Instructions,
	).Scan(&e.ID, &e.CreatedAt)
}

func (r *ExamRepository) Update(ctx context.Context, e *domain.Exam) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE exams SET title=$1, exam_type=$2, date=$3, duration_min=$4, total_marks=$5, pass_marks=$6, instructions=$7
		WHERE id=$8
	`, e.Title, e.ExamType, e.Date, e.DurationMin, e.TotalMarks, e.PassMarks, e.Instructions, e.ID)
	return err
}

func (r *ExamRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM exams WHERE id=$1`, id)
	return err
}

func (r *ExamRepository) ListResults(ctx context.Context, examID string) ([]*domain.ExamResult, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT er.id, er.exam_id, er.student_id, er.marks_obtained, er.grade_letter, er.remarks, er.created_at,
		       u.first_name, u.last_name, s.admission_no
		FROM exam_results er
		JOIN students s ON s.id = er.student_id
		JOIN users u ON u.id = s.user_id
		WHERE er.exam_id=$1 ORDER BY u.first_name
	`, examID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*domain.ExamResult
	for rows.Next() {
		r2 := &domain.ExamResult{Student: &domain.Student{User: &domain.User{}}}
		err := rows.Scan(
			&r2.ID, &r2.ExamID, &r2.StudentID, &r2.MarksObtained, &r2.GradeLetter, &r2.Remarks, &r2.CreatedAt,
			&r2.Student.User.FirstName, &r2.Student.User.LastName, &r2.Student.AdmissionNo,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, r2)
	}
	return list, nil
}

func (r *ExamRepository) FindResultsByStudent(ctx context.Context, studentID string) ([]*domain.ExamResult, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT er.id, er.exam_id, er.student_id, er.marks_obtained, er.grade_letter, er.remarks, er.created_at,
		       e.title, e.total_marks, e.date, s.name
		FROM exam_results er
		JOIN exams e ON e.id = er.exam_id
		JOIN subjects s ON s.id = e.subject_id
		WHERE er.student_id=$1 ORDER BY e.date DESC
	`, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*domain.ExamResult
	for rows.Next() {
		r2 := &domain.ExamResult{Exam: &domain.Exam{Subject: &domain.Subject{}}}
		err := rows.Scan(
			&r2.ID, &r2.ExamID, &r2.StudentID, &r2.MarksObtained, &r2.GradeLetter, &r2.Remarks, &r2.CreatedAt,
			&r2.Exam.Title, &r2.Exam.TotalMarks, &r2.Exam.Date, &r2.Exam.Subject.Name,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, r2)
	}
	return list, nil
}

func (r *ExamRepository) BulkSaveResults(ctx context.Context, results []*domain.ExamResult) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade_letter, remarks)
		VALUES ($1,$2,$3,$4,$5)
		ON CONFLICT (exam_id, student_id) DO UPDATE
		SET marks_obtained=EXCLUDED.marks_obtained, grade_letter=EXCLUDED.grade_letter, remarks=EXCLUDED.remarks
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, res := range results {
		if _, err := stmt.ExecContext(ctx, res.ExamID, res.StudentID, res.MarksObtained, res.GradeLetter, res.Remarks); err != nil {
			return err
		}
	}
	return tx.Commit()
}
