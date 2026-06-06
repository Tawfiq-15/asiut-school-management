package domain

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

type PaginationParams struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Search   string `form:"search"`
	SortBy   string `form:"sort_by"`
	SortDir  string `form:"sort_dir"`
	GradeID  string `form:"grade_id"`
	Status   string `form:"status"`
}

func (p *PaginationParams) Normalize() {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PageSize < 1 {
		p.PageSize = 10
	}
	if p.PageSize > 100 {
		p.PageSize = 100
	}
	if p.SortDir != "asc" && p.SortDir != "desc" {
		p.SortDir = "desc" // default descending
	}
}

func (p *PaginationParams) Offset() int {
	return (p.Page - 1) * p.PageSize
}
