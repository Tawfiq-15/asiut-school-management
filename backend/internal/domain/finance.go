package domain

import "time"

type PaymentStatus string

const (
	PaymentPending   PaymentStatus = "pending"
	PaymentPaid      PaymentStatus = "paid"
	PaymentOverdue   PaymentStatus = "overdue"
	PaymentCancelled PaymentStatus = "cancelled"
)

type Payment struct {
	ID            string        `json:"id" db:"id"`
	StudentID     string        `json:"student_id" db:"student_id"`
	Amount        float64       `json:"amount" db:"amount"`
	PaymentType   string        `json:"payment_type" db:"payment_type"`
	PaymentMethod *string       `json:"payment_method,omitempty" db:"payment_method"`
	Status        PaymentStatus `json:"status" db:"status"`
	DueDate       *time.Time    `json:"due_date,omitempty" db:"due_date"`
	PaidAt        *time.Time    `json:"paid_at,omitempty" db:"paid_at"`
	TransactionID *string       `json:"transaction_id,omitempty" db:"transaction_id"`
	Notes         *string       `json:"notes,omitempty" db:"notes"`
	CreatedAt     time.Time     `json:"created_at" db:"created_at"`

	Student *Student `json:"student,omitempty"`
}

type PaymentRepository interface {
	GetByID(id string) (*Payment, error)
	GetByStudentID(studentID string) ([]*Payment, error)
	Create(payment *Payment) error
	Update(payment *Payment) error
}
