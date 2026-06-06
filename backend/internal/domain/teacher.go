package domain

import "time"

type Teacher struct {
	ID             string     `json:"id" db:"id"`
	UserID         string     `json:"user_id" db:"user_id"`
	EmployeeNo     string     `json:"employee_no" db:"employee_no"`
	Qualification  *string    `json:"qualification,omitempty" db:"qualification"`
	Specialization *string    `json:"specialization,omitempty" db:"specialization"`
	JoiningDate    *time.Time `json:"joining_date,omitempty" db:"joining_date"`
	Salary         *float64   `json:"salary,omitempty" db:"salary"`
	Department     *string    `json:"department,omitempty" db:"department"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`

	User *User `json:"user,omitempty"`
}

type TeacherRepository interface {
	GetByID(id string) (*Teacher, error)
	GetByUserID(userID string) (*Teacher, error)
	List(offset, limit int) ([]*Teacher, int64, error)
	Create(teacher *Teacher) error
	Update(teacher *Teacher) error
}
