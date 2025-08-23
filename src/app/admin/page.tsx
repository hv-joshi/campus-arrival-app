'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, LogOut, Plus, Trash2, Edit, Save, X, MessageSquare, Users, FileText } from 'lucide-react';
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
  
  // Form states
  const [newVolunteer, setNewVolunteer] = useState({ username: '', password: '', role: 'volunteer' });
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  
  // Edit states
  const [editingFAQ, setEditingFAQ] = useState<number | null>(null);
  const [editFAQData, setEditFAQData] = useState({ question: '', answer: '' });
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'volunteers' | 'announcements' | 'faqs'>('volunteers');

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
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('role', 'admin')
        .single();

      if (error || !data) {
        setError('Invalid admin credentials');
        return;
      }

      setIsAuthenticated(true);
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    await Promise.all([
      fetchVolunteers(),
      fetchFAQs(),
      fetchAnnouncements()
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
      const { error } = await supabase
        .from('announcements')
        .insert([{
          message: newAnnouncement
        }]);

      if (error) throw error;

      setNewAnnouncement('');
      fetchAnnouncements();
    } catch (err) {
      console.error('Error adding announcement:', err);
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setError('');
    setVolunteers([]);
    setFaqs([]);
    setAnnouncements([]);
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              { id: 'announcements', label: 'Announcements', icon: MessageSquare },
              { id: 'faqs', label: 'FAQs', icon: FileText }
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
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newVolunteer.password}
                    onChange={(e) => setNewVolunteer(prev => ({ ...prev, password: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <select
                    value={newVolunteer.role}
                    onChange={(e) => setNewVolunteer(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <h2 className="text-lg font-semibold text-gray-900">Send Announcement</h2>
              </div>
              <div className="p-6">
                <form onSubmit={addAnnouncement} className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Enter announcement message..."
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Announcements</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900">{announcement.message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Announcement #{announcement.id}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <textarea
                    placeholder="Answer"
                    value={newFAQ.answer}
                    onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <textarea
                          value={editFAQData.answer}
                          onChange={(e) => setEditFAQData(prev => ({ ...prev, answer: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          </div>
        )}
      </div>
    </div>
  );
}
