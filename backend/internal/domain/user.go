package domain

import "time"

type Role string

const (
	RoleAdmin   Role = "admin"
	RoleTeacher Role = "teacher"
	RoleStudent Role = "student"
	RoleParent  Role = "parent"
)

type User struct {
	ID                 string     `json:"id" db:"id"`
	Email              string     `json:"email" db:"email"`
	PasswordHash       string     `json:"-" db:"password_hash"`
	Role               Role       `json:"role" db:"role"`
	FirstName          string     `json:"first_name" db:"first_name"`
	LastName           string     `json:"last_name" db:"last_name"`
	Phone              *string    `json:"phone,omitempty" db:"phone"`
	AvatarURL          *string    `json:"avatar_url,omitempty" db:"avatar_url"`
	IsActive           bool       `json:"is_active" db:"is_active"`
	IsVerified         bool       `json:"is_verified" db:"is_verified"`
	VerifyToken        *string    `json:"-" db:"verify_token"`
	ResetToken         *string    `json:"-" db:"reset_token"`
	ResetTokenExpires  *time.Time `json:"-" db:"reset_token_expires"`
	LastLogin          *time.Time `json:"last_login,omitempty" db:"last_login"`
	MustChangePassword bool       `json:"must_change_password" db:"must_change_password"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`

	// GeneratedPassword is a transient, write-once field. When an account is
	// created with a server-generated temporary password, the plaintext is
	// surfaced here exactly once in the create response so an admin can relay
	// it. It is never stored (db:"-") and is omitted when empty.
	GeneratedPassword string `json:"generated_password,omitempty" db:"-"`
}

func (u *User) FullName() string {
	return u.FirstName + " " + u.LastName
}

type UserRepository interface {
	GetByID(id string) (*User, error)
	GetByEmail(email string) (*User, error)
	Create(user *User) error
	Update(user *User) error
}
