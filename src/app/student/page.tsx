'use client';

import { useState, useEffect } from 'react';
import { supabase, getStudentProgress, TOTAL_STEPS, STEP_NAMES } from '@/lib/supabase';
import { CheckCircle, Circle, MapPin, MessageSquare, Ticket, ArrowLeft, LogOut, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Student {
  id: number;
  created_at: string;
  iat_roll_no: string;
  student_name: string;
  doaa_token?: number;
  verified_docs: Record<string, any>;
  flagged: boolean;
  fees_paid: boolean;
  hostel_mess_status: boolean;
  insurance_status: boolean;
  lhc_docs_status: boolean;
  final_approval_status: boolean;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

interface Announcement {
  id: number;
  message?: string;
}

interface Location {
  id: number;
  name: string;
  map_link: string;
}

const STEPS = [
  { id: 1, name: "Fees Payment", description: "Complete payment of all required fees", location: "SBI Collect" },
  { id: 2, name: "Hostel & Mess Registration", description: "Complete hostel and mess registration", location: "Hostel 8" },
  { id: 3, name: "Insurance Verification", description: "Verify insurance documents", location: "SBI Bank" },
  { id: 4, name: "Token Assignment", description: "Token assignment for Document verification", location: "LHC"},
  { id: 5, name: "LHC Documents", description: "Submit verified documents", location: "LHC Lecture Hall 5" },
  { id: 6, name: "Finished", description: "Welcome to IISERB", location: "Leaving L5" }
];

export default function StudentPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [iatRollNo, setIatRollNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<'checklist' | 'faq' | 'map' | 'messages' | 'token'>('checklist');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingAnnouncements, setRefreshingAnnouncements] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFAQs();
      fetchAnnouncements();
      fetchLocations();
             // Set up periodic refresh of student data and announcements
       const studentInterval = setInterval(refreshStudentData, 20000); // Refresh every 20 seconds
       const announcementInterval = setInterval(fetchAnnouncements, 20000); // Refresh announcements every 20 seconds
      return () => {
        clearInterval(studentInterval);
        clearInterval(announcementInterval);
      };
    }
  }, [isAuthenticated]);

  // Function to refresh student data
  const refreshStudentData = async () => {
    if (!student) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', student.id)
        .single();

      if (!error && data) {
        setStudent(data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error refreshing student data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try multiple approaches to find the student
      let data = null;
      let error = null;

      // First try: exact match
      const { data: exactData, error: exactError } = await supabase
        .from('students')
        .select('*')
        .eq('iat_roll_no', iatRollNo.trim())
        .single();

      if (exactData) {
        data = exactData;
      } else {
        // Second try: case insensitive search
        const { data: caseData, error: caseError } = await supabase
          .from('students')
          .select('*')
          .ilike('iat_roll_no', iatRollNo.trim())
          .single();

        if (caseData) {
          data = caseData;
        } else {
          // Third try: without .single() to see if multiple results
          const { data: multipleData, error: multipleError } = await supabase
            .from('students')
            .select('*')
            .ilike('iat_roll_no', iatRollNo.trim());

          if (multipleData && multipleData.length > 0) {
            data = multipleData[0]; // Take the first match
          } else {
            error = multipleError || caseError || exactError;
          }
        }
      }

      if (error || !data) {
        console.error('Login error:', error);
        setError('Invalid IAT Roll Number');
        return;
      }

      setStudent(data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login exception:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFAQs = async () => {
    try {
      const { data } = await supabase
        .from('faqs')
        .select('*')
        .order('id', { ascending: false });
      
      if (data) setFaqs(data);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    }
  };

  const fetchAnnouncements = async () => {
    setRefreshingAnnouncements(true);
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('id', { ascending: false })
        .limit(10);
      
      if (data) {
        setAnnouncements(data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setRefreshingAnnouncements(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .order('id', { ascending: true });
      
      if (data) setLocations(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setStudent(null);
    setIatRollNo('');
    setError('');
  };

  const getCurrentStep = (student: Student): number => {
    if (student.final_approval_status) return 5;
    if (student.lhc_docs_status) return 4;
    if (student.insurance_status) return 3;
    if (student.hostel_mess_status) return 2;
    if (student.fees_paid) return 1;
    return 0;
  };

  const isStepCompleted = (student: Student, stepId: number): boolean => {
    switch (stepId) {
      case 1: return student.fees_paid;
      case 2: return student.hostel_mess_status;
      case 3: return student.insurance_status;
      case 4: return student.lhc_docs_status;
      case 5: return student.final_approval_status;
      default: return false;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Login</h1>
            <p className="text-gray-600">Enter your IAT Roll Number to access your arrival portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IAT Roll Number
              </label>
                             <input
                 type="text"
                 value={iatRollNo}
                 onChange={(e) => setIatRollNo(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                 placeholder="Enter your IAT Roll Number"
                 required
               />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStep(student!);
  const progress = getStudentProgress(student!);

  return (
    <div className="min-h-screen bg-gray-50">
             {/* Header */}
       <div className="bg-white shadow-sm border-b">
         <div className="container mx-auto px-4 py-3 md:py-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
             <div>
               <h1 className="text-xl md:text-2xl font-bold text-gray-900">Welcome, {student?.student_name}!</h1>
               <p className="text-sm md:text-base text-gray-600">IAT Roll No: {student?.iat_roll_no}</p>
               {lastUpdate && (
                 <p className="text-xs text-gray-500 mt-1">
                   Last updated: {lastUpdate.toLocaleTimeString()}
                 </p>
               )}
             </div>
             <div className="flex items-center space-x-3 md:space-x-4">
               <button
                 onClick={refreshStudentData}
                 disabled={refreshing}
                 className="flex items-center text-blue-600 hover:text-blue-800 disabled:opacity-50 text-sm"
                 title="Refresh status"
               >
                 <RefreshCw className={`w-4 h-4 mr-1 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                 <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
               </button>
               <button
                 onClick={handleLogout}
                 className="flex items-center text-gray-600 hover:text-gray-800 text-sm"
               >
                 <LogOut className="w-4 h-4 mr-1 md:mr-2" />
                 <span className="hidden sm:inline">Logout</span>
               </button>
             </div>
           </div>
         </div>
       </div>

      {/* Status Update Notification */}
      {lastUpdate && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800">
                  Status updated at {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={() => setLastUpdate(null)}
                className="text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

             {/* Navigation Tabs */}
       <div className="bg-white border-b">
         <div className="container mx-auto px-4">
           <nav className="flex space-x-2 md:space-x-8 overflow-x-auto">
             {[
               { id: 'checklist', label: 'Checklist', icon: CheckCircle },
               { id: 'faq', label: 'FAQ', icon: MessageSquare },
               { id: 'map', label: 'Map', icon: MapPin },
               { id: 'messages', label: 'Messages', icon: MessageSquare },
               { id: 'token', label: 'Token', icon: Ticket }
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                   activeTab === tab.id
                     ? 'border-blue-500 text-blue-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
               >
                 <tab.icon className="w-4 h-4 mr-1 md:mr-2" />
                 {tab.label}
               </button>
             ))}
           </nav>
         </div>
       </div>

             {/* Content */}
       <div className="container mx-auto px-4 py-4 md:py-8">
         {activeTab === 'checklist' && (
           <div className="max-w-4xl mx-auto">
             <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Arrival Checklist</h2>
             <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-medium text-gray-700">{progress}/{TOTAL_STEPS} completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress / TOTAL_STEPS) * 100}%` }}
                  ></div>
                </div>
              </div>
              
                             <div className="space-y-3 md:space-y-4">
                 {STEPS.map((step) => (
                   <div
                     key={step.id}
                     className={`flex items-start p-3 md:p-4 rounded-lg border ${
                       isStepCompleted(student!, step.id)
                         ? 'bg-green-50 border-green-200'
                         : 'bg-gray-50 border-gray-200'
                     }`}
                   >
                     <div className="flex-shrink-0 mr-3 md:mr-4 mt-1">
                       {isStepCompleted(student!, step.id) ? (
                         <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                       ) : (
                         <Circle className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-gray-900 text-sm md:text-base">{step.name}</h3>
                       <p className="text-gray-600 text-xs md:text-sm">{step.description}</p>
                       <p className="text-xs md:text-sm text-gray-500 mt-1">Location: {step.location}</p>
                       {isStepCompleted(student!, step.id) && (
                         <p className="text-xs text-green-600 mt-1">
                           ✓ Completed
                         </p>
                       )}
                     </div>
                     {step.id === currentStep && !isStepCompleted(student!, step.id) && (
                       <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                         Current Step
                       </span>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

                 {activeTab === 'faq' && (
           <div className="max-w-4xl mx-auto">
             <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Frequently Asked Questions</h2>
             <div className="space-y-3 md:space-y-4">
               {faqs.map((faq) => (
                 <div key={faq.id} className="bg-white rounded-lg shadow p-4 md:p-6">
                   <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">{faq.question}</h3>
                   <p className="text-gray-600 text-sm md:text-base">{faq.answer}</p>
                 </div>
               ))}
             </div>
           </div>
         )}

                 {activeTab === 'map' && (
           <div className="max-w-4xl mx-auto">
             <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Campus Map</h2>
             <div className="bg-white rounded-lg shadow p-4 md:p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 {locations.map((location) => (
                   <div key={location.id} className="border rounded-lg p-3 md:p-4">
                     <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">{location.name}</h3>
                     <a 
                       href={location.map_link} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-blue-600 hover:text-blue-800 text-xs md:text-sm inline-flex items-center"
                     >
                       View on Map <span className="ml-1">→</span>
                     </a>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )}

                 {activeTab === 'messages' && (
           <div className="max-w-4xl mx-auto">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 space-y-3 md:space-y-0">
               <h2 className="text-xl md:text-2xl font-bold text-gray-900">Announcement</h2>
               <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                 <button
                   onClick={fetchAnnouncements}
                   disabled={refreshingAnnouncements}
                   className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                 >
                   <RefreshCw className={`w-4 h-4 mr-2 ${refreshingAnnouncements ? 'animate-spin' : ''}`} />
                   {refreshingAnnouncements ? 'Refreshing...' : 'Refresh'}
                 </button>
                 {lastUpdate && (
                   <span className="text-xs md:text-sm text-gray-500">
                     Last updated: {lastUpdate.toLocaleTimeString()}
                   </span>
                 )}
               </div>
             </div>
             
             {announcements.length > 0 ? (
               <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
                 <div className="text-center mb-4 md:mb-6">
                   <MessageSquare className="w-8 h-8 md:w-12 md:h-12 text-blue-600 mx-auto mb-3 md:mb-4" />
                   <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Current Announcement</h3>
                 </div>
                 <div className="bg-blue-50 rounded-lg p-4 md:p-6 border-2 border-blue-200">
                   <p className="text-sm md:text-lg text-gray-900 text-center leading-relaxed">
                     {announcements[0].message}
                   </p>
                 </div>
               </div>
             ) : (
               <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
                 <div className="text-center">
                   <MessageSquare className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
                   <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">No Announcement</h3>
                   <p className="text-sm md:text-base text-gray-600">
                     There are no announcements at the moment. Check back later for updates.
                   </p>
                 </div>
               </div>
             )}
           </div>
         )}

                 {activeTab === 'token' && (
           <div className="max-w-4xl mx-auto">
             <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Your Token</h2>
             <div className="bg-white rounded-lg shadow p-4 md:p-6">
               {student?.doaa_token ? (
                 <div className="text-center">
                   <div className="bg-blue-50 rounded-lg p-4 md:p-8 border-2 border-blue-200">
                     <Ticket className="w-8 h-8 md:w-12 md:h-12 text-blue-600 mx-auto mb-3 md:mb-4" />
                     <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Your DOAA Token</h3>
                     <p className="text-2xl md:text-3xl font-mono text-blue-600 bg-blue-100 px-3 md:px-4 py-2 rounded">
                       {student.doaa_token}
                     </p>
                     <p className="text-sm md:text-base text-gray-600 mt-3 md:mt-4">
                       Show this token to volunteers at each step
                     </p>
                   </div>
                 </div>
               ) : (
                 <div className="text-center text-gray-600">
                   <Ticket className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" />
                   <p className="text-sm md:text-base">No token assigned yet. Please complete the registration process.</p>
                 </div>
               )}
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
