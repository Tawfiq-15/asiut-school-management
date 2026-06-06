package domain

import "time"

type Student struct {
	ID            string     `json:"id" db:"id"`
	UserID        string     `json:"user_id" db:"user_id"`
	AdmissionNo   string     `json:"admission_no" db:"admission_no"`
	GradeID       *string    `json:"grade_id,omitempty" db:"grade_id"`
	DateOfBirth   *time.Time `json:"date_of_birth,omitempty" db:"date_of_birth"`
	Gender        *string    `json:"gender,omitempty" db:"gender"`
	Address       *string    `json:"address,omitempty" db:"address"`
	BloodGroup    *string    `json:"blood_group,omitempty" db:"blood_group"`
	Nationality   *string    `json:"nationality,omitempty" db:"nationality"`
	Religion      *string    `json:"religion,omitempty" db:"religion"`
	GuardianName  *string    `json:"guardian_name,omitempty" db:"guardian_name"`
	AdmissionDate *time.Time `json:"admission_date,omitempty" db:"admission_date"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`

	User  *User  `json:"user,omitempty"`
	Grade *Grade `json:"grade,omitempty"`
}

type AdmissionStatus string

const (
	AdmissionPending   AdmissionStatus = "pending"
	AdmissionReviewing AdmissionStatus = "reviewing"
	AdmissionApproved  AdmissionStatus = "approved"
	AdmissionRejected  AdmissionStatus = "rejected"
	AdmissionEnrolled  AdmissionStatus = "enrolled"
)

type Admission struct {
	ID             string          `json:"id" db:"id"`
	StudentName    string          `json:"student_name" db:"student_name"`
	DateOfBirth    *time.Time      `json:"date_of_birth,omitempty" db:"date_of_birth"`
	Gender         *string         `json:"gender,omitempty" db:"gender"`
	ApplyingGrade  *string         `json:"applying_grade,omitempty" db:"applying_grade"`
	ParentName     string          `json:"parent_name" db:"parent_name"`
	ParentEmail    string          `json:"parent_email" db:"parent_email"`
	ParentPhone    *string         `json:"parent_phone,omitempty" db:"parent_phone"`
	Address        *string         `json:"address,omitempty" db:"address"`
	PreviousSchool *string         `json:"previous_school,omitempty" db:"previous_school"`
	Status         AdmissionStatus `json:"status" db:"status"`
	Notes          *string         `json:"notes,omitempty" db:"notes"`
	AppliedAt      time.Time       `json:"applied_at" db:"applied_at"`
	ReviewedAt     *time.Time      `json:"reviewed_at,omitempty" db:"reviewed_at"`
	ReviewedBy     *string         `json:"reviewed_by,omitempty" db:"reviewed_by"`
}

type StudentRepository interface {
	GetByID(id string) (*Student, error)
	GetByUserID(userID string) (*Student, error)
	List(offset, limit int) ([]*Student, int64, error)
	Create(student *Student) error
	Update(student *Student) error
}
