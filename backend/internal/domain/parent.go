package domain

import "time"

type Parent struct {
	ID         string    `json:"id" db:"id"`
	UserID     string    `json:"user_id" db:"user_id"`
	Occupation *string   `json:"occupation,omitempty" db:"occupation"`
	Address    *string   `json:"address,omitempty" db:"address"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`

	User     *User      `json:"user,omitempty"`
	Students []*Student `json:"students,omitempty"`
}
