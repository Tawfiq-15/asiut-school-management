package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// Connect establishes a connection to the PostgreSQL database using pgx driver
func Connect() (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", ""),
		getEnv("DB_NAME", "school_management"),
		getEnv("DB_SSLMODE", "disable"),
	)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(time.Hour)
	db.SetConnMaxIdleTime(15 * time.Minute)

	log.Println("✅ Connected to PostgreSQL")
	return db, nil
}

// RunMigrations executes all SQL migration files in order
func RunMigrations(db *sql.DB) error {
	log.Println("🔄 Running database migrations...")

	migrations := []string{
		migrationCreateExtensions,
		migrationCreateUsers,
		migrationCreateStudents,
		migrationCreateTeachers,
		migrationCreateParents,
		migrationCreateGrades,
		migrationCreateSubjects,
		migrationCreateSchedules,
		migrationCreateAttendance,
		migrationCreateAssignments,
		migrationCreateSubmissions,
		migrationCreateExams,
		migrationCreateExamResults,
		migrationCreateAnnouncements,
		migrationCreateNotifications,
		migrationCreateMessages,
		migrationCreatePayments,
		migrationCreateEvents,
		migrationCreateAdmissions,
		migrationCreateLibrary,
		migrationCreateLeaveRequests,
		migrationCreateUploadedFiles,
		migrationCreateMonthlyMarks,
		migrationCreateContactMessages,
		migrationSoftDeleteColumns,
		migrationUserMustChangePassword,
	}

	for _, m := range migrations {
		if _, err := db.Exec(m); err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	}

	log.Println("✅ Migrations complete")
	return nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// ─── Migration SQL ────────────────────────────────────────────────────────────

const migrationCreateExtensions = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
`

const migrationCreateUsers = `
CREATE TABLE IF NOT EXISTS users (
	id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	email         VARCHAR(255) UNIQUE NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	role          VARCHAR(20) NOT NULL CHECK (role IN ('admin','teacher','student','parent')),
	first_name    VARCHAR(100) NOT NULL,
	last_name     VARCHAR(100) NOT NULL,
	phone         VARCHAR(20),
	avatar_url    TEXT,
	is_active     BOOLEAN DEFAULT true,
	is_verified   BOOLEAN DEFAULT false,
	verify_token  VARCHAR(255),
	reset_token   VARCHAR(255),
	reset_token_expires TIMESTAMPTZ,
	last_login    TIMESTAMPTZ,
	created_at    TIMESTAMPTZ DEFAULT NOW(),
	updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_first_name_trgm ON users USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_last_name_trgm ON users USING gin (last_name gin_trgm_ops);
`

const migrationCreateStudents = `
CREATE TABLE IF NOT EXISTS students (
	id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	admission_no  VARCHAR(50) UNIQUE NOT NULL,
	grade_id      UUID,
	date_of_birth DATE,
	gender        VARCHAR(10),
	address       TEXT,
	blood_group   VARCHAR(5),
	nationality   VARCHAR(50),
	religion      VARCHAR(50),
	guardian_name VARCHAR(100),
	admission_date DATE DEFAULT CURRENT_DATE,
	created_at    TIMESTAMPTZ DEFAULT NOW(),
	updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_students_user_id  ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_grade_id ON students(grade_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_no_trgm ON students USING gin (admission_no gin_trgm_ops);
`

const migrationCreateTeachers = `
CREATE TABLE IF NOT EXISTS teachers (
	id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	employee_no     VARCHAR(50) UNIQUE NOT NULL,
	qualification   VARCHAR(255),
	specialization  VARCHAR(255),
	joining_date    DATE DEFAULT CURRENT_DATE,
	salary          NUMERIC(12,2),
	department      VARCHAR(100),
	created_at      TIMESTAMPTZ DEFAULT NOW(),
	updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_employee_no_trgm ON teachers USING gin (employee_no gin_trgm_ops);
`

const migrationCreateParents = `
CREATE TABLE IF NOT EXISTS parents (
	id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	occupation    VARCHAR(100),
	address       TEXT,
	created_at    TIMESTAMPTZ DEFAULT NOW(),
	updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parent_students (
	parent_id  UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
	student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
	relation   VARCHAR(50) DEFAULT 'parent',
	PRIMARY KEY (parent_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON parent_students(student_id);
`

const migrationCreateGrades = `
CREATE TABLE IF NOT EXISTS grades (
	id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	name       VARCHAR(50) NOT NULL,
	section    VARCHAR(10),
	capacity   INT DEFAULT 30,
	class_teacher_id UUID REFERENCES teachers(id),
	room       VARCHAR(50),
	created_at TIMESTAMPTZ DEFAULT NOW(),
	updated_at TIMESTAMPTZ DEFAULT NOW(),
	UNIQUE(name, section)
);

-- Now add the FK on students after grades exists
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints
		WHERE constraint_name = 'students_grade_id_fkey'
	) THEN
		ALTER TABLE students ADD CONSTRAINT students_grade_id_fkey
		FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE SET NULL;
	END IF;
END $$;
`

const migrationCreateSubjects = `
CREATE TABLE IF NOT EXISTS subjects (
	id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	name        VARCHAR(100) NOT NULL,
	code        VARCHAR(20) UNIQUE NOT NULL,
	grade_id    UUID REFERENCES grades(id) ON DELETE SET NULL,
	teacher_id  UUID REFERENCES teachers(id) ON DELETE SET NULL,
	description TEXT,
	credits     INT DEFAULT 1,
	created_at  TIMESTAMPTZ DEFAULT NOW(),
	updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subjects_grade_id   ON subjects(grade_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects(teacher_id);
`

const migrationCreateSchedules = `
CREATE TABLE IF NOT EXISTS schedules (
	id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	grade_id    UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
	subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
	teacher_id  UUID REFERENCES teachers(id) ON DELETE SET NULL,
	day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
	start_time  TIME NOT NULL,
	end_time    TIME NOT NULL,
	room        VARCHAR(50),
	created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schedules_grade_id ON schedules(grade_id);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher_id ON schedules(teacher_id);
`

const migrationCreateAttendance = `
CREATE TABLE IF NOT EXISTS attendance (
	id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
	subject_id  UUID REFERENCES subjects(id) ON DELETE SET NULL,
	date        DATE NOT NULL,
	status      VARCHAR(20) NOT NULL CHECK (status IN ('present','absent','late','excused')),
	marked_by   UUID REFERENCES teachers(id) ON DELETE SET NULL,
	notes       TEXT,
	created_at  TIMESTAMPTZ DEFAULT NOW(),
	UNIQUE(student_id, date, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id      ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date            ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date    ON attendance(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status          ON attendance(status);
`

const migrationCreateAssignments = `
CREATE TABLE IF NOT EXISTS assignments (
	id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	subject_id   UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
	teacher_id   UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
	title        VARCHAR(255) NOT NULL,
	description  TEXT,
	due_date     TIMESTAMPTZ NOT NULL,
	total_marks  NUMERIC(6,2) DEFAULT 100,
	file_url     TEXT,
	is_published BOOLEAN DEFAULT true,
	created_at   TIMESTAMPTZ DEFAULT NOW(),
	updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON assignments(subject_id);
`

const migrationCreateSubmissions = `
CREATE TABLE IF NOT EXISTS submissions (
	id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	assignment_id   UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
	student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
	file_url        TEXT,
	content         TEXT,
	marks_obtained  NUMERIC(6,2),
	feedback        TEXT,
	is_late         BOOLEAN DEFAULT false,
	submitted_at    TIMESTAMPTZ DEFAULT NOW(),
	graded_at       TIMESTAMPTZ,
	UNIQUE(assignment_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id    ON submissions(student_id);
`

const migrationCreateExams = `
CREATE TABLE IF NOT EXISTS exams (
	id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	subject_id   UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
	title        VARCHAR(255) NOT NULL,
	exam_type    VARCHAR(50) DEFAULT 'written',
	date         TIMESTAMPTZ NOT NULL,
	duration_min INT DEFAULT 60,
	total_marks  NUMERIC(6,2) DEFAULT 100,
	pass_marks   NUMERIC(6,2) DEFAULT 40,
	instructions TEXT,
	created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON exams(subject_id);
`

const migrationCreateExamResults = `
CREATE TABLE IF NOT EXISTS exam_results (
	id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	exam_id        UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
	student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
	marks_obtained NUMERIC(6,2),
	grade_letter   VARCHAR(5),
	remarks        TEXT,
	created_at     TIMESTAMPTZ DEFAULT NOW(),
	UNIQUE(exam_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON exam_results(exam_id);
`

const migrationCreateAnnouncements = `
CREATE TABLE IF NOT EXISTS announcements (
	id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	title        VARCHAR(255) NOT NULL,
	content      TEXT NOT NULL,
	target_roles VARCHAR(20)[] DEFAULT ARRAY['admin','teacher','student','parent'],
	is_pinned    BOOLEAN DEFAULT false,
	created_at   TIMESTAMPTZ DEFAULT NOW(),
	updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned  ON announcements(is_pinned DESC, created_at DESC);
`

const migrationCreateNotifications = `
CREATE TABLE IF NOT EXISTS notifications (
	id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	title      VARCHAR(255) NOT NULL,
	message    TEXT NOT NULL,
	type       VARCHAR(50) DEFAULT 'info',
	is_read    BOOLEAN DEFAULT false,
	link       TEXT,
	created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
`

const migrationCreateMessages = `
CREATE TABLE IF NOT EXISTS messages (
	id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	content     TEXT NOT NULL,
	is_read     BOOLEAN DEFAULT false,
	created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id   ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
`

const migrationCreatePayments = `
CREATE TABLE IF NOT EXISTS payments (
	id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
	amount         NUMERIC(12,2) NOT NULL,
	payment_type   VARCHAR(50) NOT NULL,
	payment_method VARCHAR(50),
	status         VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
	due_date       DATE,
	paid_at        TIMESTAMPTZ,
	transaction_id VARCHAR(255),
	notes          TEXT,
	created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments(status);
`

const migrationCreateEvents = `
CREATE TABLE IF NOT EXISTS events (
	id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	title       VARCHAR(255) NOT NULL,
	description TEXT,
	event_date  TIMESTAMPTZ NOT NULL,
	end_date    TIMESTAMPTZ,
	location    VARCHAR(255),
	image_url   TEXT,
	is_public   BOOLEAN DEFAULT true,
	created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
	created_at  TIMESTAMPTZ DEFAULT NOW()
);
`

const migrationCreateAdmissions = `
CREATE TABLE IF NOT EXISTS admissions (
	id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	student_name    VARCHAR(255) NOT NULL,
	date_of_birth   DATE,
	gender          VARCHAR(10),
	applying_grade  VARCHAR(50),
	parent_name     VARCHAR(255) NOT NULL,
	parent_email    VARCHAR(255) NOT NULL,
	parent_phone    VARCHAR(20),
	address         TEXT,
	previous_school VARCHAR(255),
	status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected')),
	notes           TEXT,
	applied_at      TIMESTAMPTZ DEFAULT NOW(),
	reviewed_at     TIMESTAMPTZ,
	reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
`

const migrationCreateLibrary = `
CREATE TABLE IF NOT EXISTS books (
	id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	title        VARCHAR(255) NOT NULL,
	author       VARCHAR(255),
	isbn         VARCHAR(20) UNIQUE,
	category     VARCHAR(100),
	total_copies INT DEFAULT 1,
	available    INT DEFAULT 1,
	published_at DATE,
	created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_loans (
	id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
	student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
	loaned_at   TIMESTAMPTZ DEFAULT NOW(),
	due_date    DATE NOT NULL,
	returned_at TIMESTAMPTZ,
	status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','returned','overdue'))
);
CREATE INDEX IF NOT EXISTS idx_book_loans_book_id ON book_loans(book_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_student_id ON book_loans(student_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_status ON book_loans(status);
`

const migrationCreateLeaveRequests = `
CREATE TABLE IF NOT EXISTS leave_requests (
	id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
	from_date   DATE NOT NULL,
	to_date     DATE NOT NULL,
	reason      TEXT NOT NULL,
	status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
	reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
	reviewed_at TIMESTAMPTZ,
	created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leave_requests_student_id ON leave_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status     ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON leave_requests(created_at DESC);
`

const migrationCreateUploadedFiles = `
CREATE TABLE IF NOT EXISTS uploaded_files (
	id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	filename   VARCHAR(255) NOT NULL,
	mime_type  VARCHAR(100) NOT NULL,
	size       BIGINT NOT NULL,
	content    BYTEA NOT NULL,
	created_at TIMESTAMPTZ DEFAULT NOW()
);
`

const migrationCreateMonthlyMarks = `
CREATE TABLE IF NOT EXISTS monthly_marks (
	id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
	subject_id    UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
	month         VARCHAR(20) NOT NULL,
	activity      NUMERIC(5,2) DEFAULT 0,
	behavior      NUMERIC(5,2) DEFAULT 0,
	project       NUMERIC(5,2) DEFAULT 0,
	midterm       NUMERIC(5,2) DEFAULT 0,
	final         NUMERIC(5,2) DEFAULT 0,
	attendance    NUMERIC(5,2) DEFAULT 0,
	practical     NUMERIC(5,2) DEFAULT 0,
	created_at    TIMESTAMPTZ DEFAULT NOW(),
	updated_at    TIMESTAMPTZ DEFAULT NOW(),
	UNIQUE(student_id, subject_id, month)
);
CREATE INDEX IF NOT EXISTS idx_monthly_marks_student_id ON monthly_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_monthly_marks_subject_id ON monthly_marks(subject_id);
`

const migrationCreateContactMessages = `
CREATE TABLE IF NOT EXISTS contact_messages (
	id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	name       VARCHAR(255) NOT NULL,
	email      VARCHAR(255) NOT NULL,
	subject    VARCHAR(255) NOT NULL,
	message    TEXT NOT NULL,
	handled    BOOLEAN DEFAULT false,
	created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_handled    ON contact_messages(handled);
`

// migrationSoftDeleteColumns adds a deleted_at marker to the core "owner"
// entities so they can be soft-deleted (preserving historical/transactional
// rows that reference them) and adds partial indexes so live-row lookups stay
// fast. Idempotent via ADD COLUMN IF NOT EXISTS.
const migrationSoftDeleteColumns = `
ALTER TABLE users    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE parents  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE grades   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE books    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_not_deleted    ON users(id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_not_deleted ON students(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_not_deleted ON teachers(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_parents_not_deleted  ON parents(id)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_grades_not_deleted   ON grades(id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_subjects_not_deleted ON subjects(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_books_not_deleted    ON books(id)    WHERE deleted_at IS NULL;
`

// migrationUserMustChangePassword flags accounts created with a server-generated
// temporary password so the UI can force a reset on first login.
const migrationUserMustChangePassword = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
`

