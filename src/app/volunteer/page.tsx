'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, getStudentProgress, TOTAL_STEPS, STEP_NAMES } from '@/lib/supabase';
import { ArrowLeft, LogOut, Search, Users, CheckCircle, Clock, AlertCircle, BarChart3, RefreshCw, Ticket, FileText, ToggleLeft, ToggleRight, X, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';

interface Volunteer {
  id: number;
  username: string;
  password: string;
  role: string;
  can_verify_lhc: boolean;
  is_available: boolean;
}

interface Student {
  id: number;
  created_at: string;
  iat_roll_no: string;
  student_name: string;
  doaa_token?: number;
  token_assigned?: boolean;
  verified_docs: Record<string, any>;
  flagged: boolean;
  fees_paid: boolean;
  hostel_mess_status: boolean;
  insurance_status: boolean;
  lhc_docs_status: boolean;
  final_approval_status: boolean;
}

interface ApprovalToken {
  id: number;
  token_number: number;
  student_roll_no: string;
  created_at: string;
  volunteer_id?: number;
  is_processing?: boolean;
}

interface StepStats {
  step: number;
  count: number;
  name: string;
}

interface DocumentCheck {
  id: string;
  name: string;
  required: boolean;
  checked: boolean;
  missing: boolean;
  notes: string;
}

// Use STEP_NAMES from supabase.ts instead of local STEPS constant

const LHC_DOCUMENTS: DocumentCheck[] = [
  { id: 'admission_letter', name: 'Admission Letter', required: true, checked: false, missing: false, notes: '' },
  { id: 'photo_id', name: 'Photo ID Proof', required: true, checked: false, missing: false, notes: '' },
  { id: 'medical_certificate', name: 'Medical Certificate', required: true, checked: false, missing: false, notes: '' },
  { id: 'caste_certificate', name: 'Caste Certificate (if applicable)', required: false, checked: false, missing: false, notes: '' },
  { id: 'income_certificate', name: 'Income Certificate (if applicable)', required: false, checked: false, missing: false, notes: '' },
  { id: 'disability_certificate', name: 'Disability Certificate (if applicable)', required: false, checked: false, missing: false, notes: '' },
  { id: 'transfer_certificate', name: 'Transfer Certificate', required: true, checked: false, missing: false, notes: '' },
  { id: 'character_certificate', name: 'Character Certificate', required: true, checked: false, missing: false, notes: '' },
  { id: 'migration_certificate', name: 'Migration Certificate', required: true, checked: false, missing: false, notes: '' },
  { id: 'passport_photos', name: 'Passport Size Photographs', required: true, checked: false, missing: false, notes: '' }
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
  const [approvalTokens, setApprovalTokens] = useState<ApprovalToken[]>([]);
  const [stepStats, setStepStats] = useState<StepStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [updatingStudent, setUpdatingStudent] = useState<number | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Token assignment
  const [assigningToken, setAssigningToken] = useState(false);
  const [tokenQueue, setTokenQueue] = useState<{token: ApprovalToken, student: Student}[]>([]);

  // Calculate and update token queue
  const updateTokenQueue = useCallback(() => {
    const queue = approvalTokens
      .filter(token => {
        const student = students.find(s => s.iat_roll_no === token.student_roll_no);
        return student && !student.lhc_docs_status && !token.volunteer_id;
      })
      .sort((a, b) => a.token_number - b.token_number)
      .map(token => ({
        token,
        student: students.find(s => s.iat_roll_no === token.student_roll_no)!
      }));
    setTokenQueue(queue);
  }, [approvalTokens, students]);
  
  // LHC Document verification
  const [showLhcModal, setShowLhcModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [documentChecks, setDocumentChecks] = useState<DocumentCheck[]>(LHC_DOCUMENTS);
  const [verifyingDocs, setVerifyingDocs] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
      fetchApprovalTokens();
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
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password)
        .single();

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
      // Fetch students and tokens in parallel
      const [studentsResponse, tokensResponse] = await Promise.all([
        supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('approval_tokens')
          .select('*')
      ]);
      
      if (studentsResponse.data) {
        const students = studentsResponse.data;
        const tokens = tokensResponse.data || [];
        
        // Find students that need their token_assigned status fixed
        const studentsToFix = students.filter(student => {
          const hasToken = tokens.some(token => token.student_roll_no === student.iat_roll_no);
          return (hasToken && !student.token_assigned) || (!hasToken && student.token_assigned);
        });

        // Fix any inconsistencies
        if (studentsToFix.length > 0) {
          console.log('Fixing token_assigned status for', studentsToFix.length, 'students');
          await Promise.all(studentsToFix.map(student => {
            const hasToken = tokens.some(token => token.student_roll_no === student.iat_roll_no);
            return supabase
              .from('students')
              .update({ token_assigned: hasToken })
              .eq('id', student.id);
          }));

          // Fetch the updated student data
          const { data: refreshedData } = await supabase.from('students').select('*');
          if (refreshedData) {
            setStudents(refreshedData);
            setFilteredStudents(refreshedData);
            calculateStepStats(refreshedData);
          }
        } else {
          setStudents(students);
          setFilteredStudents(students);
          calculateStepStats(students);
        }
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchApprovalTokens = async () => {
    try {
      const { data } = await supabase
        .from('approval_tokens')
        .select('*')
        .order('token_number', { ascending: true });
      
      if (data) {
        setApprovalTokens(data);
      }
    } catch (err) {
      console.error('Error fetching approval tokens:', err);
    }
  };



  // Function to get the next available token for verification
  const getNextAvailableToken = () => {
    // Get all tokens that need LHC verification
    const availableTokens = approvalTokens
      .filter(token => {
        const student = students.find(s => s.iat_roll_no === token.student_roll_no);
        return student && !student.lhc_docs_status && !token.volunteer_id;
      })
      .sort((a, b) => a.token_number - b.token_number); // Sort by token number ascending

    return availableTokens[0]; // Return the lowest numbered token or undefined if none available
  };

  // Function to check and assign next token to volunteer
  const checkAndAssignNextToken = async () => {
    if (!volunteer?.can_verify_lhc || !volunteer.is_available) return;

    // Check if volunteer already has a token assigned
    const currentAssignment = approvalTokens.find(t => t.volunteer_id === volunteer.id);
    if (currentAssignment) {
      const student = students.find(s => s.iat_roll_no === currentAssignment.student_roll_no);
      if (student && !student.lhc_docs_status) {
        // Still has an incomplete token assigned
        return;
      }
    }

    // Get next available token
    const nextToken = getNextAvailableToken();
    if (nextToken) {
      try {
        const { error } = await supabase
          .from('approval_tokens')
          .update({ 
            volunteer_id: volunteer.id,
            is_processing: true 
          })
          .eq('id', nextToken.id);

        if (error) {
          console.error('Error assigning next token:', error);
          return;
        }

        // Refresh the tokens list
        await fetchApprovalTokens();
      } catch (err) {
        console.error('Error in automatic token assignment:', err);
      }
    }
  };

  // Check for next token assignment whenever tokens or volunteer status changes
  useEffect(() => {
    if (volunteer?.can_verify_lhc) {
      checkAndAssignNextToken();
    }
  }, [volunteer?.is_available, approvalTokens.length]);

  // Update token queue whenever tokens or students change
  useEffect(() => {
    updateTokenQueue();
  }, [updateTokenQueue, approvalTokens, students]);

  const calculateStepStats = (studentData: Student[]) => {
    const stats: StepStats[] = STEP_NAMES.map((name, index) => {
      let count = 0;
      switch (index) {
        case 0: // Fees Payment
          count = studentData.filter(student => student.fees_paid).length;
          break;
        case 1: // Hostel & Mess Registration
          count = studentData.filter(student => student.hostel_mess_status).length;
          break;
        case 2: // Insurance Verification
          count = studentData.filter(student => student.insurance_status).length;
          break;
        case 3: // Token Assignment
          count = studentData.filter(student => student.token_assigned).length;
          break;
        case 4: // LHC Documents
          count = studentData.filter(student => student.lhc_docs_status).length;
          break;
        case 5: // Final Approval
          count = studentData.filter(student => student.final_approval_status).length;
          break;
      }
      return {
        step: index + 1,
        name,
        count
      };
    });
    setStepStats(stats);
  };

  // Calculate students in queue (eligible for token assignment)
  const studentsInQueue = students.filter(student => 
    student.fees_paid && 
    student.hostel_mess_status && 
    student.insurance_status && 
    !student.token_assigned
  ).length;

  const toggleVolunteerAvailability = async () => {
    if (!volunteer) return;

    try {
      const { error } = await supabase
        .from('volunteers')
        .update({ is_available: !volunteer.is_available })
        .eq('id', volunteer.id);

      if (error) {
        console.error('Error updating volunteer availability:', error);
        setUpdateMessage({ type: 'error', message: 'Failed to update availability' });
        return;
      }

      setVolunteer(prev => prev ? { ...prev, is_available: !prev.is_available } : null);
      setUpdateMessage({ 
        type: 'success', 
        message: `You are now ${!volunteer.is_available ? 'available' : 'unavailable'} for LHC document verification` 
      });

      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      console.error('Error toggling availability:', err);
      setUpdateMessage({ type: 'error', message: 'Failed to update availability' });
    }
  };

  const assignTokenToStudent = async (student: Student) => {
    setAssigningToken(true);
    try {
      if (!volunteer) {
        setUpdateMessage({ type: 'error', message: 'No volunteer logged in' });
        return;
      }

      // Check if this volunteer can verify LHC docs and is available
      if (volunteer.can_verify_lhc && !volunteer.is_available) {
        setUpdateMessage({ type: 'error', message: 'You must be available to be assigned tokens for LHC verification' });
        return;
      }

      // Check if student already has a token in approval_tokens table
      const existingToken = approvalTokens.find(t => t.student_roll_no === student.iat_roll_no);
      if (existingToken) {
        // For LHC verifiers, allow them to claim unassigned tokens
        if (volunteer.can_verify_lhc && volunteer.is_available && !existingToken.volunteer_id && !student.lhc_docs_status) {
          // Claim this token for verification
          const { error: updateError } = await supabase
            .from('approval_tokens')
            .update({ 
              volunteer_id: volunteer.id,
              is_processing: true 
            })
            .eq('id', existingToken.id);

          if (updateError) {
            setUpdateMessage({ type: 'error', message: 'Failed to claim token for verification' });
            return;
          }

          // Update local state
          await fetchApprovalTokens();
          setUpdateMessage({ type: 'success', message: `Claimed Token #${existingToken.token_number} for verification` });
          return;
        }

        setUpdateMessage({ type: 'error', message: `Student already has Token #${existingToken.token_number} assigned` });
        return;
      }

      // Check if student has completed prerequisites
      if (!student.fees_paid || !student.hostel_mess_status || !student.insurance_status) {
        setUpdateMessage({ type: 'error', message: 'Student must complete fees, hostel & mess, and insurance before token assignment' });
        return;
      }

      // For LHC verifiers, check if they already have a token assigned that's not completed
      if (volunteer.can_verify_lhc) {
        const existingAssignment = approvalTokens.find(t => 
          t.volunteer_id === volunteer.id && 
          !students.find(s => s.iat_roll_no === t.student_roll_no)?.lhc_docs_status
        );
        
        if (existingAssignment) {
          setUpdateMessage({ type: 'error', message: `You already have Token #${existingAssignment.token_number} assigned for verification` });
          return;
        }
      }

      // Calculate next token number
      const nextTokenNumber = approvalTokens.length > 0 
        ? Math.max(...approvalTokens.map(t => t.token_number)) + 1 
        : 1;

      // Create new token
      const tokenData: any = {
        token_number: nextTokenNumber,
        student_roll_no: student.iat_roll_no,
      };

      // If volunteer is LHC verifier, assign them to this token
      if (volunteer.can_verify_lhc && volunteer.is_available) {
        tokenData.volunteer_id = volunteer.id;
        tokenData.is_processing = true;
      }

      const { data: newToken, error: tokenError } = await supabase
        .from('approval_tokens')
        .insert(tokenData)
        .select()
        .single();

      if (tokenError) {
        console.error('Error creating token:', tokenError);
        setUpdateMessage({ type: 'error', message: 'Failed to assign token: ' + tokenError.message });
        return;
      }

      // Update student with token and mark token assignment as complete
      const { error: studentError } = await supabase
        .from('students')
        .update({ 
          token_assigned: true  // Mark token assignment step as complete
        })
        .eq('id', student.id);

      if (studentError) {
        console.error('Error updating student:', studentError);
        setUpdateMessage({ type: 'error', message: 'Failed to update student: ' + studentError.message });
        return;
      }

      // Fetch fresh data to ensure we have the latest state
      await fetchApprovalTokens();
      await fetchStudents();

      setUpdateMessage({ 
        type: 'success', 
        message: `Assigned token #${newToken.token_number} to ${student.student_name}` 
      });

      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      console.error('Error assigning token:', err);
      setUpdateMessage({ type: 'error', message: 'Failed to assign token: ' + (err as Error).message });
    } finally {
      setAssigningToken(false);
    }
  };

  const openLhcModal = (student: Student) => {
    setSelectedStudent(student);
    setDocumentChecks(LHC_DOCUMENTS.map(doc => ({ ...doc, checked: false, missing: false, notes: '' })));
    setShowLhcModal(true);
  };

  const closeLhcModal = () => {
    setShowLhcModal(false);
    setSelectedStudent(null);
    setDocumentChecks(LHC_DOCUMENTS);
  };

  const toggleDocumentCheck = (docId: string, field: 'checked' | 'missing') => {
    setDocumentChecks(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, [field]: !doc[field] }
        : doc
    ));
  };

  const updateDocumentNotes = (docId: string, notes: string) => {
    setDocumentChecks(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, notes }
        : doc
    ));
  };

  const verifyLhcDocuments = async () => {
    if (!selectedStudent) return;

    // Check if volunteer can verify LHC documents
    if (!volunteer?.can_verify_lhc) {
      setUpdateMessage({ type: 'error', message: 'You do not have permission to verify LHC documents' });
      return;
    }

    // Check if volunteer is available for LHC verification
    if (!volunteer?.is_available) {
      setUpdateMessage({ type: 'error', message: 'You must be available for LHC document verification' });
      return;
    }

    setVerifyingDocs(true);
    try {
      // Check if all required documents are present
      const requiredDocs = documentChecks.filter(doc => doc.required);
      const missingRequired = requiredDocs.some(doc => doc.missing);
      
      if (missingRequired) {
        setUpdateMessage({ type: 'error', message: 'Cannot verify: Some required documents are missing' });
        return;
      }

      // Update student LHC docs status
      const { error } = await supabase
        .from('students')
        .update({ 
          lhc_docs_status: true,
          verified_docs: {
            ...selectedStudent.verified_docs,
            lhc_verification: {
              verified_at: new Date().toISOString(),
              documents: documentChecks,
              verified_by: volunteer?.username
            }
          }
        })
        .eq('id', selectedStudent.id);

      if (error) {
        console.error('Error updating LHC docs status:', error);
        setUpdateMessage({ type: 'error', message: 'Failed to verify documents' });
        return;
      }

      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id 
          ? { 
              ...s, 
              lhc_docs_status: true,
              verified_docs: {
                ...s.verified_docs,
                lhc_verification: {
                  verified_at: new Date().toISOString(),
                  documents: documentChecks,
                  verified_by: volunteer?.username
                }
              }
            }
          : s
      ));

      // Clear volunteer assignment from the completed token
      const completedToken = approvalTokens.find(t => t.student_roll_no === selectedStudent.iat_roll_no);
      if (completedToken) {
        const { error: tokenError } = await supabase
          .from('approval_tokens')
          .update({ 
            volunteer_id: null,
            is_processing: false
          })
          .eq('id', completedToken.id);

        if (tokenError) {
          console.error('Error updating token assignment:', tokenError);
        }
      }

      // Refresh tokens to get latest state
      await fetchApprovalTokens();

      // Try to assign next token automatically
      await checkAndAssignNextToken();

      setUpdateMessage({ 
        type: 'success', 
        message: `LHC documents verified for ${selectedStudent.student_name}` 
      });

      setTimeout(() => setUpdateMessage(null), 3000);
      closeLhcModal();
    } catch (err) {
      console.error('Error verifying LHC documents:', err);
      setUpdateMessage({ type: 'error', message: 'Failed to verify documents' });
    } finally {
      setVerifyingDocs(false);
    }
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
      const stepIndex = parseInt(step.replace('_status', '')) - 1;
      const stepName = STEP_NAMES[stepIndex] || step;
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
    setApprovalTokens([]);
    setShowLhcModal(false);
    setSelectedStudent(null);
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
  const studentsWithTokens = students.filter(s => s.doaa_token).length;
  
  // Calculate highest token assigned
  const assignedTokens = students
    .filter(s => s.doaa_token && s.doaa_token > 0)
    .map(s => s.doaa_token!)
    .sort((a, b) => b - a);
  const highestToken = assignedTokens.length > 0 ? assignedTokens[0] : 0;

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
              <p className="text-gray-600">
                Welcome, {volunteer?.username} ({volunteer?.role})
                {volunteer?.can_verify_lhc && ' - LHC Document Verifier'}
              </p>
              {/* Token Queue Display - Only for LHC Verifiers */}
              {volunteer?.can_verify_lhc && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification Queue</h2>
                  {tokenQueue.length > 0 ? (
                    <div className="space-y-2">
                      {tokenQueue.slice(0, 5).map(({ token, student }) => (
                        <div key={token.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                          <div>
                            <span className="font-medium text-black">Token #{token.token_number}</span>
                            <span className="text-sm text-black ml-2">{student.student_name}</span>
                          </div>
                        </div>
                      ))}
                      {tokenQueue.length > 5 && (
                        <p className="text-sm text-gray-500">+{tokenQueue.length - 5} more tokens in queue</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No tokens waiting for verification</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* Availability Toggle - Only for LHC Verifiers */}
              {volunteer?.can_verify_lhc && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">LHC Available:</span>
                  <button
                    onClick={toggleVolunteerAvailability}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium ${
                      volunteer?.is_available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {volunteer?.is_available ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                    <span>{volunteer?.is_available ? 'Yes' : 'No'}</span>
                  </button>
                </div>
              )}
              
              <button
                onClick={() => {
                  fetchStudents();
                  fetchApprovalTokens();
                }}
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
        <div className="grid md:grid-cols-6 gap-6 mb-8">
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

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <Ticket className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Queue</p>
                <p className="text-2xl font-bold text-gray-900">{studentsInQueue}</p>
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
            <div className="grid md:grid-cols-6 gap-4">
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
                    Fees Payment
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
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const existingToken = approvalTokens.find(t => t.student_roll_no === student.iat_roll_no);
                          
                          if (existingToken) {
                            return (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                  Token #{existingToken.token_number}
                                </span>
                                {volunteer?.can_verify_lhc && (
                                  <>
                                    {existingToken.volunteer_id === volunteer.id && (
                                      <span className="text-xs text-blue-600">
                                        Assigned to you for verification
                                      </span>
                                    )}
                                    {!existingToken.volunteer_id && !student.lhc_docs_status && volunteer.is_available && (
                                      <button
                                        onClick={() => assignTokenToStudent(student)}
                                        className="text-xs text-blue-600 underline hover:text-blue-800"
                                      >
                                        Claim for verification
                                      </button>
                                    )}
                                    {existingToken.volunteer_id && existingToken.volunteer_id !== volunteer.id && (
                                      <span className="text-xs text-gray-500">
                                        Being verified by another volunteer
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          } else if (volunteer?.can_verify_lhc && !volunteer.is_available) {
                            // For LHC verifiers who are not available
                            return (
                              <span className="text-xs text-gray-500">
                                Make yourself available to verify documents
                              </span>
                            );
                          } else {
                            // Show assign button if appropriate
                            return (
                              <button
                                onClick={() => assignTokenToStudent(student)}
                                disabled={assigningToken || (volunteer?.can_verify_lhc && !volunteer.is_available)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {assigningToken ? 'Assigning...' : 'Assign Token'}
                              </button>
                            );
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => updateStudentStep(student.id, 'fees_paid', !student.fees_paid)}
                        disabled={updatingStudent === student.id}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          student.fees_paid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {updatingStudent === student.id ? 'Updating...' : (student.fees_paid ? '✓' : 'Pending')}
                      </button>
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
                      <div className="flex items-center space-x-2">
                        {volunteer?.can_verify_lhc ? (
                          <>
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
                            {!student.lhc_docs_status && (
                              <button
                                onClick={() => openLhcModal(student)}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                                title="Verify LHC Documents"
                              >
                                <FileText className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            student.lhc_docs_status
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student.lhc_docs_status ? '✓' : 'Pending'}
                          </span>
                        )}
                      </div>
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

      {/* LHC Document Verification Modal */}
      {showLhcModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  LHC Document Verification - {selectedStudent.student_name}
                </h3>
                <button
                  onClick={closeLhcModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                {documentChecks.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleDocumentCheck(doc.id, 'checked')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {doc.checked ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                          <span className="font-medium text-gray-900">{doc.name}</span>
                          {doc.required && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              Required
                            </span>
                          )}
                        </div>
                        
                        {doc.checked && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center space-x-3">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={doc.missing}
                                  onChange={() => toggleDocumentCheck(doc.id, 'missing')}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-700">Document Missing</span>
                              </label>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (optional)
                              </label>
                              <textarea
                                value={doc.notes}
                                onChange={(e) => updateDocumentNotes(doc.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={2}
                                placeholder="Add any notes about this document..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {documentChecks.filter(d => d.checked && d.missing && d.required).length > 0 && (
                    <span className="text-red-600 font-medium">
                      ⚠️ Required documents are missing
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={closeLhcModal}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={verifyLhcDocuments}
                    disabled={verifyingDocs || documentChecks.filter(d => d.checked && d.missing && d.required).length > 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifyingDocs ? 'Verifying...' : 'Verify Documents'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
