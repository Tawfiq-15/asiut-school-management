package http

import (
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"school-management/backend/internal/domain"
	"school-management/backend/internal/middleware"
	"school-management/backend/internal/usecase"
)

// ─── Grade Handler ────────────────────────────────────────────────────────────

type GradeHandler struct{ svc *usecase.GradeService }

func NewGradeHandler(svc *usecase.GradeService) *GradeHandler { return &GradeHandler{svc: svc} }

func (h *GradeHandler) List(c *gin.Context) {
	grades, err := h.svc.List(c.Request.Context())
	respondOrError(c, grades, err)
}

func (h *GradeHandler) GetByID(c *gin.Context) {
	g, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	respondOrError(c, g, err)
}

func (h *GradeHandler) Create(c *gin.Context) {
	var g domain.Grade
	if err := c.ShouldBindJSON(&g); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Create(c.Request.Context(), &g); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, g)
}

func (h *GradeHandler) Update(c *gin.Context) {
	var g domain.Grade
	if err := c.ShouldBindJSON(&g); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	g.ID = c.Param("id")
	respondOrError(c, &g, h.svc.Update(c.Request.Context(), &g))
}

func (h *GradeHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Class deleted"})
}

func (h *GradeHandler) MyClasses(c *gin.Context) {
	userID := middleware.GetUserID(c)
	grades, err := h.svc.GetByTeacher(c.Request.Context(), userID)
	respondOrError(c, grades, err)
}

// ─── Subject Handler ──────────────────────────────────────────────────────────

type SubjectHandler struct{ svc *usecase.SubjectService }

func NewSubjectHandler(svc *usecase.SubjectService) *SubjectHandler { return &SubjectHandler{svc: svc} }

func (h *SubjectHandler) List(c *gin.Context) {
	subjects, err := h.svc.List(c.Request.Context())
	respondOrError(c, subjects, err)
}

func (h *SubjectHandler) GetByID(c *gin.Context) {
	s, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	respondOrError(c, s, err)
}

func (h *SubjectHandler) Create(c *gin.Context) {
	var s domain.Subject
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Create(c.Request.Context(), &s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, s)
}

func (h *SubjectHandler) Update(c *gin.Context) {
	var s domain.Subject
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	s.ID = c.Param("id")
	respondOrError(c, &s, h.svc.Update(c.Request.Context(), &s))
}

func (h *SubjectHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Subject deleted"})
}

func (h *SubjectHandler) MySubjects(c *gin.Context) {
	userID := middleware.GetUserID(c)
	subjects, err := h.svc.GetByTeacher(c.Request.Context(), userID)
	respondOrError(c, subjects, err)
}

// ─── Schedule Handler ─────────────────────────────────────────────────────────

type ScheduleHandler struct{ svc *usecase.ScheduleService }

func NewScheduleHandler(svc *usecase.ScheduleService) *ScheduleHandler {
	return &ScheduleHandler{svc: svc}
}

func (h *ScheduleHandler) List(c *gin.Context) {
	sc, err := h.svc.List(c.Request.Context())
	respondOrError(c, sc, err)
}

func (h *ScheduleHandler) MySchedule(c *gin.Context) {
	userID := middleware.GetUserID(c)
	sc, err := h.svc.ByTeacher(c.Request.Context(), userID)
	respondOrError(c, sc, err)
}

func (h *ScheduleHandler) MyStudentSchedule(c *gin.Context) {
	gradeID := c.Query("grade_id")
	if gradeID == "" {
		studentUserID := middleware.GetUserID(c)
		var gid sql.NullString
		_ = h.svc.DB().QueryRowContext(c.Request.Context(), `
			SELECT grade_id FROM students WHERE user_id = $1
		`, studentUserID).Scan(&gid)
		if gid.Valid {
			gradeID = gid.String
		}
	}
	sc, err := h.svc.ByGrade(c.Request.Context(), gradeID)
	respondOrError(c, sc, err)
}

func (h *ScheduleHandler) Create(c *gin.Context) {
	var s domain.Schedule
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Create(c.Request.Context(), &s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, s)
}

func (h *ScheduleHandler) Update(c *gin.Context) {
	var s domain.Schedule
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	s.ID = c.Param("id")
	respondOrError(c, &s, h.svc.Update(c.Request.Context(), &s))
}

func (h *ScheduleHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Schedule deleted"})
}

// ─── Attendance Handler ───────────────────────────────────────────────────────

type AttendanceHandler struct{ svc *usecase.AttendanceService }

func NewAttendanceHandler(svc *usecase.AttendanceService) *AttendanceHandler {
	return &AttendanceHandler{svc: svc}
}

type BulkAttendanceInput struct {
	Records []struct {
		StudentID string `json:"student_id"`
		SubjectID string `json:"subject_id"`
		Date      string `json:"date"`
		Status    string `json:"status"`
		Notes     string `json:"notes"`
	} `json:"records"`
}

func (h *AttendanceHandler) BulkMark(c *gin.Context) {
	var input BulkAttendanceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	teacherID := middleware.GetUserID(c)
	var records []*domain.Attendance
	for _, r := range input.Records {
		date, _ := time.Parse("2006-01-02", r.Date)
		subID := &r.SubjectID
		if r.SubjectID == "" {
			subID = nil
		}
		notes := &r.Notes
		if r.Notes == "" {
			notes = nil
		}
		records = append(records, &domain.Attendance{
			StudentID: r.StudentID,
			SubjectID: subID,
			Date:      date,
			Status:    domain.AttendanceStatus(r.Status),
			MarkedBy:  &teacherID,
			Notes:     notes,
		})
	}
	if err := h.svc.BulkMark(c.Request.Context(), records); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Attendance marked", "count": len(records)})
}

func (h *AttendanceHandler) MyAttendance(c *gin.Context) {
	userID := middleware.GetUserID(c)
	limit := 100
	if l := c.Query("limit"); l != "" {
		limit, _ = strconv.Atoi(l)
	}

	// Resolve user_id → student.id (attendance table stores students.id, not users.id)
	studentID, err := h.svc.StudentIDFromUserID(c.Request.Context(), userID)
	if err != nil || studentID == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "student profile not found"})
		return
	}

	records, err := h.svc.ByStudent(c.Request.Context(), studentID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	present, absent, late, _ := h.svc.Summary(c.Request.Context(), studentID)
	c.JSON(http.StatusOK, gin.H{
		"records": records,
		"summary": gin.H{"present": present, "absent": absent, "late": late},
	})
}

func (h *AttendanceHandler) ForParent(c *gin.Context) {
	studentID := c.Param("studentId")
	if !guardParentOwnsStudent(c, h.svc.DB(), studentID) {
		return
	}
	records, err := h.svc.ByStudent(c.Request.Context(), studentID, 100)
	respondOrError(c, records, err)
}

func (h *AttendanceHandler) ListAll(c *gin.Context) {
	var p domain.PaginationParams
	c.ShouldBindQuery(&p)
	records, total, err := h.svc.ListAll(c.Request.Context(), p)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": records, "total": total})
}

func (h *AttendanceHandler) ListByTeacher(c *gin.Context) {
	userID := middleware.GetUserID(c)
	dateStr := c.Query("date")
	subjectID := c.Query("subject_id")
	records, err := h.svc.ByTeacherAndDate(c.Request.Context(), userID, dateStr, subjectID)
	respondOrError(c, records, err)
}

func (h *AttendanceHandler) Update(c *gin.Context) {
	var a domain.Attendance
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	a.ID = c.Param("id")
	respondOrError(c, &a, h.svc.Update(c.Request.Context(), &a))
}

func (h *AttendanceHandler) Report(c *gin.Context) {
	var p domain.PaginationParams
	c.ShouldBindQuery(&p)
	p.Normalize()
	records, total, err := h.svc.ListAll(c.Request.Context(), p)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": records, "total": total})
}

// ─── Assignment Handler ───────────────────────────────────────────────────────

type AssignmentHandler struct{ svc *usecase.AssignmentService }

func NewAssignmentHandler(svc *usecase.AssignmentService) *AssignmentHandler {
	return &AssignmentHandler{svc: svc}
}

func (h *AssignmentHandler) ListAll(c *gin.Context) {
	list, err := h.svc.ListAll(c.Request.Context())
	respondOrError(c, list, err)
}

func (h *AssignmentHandler) ListByTeacher(c *gin.Context) {
	userID := middleware.GetUserID(c)
	assignments, err := h.svc.ByTeacher(c.Request.Context(), userID)
	respondOrError(c, assignments, err)
}

func (h *AssignmentHandler) Create(c *gin.Context) {
	var a domain.Assignment
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	a.TeacherID = middleware.GetUserID(c)
	if err := h.svc.Create(c.Request.Context(), &a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, a)
}

func (h *AssignmentHandler) GetByID(c *gin.Context) {
	a, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	respondOrError(c, a, err)
}

func (h *AssignmentHandler) Update(c *gin.Context) {
	var a domain.Assignment
	if err := c.ShouldBindJSON(&a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	a.ID = c.Param("id")
	if err := h.svc.Update(c.Request.Context(), &a); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, a)
}

func (h *AssignmentHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Assignment deleted"})
}

func (h *AssignmentHandler) ListSubmissions(c *gin.Context) {
	list, err := h.svc.ListSubmissions(c.Request.Context(), c.Param("id"))
	respondOrError(c, list, err)
}

func (h *AssignmentHandler) Submit(c *gin.Context) {
	var body struct {
		Content string `json:"content"`
		FileURL string `json:"file_url"`
	}
	// Body is optional (a submission may be just a file uploaded separately),
	// but if one is supplied it must be valid JSON.
	if err := c.ShouldBindJSON(&body); err != nil && err != io.EOF {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	studentUserID := middleware.GetUserID(c)
	var studentID string
	var err error
	err = h.svc.DB().QueryRowContext(c.Request.Context(), `
		SELECT id FROM students WHERE user_id = $1
	`, studentUserID).Scan(&studentID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "student profile not found"})
		return
	}
	assignment, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil || assignment == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "assignment not found"})
		return
	}
	isLate := time.Now().After(assignment.DueDate)
	fileURL := &body.FileURL
	if body.FileURL == "" {
		fileURL = nil
	}
	content := &body.Content
	if body.Content == "" {
		content = nil
	}
	sub := &domain.Submission{
		AssignmentID: c.Param("id"),
		StudentID:    studentID,
		FileURL:      fileURL,
		Content:      content,
		IsLate:       isLate,
	}
	if err := h.svc.Submit(c.Request.Context(), sub); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, sub)
}

func (h *AssignmentHandler) GradeSubmission(c *gin.Context) {
	var body struct {
		MarksObtained float64 `json:"marks_obtained"`
		Marks         float64 `json:"marks"` // legacy alias
		Feedback      string  `json:"feedback"`
	}
	if err := c.ShouldBindJSON(&body); err != nil && err != io.EOF {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Accept either marks_obtained (frontend) or marks (legacy)
	marks := body.MarksObtained
	if marks == 0 && body.Marks != 0 {
		marks = body.Marks
	}
	if err := h.svc.GradeSubmission(c.Request.Context(), c.Param("id"), marks, body.Feedback); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Graded successfully"})
}

func (h *AssignmentHandler) MyAssignments(c *gin.Context) {
	studentUserID := middleware.GetUserID(c)
	var studentID, gradeID string
	err := h.svc.DB().QueryRowContext(c.Request.Context(), `
		SELECT id, grade_id FROM students WHERE user_id = $1
	`, studentUserID).Scan(&studentID, &gradeID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "student profile not found"})
		return
	}

	assignments, err := h.svc.ByGrade(c.Request.Context(), gradeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, a := range assignments {
		sub, err := h.svc.FindSubmission(c.Request.Context(), a.ID, studentID)
		if err == nil && sub != nil {
			a.Submission = sub
		}
	}

	c.JSON(http.StatusOK, assignments)
}

func (h *AssignmentHandler) ForParent(c *gin.Context) {
	studentID := c.Param("studentId")
	if !guardParentOwnsStudent(c, h.svc.DB(), studentID) {
		return
	}
	var gradeID string
	err := h.svc.DB().QueryRowContext(c.Request.Context(), `
		SELECT grade_id FROM students WHERE id = $1
	`, studentID).Scan(&gradeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student profile not found"})
		return
	}

	assignments, err := h.svc.ByGrade(c.Request.Context(), gradeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, a := range assignments {
		sub, err := h.svc.FindSubmission(c.Request.Context(), a.ID, studentID)
		if err == nil && sub != nil {
			a.Submission = sub
		}
	}

	c.JSON(http.StatusOK, assignments)
}

// ─── Exam Handler ─────────────────────────────────────────────────────────────

type ExamHandler struct{ svc *usecase.ExamService }

func NewExamHandler(svc *usecase.ExamService) *ExamHandler { return &ExamHandler{svc: svc} }

func (h *ExamHandler) ListAll(c *gin.Context) {
	list, err := h.svc.ListAll(c.Request.Context())
	respondOrError(c, list, err)
}

func (h *ExamHandler) ListByTeacher(c *gin.Context) {
	userID := middleware.GetUserID(c)
	list, err := h.svc.ByTeacher(c.Request.Context(), userID)
	respondOrError(c, list, err)
}

func (h *ExamHandler) MyResults(c *gin.Context) {
	userID := middleware.GetUserID(c)
	list, err := h.svc.ResultsByStudent(c.Request.Context(), userID)
	respondOrError(c, list, err)
}

func (h *ExamHandler) ForParent(c *gin.Context) {
	studentID := c.Param("studentId")
	if !guardParentOwnsStudent(c, h.svc.DB(), studentID) {
		return
	}
	list, err := h.svc.ResultsByStudent(c.Request.Context(), studentID)
	respondOrError(c, list, err)
}

func (h *ExamHandler) Create(c *gin.Context) {
	var e domain.Exam
	if err := c.ShouldBindJSON(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Create(c.Request.Context(), &e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, e)
}

func (h *ExamHandler) Update(c *gin.Context) {
	var e domain.Exam
	if err := c.ShouldBindJSON(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	e.ID = c.Param("id")
	respondOrError(c, &e, h.svc.Update(c.Request.Context(), &e))
}

func (h *ExamHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Exam deleted"})
}

func (h *ExamHandler) ListResults(c *gin.Context) {
	list, err := h.svc.ListResults(c.Request.Context(), c.Param("id"))
	respondOrError(c, list, err)
}

func (h *ExamHandler) BulkSaveResults(c *gin.Context) {
	// Accept both a bare array and the {results:[...]} wrapper sent by the frontend.
	body, _ := c.GetRawData()

	var results []*domain.ExamResult

	// Try wrapped form first.
	var wrapped struct {
		Results []*domain.ExamResult `json:"results"`
	}
	if err := json.Unmarshal(body, &wrapped); err == nil && len(wrapped.Results) > 0 {
		results = wrapped.Results
	} else if err := json.Unmarshal(body, &results); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	examID := c.Param("id")
	for _, r := range results {
		r.ExamID = examID
	}
	if err := h.svc.BulkSaveResults(c.Request.Context(), results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Results saved", "count": len(results)})
}

// ─── Monthly Mark Handler ─────────────────────────────────────────────────────

type MonthlyMarkHandler struct{ svc *usecase.MonthlyMarkService }

func NewMonthlyMarkHandler(svc *usecase.MonthlyMarkService) *MonthlyMarkHandler {
	return &MonthlyMarkHandler{svc: svc}
}

func (h *MonthlyMarkHandler) GetMarks(c *gin.Context) {
	subjectID := c.Query("subject_id")
	month := c.Query("month")
	list, err := h.svc.GetMarks(c.Request.Context(), subjectID, month)
	respondOrError(c, list, err)
}

func (h *MonthlyMarkHandler) SaveMarks(c *gin.Context) {
	var input struct {
		Marks []map[string]interface{} `json:"marks"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.SaveMarks(c.Request.Context(), input.Marks); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Marks saved successfully"})
}
