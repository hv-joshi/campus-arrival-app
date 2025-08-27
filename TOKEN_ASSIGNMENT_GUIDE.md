# Token Assignment and LHC Document Verification System

## Overview

This document describes the new token assignment and LHC document verification system implemented for the Campus Arrival App.

## New Features

### 1. Automatic Token Assignment System

- **Queue-based Assignment**: Tokens are automatically assigned from a queue when volunteers click the "Assign Token" button
- **Unique Token Numbers**: Each student gets a unique token number starting from 1
- **Prerequisites**: Students must complete fees payment, hostel & mess registration, and insurance verification before being eligible for token assignment
- **Step Completion**: After token assignment, the "Token Assignment" step is automatically marked as complete
- **Token Display**: After assignment, the actual token number is displayed instead of the "Assign Token" button
- **Queue Management**: Dashboard shows the number of students in queue (eligible for token assignment)
- **Database Integration**: Uses the new `approval_tokens` table to track token assignments

### 2. Two Types of Volunteers

#### Regular Volunteers
- Can assign tokens to students
- Can update student progress for all steps except LHC document verification
- Cannot verify LHC documents (LHC docs status is read-only)
- No availability toggle needed

#### LHC Document Verifiers
- Can assign tokens to students (same as regular volunteers)
- Can verify LHC documents through a detailed popup interface (requires `can_verify_lhc` permission)
- Must be marked as "available" to verify LHC documents
- Can toggle their availability status for LHC verification only

#### Admins
- Have all capabilities of both regular volunteers and LHC verifiers
- Can create, edit, and delete volunteers
- Can manage volunteer permissions and roles
- Can access the admin dashboard with full management capabilities

### 3. LHC Document Verification

#### Document Checklist
The system includes verification for the following documents:

**Required Documents:**
- Admission Letter
- Photo ID Proof
- Medical Certificate
- Transfer Certificate
- Character Certificate
- Migration Certificate
- Passport Size Photographs

**Optional Documents:**
- Caste Certificate (if applicable)
- Income Certificate (if applicable)
- Disability Certificate (if applicable)

#### Verification Process
1. LHC verifiers click the document icon next to the LHC Documents step
2. A popup appears with all documents listed
3. Verifiers check each document as present or missing
4. Required documents must be present to proceed
5. Optional documents can be marked as missing
6. Verifiers can add notes for each document
7. Verification is recorded with timestamp and verifier information

### 4. Volunteer Availability System

- Only LHC Document Verifiers have availability toggle
- Availability is only required for LHC document verification
- All volunteers can assign tokens regardless of availability
- Availability status is displayed in the dashboard header for LHC verifiers
- Status persists across sessions

### 5. Enhanced Student Dashboard

- **Always-visible Announcements**: Announcements are now displayed at the top of the student page
- **Token Display**: Students can see their assigned token number
- **Real-time Updates**: Status updates automatically refresh every 20 seconds

## Database Schema Changes

### New Table: `approval_tokens`
```sql
CREATE TABLE public.approval_tokens (
    id BIGSERIAL PRIMARY KEY,
    token_number INTEGER NOT NULL,
    student_roll_no TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT approval_tokens_student_roll_no_fkey FOREIGN KEY (student_roll_no) REFERENCES public.students(iat_roll_no) ON DELETE CASCADE,
    CONSTRAINT approval_tokens_student_roll_no_key UNIQUE (student_roll_no)
);
```

### Updated Table: `volunteers`
Added new columns:
- `can_verify_lhc`: Boolean indicating if volunteer can verify LHC documents
- `is_available`: Boolean indicating if volunteer is available for LHC document verification

### Updated Table: `students`
Added new column:
- `token_assigned`: Boolean indicating if token assignment step is complete

## Usage Instructions

### For Volunteers

#### Regular Volunteers
1. Login with your credentials
2. Search for students who need token assignment
3. Click "Assign Token" for eligible students
4. Update student progress for completed steps

#### LHC Document Verifiers
1. Login with your credentials
2. Toggle availability for LHC verification if needed
3. Search for students who need token assignment or LHC document verification
4. For token assignment: Click "Assign Token" for eligible students
5. For LHC verification: Click the document icon (📄) next to LHC Documents step
6. Check each document as present or missing
7. Add notes if needed
8. Click "Verify Documents" to complete verification

#### Admins
1. Login with admin credentials
2. Access the admin dashboard to manage volunteers
3. Create, edit, or delete volunteers as needed
4. Set volunteer roles and permissions
5. Can also perform all volunteer functions

### For Students
1. Login with your IAT roll number
2. View announcements at the top of the page
3. Check your progress in the checklist
4. View your assigned token number in the Token tab
5. Follow the instructions for each step

## Sample Volunteer Accounts

The system includes these sample accounts for testing:

- **Admin**: `admin` / `admin123` (Can verify LHC documents)
- **LHC Verifier**: `lhc_volunteer` / `lhc123` (Can verify LHC documents)
- **Regular Volunteer**: `regular_volunteer` / `vol123` (Cannot verify LHC documents)

## Technical Implementation

### Key Components

1. **Token Assignment Logic**: Automatic queue-based assignment with unique token numbers
2. **LHC Modal**: React modal with document checklist and verification
3. **Availability Toggle**: Real-time status updates for volunteers
4. **Database Functions**: Helper functions for token management and statistics
5. **Real-time Updates**: Automatic refresh of student data and announcements

### State Management

The system uses React state to manage:
- Volunteer availability status
- Token assignment process
- LHC document verification
- Real-time updates
- Modal states

### Database Integration

- Uses Supabase for real-time database operations
- Implements Row Level Security (RLS) policies
- Includes database triggers for data integrity
- Provides helper functions for common operations

## Security Features

- Row Level Security (RLS) enabled on all tables
- Proper authentication and authorization
- Input validation and sanitization
- Unique constraints to prevent duplicate tokens
- Audit trail for document verification

## Performance Optimizations

- Database indexes on frequently queried columns
- Efficient queries with proper joins
- Real-time updates with minimal API calls
- Optimized React component rendering
- Cached data to reduce database load

## Troubleshooting

### Common Issues

1. **Token Assignment Fails**
   - Verify student has completed prerequisites (fees, hostel & mess, insurance)
   - Ensure no duplicate token exists
   - Check database connection and permissions

2. **LHC Verification Not Working**
   - Confirm volunteer has `can_verify_lhc` permission
   - Check if all required documents are marked as present
   - Verify database connection

3. **Real-time Updates Not Working**
   - Check network connection
   - Verify Supabase configuration
   - Ensure proper authentication

### Database Setup

Run the `database_schema_updates.sql` script to:
1. Create the `approval_tokens` table
2. Add new columns to `volunteers` table
3. Create necessary indexes
4. Set up RLS policies
5. Insert sample data

## Future Enhancements

Potential improvements for future versions:
- Bulk token assignment
- Advanced reporting and analytics
- Mobile app support
- Integration with external systems
- Enhanced document upload capabilities
- Multi-language support
