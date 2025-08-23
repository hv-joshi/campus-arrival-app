# Campus Arrival Portal

A comprehensive web application for managing new student arrivals on campus. The app provides three main interfaces for different user roles: Students, Volunteers, and Administrators.

## Features

### Student Portal
- **Authentication**: Login using roll number and birth date
- **Checklist**: View progress through arrival steps
- **FAQ**: Access frequently asked questions
- **Map**: View campus locations for each step
- **Messages**: Read broadcast messages from admin
- **Token**: Display assigned token for verification

### Volunteer Portal
- **Authentication**: Login with username and password
- **Dashboard**: Real-time statistics and progress tracking
- **Search**: Find students by roll number or name
- **Status Updates**: Update student progress through steps
- **Statistics**: View completion rates and step-wise distribution

### Admin Portal
- **Volunteer Management**: Add and remove volunteers
- **Broadcasting**: Send messages to all students
- **FAQ Management**: Create, edit, and delete FAQs
- **System Overview**: Monitor overall system status

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Authentication**: Custom implementation with Supabase

## Database Schema

### Students Table
- `id`: Unique identifier (BIGSERIAL)
- `created_at`: Record creation timestamp
- `iat_roll_no`: IAT Roll Number (unique)
- `student_name`: Student full name
- `doaa_token`: Assigned DOAA token number
- `verified_docs`: JSONB object for verified documents
- `flagged`: Boolean flag for special attention
- `hostel_mess_status`: Hostel and mess registration status
- `insurance_status`: Insurance verification status
- `lhc_docs_status`: LHC documents status
- `final_approval_status`: Final approval status

### Volunteers Table
- `id`: Unique identifier (BIGSERIAL)
- `username`: Login username (unique)
- `password`: Password (plain text for demo)
- `role`: User role ('volunteer' or 'admin')

### Announcements Table
- `id`: Unique identifier (BIGSERIAL)
- `message`: Announcement message content

### FAQs Table
- `id`: Unique identifier (BIGSERIAL)
- `question`: FAQ question
- `answer`: FAQ answer

### Locations Table
- `id`: Unique identifier (BIGSERIAL)
- `name`: Location name
- `map_link`: Google Maps link for the location

## Arrival Process Steps

1. **Hostel & Mess Registration**: Complete hostel and mess registration
2. **Insurance Verification**: Verify insurance documents
3. **LHC Documents**: Submit LHC medical documents
4. **Final Approval**: Get final approval for campus entry

## Security Notes

⚠️ **Important**: This is a demo application with simplified authentication.

## Customization

### Adding New Steps
1. Update the `STEPS` array in each page component
2. Modify the database constraints if needed
3. Update the UI components accordingly

### Styling
The app uses Tailwind CSS. You can customize the design by:
1. Modifying the color schemes in the components
2. Updating the Tailwind configuration
3. Adding custom CSS classes

### Database
To add new features:
1. Create new tables in Supabase
2. Update the TypeScript interfaces in `src/lib/supabase.ts`
3. Add corresponding API calls in the components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
