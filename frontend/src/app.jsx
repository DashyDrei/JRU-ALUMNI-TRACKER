import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Plus, GraduationCap, Quote, Award, Linkedin, Mail, 
  X, CheckCircle2, BarChart3, Users, Sparkles, SlidersHorizontal, Moon, Sun, 
  ShieldCheck, CheckCircle, Edit3, Trash2, Lock, Key, Upload, 
  AlertTriangle, Check, Eye, Server
} from 'lucide-react';
import { COLLEGE_STRUCTURE } from './data/collegeData';
import { INITIAL_ALUMNI } from './data/initialAlumni';

export default function App() {
  const [alumniList, setAlumniList] = useState(() => {
    try {
      const saved = localStorage.getItem('JRU_ALUMNI_DATABASE_V4');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ALUMNI;
  });

  const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    try {
      return localStorage.getItem('JRU_ALUMNI_API_URL') || defaultApiBaseUrl;
    } catch (e) {
      return defaultApiBaseUrl;
    }
  });

  // Helper to ensure all requests skip the ngrok browser warning page
  const getHeaders = (extra = {}) => ({
    ...extra,
    'ngrok-skip-browser-warning': 'true'
  });

  const fetchAlumniFromDatabase = async (baseUrl = apiBaseUrl) => {
    try {
      const response = await fetch(`${baseUrl}/alumni`, {
        headers: getHeaders()
      });
      if (!response.ok) return false;
      const data = await response.json();
      if (data && data.length > 0) {
        setAlumniList(data);
      }
      return true;
    } catch (error) {
      console.warn('⚠️ Express MySQL server offline. Operating in local offline mode.');
      return false;
    }
  };

  useEffect(() => {
    fetchAlumniFromDatabase();
  }, [apiBaseUrl]);

  useEffect(() => {
    try {
      localStorage.setItem('JRU_ALUMNI_DATABASE_V4', JSON.stringify(alumniList));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, [alumniList]);

  const [activeTab, setActiveTab] = useState('directory');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [userRole, setUserRole] = useState('visitor');
  const [adminToken, setAdminToken] = useState(null);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState('');

  const clickCounterRef = useRef(0);
  const clickTimerRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2026);
  const [sortBy, setSortBy] = useState('batchDesc');

  const [visitorAlumnus, setVisitorAlumnus] = useState(null);
  const [editingAlumnus, setEditingAlumnus] = useState(null);
  const [deletingAlumnus, setDeletingAlumnus] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    studentIdSuffix: '192918',
    fullName: '',
    batchYear: 2024,
    collegeKey: 'CSE',
    programName: 'Bachelor of Science in Information Technology (BSIT)',
    major: '',
    motto: '',
    honor: 'Academic Excellence',
    academicHighlights: '',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80',
    email: '',
    linkedin: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogoClick = () => {
    clickCounterRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCounterRef.current >= 3) {
      clickCounterRef.current = 0;
      setPinInput('');
      setPinError('');
      setIsAdminPinModalOpen(true);
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCounterRef.current = 0;
      }, 1500);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setPinInput('');
        setPinError('');
        setIsAdminPinModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAdminAuthSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    try {
      const response = await fetch(`${apiBaseUrl}/admin/login`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ pin: pinInput })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPinError(result.error || 'Admin sign-in failed.');
        return;
      }

      setAdminToken(result.token);
      setUserRole('admin');
      setIsAdminPinModalOpen(false);
      setPinInput('');
      showToast('Administrator mode unlocked.');
    } catch (error) {
      setPinError('Could not reach the server. Admin sign-in is unavailable.');
    }
  };

  const handleExitAdmin = () => {
    setAdminToken(null);
    setUserRole('visitor');
    showToast("Returned to Visitor Mode");
  };

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    const trimmed = apiUrlInput.trim().replace(/\/+$/, '');
    if (!trimmed) {
      showToast('Please enter a backend API URL.');
      return;
    }
    try {
      localStorage.setItem('JRU_ALUMNI_API_URL', trimmed);
    } catch (err) {
      console.error('Storage error:', err);
    }
    setApiBaseUrl(trimmed);
    setIsApiSettingsOpen(false);
    showToast(`Backend set to ${trimmed}`);
  };

  const handleResetApiUrl = () => {
    try {
      localStorage.removeItem('JRU_ALUMNI_API_URL');
    } catch (err) {
      console.error('Storage error:', err);
    }
    setApiBaseUrl(defaultApiBaseUrl);
    setIsApiSettingsOpen(false);
    showToast('Backend URL reset to default.');
  };

  const handleTestApiUrl = async () => {
    const trimmed = apiUrlInput.trim().replace(/\/+$/, '');
    if (!trimmed) {
      showToast('Please enter a backend API URL.');
      return;
    }
    const ok = await fetchAlumniFromDatabase(trimmed);
    showToast(ok ? `Connected to ${trimmed}` : `Could not reach ${trimmed}`);
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, avatarUrl: e.target.result }));
      showToast('Graduation portrait loaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) processImageFile(file);
  };

  const availableProgramsForCollegeFilter = useMemo(() => {
    if (selectedCollege === 'ALL') {
      const all = [];
      Object.values(COLLEGE_STRUCTURE).forEach(col => {
        col.programs.forEach(p => {
          const label = p.major ? `${p.name} - ${p.major}` : p.name;
          if (!all.includes(label)) all.push(label);
        });
      });
      return all;
    }
    return COLLEGE_STRUCTURE[selectedCollege]?.programs.map(p => 
      p.major ? `${p.name} - ${p.major}` : p.name
    ) || [];
  }, [selectedCollege]);

  const filteredAlumni = useMemo(() => {
    return alumniList.filter(item => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch = !query || 
        item.fullName.toLowerCase().includes(query) ||
        (item.studentId && item.studentId.toLowerCase().includes(query)) ||
        item.motto.toLowerCase().includes(query) ||
        item.programName.toLowerCase().includes(query) ||
        (item.major && item.major.toLowerCase().includes(query)) ||
        (item.honor && item.honor.toLowerCase().includes(query));

      const matchCollege = selectedCollege === 'ALL' || item.collegeKey === selectedCollege;

      const matchProgram = selectedProgram === 'ALL' || 
        (item.major ? `${item.programName} - ${item.major}` : item.programName) === selectedProgram ||
        item.programName === selectedProgram;

      const matchBatch = item.batchYear >= startYear && item.batchYear <= endYear;

      return matchSearch && matchCollege && matchProgram && matchBatch;
    }).sort((a, b) => {
      if (sortBy === 'batchAsc') return a.batchYear - b.batchYear;
      if (sortBy === 'nameAsc') return a.fullName.localeCompare(b.fullName);
      return b.batchYear - a.batchYear;
    });
  }, [alumniList, searchTerm, selectedCollege, selectedProgram, startYear, endYear, sortBy]);

  const handleOpenEdit = (alumnus) => {
    const studentIdSuffix = alumnus.studentId ? alumnus.studentId.split('-')[1] || '192918' : '192918';
    setFormData({
      id: alumnus.id,
      studentIdSuffix: studentIdSuffix,
      fullName: alumnus.fullName,
      batchYear: alumnus.batchYear,
      collegeKey: alumnus.collegeKey,
      programName: alumnus.programName,
      major: alumnus.major || '',
      motto: alumnus.motto,
      honor: alumnus.honor || 'Graduate',
      academicHighlights: alumnus.academicHighlights || '',
      avatarUrl: alumnus.avatarUrl,
      email: alumnus.email || '',
      linkedin: alumnus.linkedin || ''
    });
    setEditingAlumnus(alumnus);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const formattedStudentId = `${String(formData.batchYear).slice(-2)}-${formData.studentIdSuffix || '192918'}`;

    const updatedData = {
      ...formData,
      studentId: formattedStudentId,
      batchYear: parseInt(formData.batchYear)
    };

    try {
      const response = await fetch(`${apiBaseUrl}/alumni/${formData.id}`, {
        method: 'PUT',
        headers: getHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }),
        body: JSON.stringify(updatedData)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'The server rejected the update.');
      }
    } catch (err) {
      console.warn('Could not update alumnus in MySQL:', err);
      showToast(`Could not save changes: ${err.message}`);
      return;
    }

    setAlumniList(prev => prev.map(item => {
      if (item.id === formData.id) {
        return { ...item, ...updatedData };
      }
      return item;
    }));
    setEditingAlumnus(null);
    showToast(`Updated student profile for ${formData.fullName}`);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAlumnus) return;
    const targetId = deletingAlumnus.id;
    const name = deletingAlumnus.fullName;

    try {
      const response = await fetch(`${apiBaseUrl}/alumni/${targetId}`, {
        method: 'DELETE',
        headers: getHeaders({ Authorization: `Bearer ${adminToken}` })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'The server rejected the deletion.');
      }
    } catch (err) {
      console.warn('Could not delete alumnus from MySQL:', err);
      showToast(`Could not delete record: ${err.message}`);
      return;
    }

    setAlumniList(prev => prev.filter(a => a.id !== targetId));
    setDeletingAlumnus(null);
    if (visitorAlumnus && visitorAlumnus.id === targetId) {
      setVisitorAlumnus(null);
    }
    showToast(`🗑️ Permanently deleted alumni record for ${name}`);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.motto) {
      showToast('Please fill out all required fields.');
      return;
    }

    const formattedStudentId = `${String(formData.batchYear).slice(-2)}-${formData.studentIdSuffix || Math.floor(100000 + Math.random() * 900000)}`;

    const newEntry = {
      ...formData,
      id: `jru-${formData.batchYear}-${Math.floor(100 + Math.random() * 900)}`,
      studentId: formattedStudentId,
      batchYear: parseInt(formData.batchYear),
      verified: true
    };

    let savedEntry;
    try {
      const response = await fetch(`${apiBaseUrl}/alumni`, {
        method: 'POST',
        headers: getHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }),
        body: JSON.stringify(newEntry)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'The server rejected the new record.');
      }
      savedEntry = {
        ...newEntry,
        id: result.id,
        studentId: result.studentId
      };
    } catch (err) {
      console.warn('Could not save alumnus to MySQL:', err);
      showToast(`Could not register alumnus: ${err.message}`);
      return;
    }

    setAlumniList(prev => [savedEntry, ...prev]);
    setIsAddModalOpen(false);
    showToast(`Registered new Rizalian graduate: ${formData.fullName}!`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {userRole === 'admin' && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black text-center border-b border-amber-600 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>ADMINISTRATOR MODE ACTIVE: Full privileges enabled to Edit or Delete Alumni records.</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                setFormData({
                  id: '',
                  studentIdSuffix: `${Math.floor(100000 + Math.random() * 900000)}`,
                  fullName: '',
                  batchYear: 2024,
                  collegeKey: 'CSE',
                  programName: 'Bachelor of Science in Information Technology (BSIT)',
                  major: '',
                  motto: '',
                  honor: 'Academic Excellence',
                  academicHighlights: '',
                  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80',
                  email: '',
                  linkedin: ''
                });
                setIsAddModalOpen(true);
              }}
              className="bg-slate-950 text-amber-400 hover:text-amber-300 px-3 py-1 rounded-lg text-[10px] uppercase font-black transition-all flex items-center space-x-1"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Add Alumni</span>
            </button>
            <button 
              onClick={handleExitAdmin}
              className="bg-slate-950 text-slate-200 hover:text-white px-3 py-1 rounded-lg text-[10px] uppercase font-black transition-all"
            >
              Exit Admin
            </button>
          </div>
        </div>
      )}

      <header className={`sticky top-0 z-40 backdrop-blur-md border-b shadow-sm transition-colors ${
        darkMode ? 'bg-[#0B2545]/95 text-white border-amber-500/20' : 'bg-white/95 text-slate-900 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none group" 
            onClick={handleLogoClick}
            title="Jose Rizal University (Triple-click for Secret Admin Login)"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B2545] rounded-[14px] flex items-center justify-center border border-amber-400/40">
                <GraduationCap className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <span className={`font-extrabold text-xl tracking-tight block ${darkMode ? 'text-white' : 'text-[#0B2545]'}`}>
                JRU Alumni Tracker
              </span>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Jose Rizal University • Mandaluyong City
              </p>
            </div>
          </div>

          <div className={`hidden md:flex items-center space-x-1 p-1.5 rounded-xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-300'
          }`}>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'directory' 
                  ? (darkMode ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-[#0B2545] text-amber-400 shadow-md')
                  : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200')
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Alumni Directory</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'analytics' 
                  ? (darkMode ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-[#0B2545] text-amber-400 shadow-md')
                  : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200')
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Insights</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setApiUrlInput(apiBaseUrl);
                setIsApiSettingsOpen(true);
              }}
              className={`p-2.5 rounded-xl border transition-all flex items-center space-x-1.5 ${
                darkMode 
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              }`}
              title="Backend API Connection"
            >
              <Server className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Backend</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-all flex items-center space-x-1.5 ${
                darkMode 
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              }`}
              title="Toggle Day Mode / Night Mode"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold hidden sm:inline text-amber-300">Day Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold hidden sm:inline text-slate-800">Night Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B2545] via-[#13315C] to-[#1E3D59] text-white border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wide shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Find Your Inner Hero</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Jose Rizal University <br />
                <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Alumni Tracker
                </span>
              </h1>

              <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
                Connect with graduates across all colleges. Discover academic achievements, personal mottos, graduation portraits, and verified student credentials from Jose Rizal University.
              </p>
            </div>

            <div className="md:col-span-4 bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-amber-500/30 shadow-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-extrabold uppercase tracking-wider text-amber-400">
                <span className="flex items-center space-x-1">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Rizalian Registry</span>
                </span>
                <span className="text-slate-300 text-[10px] font-semibold">Active Database</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-[#0B2545] p-3 rounded-xl border border-slate-700">
                  <p className="text-2xl font-black text-amber-400">{alumniList.length}</p>
                  <p className="text-[10px] font-bold text-slate-300">Verified Graduates</p>
                </div>
                <div className="bg-[#0B2545] p-3 rounded-xl border border-slate-700">
                  <p className="text-2xl font-black text-blue-300">6 Colleges</p>
                  <p className="text-[10px] font-bold text-slate-300">Academic Hub</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'directory' && (
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border transition-colors ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-md'
            }`}>
              <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${
                darkMode ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className="relative flex-1">
                  <Search className={`w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search by student name, ID (e.g. 18-192918), motto, degree, or major..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                    }`}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                  <span className={`text-xs font-extrabold ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="batchDesc">Newest Batch</option>
                    <option value="batchAsc">Oldest Batch</option>
                    <option value="nameAsc">Name (A – Z)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${
                    darkMode ? 'text-amber-400' : 'text-[#0B2545]'
                  }`}>
                    College Filter
                  </label>
                  <select
                    value={selectedCollege}
                    onChange={(e) => {
                      setSelectedCollege(e.target.value);
                      setSelectedProgram('ALL');
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ALL">All Colleges (EAS, BAA, CSE, HTM, NHS, CJE)</option>
                    {Object.entries(COLLEGE_STRUCTURE).map(([key, col]) => (
                      <option key={key} value={key}>{col.short} - {col.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${
                    darkMode ? 'text-amber-400' : 'text-[#0B2545]'
                  }`}>
                    Program Offering
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ALL">All Degree Offerings</option>
                    {availableProgramsForCollegeFilter.map((prog, idx) => (
                      <option key={idx} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${
                    darkMode ? 'text-amber-400' : 'text-[#0B2545]'
                  }`}>
                    From Batch: <span className="font-extrabold text-amber-600 dark:text-amber-400">{startYear}</span>
                  </label>
                  <input
                    type="range"
                    min="2000"
                    max="2026"
                    value={startYear}
                    onChange={(e) => setStartYear(Math.min(parseInt(e.target.value), endYear))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${
                    darkMode ? 'text-amber-400' : 'text-[#0B2545]'
                  }`}>
                    To Batch: <span className="font-extrabold text-amber-600 dark:text-amber-400">{endYear}</span>
                  </label>
                  <input
                    type="range"
                    min="2000"
                    max="2026"
                    value={endYear}
                    onChange={(e) => setEndYear(Math.max(parseInt(e.target.value), startYear))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-xs font-black uppercase tracking-wider ${
                  darkMode ? 'text-slate-400' : 'text-slate-800'
                }`}>
                  Displaying <span className="text-amber-600 dark:text-amber-400 font-black">{filteredAlumni.length}</span> Rizalian Alumni Records
                </p>
                {userRole === 'admin' && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-lg">
                    ⚡ Admin Controls Active: Click Edit or Delete on Cards
                  </span>
                )}
              </div>

              {filteredAlumni.length === 0 ? (
                <div className={`text-center py-16 rounded-2xl border ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-md'
                }`}>
                  <GraduationCap className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <h3 className={`text-base font-extrabold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>No Alumni Profiles Found</h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Try clearing filters or searching another keyword.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredAlumni.map((item) => {
                    const collegeObj = COLLEGE_STRUCTURE[item.collegeKey] || COLLEGE_STRUCTURE.CSE;

                    return (
                      <div
                        key={item.id}
                        className={`group rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden flex flex-col sm:flex-row relative ${
                          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-md'
                        }`}
                      >
                        <div className="w-full sm:w-52 md:w-60 h-64 sm:h-auto flex-shrink-0 relative overflow-hidden bg-slate-900">
                          <img
                            src={item.avatarUrl}
                            alt={item.fullName}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent sm:hidden" />
                          
                          <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-400/30 flex items-center space-x-1 shadow-sm">
                            <GraduationCap className="w-3 h-3 text-amber-400" />
                            <span>Grad Portrait</span>
                          </div>

                          {item.verified && (
                            <div className="absolute bottom-2.5 left-2.5 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black flex items-center space-x-1 shadow-md">
                              <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                              <span>Verified Alumni</span>
                            </div>
                          )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                darkMode ? collegeObj.badgeBgDark : collegeObj.badgeBgLight
                              }`}>
                                {collegeObj.short} • {collegeObj.name}
                              </span>

                              <div className="flex items-center space-x-1.5">
                                <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30 font-mono">
                                  ID: {item.studentId}
                                </span>
                                <span className="text-[11px] font-black text-blue-900 dark:text-blue-200 bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-500/30">
                                  Class of {item.batchYear}
                                </span>
                              </div>
                            </div>

                            <h3 className={`text-lg font-black transition-colors ${
                              darkMode ? 'text-white group-hover:text-amber-400' : 'text-[#0B2545] group-hover:text-blue-900'
                            }`}>
                              {item.fullName}
                            </h3>

                            {item.honor && (
                              <p className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center space-x-1 mt-0.5">
                                <Award className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                                <span>{item.honor}</span>
                              </p>
                            )}

                            <div className="mt-2 space-y-0.5">
                              <p className={`text-xs font-extrabold line-clamp-1 ${
                                darkMode ? 'text-slate-200' : 'text-slate-900'
                              }`}>
                                {item.programName}
                              </p>
                              {item.major && (
                                <p className={`text-[11px] font-bold line-clamp-1 ${
                                  darkMode ? 'text-amber-300' : 'text-blue-900'
                                }`}>
                                  {item.major}
                                </p>
                              )}
                            </div>

                            <div className={`mt-3 p-3 rounded-xl border relative ${
                              darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-amber-50/90 border-amber-200'
                            }`}>
                              <Quote className={`w-4 h-4 absolute top-2 right-2 rotate-180 ${
                                darkMode ? 'text-amber-400/30' : 'text-amber-600/30'
                              }`} />
                              <p className={`text-xs italic font-semibold leading-relaxed pr-3 line-clamp-2 ${
                                darkMode ? 'text-slate-200' : 'text-slate-900'
                              }`}>
                                "{item.motto}"
                              </p>
                            </div>
                          </div>

                          <div className={`pt-3 border-t flex items-center justify-between ${
                            darkMode ? 'border-slate-800' : 'border-slate-200'
                          }`}>
                            <button
                              onClick={() => setVisitorAlumnus(item)}
                              className={`text-xs font-black flex items-center space-x-1 transition-colors ${
                                darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-[#0B2545] hover:text-amber-600'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Profile</span>
                            </button>

                            {userRole === 'admin' && (
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
                                  title="Edit Student Profile"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  onClick={() => setDeletingAlumnus(item)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
                                  title="Delete Student Record"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className={`text-xl font-black flex items-center space-x-2 ${
              darkMode ? 'text-white' : 'text-[#0B2545]'
            }`}>
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <span>Academic Analytics & College Distribution</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-2xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-md'
              }`}>
                <h3 className={`text-sm font-extrabold mb-4 ${
                  darkMode ? 'text-white' : 'text-[#0B2545]'
                }`}>Graduate Distribution by College</h3>
                
                <div className="space-y-4">
                  {Object.entries(COLLEGE_STRUCTURE).map(([key, col]) => {
                    const count = alumniList.filter(a => a.collegeKey === key).length;
                    const pct = Math.round((count / alumniList.length) * 100) || 0;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={darkMode ? 'text-slate-200' : 'text-slate-900'}>{col.short} - {col.name}</span>
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold">{count} ({pct}%)</span>
                        </div>
                        <div className={`w-full h-2.5 rounded-full overflow-hidden border ${
                          darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-200 border-slate-300'
                        }`}>
                          <div className={`h-full bg-gradient-to-r ${col.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-md'
              }`}>
                <h3 className={`text-sm font-extrabold mb-4 ${
                  darkMode ? 'text-white' : 'text-[#0B2545]'
                }`}>Graduation Era Breakdown</h3>
                
                <div className="grid grid-cols-3 gap-3 text-center mb-6">
                  <div className={`p-3 rounded-xl border ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
                  }`}>
                    <p className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>2000–2009</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      {alumniList.filter(a => a.batchYear >= 2000 && a.batchYear <= 2009).length}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
                  }`}>
                    <p className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>2010–2018</p>
                    <p className="text-xl font-black text-blue-700 dark:text-blue-400 mt-1">
                      {alumniList.filter(a => a.batchYear >= 2010 && a.batchYear <= 2018).length}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
                  }`}>
                    <p className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>2019–2026</p>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                      {alumniList.filter(a => a.batchYear >= 2019).length}
                    </p>
                  </div>
                </div>

                <h4 className={`text-xs font-black uppercase mb-3 ${
                  darkMode ? 'text-slate-400' : 'text-slate-800'
                }`}>Academic Honor Roll Highlights</h4>
                
                <div className="space-y-2 text-xs font-bold">
                  <div className="flex justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300">
                    <span>Summa Cum Laude Graduates</span>
                    <span className="font-black">{alumniList.filter(a => a.honor === 'Summa Cum Laude').length}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-300">
                    <span>Magna Cum Laude Graduates</span>
                    <span className="font-black">{alumniList.filter(a => a.honor === 'Magna Cum Laude').length}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300">
                    <span>Cum Laude Graduates</span>
                    <span className="font-black">{alumniList.filter(a => a.honor === 'Cum Laude').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {visitorAlumnus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="px-6 py-4 bg-[#0B2545] text-white flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-extrabold tracking-tight">Rizalian Student Credential</h3>
              </div>
              <button
                onClick={() => setVisitorAlumnus(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col md:flex-row gap-6 items-stretch max-h-[80vh] overflow-y-auto">
              <div className="w-full md:w-80 flex-shrink-0 flex flex-col items-center">
                <div className="w-full h-80 rounded-2xl overflow-hidden border-4 border-amber-400 shadow-xl relative bg-slate-900">
                  <img
                    src={visitorAlumnus.avatarUrl}
                    alt={visitorAlumnus.fullName}
                    className="w-full h-full object-cover object-center"
                  />
                  {visitorAlumnus.verified && (
                    <div className="absolute bottom-3 left-3 bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-md">
                      <ShieldCheck className="w-4 h-4 fill-slate-950 text-amber-400" />
                      <span>Verified Alumni</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-center space-y-1 w-full">
                  <span className="inline-block text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full font-mono">
                    Student ID: {visitorAlumnus.studentId}
                  </span>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Class of {visitorAlumnus.batchYear}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                      {COLLEGE_STRUCTURE[visitorAlumnus.collegeKey]?.name}
                    </span>
                  </div>

                  <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-[#0B2545]'}`}>
                    {visitorAlumnus.fullName}
                  </h2>

                  {visitorAlumnus.honor && (
                    <p className="text-sm font-black text-amber-600 dark:text-amber-400 flex items-center space-x-1.5 mt-1">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>{visitorAlumnus.honor}</span>
                    </p>
                  )}

                  <div className={`mt-3 p-3.5 rounded-xl border space-y-0.5 ${
                    darkMode 
                      ? 'bg-slate-950/80 border-slate-800' 
                      : 'bg-slate-100 border-slate-200'
                  }`}>
                    <p className={`text-xs font-extrabold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      {visitorAlumnus.programName}
                    </p>
                    {visitorAlumnus.major && (
                      <p className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-blue-900'}`}>
                        {visitorAlumnus.major}
                      </p>
                    )}
                  </div>

                  <div className={`my-4 p-4 rounded-2xl border relative ${
                    darkMode ? 'bg-slate-950/80 border-amber-500/30' : 'bg-amber-50/90 border-amber-200'
                  }`}>
                    <Quote className={`w-5 h-5 absolute top-3 right-3 rotate-180 ${
                      darkMode ? 'text-amber-400/40' : 'text-amber-600/40'
                    }`} />
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Personal Motto</p>
                    <p className={`text-xs italic font-semibold leading-relaxed pr-4 ${
                      darkMode ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      "{visitorAlumnus.motto}"
                    </p>
                  </div>

                  {visitorAlumnus.academicHighlights && (
                    <div>
                      <h4 className={`text-xs font-black uppercase mb-1 ${
                        darkMode ? 'text-slate-300' : 'text-slate-800'
                      }`}>Academic Highlights & Achievements</h4>
                      <p className={`text-xs leading-relaxed p-3 rounded-xl border ${
                        darkMode ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}>
                        {visitorAlumnus.academicHighlights}
                      </p>
                    </div>
                  )}
                </div>

                <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-2 ${
                  darkMode ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className="flex space-x-2 text-xs">
                    {visitorAlumnus.linkedin && (
                      <a href={visitorAlumnus.linkedin} target="_blank" rel="noreferrer" className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center space-x-1 shadow-sm">
                        <Linkedin className="w-3.5 h-3.5" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {visitorAlumnus.email && (
                      <a href={`mailto:${visitorAlumnus.email}`} className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center space-x-1 shadow-sm">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Contact Alumni</span>
                      </a>
                    )}
                  </div>

                  {userRole === 'admin' ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const target = visitorAlumnus;
                          handleOpenEdit(target);
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-md transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Credentials</span>
                      </button>

                      <button
                        onClick={() => {
                          setDeletingAlumnus(visitorAlumnus);
                        }}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-md transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Record</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        showToast(`Rizalian network request sent to ${visitorAlumnus.fullName}`);
                        setVisitorAlumnus(null);
                      }}
                      className="px-4 py-2 bg-[#0B2545] hover:bg-blue-900 text-amber-400 font-black text-xs rounded-xl shadow-md"
                    >
                      Connect via JRU Registry
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdminPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
            darkMode ? 'bg-slate-900 border-amber-500/40 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <button 
              onClick={() => setIsAdminPinModalOpen(false)}
              className={`absolute top-4 right-4 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 mx-auto flex items-center justify-center">
                <Key className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-[#0B2545]'}`}>
                Administrator Passcode Required
              </h3>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Enter JRU Administrator Passcode to unlock edit and delete privileges.
              </p>
            </div>

            <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-amber-700 dark:text-amber-400 mb-1">Passcode / PIN *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter administrator passcode"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                {pinError && <p className="text-xs text-rose-500 font-bold mt-1 text-center">{pinError}</p>}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminPinModalOpen(false)}
                  className={`w-1/2 py-2.5 rounded-xl text-xs font-bold ${
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md"
                >
                  Unlock Admin Mode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isApiSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
            darkMode ? 'bg-slate-900 border-amber-500/40 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <button 
              onClick={() => setIsApiSettingsOpen(false)}
              className={`absolute top-4 right-4 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 mx-auto flex items-center justify-center">
                <Server className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-[#0B2545]'}`}>
                Backend API Connection
              </h3>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Point this app at your Express + MySQL backend. Saved in this browser only.
              </p>
            </div>

            <form onSubmit={handleSaveApiUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-amber-700 dark:text-amber-400 mb-1">Backend API Base URL *</label>
                <input
                  type="url"
                  required
                  placeholder="http://localhost:5000/api"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Include the <span className="font-mono">/api</span> suffix. In use: <span className="font-mono">{apiBaseUrl}</span>
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetApiUrl}
                  className={`w-1/3 py-2.5 rounded-xl text-xs font-bold ${
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleTestApiUrl}
                  className={`w-1/3 py-2.5 rounded-xl text-xs font-bold ${
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  Test
                </button>
                <button
                  type="submit"
                  className="w-1/3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAlumnus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
            darkMode ? 'bg-slate-900 border-blue-500/40 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="px-6 py-4 bg-[#0B2545] text-white border-b border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold">Edit Student Credentials — {editingAlumnus.fullName}</h3>
              </div>
              <button onClick={() => setEditingAlumnus(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Graduation Batch Year *</label>
                  <select
                    value={formData.batchYear}
                    onChange={(e) => setFormData({ ...formData, batchYear: parseInt(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {Array.from({ length: 27 }, (_, i) => 2026 - i).map(year => (
                      <option key={year} value={year}>Class of {year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Student ID Suffix *</label>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono font-black text-amber-600 px-2 py-2 bg-amber-500/15 rounded-lg border border-amber-500/30">
                      {String(formData.batchYear).slice(-2)}-
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="192918"
                      value={formData.studentIdSuffix}
                      onChange={(e) => setFormData({ ...formData, studentIdSuffix: e.target.value })}
                      className={`flex-1 p-2.5 rounded-xl border text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Academic Honor</label>
                  <select
                    value={formData.honor}
                    onChange={(e) => setFormData({ ...formData, honor: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Summa Cum Laude">Summa Cum Laude</option>
                    <option value="Magna Cum Laude">Magna Cum Laude</option>
                    <option value="Cum Laude">Cum Laude</option>
                    <option value="Academic Excellence">Academic Excellence</option>
                    <option value="Leadership Distinction">Leadership Distinction</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>College *</label>
                  <select
                    value={formData.collegeKey}
                    onChange={(e) => {
                      const colKey = e.target.value;
                      const defaultProg = COLLEGE_STRUCTURE[colKey].programs[0];
                      setFormData({ 
                        ...formData, 
                        collegeKey: colKey,
                        programName: defaultProg.name,
                        major: defaultProg.major || ''
                      });
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {Object.entries(COLLEGE_STRUCTURE).map(([key, col]) => (
                      <option key={key} value={key}>{col.short} - {col.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Program & Major *</label>
                  <select
                    value={formData.major ? `${formData.programName} - ${formData.major}` : formData.programName}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const foundObj = COLLEGE_STRUCTURE[formData.collegeKey].programs.find(p => {
                        const str = p.major ? `${p.name} - ${p.major}` : p.name;
                        return str === selectedVal;
                      });
                      if (foundObj) {
                        setFormData({
                          ...formData,
                          programName: foundObj.name,
                          major: foundObj.major || ''
                        });
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {COLLEGE_STRUCTURE[formData.collegeKey].programs.map((p, idx) => {
                      const label = p.major ? `${p.name} - ${p.major}` : p.name;
                      return <option key={idx} value={label}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Personal Motto *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.motto}
                  onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Academic Highlights / Achievements</label>
                <textarea
                  rows={2}
                  value={formData.academicHighlights}
                  onChange={(e) => setFormData({ ...formData, academicHighlights: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>
                  Graduation Portrait (Drag & Drop or Choose Local File)
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-4 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center justify-center space-y-2 ${
                    isDragging ? 'border-amber-500 bg-amber-500/10' : darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  {formData.avatarUrl ? (
                    <div className="flex items-center space-x-3">
                      <img src={formData.avatarUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Image Loaded</span>
                        </p>
                        <p className="text-[10px] text-slate-500">Drag a new image to replace</p>
                      </div>
                    </div>
                  ) : (
                    <Upload className="w-8 h-8 text-amber-500" />
                  )}

                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Drag and drop your Graduation Photo here
                  </p>

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="file-upload-edit"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <label
                      htmlFor="file-upload-edit"
                      className="inline-block px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer shadow-md"
                    >
                      Choose File / Browse Documents
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`pt-4 border-t flex justify-end space-x-2 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setEditingAlumnus(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-md text-xs"
                >
                  Save Credential Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingAlumnus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
            darkMode ? 'bg-slate-900 border-rose-500/40 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 mx-auto flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-[#0B2545]'}`}>Delete Student Record?</h3>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Are you sure you want to permanently delete <span className="text-amber-600 dark:text-amber-400 font-extrabold">{deletingAlumnus.fullName}</span> (Student ID: {deletingAlumnus.studentId}, Class of {deletingAlumnus.batchYear}) from the registry?
              </p>
              <p className="text-[11px] text-rose-500 dark:text-rose-400 font-bold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                ⚠️ This action cannot be undone once confirmed.
              </p>
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => setDeletingAlumnus(null)}
                className={`w-1/2 py-2.5 rounded-xl text-xs font-bold ${
                  darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md flex items-center justify-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
            darkMode ? 'bg-slate-900 border-amber-500/40 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="px-6 py-4 bg-[#0B2545] text-white border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-extrabold">Register New Rizalian Graduate</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Graduation Batch Year *</label>
                  <select
                    value={formData.batchYear}
                    onChange={(e) => setFormData({ ...formData, batchYear: parseInt(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {Array.from({ length: 27 }, (_, i) => 2026 - i).map(year => (
                      <option key={year} value={year}>Class of {year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Student ID Suffix *</label>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono font-black text-amber-600 px-2 py-2 bg-amber-500/15 rounded-lg border border-amber-500/30">
                      {String(formData.batchYear).slice(-2)}-
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="192918"
                      value={formData.studentIdSuffix}
                      onChange={(e) => setFormData({ ...formData, studentIdSuffix: e.target.value })}
                      className={`flex-1 p-2.5 rounded-xl border text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Academic Honor</label>
                  <select
                    value={formData.honor}
                    onChange={(e) => setFormData({ ...formData, honor: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Summa Cum Laude">Summa Cum Laude</option>
                    <option value="Magna Cum Laude">Magna Cum Laude</option>
                    <option value="Cum Laude">Cum Laude</option>
                    <option value="Academic Excellence">Academic Excellence</option>
                    <option value="Leadership Distinction">Leadership Distinction</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>College *</label>
                  <select
                    value={formData.collegeKey}
                    onChange={(e) => {
                      const colKey = e.target.value;
                      const defaultProg = COLLEGE_STRUCTURE[colKey].programs[0];
                      setFormData({ 
                        ...formData, 
                        collegeKey: colKey,
                        programName: defaultProg.name,
                        major: defaultProg.major || ''
                      });
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {Object.entries(COLLEGE_STRUCTURE).map(([key, col]) => (
                      <option key={key} value={key}>{col.short} - {col.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Program & Major *</label>
                  <select
                    value={formData.major ? `${formData.programName} - ${formData.major}` : formData.programName}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const foundObj = COLLEGE_STRUCTURE[formData.collegeKey].programs.find(p => {
                        const str = p.major ? `${p.name} - ${p.major}` : p.name;
                        return str === selectedVal;
                      });
                      if (foundObj) {
                        setFormData({
                          ...formData,
                          programName: foundObj.name,
                          major: foundObj.major || ''
                        });
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {COLLEGE_STRUCTURE[formData.collegeKey].programs.map((p, idx) => {
                      const label = p.major ? `${p.name} - ${p.major}` : p.name;
                      return <option key={idx} value={label}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>Personal Motto *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Share an inspirational motto..."
                  value={formData.motto}
                  onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-black mb-1 ${darkMode ? 'text-amber-400' : 'text-[#0B2545]'}`}>
                  Graduation Portrait (Drag & Drop or Browse Documents)
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-4 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center justify-center space-y-2 ${
                    isDragging ? 'border-amber-500 bg-amber-500/10' : darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  {formData.avatarUrl ? (
                    <div className="flex items-center space-x-3">
                      <img src={formData.avatarUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Image Loaded</span>
                        </p>
                        <p className="text-[10px] text-slate-500">Drag a new image to replace</p>
                      </div>
                    </div>
                  ) : (
                    <Upload className="w-8 h-8 text-amber-500" />
                  )}

                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Drag and drop your Graduation Photo here
                  </p>

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="file-upload-add"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <label
                      htmlFor="file-upload-add"
                      className="inline-block px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer shadow-md"
                    >
                      Choose File / Browse Documents
                    </label>
                  </div>
                </div>
              </div>

              <div className={`pt-4 border-t flex justify-end space-x-2 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md text-xs"
                >
                  Register Graduate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-5 h-5 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <footer className="mt-16 bg-[#0B2545] border-t border-amber-500/30 text-slate-300 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-white text-sm">Jose Rizal University Alumni Tracker</span>
          </div>
          <p className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
            Find Your Inner Hero
          </p>
          <p className="text-slate-300 font-medium max-w-2xl mx-auto">
            Connect with graduates across all colleges. Discover academic achievements, personal mottos, graduation portraits, and verified student credentials from Jose Rizal University.
          </p>
          <p className="text-[11px] text-slate-400 font-semibold pt-1">
            Jose Rizal University. 80 Shaw Boulevard, Mandaluyong City, Metro Manila, Philippines
          </p>
        </div>
      </footer>
    </div>
  );
}