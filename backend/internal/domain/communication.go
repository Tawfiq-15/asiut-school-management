package domain

import "time"

type Announcement struct {
	ID          string    `json:"id" db:"id"`
	AuthorID    string    `json:"author_id" db:"author_id"`
	Title       string    `json:"title" db:"title"`
	Content     string    `json:"content" db:"content"`
	TargetRoles []string  `json:"target_roles" db:"target_roles"`
	IsPinned    bool      `json:"is_pinned" db:"is_pinned"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`

	Author *User `json:"author,omitempty"`
}

type AnnouncementComment struct {
	ID             string    `json:"id" db:"id"`
	AnnouncementID string    `json:"announcement_id" db:"announcement_id"`
	UserID         string    `json:"user_id" db:"user_id"`
	Content        string    `json:"content" db:"content"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`

	User *User `json:"user,omitempty"`
}

type Notification struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Title     string    `json:"title" db:"title"`
	Message   string    `json:"message" db:"message"`
	Type      string    `json:"type" db:"type"`
	IsRead    bool      `json:"is_read" db:"is_read"`
	Link      *string   `json:"link,omitempty" db:"link"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Message struct {
	ID         string    `json:"id" db:"id"`
	SenderID   string    `json:"sender_id" db:"sender_id"`
	ReceiverID string    `json:"receiver_id" db:"receiver_id"`
	Content    string    `json:"content" db:"content"`
	IsRead     bool      `json:"is_read" db:"is_read"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`

	Sender   *User `json:"sender,omitempty"`
	Receiver *User `json:"receiver,omitempty"`
}

type Event struct {
	ID          string     `json:"id" db:"id"`
	Title       string     `json:"title" db:"title"`
	Description *string    `json:"description,omitempty" db:"description"`
	EventDate   time.Time  `json:"event_date" db:"event_date"`
	EndDate     *time.Time `json:"end_date,omitempty" db:"end_date"`
	Location    *string    `json:"location,omitempty" db:"location"`
	ImageURL    *string    `json:"image_url,omitempty" db:"image_url"`
	IsPublic    bool       `json:"is_public" db:"is_public"`
	CreatedBy   *string    `json:"created_by,omitempty" db:"created_by"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}
