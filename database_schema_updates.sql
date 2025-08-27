-- Database Schema Updates for Campus Arrival App

-- 1. Create approval_tokens table
CREATE TABLE IF NOT EXISTS public.approval_tokens (
    id BIGSERIAL PRIMARY KEY,
    token_number INTEGER NOT NULL,
    student_roll_no TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT approval_tokens_student_roll_no_fkey FOREIGN KEY (student_roll_no) REFERENCES public.students(iat_roll_no) ON DELETE CASCADE,
    CONSTRAINT approval_tokens_student_roll_no_key UNIQUE (student_roll_no)
);

-- 2. Add new columns to volunteers table
ALTER TABLE public.volunteers 
ADD COLUMN IF NOT EXISTS can_verify_lhc BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- 3. Add token_assigned column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS token_assigned BOOLEAN DEFAULT false;

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_approval_tokens_token_number ON public.approval_tokens(token_number);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_student_roll_no ON public.approval_tokens(student_roll_no);
CREATE INDEX IF NOT EXISTS idx_volunteers_can_verify_lhc ON public.volunteers(can_verify_lhc);
CREATE INDEX IF NOT EXISTS idx_volunteers_is_available ON public.volunteers(is_available);

-- 4. Insert sample data for testing (optional)
-- Insert some volunteers with different roles
INSERT INTO public.volunteers (username, password, role, can_verify_lhc, is_available) 
VALUES 
    ('admin', 'admin123', 'admin', true, true),
    ('lhc_volunteer', 'lhc123', 'LHC Verifier', true, true),
    ('regular_volunteer', 'vol123', 'General Volunteer', false, true)
ON CONFLICT (username) DO NOTHING;

-- 5. Create RLS policies for approval_tokens table
ALTER TABLE public.approval_tokens ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read approval tokens
CREATE POLICY "Allow read access to approval tokens" ON public.approval_tokens
    FOR SELECT USING (true);

-- Allow authenticated users to insert approval tokens
CREATE POLICY "Allow insert access to approval tokens" ON public.approval_tokens
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update approval tokens
CREATE POLICY "Allow update access to approval tokens" ON public.approval_tokens
    FOR UPDATE USING (true);

-- Allow authenticated users to delete approval tokens
CREATE POLICY "Allow delete access to approval tokens" ON public.approval_tokens
    FOR DELETE USING (true);

-- 6. Update RLS policies for volunteers table to include new columns
DROP POLICY IF EXISTS "Allow read access to volunteers" ON public.volunteers;
CREATE POLICY "Allow read access to volunteers" ON public.volunteers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update access to volunteers" ON public.volunteers;
CREATE POLICY "Allow update access to volunteers" ON public.volunteers
    FOR UPDATE USING (true);

-- 7. Create function to automatically assign next token number
CREATE OR REPLACE FUNCTION get_next_token_number()
RETURNS INTEGER AS $$
DECLARE
    next_token INTEGER;
BEGIN
    SELECT COALESCE(MAX(token_number), 0) + 1 INTO next_token
    FROM public.approval_tokens;
    
    RETURN next_token;
END;
$$ LANGUAGE plpgsql;

-- 11. Settings table to store admin-configurable values
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    skip_offset INTEGER NOT NULL DEFAULT 3,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure single-row semantics
INSERT INTO public.settings (id, skip_offset)
SELECT 1, 3
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE id = 1);

-- 8. Create trigger to ensure unique token numbers
CREATE OR REPLACE FUNCTION ensure_unique_token_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if token number already exists
    IF EXISTS (SELECT 1 FROM public.approval_tokens WHERE token_number = NEW.token_number AND id != NEW.id) THEN
        RAISE EXCEPTION 'Token number % already exists', NEW.token_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_unique_token_number
    BEFORE INSERT OR UPDATE ON public.approval_tokens
    FOR EACH ROW
    EXECUTE FUNCTION ensure_unique_token_number();

-- 9. Create view for volunteer dashboard statistics
CREATE OR REPLACE VIEW volunteer_dashboard_stats AS
SELECT 
    COUNT(*) as total_students,
    COUNT(CASE WHEN fees_paid THEN 1 END) as fees_paid_count,
    COUNT(CASE WHEN hostel_mess_status THEN 1 END) as hostel_mess_count,
    COUNT(CASE WHEN insurance_status THEN 1 END) as insurance_count,
    COUNT(CASE WHEN doaa_token IS NOT NULL THEN 1 END) as tokens_assigned_count,
    COUNT(CASE WHEN lhc_docs_status THEN 1 END) as lhc_docs_count,
    COUNT(CASE WHEN final_approval_status THEN 1 END) as final_approval_count,
    COALESCE(MAX(at.token_number), 0) as highest_token_number
FROM public.students s
LEFT JOIN public.approval_tokens at ON s.iat_roll_no = at.student_roll_no;

-- 10. Create function to get students in queue for token assignment
CREATE OR REPLACE FUNCTION get_students_for_token_assignment()
RETURNS TABLE (
    student_id INTEGER,
    student_name TEXT,
    iat_roll_no TEXT,
    fees_paid BOOLEAN,
    hostel_mess_status BOOLEAN,
    insurance_status BOOLEAN,
    has_token BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.student_name,
        s.iat_roll_no,
        s.fees_paid,
        s.hostel_mess_status,
        s.insurance_status,
        CASE WHEN at.token_number IS NOT NULL THEN true ELSE false END as has_token
    FROM public.students s
    LEFT JOIN public.approval_tokens at ON s.iat_roll_no = at.student_roll_no
    WHERE s.fees_paid = true 
      AND s.hostel_mess_status = true 
      AND s.insurance_status = true
      AND at.token_number IS NULL
    ORDER BY s.created_at ASC;
END;
$$ LANGUAGE plpgsql;
