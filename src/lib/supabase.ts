import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types matching the exact schema
export interface Student {
  id: number
  created_at: string
  iat_roll_no: string
  student_name: string
  token_assigned?: boolean
  flagged: boolean
  fees_paid: boolean
  hostel_mess_status: boolean
  insurance_status: boolean
  lhc_docs_status: boolean
  final_approval_status: boolean
}

export interface Volunteer {
  id: number
  username: string
  password: string
  role: string
  can_verify_lhc: boolean
  is_available: boolean
}

export interface ApprovalToken {
  id: number
  token_number: number
  student_roll_no: string
  created_at: string
  volunteer_id?: number
  is_processing?: boolean
}

export interface Announcement {
  id: number
  message?: string
}

export interface FAQ {
  id: number
  question: string
  answer: string
}

export interface Location {
  id: number
  name: string
  map_link: string
}

// Helper function to get student progress
export function getStudentProgress(student: Student): number {
  const steps = [
    student.fees_paid,
    student.hostel_mess_status,
    student.insurance_status,
    student.token_assigned,
    student.lhc_docs_status,
    student.final_approval_status
  ]
  return steps.filter(Boolean).length
}

// Helper function to get total steps
export const TOTAL_STEPS = 6

// Step names for UI
export const STEP_NAMES = [
  'Fees Payment',
  'Hostel & Mess Registration',
  'Insurance Verification',
  'Token Assignment',
  'LHC Documents',
  'Final Approval'
]
