package domain

import "time"

type Grade struct {
	ID              string    `json:"id" db:"id"`
	Name            string    `json:"name" db:"name"`
	Section         *string   `json:"section,omitempty" db:"section"`
	Capacity        int       `json:"capacity" db:"capacity"`
	ClassTeacherID  *string   `json:"class_teacher_id,omitempty" db:"class_teacher_id"`
	Room            *string   `json:"room,omitempty" db:"room"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`

	ClassTeacher *Teacher `json:"class_teacher,omitempty"`
	StudentCount int      `json:"student_count,omitempty"`
}

type Subject struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Code        string    `json:"code" db:"code"`
	GradeID     *string   `json:"grade_id,omitempty" db:"grade_id"`
	TeacherID   *string   `json:"teacher_id,omitempty" db:"teacher_id"`
	Description *string   `json:"description,omitempty" db:"description"`
	Credits     int       `json:"credits" db:"credits"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`

	Grade   *Grade   `json:"grade,omitempty"`
	Teacher *Teacher `json:"teacher,omitempty"`
}

type Schedule struct {
	ID        string    `json:"id" db:"id"`
	GradeID   string    `json:"grade_id" db:"grade_id"`
	SubjectID string    `json:"subject_id" db:"subject_id"`
	TeacherID *string   `json:"teacher_id,omitempty" db:"teacher_id"`
	DayOfWeek int       `json:"day_of_week" db:"day_of_week"`
	StartTime string    `json:"start_time" db:"start_time"`
	EndTime   string    `json:"end_time" db:"end_time"`
	Room      *string   `json:"room,omitempty" db:"room"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`

	Grade   *Grade   `json:"grade,omitempty"`
	Subject *Subject `json:"subject,omitempty"`
	Teacher *Teacher `json:"teacher,omitempty"`
}

type AttendanceStatus string

const (
	AttendancePresent AttendanceStatus = "present"
	AttendanceAbsent  AttendanceStatus = "absent"
	AttendanceLate    AttendanceStatus = "late"
	AttendanceExcused AttendanceStatus = "excused"
)

type Attendance struct {
	ID        string           `json:"id" db:"id"`
	StudentID string           `json:"student_id" db:"student_id"`
	SubjectID *string          `json:"subject_id,omitempty" db:"subject_id"`
	Date      time.Time        `json:"date" db:"date"`
	Status    AttendanceStatus `json:"status" db:"status"`
	MarkedBy  *string          `json:"marked_by,omitempty" db:"marked_by"`
	Notes     *string          `json:"notes,omitempty" db:"notes"`
	CreatedAt time.Time        `json:"created_at" db:"created_at"`

	Student *Student `json:"student,omitempty"`
	Subject *Subject `json:"subject,omitempty"`
}

type Assignment struct {
	ID          string    `json:"id" db:"id"`
	SubjectID   string    `json:"subject_id" db:"subject_id"`
	TeacherID   string    `json:"teacher_id" db:"teacher_id"`
	Title       string    `json:"title" db:"title"`
	Description *string   `json:"description,omitempty" db:"description"`
	DueDate     time.Time `json:"due_date" db:"due_date"`
	TotalMarks  float64   `json:"total_marks" db:"total_marks"`
	FileURL     *string   `json:"file_url,omitempty" db:"file_url"`
	IsPublished bool      `json:"is_published" db:"is_published"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`

	Subject    *Subject    `json:"subject,omitempty"`
	Teacher    *Teacher    `json:"teacher,omitempty"`
	Submission *Submission `json:"submission,omitempty"`
}

type Submission struct {
	ID            string     `json:"id" db:"id"`
	AssignmentID  string     `json:"assignment_id" db:"assignment_id"`
	StudentID     string     `json:"student_id" db:"student_id"`
	FileURL       *string    `json:"file_url,omitempty" db:"file_url"`
	Content       *string    `json:"content,omitempty" db:"content"`
	MarksObtained *float64   `json:"marks_obtained,omitempty" db:"marks_obtained"`
	Feedback      *string    `json:"feedback,omitempty" db:"feedback"`
	IsLate        bool       `json:"is_late" db:"is_late"`
	SubmittedAt   time.Time  `json:"submitted_at" db:"submitted_at"`
	GradedAt      *time.Time `json:"graded_at,omitempty" db:"graded_at"`

	Student    *Student    `json:"student,omitempty"`
	Assignment *Assignment `json:"assignment,omitempty"`
}

type Exam struct {
	ID           string    `json:"id" db:"id"`
	SubjectID    string    `json:"subject_id" db:"subject_id"`
	Title        string    `json:"title" db:"title"`
	ExamType     string    `json:"exam_type" db:"exam_type"`
	Date         time.Time `json:"date" db:"date"`
	DurationMin  int       `json:"duration_min" db:"duration_min"`
	TotalMarks   float64   `json:"total_marks" db:"total_marks"`
	PassMarks    float64   `json:"pass_marks" db:"pass_marks"`
	Instructions *string   `json:"instructions,omitempty" db:"instructions"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`

	Subject *Subject `json:"subject,omitempty"`
}

type ExamResult struct {
	ID            string    `json:"id" db:"id"`
	ExamID        string    `json:"exam_id" db:"exam_id"`
	StudentID     string    `json:"student_id" db:"student_id"`
	MarksObtained *float64  `json:"marks_obtained,omitempty" db:"marks_obtained"`
	GradeLetter   *string   `json:"grade_letter,omitempty" db:"grade_letter"`
	Remarks       *string   `json:"remarks,omitempty" db:"remarks"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`

	Exam    *Exam    `json:"exam,omitempty"`
	Student *Student `json:"student,omitempty"`
}

type LeaveRequest struct {
	ID         string     `json:"id" db:"id"`
	StudentID  string     `json:"student_id" db:"student_id"`
	FromDate   time.Time  `json:"from_date" db:"from_date"`
	ToDate     time.Time  `json:"to_date" db:"to_date"`
	Reason     string     `json:"reason" db:"reason"`
	Status     string     `json:"status" db:"status"`
	ReviewedBy *string    `json:"reviewed_by,omitempty" db:"reviewed_by"`
	ReviewedAt *time.Time `json:"reviewed_at,omitempty" db:"reviewed_at"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`

	Student *Student `json:"student,omitempty"`
}

type MonthlyMark struct {
	ID         string    `json:"id" db:"id"`
	StudentID  string    `json:"student_id" db:"student_id"`
	SubjectID  string    `json:"subject_id" db:"subject_id"`
	Month      string    `json:"month" db:"month"`
	Activity   float64   `json:"activity" db:"activity"`
	Behavior   float64   `json:"behavior" db:"behavior"`
	Project    float64   `json:"project" db:"project"`
	Midterm    float64   `json:"midterm" db:"midterm"`
	Final      float64   `json:"final" db:"final"`
	Attendance float64   `json:"attendance" db:"attendance"`
	Practical  float64   `json:"practical" db:"practical"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`

	Student *Student `json:"student,omitempty"`
}

type AcademicRepository interface {
	// Add abstract repo methods here
}
