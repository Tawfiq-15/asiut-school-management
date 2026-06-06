package domain

import "time"

type Book struct {
	ID          string     `json:"id" db:"id"`
	Title       string     `json:"title" db:"title"`
	Author      *string    `json:"author,omitempty" db:"author"`
	ISBN        *string    `json:"isbn,omitempty" db:"isbn"`
	Category    *string    `json:"category,omitempty" db:"category"`
	TotalCopies int        `json:"total_copies" db:"total_copies"`
	Available   int        `json:"available" db:"available"`
	PublishedAt *time.Time `json:"published_at,omitempty" db:"published_at"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}
