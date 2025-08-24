'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, LogOut, Plus, Trash2, Edit, Save, X, MessageSquare, Users, FileText, MapPin } from 'lucide-react';
import Link from 'next/link';

interface Volunteer {
  id: number;
  username: string;
  password: string;
  role: string;
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

interface Location {
  id: number;
  name: string;
  map_link: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data states
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Form states
  const [newVolunteer, setNewVolunteer] = useState({ username: '', password: '', role: 'volunteer' });
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  const [newStudent, setNewStudent] = useState({
    iat_roll_no: '',
    student_name: '',
    doaa_token: '',
    flagged: false,
    hostel_mess_status: false,
    insurance_status: false,
    lhc_docs_status: false,
    final_approval_status: false
  });
  const [newLocation, setNewLocation] = useState({ name: '', map_link: '' });
  
  // Edit states
  const [editingFAQ, setEditingFAQ] = useState<number | null>(null);
  const [editFAQData, setEditFAQData] = useState({ question: '', answer: '' });
  const [editingStudent, setEditingStudent] = useState<number | null>(null);
  const [editStudentData, setEditStudentData] = useState({
    iat_roll_no: '',
    student_name: '',
    doaa_token: '',
    flagged: false,
    hostel_mess_status: false,
    insurance_status: false,
    lhc_docs_status: false,
    final_approval_status: false
  });
  const [editingLocation, setEditingLocation] = useState<number | null>(null);
  const [editLocationData, setEditLocationData] = useState({ name: '', map_link: '' });
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'volunteers' | 'announcements' | 'faqs' | 'students' | 'locations'>('volunteers');

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try multiple approaches to find the admin
      let data = null;
      let error = null;

      // First try: exact match
      const { data: exactData, error: exactError } = await supabase
        .from('volunteers')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password)
        .eq('role', 'admin')
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
          .eq('role', 'admin')
          .single();

        if (caseData) {
          data = caseData;
        } else {
          // Third try: without .single() to see if multiple results
          const { data: multipleData, error: multipleError } = await supabase
            .from('volunteers')
            .select('*')
            .ilike('username', username.trim())
            .eq('password', password)
            .eq('role', 'admin');

          if (multipleData && multipleData.length > 0) {
            data = multipleData[0]; // Take the first match
          } else {
            error = multipleError || caseError || exactError;
          }
        }
      }

      if (error || !data) {
        console.error('Admin login error:', error);
        setError('Invalid admin credentials');
        return;
      }

      setIsAuthenticated(true);
    } catch (err) {
      console.error('Admin login exception:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    await Promise.all([
      fetchVolunteers(),
      fetchFAQs(),
      fetchAnnouncements(),
      fetchStudents(),
      fetchLocations()
    ]);
  };

  const fetchVolunteers = async () => {
    try {
      const { data } = await supabase
        .from('volunteers')
        .select('*')
        .order('id', { ascending: false });
      
      if (data) setVolunteers(data);
    } catch (err) {
      console.error('Error fetching volunteers:', err);
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
        .order('id', { ascending: false });
      
      if (data) setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
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

  const addVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolunteer.username || !newVolunteer.password) return;

    try {
      const { error } = await supabase
        .from('volunteers')
        .insert([{
          username: newVolunteer.username,
          password: newVolunteer.password,
          role: newVolunteer.role
        }]);

      if (error) throw error;

      setNewVolunteer({ username: '', password: '', role: 'volunteer' });
      fetchVolunteers();
    } catch (err) {
      console.error('Error adding volunteer:', err);
    }
  };

  const deleteVolunteer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this volunteer?')) return;

    try {
      const { error } = await supabase
        .from('volunteers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchVolunteers();
    } catch (err) {
      console.error('Error deleting volunteer:', err);
    }
  };

  const addAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;

    try {
      // If there's an existing announcement, delete it first
      if (announcements.length > 0) {
        const { error: deleteError } = await supabase
          .from('announcements')
          .delete()
          .eq('id', announcements[0].id);

        if (deleteError) throw deleteError;
      }

      // Insert the new announcement
      const { error } = await supabase
        .from('announcements')
        .insert([{
          message: newAnnouncement
        }]);

      if (error) throw error;

      setNewAnnouncement('');
      fetchAnnouncements();
    } catch (err) {
      console.error('Error updating announcement:', err);
    }
  };

  const deleteAnnouncement = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  const addFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFAQ.question || !newFAQ.answer) return;

    try {
      const { error } = await supabase
        .from('faqs')
        .insert([newFAQ]);

      if (error) throw error;

      setNewFAQ({ question: '', answer: '' });
      fetchFAQs();
    } catch (err) {
      console.error('Error adding FAQ:', err);
    }
  };

  const startEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq.id);
    setEditFAQData({ question: faq.question, answer: faq.answer });
  };

  const saveEditFAQ = async () => {
    if (!editingFAQ) return;

    try {
      const { error } = await supabase
        .from('faqs')
        .update(editFAQData)
        .eq('id', editingFAQ);

      if (error) throw error;

      setEditingFAQ(null);
      setEditFAQData({ question: '', answer: '' });
      fetchFAQs();
    } catch (err) {
      console.error('Error updating FAQ:', err);
    }
  };

  const deleteFAQ = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFAQs();
    } catch (err) {
      console.error('Error deleting FAQ:', err);
    }
  };

  // Student management functions
  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.iat_roll_no || !newStudent.student_name) return;

    try {
      const studentData = {
        ...newStudent,
        doaa_token: newStudent.doaa_token ? parseInt(newStudent.doaa_token) : null
      };

      const { error } = await supabase
        .from('students')
        .insert([studentData]);

      if (error) throw error;

      setNewStudent({
        iat_roll_no: '',
        student_name: '',
        doaa_token: '',
        flagged: false,
        hostel_mess_status: false,
        insurance_status: false,
        lhc_docs_status: false,
        final_approval_status: false
      });
      fetchStudents();
    } catch (err) {
      console.error('Error adding student:', err);
    }
  };

  const startEditStudent = (student: Student) => {
    setEditingStudent(student.id);
    setEditStudentData({
      iat_roll_no: student.iat_roll_no,
      student_name: student.student_name,
      doaa_token: student.doaa_token?.toString() || '',
      flagged: student.flagged,
      hostel_mess_status: student.hostel_mess_status,
      insurance_status: student.insurance_status,
      lhc_docs_status: student.lhc_docs_status,
      final_approval_status: student.final_approval_status
    });
  };

  const saveEditStudent = async () => {
    if (!editingStudent) return;

    try {
      const studentData = {
        ...editStudentData,
        doaa_token: editStudentData.doaa_token ? parseInt(editStudentData.doaa_token) : null
      };

      const { error } = await supabase
        .from('students')
        .update(studentData)
        .eq('id', editingStudent);

      if (error) throw error;

      setEditingStudent(null);
      setEditStudentData({
        iat_roll_no: '',
        student_name: '',
        doaa_token: '',
        flagged: false,
        hostel_mess_status: false,
        insurance_status: false,
        lhc_docs_status: false,
        final_approval_status: false
      });
      fetchStudents();
    } catch (err) {
      console.error('Error updating student:', err);
    }
  };

  const deleteStudent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchStudents();
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  // Location management functions
  const addLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.name || !newLocation.map_link) return;

    try {
      const { error } = await supabase
        .from('locations')
        .insert([newLocation]);

      if (error) throw error;

      setNewLocation({ name: '', map_link: '' });
      fetchLocations();
    } catch (err) {
      console.error('Error adding location:', err);
    }
  };

  const startEditLocation = (location: Location) => {
    setEditingLocation(location.id);
    setEditLocationData({ name: location.name, map_link: location.map_link });
  };

  const saveEditLocation = async () => {
    if (!editingLocation) return;

    try {
      const { error } = await supabase
        .from('locations')
        .update(editLocationData)
        .eq('id', editingLocation);

      if (error) throw error;

      setEditingLocation(null);
      setEditLocationData({ name: '', map_link: '' });
      fetchLocations();
    } catch (err) {
      console.error('Error updating location:', err);
    }
  };

  const deleteLocation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchLocations();
    } catch (err) {
      console.error('Error deleting location:', err);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setError('');
    setVolunteers([]);
    setFaqs([]);
    setAnnouncements([]);
    setStudents([]);
    setLocations([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Administrative access required</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Enter admin username"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Enter admin password"
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
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Administrative Control Panel</p>
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
              { id: 'volunteers', label: 'Volunteers', icon: Users },
              { id: 'announcements', label: 'Announcement', icon: MessageSquare },
              { id: 'faqs', label: 'FAQs', icon: FileText },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'locations', label: 'Locations', icon: MapPin }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
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

      <div className="container mx-auto px-4 py-8">
        {/* Volunteers Tab */}
        {activeTab === 'volunteers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Add New Volunteer</h2>
              </div>
              <div className="p-6">
                <form onSubmit={addVolunteer} className="grid md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newVolunteer.username}
                    onChange={(e) => setNewVolunteer(prev => ({ ...prev, username: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newVolunteer.password}
                    onChange={(e) => setNewVolunteer(prev => ({ ...prev, password: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    required
                  />
                  <select
                    value={newVolunteer.role}
                    onChange={(e) => setNewVolunteer(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  >
                    <option value="volunteer">Volunteer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Manage Volunteers</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {volunteers.map((volunteer) => (
                      <tr key={volunteer.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {volunteer.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            volunteer.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {volunteer.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => deleteVolunteer(volunteer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Manage Announcement</h2>
                <p className="text-sm text-gray-600 mt-1">Only one announcement can be active at a time</p>
              </div>
              <div className="p-6">
                {announcements.length > 0 ? (
                  <div className="space-y-6">
                    {/* Current Announcement Display */}
                                         <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                       <h3 className="font-medium text-blue-900 mb-2">Current Announcement</h3>
                       <p className="text-blue-800 mb-3">{announcements[0].message}</p>
                       <div className="flex justify-end">
                         <button
                           onClick={() => deleteAnnouncement(announcements[0].id)}
                           className="text-red-600 hover:text-red-900 text-sm"
                         >
                           <Trash2 className="w-4 h-4 inline mr-1" />
                           Remove
                         </button>
                       </div>
                     </div>
                    
                    {/* Replace Announcement Form */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Replace with New Announcement</h4>
                      <form onSubmit={addAnnouncement} className="flex space-x-4">
                        <input
                          type="text"
                          placeholder="Enter new announcement message..."
                          value={newAnnouncement}
                          onChange={(e) => setNewAnnouncement(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                          required
                        />
                        <button
                          type="submit"
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                        >
                          Replace
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-lg font-medium text-gray-900 mb-2">No Active Announcement</p>
                      <p className="text-gray-600">Create the first announcement to get started</p>
                    </div>
                    
                    <form onSubmit={addAnnouncement} className="flex space-x-4">
                      <input
                        type="text"
                        placeholder="Enter announcement message..."
                        value={newAnnouncement}
                        onChange={(e) => setNewAnnouncement(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                      >
                        Create
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Add New FAQ</h2>
              </div>
              <div className="p-6">
                <form onSubmit={addFAQ} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Question"
                    value={newFAQ.question}
                    onChange={(e) => setNewFAQ(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    required
                  />
                  <textarea
                    placeholder="Answer"
                    value={newFAQ.answer}
                    onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Add FAQ
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Manage FAQs</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {faqs.map((faq) => (
                  <div key={faq.id} className="p-6">
                    {editingFAQ === faq.id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editFAQData.question}
                          onChange={(e) => setEditFAQData(prev => ({ ...prev, question: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                        <textarea
                          value={editFAQData.answer}
                          onChange={(e) => setEditFAQData(prev => ({ ...prev, answer: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEditFAQ}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingFAQ(null)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                          <p className="text-gray-600">{faq.answer}</p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => startEditFAQ(faq)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteFAQ(faq.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                             </div>
             </div>

             {/* Student Edit Form */}
             {editingStudent && (
               <div className="bg-white rounded-lg shadow">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <h2 className="text-lg font-semibold text-gray-900">Edit Student</h2>
                 </div>
                 <div className="p-6">
                   <form onSubmit={(e) => { e.preventDefault(); saveEditStudent(); }} className="grid md:grid-cols-2 gap-4">
                     <input
                       type="text"
                       placeholder="IAT Roll Number"
                       value={editStudentData.iat_roll_no}
                       onChange={(e) => setEditStudentData(prev => ({ ...prev, iat_roll_no: e.target.value }))}
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                       required
                     />
                     <input
                       type="text"
                       placeholder="Student Name"
                       value={editStudentData.student_name}
                       onChange={(e) => setEditStudentData(prev => ({ ...prev, student_name: e.target.value }))}
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                       required
                     />
                     <input
                       type="number"
                       placeholder="DOAA Token (optional)"
                       value={editStudentData.doaa_token}
                       onChange={(e) => setEditStudentData(prev => ({ ...prev, doaa_token: e.target.value }))}
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                     />
                     <div className="grid md:grid-cols-2 gap-4">
                       <label className="flex items-center">
                         <input
                           type="checkbox"
                           checked={editStudentData.flagged}
                           onChange={(e) => setEditStudentData(prev => ({ ...prev, flagged: e.target.checked }))}
                           className="mr-2"
                         />
                         <span className="text-sm text-gray-700">Flagged</span>
                       </label>
                       <label className="flex items-center">
                         <input
                           type="checkbox"
                           checked={editStudentData.hostel_mess_status}
                           onChange={(e) => setEditStudentData(prev => ({ ...prev, hostel_mess_status: e.target.checked }))}
                           className="mr-2"
                         />
                         <span className="text-sm text-gray-700">Hostel & Mess</span>
                       </label>
                       <label className="flex items-center">
                         <input
                           type="checkbox"
                           checked={editStudentData.insurance_status}
                           onChange={(e) => setEditStudentData(prev => ({ ...prev, insurance_status: e.target.checked }))}
                           className="mr-2"
                         />
                         <span className="text-sm text-gray-700">Insurance</span>
                       </label>
                       <label className="flex items-center">
                         <input
                           type="checkbox"
                           checked={editStudentData.lhc_docs_status}
                           onChange={(e) => setEditStudentData(prev => ({ ...prev, lhc_docs_status: e.target.checked }))}
                           className="mr-2"
                         />
                         <span className="text-sm text-gray-700">LHC Docs</span>
                       </label>
                       <label className="flex items-center">
                         <input
                           type="checkbox"
                           checked={editStudentData.final_approval_status}
                           onChange={(e) => setEditStudentData(prev => ({ ...prev, final_approval_status: e.target.checked }))}
                           className="mr-2"
                         />
                         <span className="text-sm text-gray-700">Final Approval</span>
                       </label>
                     </div>
                     <div className="flex space-x-2 md:col-span-2">
                       <button
                         type="submit"
                         className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                       >
                         <Save className="w-4 h-4 mr-2" />
                         Save Changes
                       </button>
                       <button
                         type="button"
                         onClick={() => setEditingStudent(null)}
                         className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                       >
                         <X className="w-4 h-4 mr-2" />
                         Cancel
                       </button>
                     </div>
                   </form>
                 </div>
               </div>
             )}
           </div>
         )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Add New Student</h2>
              </div>
              <div className="p-6">
                <form onSubmit={addStudent} className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="IAT Roll Number"
                    value={newStudent.iat_roll_no}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, iat_roll_no: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Student Name"
                    value={newStudent.student_name}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, student_name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    required
                  />
                  <input
                    type="number"
                    placeholder="DOAA Token (optional)"
                    value={newStudent.doaa_token}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, doaa_token: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                  />
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStudent.flagged}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, flagged: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Flagged</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 md:col-span-2"
                  >
                    Add Student
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Manage Students</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                            <div className="text-sm text-gray-500">{student.iat_roll_no}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.doaa_token ? `#${student.doaa_token}` : 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {student.hostel_mess_status && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Hostel</span>}
                            {student.insurance_status && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Insurance</span>}
                            {student.lhc_docs_status && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">LHC</span>}
                            {student.final_approval_status && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Final</span>}
                            {student.flagged && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Flagged</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditStudent(student)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteStudent(student.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Add New Location</h2>
              </div>
              <div className="p-6">
                <form onSubmit={addLocation} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Location Name"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    required
                  />
                  <input
                    type="url"
                    placeholder="Map Link"
                    value={newLocation.map_link}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, map_link: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Add Location
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Manage Locations</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {locations.map((location) => (
                  <div key={location.id} className="p-6">
                    {editingLocation === location.id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editLocationData.name}
                          onChange={(e) => setEditLocationData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                        <input
                          type="url"
                          value={editLocationData.map_link}
                          onChange={(e) => setEditLocationData(prev => ({ ...prev, map_link: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEditLocation}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingLocation(null)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{location.name}</h3>
                          <a 
                            href={location.map_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {location.map_link}
                          </a>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => startEditLocation(location)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLocation(location.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
