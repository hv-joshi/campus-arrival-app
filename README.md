# Campus Arrival Portal

A comprehensive web application for managing new student arrivals on campus. The app provides three main interfaces for different user roles: Students, Volunteers, and Administrators.

## Features

### 🎓 Student Portal
- **Authentication**: Login using roll number and birth date
- **Checklist**: View progress through arrival steps
- **FAQ**: Access frequently asked questions
- **Map**: View campus locations for each step
- **Messages**: Read broadcast messages from admin
- **Token**: Display assigned token for verification

### 👥 Volunteer Portal
- **Authentication**: Login with username and password
- **Dashboard**: Real-time statistics and progress tracking
- **Search**: Find students by roll number or name
- **Status Updates**: Update student progress through steps
- **Statistics**: View completion rates and step-wise distribution

### 🔧 Admin Portal
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

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd campus-arrival-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Run the script to create tables and sample data

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Student Access
- **URL**: `/student`
- **Login**: Use IAT Roll Number
- **Sample Data**: 
  - IAT Roll No: `2024001`
  - IAT Roll No: `2024002`

### Volunteer Access
- **URL**: `/volunteer`
- **Login**: Use username and password
- **Sample Data**:
  - Username: `volunteer1`, Password: `password123`
  - Username: `volunteer2`, Password: `password123`

### Admin Access
- **URL**: `/admin`
- **Login**: 
  - Username: `admin`, Password: `admin123`

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

⚠️ **Important**: This is a demo application with simplified authentication. For production use:

1. Implement proper password hashing (bcrypt, argon2)
2. Add Row Level Security (RLS) policies
3. Use Supabase Auth for proper authentication
4. Add input validation and sanitization
5. Implement rate limiting
6. Add HTTPS and security headers

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

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support and questions:
1. Check the FAQ section in the admin panel
2. Review the database setup script
3. Check the browser console for errors
4. Verify your Supabase configuration

## Roadmap

- [ ] Real-time updates using Supabase subscriptions
- [ ] Mobile app version
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] QR code integration for tokens
- [ ] Integration with existing campus systems
