-- Campus Arrival App Database Setup
-- Run this script in your Supabase SQL editor

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  message TEXT
);

-- Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  map_link TEXT NOT NULL
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  iat_roll_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  doaa_token INTEGER,
  verified_docs JSONB DEFAULT '{}'::jsonb,
  flagged BOOLEAN DEFAULT false,
  hostel_mess_status BOOLEAN DEFAULT false NOT NULL,
  insurance_status BOOLEAN DEFAULT false NOT NULL,
  lhc_docs_status BOOLEAN DEFAULT false NOT NULL,
  final_approval_status BOOLEAN DEFAULT false NOT NULL
);

-- Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'volunteer' NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_iat_roll_no ON students(iat_roll_no);
CREATE INDEX IF NOT EXISTS idx_volunteers_username ON volunteers(username);
CREATE INDEX IF NOT EXISTS idx_announcements_id ON announcements(id DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_id ON faqs(id DESC);

-- Insert sample data for testing

-- Sample students
INSERT INTO students (iat_roll_no, student_name, doaa_token, verified_docs, flagged, hostel_mess_status, insurance_status, lhc_docs_status, final_approval_status) VALUES
('2024001', 'John Doe', 1001, '{"doc1": true, "doc2": false}', false, false, false, false, false),
('2024002', 'Jane Smith', 1002, '{"doc1": true, "doc2": true}', false, true, false, false, false),
('2024003', 'Mike Johnson', 1003, '{"doc1": true, "doc2": true}', false, true, true, false, false),
('2024004', 'Sarah Wilson', 1004, '{"doc1": true, "doc2": true}', false, true, true, true, false),
('2024005', 'David Brown', 1005, '{"doc1": true, "doc2": true}', false, true, true, true, true)
ON CONFLICT (iat_roll_no) DO NOTHING;

-- Sample volunteers
INSERT INTO volunteers (username, password, role) VALUES
('volunteer1', 'password123', 'volunteer'),
('volunteer2', 'password123', 'volunteer'),
('admin', 'admin123', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Sample announcements
INSERT INTO announcements (message) VALUES
('Welcome to campus! Please proceed to the registration desk.'),
('Document verification is now open. Please bring all required documents.'),
('Orientation session will begin at 2 PM in the auditorium.')
ON CONFLICT DO NOTHING;

-- Sample FAQs
INSERT INTO faqs (question, answer) VALUES
('Where do I go first when I arrive?', 'Please proceed to the main gate registration desk to begin your arrival process.'),
('What documents do I need to bring?', 'Please bring your admission letter, ID proof, and any other documents mentioned in your admission package.'),
('How long does the entire process take?', 'The complete arrival process typically takes 2-3 hours depending on the number of students.'),
('Can I bring my parents with me?', 'Yes, parents are welcome to accompany you during the arrival process.'),
('What if I lose my token?', 'Please contact any volunteer or go to the help desk to get a replacement token.')
ON CONFLICT DO NOTHING;

-- Sample locations
INSERT INTO locations (name, map_link) VALUES
('Main Gate', 'https://maps.google.com/?q=main+gate'),
('Admin Block', 'https://maps.google.com/?q=admin+block'),
('Hostel Office', 'https://maps.google.com/?q=hostel+office'),
('Student Center', 'https://maps.google.com/?q=student+center'),
('Auditorium', 'https://maps.google.com/?q=auditorium')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for production
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (uncomment for production)
-- CREATE POLICY "Students can view their own data" ON students FOR SELECT USING (iat_roll_no = current_user);
-- CREATE POLICY "Volunteers can view all students" ON students FOR ALL USING (true);
-- CREATE POLICY "Admins can manage all data" ON students FOR ALL USING (true);
