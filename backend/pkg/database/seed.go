package database

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type demoUser struct {
	email     string
	password  string
	role      string
	firstName string
	lastName  string
}

// SeedDemoUsers creates demo accounts and rich dummy data for all roles.
// It skips silently if the database already contains seeded users.
func SeedDemoUsers(db *sql.DB) error {
	// Fast early-exit: if ANY users exist, the DB has already been seeded.
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count); err != nil {
		return fmt.Errorf("seed check failed: %w", err)
	}
	if count > 0 {
		log.Printf("⏭️  Seed: %d users already present, skipping", count)
		return nil
	}

	log.Println("🌱 Seeding demo database (first run)...")

	// bcrypt cost 10 is the industry standard — strong enough, 4× faster than 12.
	const seedCost = 10

	demos := []demoUser{
		{"admin@school.com", "Admin@123", "admin", "Admin", "User"},
		{"teacher@school.com", "Teacher@123", "teacher", "Sarah", "Johnson"},
		{"student@school.com", "Student@123", "student", "Omar", "Hassan"},
		{"parent@school.com", "Parent@123", "parent", "Lisa", "Chen"},
	}
	for i := 1; i <= 5; i++ {
		demos = append(demos,
			demoUser{fmt.Sprintf("student%d@school.com", i), "Student@123", "student", fmt.Sprintf("Student%d", i), "Test"},
			demoUser{fmt.Sprintf("teacher%d@school.com", i), "Teacher@123", "teacher", fmt.Sprintf("Teacher%d", i), "Test"},
			demoUser{fmt.Sprintf("parent%d@school.com", i), "Parent@123", "parent", fmt.Sprintf("Parent%d", i), "Test"},
		)
	}

	// Insert all users first (batch hashing avoids repeated round-trips).
	userIDs := make(map[string]string, len(demos))
	for _, d := range demos {
		hash, err := bcrypt.GenerateFromPassword([]byte(d.password), seedCost)
		if err != nil {
			return fmt.Errorf("bcrypt failed for %s: %w", d.email, err)
		}
		var uid string
		err = db.QueryRow(`
			INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, is_verified)
			VALUES ($1,$2,$3,$4,$5,true,true) RETURNING id
		`, d.email, string(hash), d.role, d.firstName, d.lastName).Scan(&uid)
		if err != nil {
			return fmt.Errorf("insert user %s: %w", d.email, err)
		}
		userIDs[d.email] = uid
		log.Printf("  ✅ Created user: %s (%s)", d.email, d.role)
	}

	// ── Teacher profiles ─────────────────────────────────────────────────────
	var teacherProfileID string
	err := db.QueryRow(`
		INSERT INTO teachers (user_id, employee_no, department, qualification, specialization)
		VALUES ($1,'EMP-1001','Engineering','M.Tech Computer Science','Software Systems') RETURNING id
	`, userIDs["teacher@school.com"]).Scan(&teacherProfileID)
	if err != nil {
		return fmt.Errorf("create primary teacher: %w", err)
	}

	for i := 1; i <= 5; i++ {
		db.Exec(`
			INSERT INTO teachers (user_id, employee_no, department, qualification)
			VALUES ($1,$2,'Mechanical Engineering','B.Sc. Engineering')
		`, userIDs[fmt.Sprintf("teacher%d@school.com", i)], fmt.Sprintf("EMP-200%d", i))
	}

	// ── Grades / Classes ─────────────────────────────────────────────────────
	grades := []struct{ name, section, room string }{
		{"Grade 10", "A", "Lab 201"},
		{"Grade 11", "B", "Lab 305"},
		{"Grade 12", "A", "Lab 102"},
	}
	gradeIDs := make([]string, 0, 3)
	for _, g := range grades {
		var gid string
		if err := db.QueryRow(`
			INSERT INTO grades (name, section, capacity, class_teacher_id, room)
			VALUES ($1,$2,30,$3,$4) RETURNING id
		`, g.name, g.section, teacherProfileID, g.room).Scan(&gid); err != nil {
			return fmt.Errorf("create grade %s: %w", g.name, err)
		}
		gradeIDs = append(gradeIDs, gid)
		log.Printf("  ✅ Created grade: %s-%s", g.name, g.section)
	}

	// ── Student profiles ─────────────────────────────────────────────────────
	var studentProfileID string
	if err := db.QueryRow(`
		INSERT INTO students (user_id, admission_no, grade_id, date_of_birth, gender, address, blood_group, nationality)
		VALUES ($1,'ADM-998877',$2,'2008-05-14','Male','12 Industrial St, Assiut','O+','Egyptian') RETURNING id
	`, userIDs["student@school.com"], gradeIDs[0]).Scan(&studentProfileID); err != nil {
		return fmt.Errorf("create primary student: %w", err)
	}
	log.Println("  ✅ Created student profile for Omar Hassan")

	for i := 1; i <= 5; i++ {
		db.Exec(`
			INSERT INTO students (user_id, admission_no, grade_id, date_of_birth, gender, address)
			VALUES ($1,$2,$3,'2008-08-20','Female','Assiut Center')
		`, userIDs[fmt.Sprintf("student%d@school.com", i)],
			fmt.Sprintf("ADM-100%d", i), gradeIDs[rand.Intn(len(gradeIDs))])
	}

	// ── Parent profiles ──────────────────────────────────────────────────────
	var parentProfileID string
	if err := db.QueryRow(`
		INSERT INTO parents (user_id, occupation, address)
		VALUES ($1,'Senior Technical Supervisor','12 Industrial St, Assiut') RETURNING id
	`, userIDs["parent@school.com"]).Scan(&parentProfileID); err != nil {
		return fmt.Errorf("create parent: %w", err)
	}
	log.Println("  ✅ Created parent profile for Lisa Chen")

	for i := 1; i <= 5; i++ {
		db.Exec(`INSERT INTO parents (user_id, occupation) VALUES ($1,'Industrial Specialist')`,
			userIDs[fmt.Sprintf("parent%d@school.com", i)])
	}

	// Link primary parent ↔ student
	db.Exec(`INSERT INTO parent_students (parent_id, student_id, relation) VALUES ($1,$2,'mother')`,
		parentProfileID, studentProfileID)

	// ── Subjects ─────────────────────────────────────────────────────────────
	subjects := []struct{ name, code string }{
		{"Advanced Mathematics", "MATH-10"},
		{"Electrical Workshop", "ELEC-10"},
		{"Basic Programming", "COMP-10"},
	}
	subjectIDs := make([]string, 0, 3)
	for _, s := range subjects {
		var sid string
		if err := db.QueryRow(`
			INSERT INTO subjects (name, code, grade_id, teacher_id, description, credits)
			VALUES ($1,$2,$3,$4,'Rich subject course content description.',4) RETURNING id
		`, s.name, s.code, gradeIDs[0], teacherProfileID).Scan(&sid); err != nil {
			return fmt.Errorf("create subject %s: %w", s.name, err)
		}
		subjectIDs = append(subjectIDs, sid)
		log.Printf("  ✅ Created subject: %s (%s)", s.name, s.code)
	}

	// ── Schedules ────────────────────────────────────────────────────────────
	scheds := []struct {
		day        int
		start, end string
		sub, room  string
	}{
		{1, "08:30:00", "10:00:00", subjectIDs[0], "Room 201"},
		{1, "10:30:00", "12:00:00", subjectIDs[1], "Workshop 3"},
		{2, "08:30:00", "10:00:00", subjectIDs[2], "Lab 201"},
		{3, "13:00:00", "14:30:00", subjectIDs[0], "Room 201"},
		{4, "10:30:00", "12:00:00", subjectIDs[1], "Workshop 3"},
		{5, "08:30:00", "10:00:00", subjectIDs[2], "Lab 201"},
	}
	for _, sc := range scheds {
		if _, err := db.Exec(`
			INSERT INTO schedules (grade_id, subject_id, teacher_id, day_of_week, start_time, end_time, room)
			VALUES ($1,$2,$3,$4,$5,$6,$7)
		`, gradeIDs[0], sc.sub, teacherProfileID, sc.day, sc.start, sc.end, sc.room); err != nil {
			log.Printf("  ⚠️  schedule insert: %v", err)
		}
	}
	log.Println("  ✅ Seeded timetable for Grade 10-A")

	// ── Attendance (last 30 days) ─────────────────────────────────────────────
	start := time.Now().AddDate(0, 0, -30)
	for i := 0; i < 30; i++ {
		d := start.AddDate(0, 0, i)
		if d.Weekday() == time.Friday || d.Weekday() == time.Saturday {
			continue
		}
		status := "present"
		if v := rand.Float64(); v < 0.08 {
			status = "absent"
		} else if v < 0.15 {
			status = "late"
		}
		db.Exec(`
			INSERT INTO attendance (student_id, subject_id, date, status, marked_by, notes)
			VALUES ($1,$2,$3,$4,$5,'Daily attendance record') ON CONFLICT DO NOTHING
		`, studentProfileID, subjectIDs[0], d.Format("2006-01-02"), status, teacherProfileID)
	}
	log.Println("  ✅ Seeded 30 days of attendance data")

	// ── Payments ─────────────────────────────────────────────────────────────
	payments := []struct {
		amount       float64
		ptype, status, due string
	}{
		{1500, "Tuition Fees - Term 1", "paid", "2026-02-15"},
		{1500, "Tuition Fees - Term 2", "pending", "2026-06-15"},
		{350, "Bus Transportation", "paid", "2026-03-01"},
		{120, "Workshop Safety Kit & Uniform", "overdue", "2026-04-01"},
	}
	for _, p := range payments {
		db.Exec(`
			INSERT INTO payments (student_id, amount, payment_type, payment_method, status, due_date, notes)
			VALUES ($1,$2,$3,'Bank Transfer',$4,$5,'Demo payment record')
		`, studentProfileID, p.amount, p.ptype, p.status, p.due)
	}
	log.Println("  ✅ Seeded fee payments")

	// ── Announcements ────────────────────────────────────────────────────────
	adminUID := userIDs["admin@school.com"]
	anns := []struct {
		title, content string
		roles          []string
	}{
		{
			"Annual Technical Exhibition 2026",
			"Assiut Metals secondary technical school will host the annual student exhibition next week on Monday.",
			[]string{"admin", "teacher", "student", "parent"},
		},
		{
			"Final Term Exam Guidelines & Timetable",
			"Please review the detailed guidelines and schedules posted on the exam center dashboard.",
			[]string{"student", "parent"},
		},
		{
			"Staff Meeting: Safety Protocols",
			"A mandatory teacher meeting is scheduled this Wednesday in Lab 102 regarding workshop safety.",
			[]string{"teacher"},
		},
	}
	for _, a := range anns {
		db.Exec(`
			INSERT INTO announcements (author_id, title, content, target_roles, is_pinned)
			VALUES ($1,$2,$3,$4,true)
		`, adminUID, a.title, a.content, a.roles)
	}
	log.Println("  ✅ Seeded announcements")

	// ── Exams & Results ───────────────────────────────────────────────────────
	examList := []struct {
		title, sub  string
		total, marks float64
		grade       string
	}{
		{"Midterm Math Exam", subjectIDs[0], 100, 88, "A"},
		{"Electronics Fundamentals Test", subjectIDs[1], 100, 74, "B"},
		{"Basic Web Dev Coding Quiz", subjectIDs[2], 50, 48, "A+"},
	}
	for _, ex := range examList {
		var examID string
		if err := db.QueryRow(`
			INSERT INTO exams (subject_id, title, exam_type, date, duration_min, total_marks, pass_marks)
			VALUES ($1,$2,'written',NOW()-INTERVAL '10 days',90,$3,40) RETURNING id
		`, ex.sub, ex.title, ex.total).Scan(&examID); err == nil {
			db.Exec(`
				INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade_letter, remarks)
				VALUES ($1,$2,$3,$4,'Good work!')
			`, examID, studentProfileID, ex.marks, ex.grade)
		}
	}
	log.Println("  ✅ Seeded exams and results")

	// ── Assignments & Submissions ─────────────────────────────────────────────
	assignments := []struct {
		title, desc, sub string
		days             int
		subm             bool
		marks            float64
		feedback         string
	}{
		{"Algebraic Systems & Matrices", "Solve homework exercises 1–10 on page 42.", subjectIDs[0], -5, true, 95, "Outstanding mathematical logic!"},
		{"Workshop Breadboard Circuit Assembly", "Submit photos and schematic diagrams of your basic electronic gate simulation.", subjectIDs[1], -2, true, 80, "Circuit diagram is very neat."},
		{"HTML Form Validation Script", "Build a form with full validations using CSS variables.", subjectIDs[2], 5, false, 0, ""},
	}
	for _, a := range assignments {
		var assID string
		if err := db.QueryRow(`
			INSERT INTO assignments (subject_id, teacher_id, title, description, due_date, total_marks, is_published)
			VALUES ($1,$2,$3,$4,NOW()+$5*INTERVAL '1 day',100,true) RETURNING id
		`, a.sub, teacherProfileID, a.title, a.desc, a.days).Scan(&assID); err == nil && a.subm {
			db.Exec(`
				INSERT INTO submissions (assignment_id, student_id, content, marks_obtained, feedback, is_late, submitted_at, graded_at)
				VALUES ($1,$2,'Completed.', $3,$4,false,NOW()-INTERVAL '1 day',NOW())
			`, assID, studentProfileID, a.marks, a.feedback)
		}
	}
	log.Println("  ✅ Seeded assignments and submissions")

	log.Println("🌱 Seeding complete!")
	return nil
}
