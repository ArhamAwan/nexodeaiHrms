-- Add performance indexes for common queries

-- Index for employee queries
CREATE INDEX IF NOT EXISTS "idx_employee_user_id" ON "Employee"("userId");
CREATE INDEX IF NOT EXISTS "idx_employee_department_id" ON "Employee"("departmentId");
CREATE INDEX IF NOT EXISTS "idx_employee_created_at" ON "Employee"("createdAt");

-- Index for attendance queries
CREATE INDEX IF NOT EXISTS "idx_attendance_employee_id" ON "Attendance"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_attendance_day" ON "Attendance"("day");
CREATE INDEX IF NOT EXISTS "idx_attendance_employee_day" ON "Attendance"("employeeId", "day");

-- Index for time log queries
CREATE INDEX IF NOT EXISTS "idx_timelog_employee_id" ON "TimeLog"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_timelog_start_time" ON "TimeLog"("startTime");
CREATE INDEX IF NOT EXISTS "idx_timelog_end_time" ON "TimeLog"("endTime");
CREATE INDEX IF NOT EXISTS "idx_timelog_employee_start" ON "TimeLog"("employeeId", "startTime");

-- Index for leave queries
CREATE INDEX IF NOT EXISTS "idx_leave_employee_id" ON "Leave"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_leave_status" ON "Leave"("status");
CREATE INDEX IF NOT EXISTS "idx_leave_created_at" ON "Leave"("createdAt");

-- Index for report queries
CREATE INDEX IF NOT EXISTS "idx_report_employee_id" ON "Report"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_report_submission_date" ON "Report"("submissionDate");

-- Index for notification queries
CREATE INDEX IF NOT EXISTS "idx_notification_user_id" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "idx_notification_created_at" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_notification_user_created" ON "Notification"("userId", "createdAt");

-- Index for user queries
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("role");

-- Index for holiday queries
CREATE INDEX IF NOT EXISTS "idx_holiday_date" ON "Holiday"("date");
