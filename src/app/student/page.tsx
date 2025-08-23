'use client';

import { useState, useEffect } from 'react';
import { supabase, getStudentProgress, TOTAL_STEPS, STEP_NAMES } from '@/lib/supabase';
import { CheckCircle, Circle, MapPin, MessageSquare, Ticket, ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';

interface Student {
  id: number;
  created_at: string;
  iat_roll_no: string;
  student_name: string;
  doaa_token?: number;
  verified_docs: Record<string, any>;
  flagged: boolean;
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
  { id: 1, name: "Hostel & Mess Registration", description: "Complete hostel and mess registration", location: "Hostel Office" },
  { id: 2, name: "Insurance Verification", description: "Verify insurance documents", location: "Admin Block" },
  { id: 3, name: "LHC Documents", description: "Submit LHC medical documents", location: "Health Center" },
  { id: 4, name: "Final Approval", description: "Get final approval for campus entry", location: "Student Center" }
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchFAQs();
      fetchAnnouncements();
      fetchLocations();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('iat_roll_no', iatRollNo)
        .single();

      if (error || !data) {
        setError('Invalid IAT Roll Number');
        return;
      }

      setStudent(data);
      setIsAuthenticated(true);
    } catch (err) {
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
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('id', { ascending: false })
        .limit(10);
      
      if (data) setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
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
    if (student.final_approval_status) return 4;
    if (student.lhc_docs_status) return 3;
    if (student.insurance_status) return 2;
    if (student.hostel_mess_status) return 1;
    return 0;
  };

  const isStepCompleted = (student: Student, stepId: number): boolean => {
    switch (stepId) {
      case 1: return student.hostel_mess_status;
      case 2: return student.insurance_status;
      case 3: return student.lhc_docs_status;
      case 4: return student.final_approval_status;
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {student?.student_name}!</h1>
              <p className="text-gray-600">IAT Roll No: {student?.iat_roll_no}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
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
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'checklist' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Arrival Checklist</h2>
            <div className="bg-white rounded-lg shadow p-6">
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
              
              <div className="space-y-4">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center p-4 rounded-lg border ${
                      isStepCompleted(student!, step.id)
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {isStepCompleted(student!, step.id) ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{step.name}</h3>
                      <p className="text-gray-600">{step.description}</p>
                      <p className="text-sm text-gray-500 mt-1">Location: {step.location}</p>
                    </div>
                    {step.id === currentStep && !isStepCompleted(student!, step.id) && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Campus Map</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {locations.map((location) => (
                  <div key={location.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{location.name}</h3>
                    <a 
                      href={location.map_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View on Map →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Announcements</h2>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-900 mb-2">{announcement.message}</p>
                  <p className="text-sm text-gray-500">
                    Announcement #{announcement.id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'token' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Token</h2>
            <div className="bg-white rounded-lg shadow p-6">
              {student?.doaa_token ? (
                <div className="text-center">
                  <div className="bg-blue-50 rounded-lg p-8 border-2 border-blue-200">
                    <Ticket className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Your DOAA Token</h3>
                    <p className="text-3xl font-mono text-blue-600 bg-blue-100 px-4 py-2 rounded">
                      {student.doaa_token}
                    </p>
                    <p className="text-gray-600 mt-4">
                      Show this token to volunteers at each step
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-600">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>No token assigned yet. Please complete the registration process.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
