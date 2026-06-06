package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"school-management/backend/internal/domain"
	"school-management/backend/internal/repository"
)

// GenerateTempPassword returns a cryptographically-random temporary password
// for admin-provisioned accounts. ~16 hex chars of entropy with a guaranteed
// symbol/case mix so it satisfies typical password policies.
func GenerateTempPassword() string {
	b := make([]byte, 9)
	if _, err := rand.Read(b); err != nil {
		// Extremely unlikely; fall back to a time-seeded value so we never
		// return an empty or predictable-constant password.
		return "Tmp!" + hex.EncodeToString([]byte(time.Now().String()))[:12]
	}
	return "Aa1!" + hex.EncodeToString(b)
}

// resolveCredential decides the password to store for a new account. When the
// admin supplied one we hash it as-is; otherwise we generate a secure temporary
// password, return its plaintext (for one-time display) and flag the account so
// the user is forced to change it on first login.
func resolveCredential(supplied string) (hash string, generatedPlaintext string, mustChange bool, err error) {
	plaintext := supplied
	if plaintext == "" {
		plaintext = GenerateTempPassword()
		generatedPlaintext = plaintext
		mustChange = true
	}
	h, err := bcrypt.GenerateFromPassword([]byte(plaintext), 12)
	if err != nil {
		return "", "", false, err
	}
	return string(h), generatedPlaintext, mustChange, nil
}

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

func (s *AuthService) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	return s.userRepo.FindByID(ctx, id)
}

func (s *AuthService) UpdateUser(ctx context.Context, u *domain.User) error {
	return s.userRepo.Update(ctx, u)
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type RegisterInput struct {
	Email     string     `json:"email" binding:"required,email"`
	Password  string     `json:"password" binding:"required,min=8"`
	FirstName string     `json:"first_name" binding:"required"`
	LastName  string     `json:"last_name" binding:"required"`
	Role      domain.Role `json:"role" binding:"required"`
	Phone     string     `json:"phone"`
}

func (s *AuthService) Login(ctx context.Context, input LoginInput) (*domain.User, error) {
	user, err := s.userRepo.FindByEmail(ctx, input.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid credentials")
	}
	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}
	s.userRepo.UpdateLastLogin(ctx, user.ID)
	return user, nil
}

func (s *AuthService) Register(ctx context.Context, input RegisterInput) (*domain.User, error) {
	existing, err := s.userRepo.FindByEmail(ctx, input.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	// Only allow student/parent self-registration; admin creates teachers
	if input.Role == domain.RoleAdmin || input.Role == domain.RoleTeacher {
		return nil, errors.New("cannot self-register with this role")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		return nil, err
	}

	token := randomToken()
	phone := &input.Phone
	if input.Phone == "" {
		phone = nil
	}

	user := &domain.User{
		Email:        input.Email,
		PasswordHash: string(hash),
		Role:         input.Role,
		FirstName:    input.FirstName,
		LastName:     input.LastName,
		Phone:        phone,
		VerifyToken:  &token,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) ForgotPassword(ctx context.Context, email string) (string, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil || user == nil {
		return "", nil // silent fail for security
	}
	token := randomToken()
	expires := time.Now().Add(1 * time.Hour)
	if err := s.userRepo.SetResetToken(ctx, user.ID, token, expires); err != nil {
		return "", err
	}
	return token, nil
}

func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	user, err := s.userRepo.FindByResetToken(ctx, token)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("invalid or expired reset token")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return err
	}
	return s.userRepo.UpdatePassword(ctx, user.ID, string(hash))
}

func (s *AuthService) VerifyEmail(ctx context.Context, token string) error {
	user, err := s.userRepo.FindByVerifyToken(ctx, token)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("invalid verification token")
	}
	return s.userRepo.SetVerified(ctx, user.ID)
}

func (s *AuthService) ChangePassword(ctx context.Context, userID, oldPassword, newPassword string) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil || user == nil {
		return errors.New("user not found")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return errors.New("current password is incorrect")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return err
	}
	return s.userRepo.UpdatePassword(ctx, userID, string(hash))
}

func randomToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// ─── Student Service ──────────────────────────────────────────────────────────

type StudentService struct {
	repo     *repository.StudentRepository
	userRepo *repository.UserRepository
}

func NewStudentService(repo *repository.StudentRepository, userRepo *repository.UserRepository) *StudentService {
	return &StudentService{repo: repo, userRepo: userRepo}
}

type CreateStudentInput struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=8"`
	FirstName   string `json:"first_name" binding:"required"`
	LastName    string `json:"last_name" binding:"required"`
	Phone       string `json:"phone"`
	AdmissionNo string `json:"admission_no" binding:"required"`
	GradeID     string `json:"grade_id"`
	Gender      string `json:"gender"`
	Address     string `json:"address"`
	BloodGroup  string `json:"blood_group"`
	GuardianName string `json:"guardian_name"`
}

func (s *StudentService) Create(ctx context.Context, input CreateStudentInput) (*domain.Student, error) {
	hash, generatedPwd, mustChange, err := resolveCredential(input.Password)
	if err != nil {
		return nil, err
	}
	phone := &input.Phone
	if input.Phone == "" {
		phone = nil
	}
	user := &domain.User{
		Email: input.Email, PasswordHash: hash,
		Role: domain.RoleStudent, FirstName: input.FirstName,
		LastName: input.LastName, Phone: phone, IsVerified: true,
		MustChangePassword: mustChange,
	}
	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}
	user.GeneratedPassword = generatedPwd

	gradeID := &input.GradeID
	if input.GradeID == "" { gradeID = nil }
	gender := &input.Gender
	if input.Gender == "" { gender = nil }
	address := &input.Address
	if input.Address == "" { address = nil }
	bloodGroup := &input.BloodGroup
	if input.BloodGroup == "" { bloodGroup = nil }
	guardian := &input.GuardianName
	if input.GuardianName == "" { guardian = nil }

	student := &domain.Student{
		UserID: user.ID, AdmissionNo: input.AdmissionNo,
		GradeID: gradeID, Gender: gender, Address: address,
		BloodGroup: bloodGroup, GuardianName: guardian,
	}
	if err := s.repo.Create(ctx, student); err != nil {
		return nil, err
	}
	student.User = user
	return student, nil
}

func (s *StudentService) List(ctx context.Context, p domain.PaginationParams) (*domain.PaginatedResponse, error) {
	students, total, err := s.repo.List(ctx, p)
	if err != nil {
		return nil, err
	}
	totalPages := int(total) / p.PageSize
	if int(total)%p.PageSize != 0 { totalPages++ }
	return &domain.PaginatedResponse{Data: students, Total: total, Page: p.Page, PageSize: p.PageSize, TotalPages: totalPages}, nil
}

func (s *StudentService) GetByID(ctx context.Context, id string) (*domain.Student, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *StudentService) GetByUserID(ctx context.Context, userID string) (*domain.Student, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *StudentService) Update(ctx context.Context, id string, input map[string]interface{}) (*domain.Student, error) {
	student, err := s.repo.FindByID(ctx, id)
	if err != nil || student == nil {
		return nil, errors.New("student not found")
	}
	if v, ok := input["grade_id"].(string); ok {
		if v == "" {
			student.GradeID = nil
		} else {
			student.GradeID = &v
		}
	}
	if v, ok := input["gender"].(string); ok {
		if v == "" { student.Gender = nil } else { student.Gender = &v }
	}
	if v, ok := input["address"].(string); ok {
		if v == "" { student.Address = nil } else { student.Address = &v }
	}
	if v, ok := input["blood_group"].(string); ok {
		if v == "" { student.BloodGroup = nil } else { student.BloodGroup = &v }
	}
	if v, ok := input["guardian_name"].(string); ok {
		if v == "" { student.GuardianName = nil } else { student.GuardianName = &v }
	}
	if v, ok := input["admission_no"].(string); ok && v != "" {
		student.AdmissionNo = v
	}



	if err := s.repo.Update(ctx, student); err != nil {
		return nil, err
	}
	user, err := s.userRepo.FindByID(ctx, student.UserID)
	if err == nil && user != nil {
		updatedUser := false
		if v, ok := input["first_name"].(string); ok && v != "" {
			user.FirstName = v
			updatedUser = true
		}
		if v, ok := input["last_name"].(string); ok && v != "" {
			user.LastName = v
			updatedUser = true
		}
		if v, ok := input["email"].(string); ok && v != "" {
			user.Email = v
			updatedUser = true
		}
		if updatedUser {
			_ = s.userRepo.Update(ctx, user)
		}
	}
	return student, nil
}

func (s *StudentService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *StudentService) ListByTeacher(ctx context.Context, teacherUserID string, p domain.PaginationParams) (*domain.PaginatedResponse, error) {
	students, total, err := s.repo.ListByTeacherGrades(ctx, teacherUserID, p)
	if err != nil {
		return nil, err
	}
	totalPages := int(total) / p.PageSize
	if int(total)%p.PageSize != 0 { totalPages++ }
	return &domain.PaginatedResponse{Data: students, Total: total, Page: p.Page, PageSize: p.PageSize, TotalPages: totalPages}, nil
}

// ─── Teacher Service ──────────────────────────────────────────────────────────

type TeacherService struct {
	repo     *repository.TeacherRepository
	userRepo *repository.UserRepository
}

func NewTeacherService(repo *repository.TeacherRepository, userRepo *repository.UserRepository) *TeacherService {
	return &TeacherService{repo: repo, userRepo: userRepo}
}

func (s *TeacherService) Create(ctx context.Context, input map[string]interface{}) (*domain.Teacher, error) {
	email, _ := input["email"].(string)
	password, _ := input["password"].(string)
	firstName, _ := input["first_name"].(string)
	lastName, _ := input["last_name"].(string)
	employeeNo, _ := input["employee_no"].(string)

	hash, generatedPwd, mustChange, err := resolveCredential(password)
	if err != nil {
		return nil, err
	}
	user := &domain.User{
		Email: email, PasswordHash: hash,
		Role: domain.RoleTeacher, FirstName: firstName,
		LastName: lastName, IsVerified: true,
		MustChangePassword: mustChange,
	}
	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}
	user.GeneratedPassword = generatedPwd

	qual, _ := input["qualification"].(string)
	spec, _ := input["specialization"].(string)
	dept, _ := input["department"].(string)

	qualPtr := &qual
	specPtr := &spec
	deptPtr := &dept

	teacher := &domain.Teacher{
		UserID: user.ID, EmployeeNo: employeeNo,
		Qualification: qualPtr, Specialization: specPtr, Department: deptPtr,
	}
	if err := s.repo.Create(ctx, teacher); err != nil {
		return nil, err
	}
	teacher.User = user
	return teacher, nil
}

func (s *TeacherService) List(ctx context.Context, p domain.PaginationParams) (*domain.PaginatedResponse, error) {
	teachers, total, err := s.repo.List(ctx, p)
	if err != nil {
		return nil, err
	}
	totalPages := int(total) / p.PageSize
	if int(total)%p.PageSize != 0 { totalPages++ }
	return &domain.PaginatedResponse{Data: teachers, Total: total, Page: p.Page, PageSize: p.PageSize, TotalPages: totalPages}, nil
}

func (s *TeacherService) GetByID(ctx context.Context, id string) (*domain.Teacher, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *TeacherService) GetByUserID(ctx context.Context, userID string) (*domain.Teacher, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *TeacherService) Update(ctx context.Context, id string, input map[string]interface{}) (*domain.Teacher, error) {
	teacher, err := s.repo.FindByID(ctx, id)
	if err != nil || teacher == nil {
		return nil, errors.New("teacher not found")
	}
	if v, ok := input["qualification"].(string); ok { teacher.Qualification = &v }
	if v, ok := input["specialization"].(string); ok { teacher.Specialization = &v }
	if v, ok := input["department"].(string); ok { teacher.Department = &v }
	return teacher, s.repo.Update(ctx, teacher)
}

func (s *TeacherService) Delete(ctx context.Context, id string) error { return s.repo.Delete(ctx, id) }

// ─── Parent Service ───────────────────────────────────────────────────────────

type ParentService struct {
	repo     *repository.ParentRepository
	userRepo *repository.UserRepository
}

func NewParentService(repo *repository.ParentRepository, userRepo *repository.UserRepository) *ParentService {
	return &ParentService{repo: repo, userRepo: userRepo}
}

func (s *ParentService) List(ctx context.Context, p domain.PaginationParams) (*domain.PaginatedResponse, error) {
	parents, total, err := s.repo.List(ctx, p)
	if err != nil {
		return nil, err
	}
	totalPages := int(total) / p.PageSize
	if int(total)%p.PageSize != 0 { totalPages++ }
	return &domain.PaginatedResponse{Data: parents, Total: total, Page: p.Page, PageSize: p.PageSize, TotalPages: totalPages}, nil
}

func (s *ParentService) GetByID(ctx context.Context, id string) (*domain.Parent, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *ParentService) GetByUserID(ctx context.Context, userID string) (*domain.Parent, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *ParentService) GetChildren(ctx context.Context, parentID string) ([]*domain.Student, error) {
	return s.repo.GetChildren(ctx, parentID)
}

func (s *ParentService) Create(ctx context.Context, input map[string]interface{}) (*domain.Parent, error) {
	email, _ := input["email"].(string)
	password, _ := input["password"].(string)
	firstName, _ := input["first_name"].(string)
	lastName, _ := input["last_name"].(string)

	hash, generatedPwd, mustChange, err := resolveCredential(password)
	if err != nil {
		return nil, err
	}
	user := &domain.User{
		Email: email, PasswordHash: hash,
		Role: domain.RoleParent, FirstName: firstName,
		LastName: lastName, IsVerified: true,
		MustChangePassword: mustChange,
	}
	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}
	user.GeneratedPassword = generatedPwd
	occupation, _ := input["occupation"].(string)
	address, _ := input["address"].(string)
	occ := &occupation
	addr := &address
	parent := &domain.Parent{UserID: user.ID, Occupation: occ, Address: addr}
	if err := s.repo.Create(ctx, parent); err != nil {
		return nil, err
	}
	parent.User = user
	return parent, nil
}

func (s *ParentService) Update(ctx context.Context, id string, input map[string]interface{}) (*domain.Parent, error) {
	parent, err := s.repo.FindByID(ctx, id)
	if err != nil || parent == nil {
		return nil, errors.New("parent not found")
	}
	if v, ok := input["occupation"].(string); ok { parent.Occupation = &v }
	if v, ok := input["address"].(string); ok { parent.Address = &v }
	return parent, s.repo.Update(ctx, parent)
}

func (s *ParentService) Delete(ctx context.Context, id string) error { return s.repo.Delete(ctx, id) }

// ─── Monthly Mark Service ───────────────────────────────────────────────────

type MonthlyMarkService struct {
	repo *repository.MonthlyMarkRepository
}

func NewMonthlyMarkService(repo *repository.MonthlyMarkRepository) *MonthlyMarkService {
	return &MonthlyMarkService{repo: repo}
}

func (s *MonthlyMarkService) GetMarks(ctx context.Context, subjectID, month string) ([]*domain.MonthlyMark, error) {
	if subjectID == "" || month == "" {
		return nil, errors.New("subject_id and month are required")
	}
	return s.repo.ListBySubjectAndMonth(ctx, subjectID, month)
}

func (s *MonthlyMarkService) SaveMarks(ctx context.Context, marks []map[string]interface{}) error {
	for _, mData := range marks {
		studentID, _ := mData["student_id"].(string)
		subjectID, _ := mData["subject_id"].(string)
		month, _ := mData["month"].(string)
		
		if studentID == "" || subjectID == "" || month == "" {
			continue // skip invalid
		}

		activity, _ := mData["activity"].(float64)
		behavior, _ := mData["behavior"].(float64)
		project, _ := mData["project"].(float64)
		midterm, _ := mData["midterm"].(float64)
		final, _ := mData["final"].(float64)
		attendance, _ := mData["attendance"].(float64)
		practical, _ := mData["practical"].(float64)

		m := &domain.MonthlyMark{
			StudentID:  studentID,
			SubjectID:  subjectID,
			Month:      month,
			Activity:   activity,
			Behavior:   behavior,
			Project:    project,
			Midterm:    midterm,
			Final:      final,
			Attendance: attendance,
			Practical:  practical,
		}
		if err := s.repo.Upsert(ctx, m); err != nil {
			return err
		}
	}
	return nil
}
