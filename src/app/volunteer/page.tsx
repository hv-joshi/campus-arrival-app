'use client';

import { useState, useEffect } from 'react';
import { supabase, getStudentProgress, TOTAL_STEPS, STEP_NAMES } from '@/lib/supabase';
import { ArrowLeft, LogOut, Search, Users, CheckCircle, Clock, AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Volunteer {
  id: number;
  username: string;
  password: string;
  role: string;
}

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

interface StepStats {
  step: number;
  count: number;
  name: string;
}

const STEPS = [
  { id: 1, name: "Hostel & Mess Registration" },
  { id: 2, name: "Insurance Verification" },
  { id: 3, name: "LHC Documents" },
  { id: 4, name: "Final Approval" }
];

export default function VolunteerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dashboard data
  const [students, setStudents] = useState<Student[]>([]);
  const [stepStats, setStepStats] = useState<StepStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [updatingStudent, setUpdatingStudent] = useState<number | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.iat_roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try multiple approaches to find the volunteer
      let data = null;
      let error = null;

      // First try: exact match
      const { data: exactData, error: exactError } = await supabase
        .from('volunteers')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password)
        .single();

      if (exactData) {
        data = exactData;
      } else {
        // Second try: case insensitive username search
        const { data: caseData, error: caseError } = await supabase
          .from('volunteers')
          .select('*')
          .ilike('username', username.trim())
          .eq('password', password)
          .single();

        if (caseData) {
          data = caseData;
        } else {
          // Third try: without .single() to see if multiple results
          const { data: multipleData, error: multipleError } = await supabase
            .from('volunteers')
            .select('*')
            .ilike('username', username.trim())
            .eq('password', password);

          if (multipleData && multipleData.length > 0) {
            data = multipleData[0]; // Take the first match
          } else {
            error = multipleError || caseError || exactError;
          }
        }
      }

      if (error || !data) {
        console.error('Volunteer login error:', error);
        setError('Invalid username or password');
        return;
      }

      setVolunteer(data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Volunteer login exception:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setStudents(data);
        setFilteredStudents(data);
        calculateStepStats(data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const calculateStepStats = (studentData: Student[]) => {
    const stats: StepStats[] = STEPS.map(step => {
      let count = 0;
      switch (step.id) {
        case 1:
          count = studentData.filter(student => student.hostel_mess_status).length;
          break;
        case 2:
          count = studentData.filter(student => student.insurance_status).length;
          break;
        case 3:
          count = studentData.filter(student => student.lhc_docs_status).length;
          break;
        case 4:
          count = studentData.filter(student => student.final_approval_status).length;
          break;
      }
      return {
        step: step.id,
        name: step.name,
        count
      };
    });
    setStepStats(stats);
  };

  const updateStudentStep = async (studentId: number, step: string, value: boolean) => {
    setUpdatingStudent(studentId);
    try {
      const updateData: any = {};
      updateData[step] = value;

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', studentId);

      if (error) {
        console.error('Error updating student:', error);
        setUpdateMessage({ type: 'error', message: 'Failed to update student status' });
        return;
      }

      // Update local state
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { ...student, [step]: value }
          : student
      ));

      // Show success message
      const student = students.find(s => s.id === studentId);
      const stepName = STEPS.find(s => s.id === parseInt(step.replace('_status', '')))?.name || step;
      setUpdateMessage({ 
        type: 'success', 
        message: `Updated ${student?.student_name}'s ${stepName} status to ${value ? 'completed' : 'pending'}` 
      });

      // Clear message after 3 seconds
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      console.error('Error updating student step:', err);
      setUpdateMessage({ type: 'error', message: 'Failed to update student status' });
    } finally {
      setUpdatingStudent(null);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setVolunteer(null);
    setUsername('');
    setPassword('');
    setError('');
    setStudents([]);
    setFilteredStudents([]);
    setStepStats([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Login</h1>
            <p className="text-gray-600">Access the volunteer dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
                             <input
                 type="text"
                 value={username}
                 onChange={(e) => setUsername(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                 placeholder="Enter your username"
                 required
               />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
                             <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                 placeholder="Enter your password"
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
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalStudents = students.length;
  const completedStudents = students.filter(s => s.final_approval_status).length;
  const inProgressStudents = totalStudents - completedStudents;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        {/* Update Notification */}
        {updateMessage && (
          <div className={`border-b ${
            updateMessage.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {updateMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  )}
                  <span className={`text-sm ${
                    updateMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {updateMessage.message}
                  </span>
                </div>
                <button
                  onClick={() => setUpdateMessage(null)}
                  className={`${
                    updateMessage.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
                  }`}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Volunteer Dashboard</h1>
              <p className="text-gray-600">Welcome, {volunteer?.username} ({volunteer?.role})</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchStudents}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
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
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step Statistics */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Step Statistics</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              {stepStats.map((stat) => (
                <div key={stat.step} className="text-center">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                    <p className="text-sm text-gray-600">{stat.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Student Search and List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Student Management</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                 <input
                   type="text"
                   placeholder="Search by IAT roll number or name..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                 />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hostel & Mess
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Insurance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LHC Docs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Approval
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                        <div className="text-sm text-gray-500">{student.iat_roll_no}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.doaa_token || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => updateStudentStep(student.id, 'hostel_mess_status', !student.hostel_mess_status)}
                        disabled={updatingStudent === student.id}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          student.hostel_mess_status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {updatingStudent === student.id ? 'Updating...' : (student.hostel_mess_status ? '✓' : 'Pending')}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => updateStudentStep(student.id, 'insurance_status', !student.insurance_status)}
                        disabled={updatingStudent === student.id}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          student.insurance_status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {updatingStudent === student.id ? 'Updating...' : (student.insurance_status ? '✓' : 'Pending')}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => updateStudentStep(student.id, 'lhc_docs_status', !student.lhc_docs_status)}
                        disabled={updatingStudent === student.id}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          student.lhc_docs_status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {updatingStudent === student.id ? 'Updating...' : (student.lhc_docs_status ? '✓' : 'Pending')}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => updateStudentStep(student.id, 'final_approval_status', !student.final_approval_status)}
                        disabled={updatingStudent === student.id}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          student.final_approval_status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {updatingStudent === student.id ? 'Updating...' : (student.final_approval_status ? '✓' : 'Pending')}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {student.flagged && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          Flagged
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No students found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
