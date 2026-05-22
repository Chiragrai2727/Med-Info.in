import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  deleteDoc, 
  doc, 
  writeBatch, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
  ShieldCheck, 
  Search as SearchIcon, 
  Activity, 
  AlertTriangle, 
  Download, 
  Trash2, 
  CheckCircle2, 
  MessageSquareWarning, 
  Star, 
  UserMinus, 
  Check, 
  Mail, 
  Filter, 
  CheckSquare, 
  RefreshCw,
  UploadCloud,
  Cpu,
  Play
} from 'lucide-react';

const STATIC_FALLBACK_TIMESTAMP = 1778400000000; // May 2026

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  subscriptionTier?: string;
  createdAt: string;
  role: string;
  phoneNumber?: string;
}

interface SearchData {
  id: string;
  query: string;
  count: number;
  lastSearchedAt: string;
}

interface FeedbackData {
  id: string;
  type: string;
  message: string;
  medicineName?: string;
  email?: string;
  userId?: string;
  status: string;
  createdAt: string;
}

interface ContactRequestData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  userId: string;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Primary Data
  const [users, setUsers] = useState<UserData[]>([]);
  const [searches, setSearches] = useState<SearchData[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequestData[]>([]);
  const [datasetStats, setDatasetStats] = useState<{
    totalRecords: number;
    totalMedicines: number;
    totalBanned: number;
    totalRawCrawled?: number;
    schedulerLogs?: Array<{
      timestamp: string;
      status: string;
      processedCount: number;
      processedItems: string[];
      message: string;
    }>;
  } | null>(null);

  // CDSCO Scheduler States
  const [unverifiedList, setUnverifiedList] = useState<string[]>([]);
  const [unverifiedTotal, setUnverifiedTotal] = useState(0);
  const [loadingUnverified, setLoadingUnverified] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(2);
  const [csvUploading, setCsvUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Navigation / Filter States
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'feedback' | 'contact' | 'cdsco'>('overview');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'premium' | 'standard' | 'admin'>('all');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [updatingData, setUpdatingData] = useState(false);

  const fetchAdminData = useCallback(async () => {
    if (profile?.role !== 'admin') return;
    setLoading(true);

    try {
      // 1. Fetch Users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log("usersSnapshot empty:", usersSnapshot.empty, "size:", usersSnapshot.size);
      const fetchedUsers: UserData[] = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt = '';
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (data.createdAt) {
          createdAt = data.createdAt;
        }
        fetchedUsers.push({ ...data, uid: doc.id, createdAt } as UserData);
      });
      fetchedUsers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setUsers(fetchedUsers);

      // 2. Fetch Search Analytics
      const searchesQuery = query(collection(db, 'searchAnalytics'), orderBy('count', 'desc'), limit(50));
      const searchesSnapshot = await getDocs(searchesQuery);
      const fetchedSearches: SearchData[] = [];
      searchesSnapshot.forEach((doc) => {
        const data = doc.data();
        let lastSearchedAt = '';
        if (data.lastSearchedAt?.toDate) {
          lastSearchedAt = data.lastSearchedAt.toDate().toISOString();
        } else if (data.lastSearchedAt) {
          lastSearchedAt = data.lastSearchedAt;
        }
        fetchedSearches.push({ ...data, id: doc.id, lastSearchedAt } as SearchData);
      });
      setSearches(fetchedSearches);

      // 3. Fetch Feedback
      const feedbackQuery = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(100));
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const fetchedFeedbacks: FeedbackData[] = [];
      feedbackSnapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt = '';
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (data.createdAt) {
          createdAt = data.createdAt;
        }
        fetchedFeedbacks.push({ ...data, id: doc.id, createdAt } as FeedbackData);
      });
      setFeedbacks(fetchedFeedbacks);

      // 4. Fetch Contact Requests
      const contactQuery = query(collection(db, 'contactRequests'), orderBy('createdAt', 'desc'), limit(100));
      const contactSnapshot = await getDocs(contactQuery);
      const fetchedContacts: ContactRequestData[] = [];
      contactSnapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt = '';
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (data.createdAt) {
          createdAt = data.createdAt;
        }
        fetchedContacts.push({ ...data, id: doc.id, createdAt } as ContactRequestData);
      });
      setContactRequests(fetchedContacts);

      // 5. Fetch Dataset Stats and Unverified List
      try {
        const statsRes = await fetch("/api/admin/dataset-stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            setDatasetStats(statsData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dataset stats", err);
      }
      
      try {
        setLoadingUnverified(true);
        const unverifiedRes = await fetch("/api/admin/unverified-list");
        if (unverifiedRes.ok) {
          const uvData = await unverifiedRes.json();
          if (uvData.success) {
            setUnverifiedList(uvData.list || []);
            setUnverifiedTotal(uvData.totalCount || 0);
          }
        }
        setLoadingUnverified(false);
      } catch(err) {
        console.error("Failed to fetch unverified list", err);
        setLoadingUnverified(false);
      }

    } catch (error) {
      console.error("Error fetching admin data:", error);
      showToast("Access failed. Check Firebase console permissions.", "error");
    } finally {
      setLoading(false);
    }
  }, [profile, showToast]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Admin interactive modifiers
  const handleTogglePremium = async (userId: string, currentIsPremium: boolean) => {
    setActionLoading(`premium-${userId}`);
    try {
      const userRef = doc(db, 'users', userId);
      const targetState = !currentIsPremium;
      await updateDoc(userRef, {
        isPremium: targetState,
        plan: targetState ? 'premium' : 'basic',
        subscriptionTier: targetState ? 'premium' : 'basic'
      });
      
      setUsers(prev => prev.map(u => 
        u.uid === userId 
          ? { ...u, isPremium: targetState, subscriptionTier: targetState ? 'premium' : 'basic' } 
          : u
      ));
      showToast(`User successfully ${targetState ? 'promoted to PREMIUM' : 'demoted to STANDARD'}.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to switch user premium tier.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === profile?.email) {
      showToast("Identity Error: Cannot self-purge the active administrator.", "error");
      return;
    }
    const confirmed = window.confirm(`Confirm action: Permanently terminate profile for "${email}"? This action removes all records.`);
    if (!confirmed) return;

    setActionLoading(`delete-user-${userId}`);
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.uid !== userId));
      showToast("Patient record successfully removed.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to purge account database record.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeedbackStatus = async (feedbackId: string, currentStatus: string) => {
    setActionLoading(`feedback-${feedbackId}`);
    try {
      const targetStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';
      await updateDoc(doc(db, 'feedback', feedbackId), { status: targetStatus });
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status: targetStatus } : f));
      showToast(`Feedback set to ${targetStatus.toUpperCase()}.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to alter status.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!window.confirm("Delete this feedback report forever?")) return;
    setActionLoading(`delete-feedback-${feedbackId}`);
    try {
      await deleteDoc(doc(db, 'feedback', feedbackId));
      setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
      showToast("Feedback record erased.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to clear report.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteContactRequest = async (contactId: string) => {
    if (!window.confirm("Verify: Dismiss and delete this customer contact inquiry?")) return;
    setActionLoading(`delete-contact-${contactId}`);
    try {
      await deleteDoc(doc(db, 'contactRequests', contactId));
      setContactRequests(prev => prev.filter(c => c.id !== contactId));
      showToast("Contact request deleted.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failure dismission action.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const exportToCSV = () => {
    if (users.length === 0) return;
    const headers = ['UID', 'Name', 'Email', 'Phone', 'Role', 'Premium Status', 'Tier', 'Joined Date'];
    const rows = users.map(u => [
      u.uid,
      `"${u.displayName || 'Anonymous Patient'}"`,
      u.email,
      u.phoneNumber || 'N/A',
      u.role || 'user',
      u.isPremium ? 'Yes' : 'No',
      u.subscriptionTier || 'None',
      new Date(u.createdAt || Date.now()).toLocaleDateString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `aethelcare_patient_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV report generated and downloaded.", "success");
  };

  const handleClearOldUsers = async () => {
    const confirmed = window.confirm("WARNING FORCE RESET: Delete ALL client accounts and search records to begin clean index? Your active admin profile is safe. PROCEED?");
    if (!confirmed) return;

    setResetting(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      let count = 0;

      usersSnap.forEach((userDoc) => {
        const data = userDoc.data();
        if (data.email !== profile?.email) {
          batch.delete(doc(db, 'users', userDoc.id));
          count++;
        }
      });

      const searchSnap = await getDocs(collection(db, 'searchAnalytics'));
      searchSnap.forEach((sDoc) => {
        batch.delete(doc(db, 'searchAnalytics', sDoc.id));
      });

      if (count > 0 || searchSnap.size > 0) {
        await batch.commit();
      }

      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 5000);
      await fetchAdminData();
      showToast("Registry database purged successfully.", "success");
    } catch (error) {
      console.error(error);
      showToast("Global system reset error.", "error");
    } finally {
      setResetting(false);
    }
  };

  const handleTriggerDataUpdate = async () => {
    if (!window.confirm("Initialize manual medical dataset update via AI? This initiates a background process.")) return;

    setUpdatingData(true);
    try {
      showToast("Triggering background AI data fetch...", "success");
      const res = await fetch("/api/admin/trigger-data-update", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Dataset update started successfully.", "success");
        await fetchAdminData(); // Refresh UI stats
      } else {
        showToast(data.message || "Failed to trigger update.", "error");
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Error triggering AI dataset update.", "error");
    } finally {
      setUpdatingData(false);
    }
  };

  // UI calculations
  const totalUsers = users.length;
  const premiumUsers = users.filter(u => u.isPremium).length;
  const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0';

  // Filters applicators
  const matchingSearchedUsers = users.filter(u => 
    (u.displayName || '').toLowerCase().includes(userSearchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.phoneNumber || '').toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const finalFilteredUsers = matchingSearchedUsers.filter(u => {
    if (planFilter === 'premium') return u.isPremium;
    if (planFilter === 'standard') return !u.isPremium && u.role !== 'admin';
    if (planFilter === 'admin') return u.role === 'admin';
    return true;
  });

  const finalFilteredFeedback = feedbacks.filter(f => {
    if (feedbackFilter === 'pending') return f.status !== 'resolved';
    if (feedbackFilter === 'resolved') return f.status === 'resolved';
    return true;
  });

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg pt-20 px-4">
        <div className="text-center bg-surface p-12 rounded-[2rem] border border-border shadow-xl max-w-md w-full">
          <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-bold text-text-primary mb-2">Access Restrained</h1>
          <p className="text-text-secondary text-sm mb-8">Admin clearance tier is missing. Verify email privileges with standard support.</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Admin Command Station - Aethelcare</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-7xl mx-auto">
        
        {/* Banner Area */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-primary/15 text-primary tracking-widest uppercase px-2 py-0.5 rounded-full">SYSTEM KEEPER</span>
                {profile?.email && <span className="text-xs text-text-secondary font-medium">{profile.email}</span>}
              </div>
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mt-1">Admin Command Station</h1>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            <button
              onClick={fetchAdminData}
              className="px-4 py-3 bg-surface border border-border rounded-xl text-xs font-semibold text-text-secondary hover:bg-bg transition-all flex items-center gap-2 hover:text-text-primary"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button 
              onClick={exportToCSV}
              className="px-4 py-3 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-hover transition-all flex items-center gap-2 shadow-sm shadow-primary/15"
            >
              <Download className="w-4 h-4" />
              Export Records
            </button>
            
            <button 
              onClick={handleTriggerDataUpdate}
              disabled={updatingData}
              className="px-4 py-3 bg-indigo-500/10 border border-indigo-500/25 text-indigo-500 rounded-xl text-xs font-semibold hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-55"
            >
              {updatingData ? 'Syncing...' : 'Sync Datasets'}
            </button>
          </div>
        </div>

        {resetSuccess && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-sm font-semibold rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Platform registry and searches wiped clean. Started fresh index.
          </div>
        )}

        {/* Dynamic Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
          <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-primary transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-85">Total Registries</p>
                <h3 className="text-3xl font-black text-text-primary tracking-tight mt-2">{loading ? "..." : totalUsers}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <span className="text-success font-semibold">Active</span> patients cataloged.
            </div>
            <div className="absolute bottom-0 left-0 h-[3px] bg-primary w-full opacity-60" />
          </div>

          <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-success transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-85">Premium Accounts</p>
                <h3 className="text-3xl font-black text-success tracking-tight mt-2">{loading ? "..." : premiumUsers}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-success flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <span className="text-success font-bold">{conversionRate}%</span> subscription conversion.
            </div>
            <div className="absolute bottom-0 left-0 h-[3px] bg-success w-full opacity-60" />
          </div>

          <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-amber-500 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-85">Active Feedbacks</p>
                <h3 className="text-3xl font-black text-amber-600 tracking-tight mt-2">{loading ? "..." : feedbacks.filter(f => f.status !== 'resolved').length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <MessageSquareWarning className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <span className="text-amber-600 font-bold">{feedbacks.length}</span> total drug feedback reports.
            </div>
            <div className="absolute bottom-0 left-0 h-[3px] bg-amber-500 w-full opacity-60" />
          </div>

          <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-purple-500 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-85">Unread Contact Queries</p>
                <h3 className="text-3xl font-black text-purple-600 tracking-tight mt-2">{loading ? "..." : contactRequests.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-text-secondary flex items-center gap-1.5">
              General questions & consultations.
            </div>
            <div className="absolute bottom-0 left-0 h-[3px] bg-purple-600 w-full opacity-60" />
          </div>

          {/* New DB Dataset Metric Box */}
          <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-indigo-500 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-85">Medical Dataset</p>
                <h3 className="text-3xl font-black text-indigo-500 tracking-tight mt-2">
                  {loading ? "..." : (datasetStats ? new Intl.NumberFormat().format(datasetStats.totalRecords) : "N/A")}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <CheckSquare className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-text-secondary flex items-center gap-1.5">
               Total CDSCO records available.
            </div>
            <div className="absolute bottom-0 left-0 h-[3px] bg-indigo-500 w-full opacity-60" />
          </div>

          {/* AI Queue Target Metric Box */}
          <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-85">AI Crawl Queue</p>
                <h3 className="text-3xl font-black text-blue-500 tracking-tight mt-2">
                  {loading ? "..." : (datasetStats?.totalRawCrawled ? new Intl.NumberFormat().format(datasetStats.totalRawCrawled) : "0")}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-text-secondary flex items-center gap-1.5 flex-wrap">
               Pending crawler verifications.
            </div>
            <div className="absolute bottom-0 left-0 h-[3px] bg-blue-500 w-full opacity-60" />
          </div>
        </div>

        {/* Tab Interface Controls */}
        <div className="border-b border-border flex gap-1 mb-8 overflow-x-auto whitespace-nowrap pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'overview' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg'
            }`}
          >
            <Activity className="w-4 h-4" />
            Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'patients' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg'
            }`}
          >
            <Users className="w-4 h-4" />
            Patient Registry ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'feedback' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg'
            }`}
          >
            <MessageSquareWarning className="w-4 h-4" />
            Feedback Logs ({feedbacks.length})
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'contact' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg'
            }`}
          >
            <Mail className="w-4 h-4" />
            Customer inquiries ({contactRequests.length})
          </button>
        </div>

        {/* Tab Content rendering */}
        {loading ? (
          <div className="bg-surface border border-border p-20 text-center rounded-2xl shadow-sm">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-text-secondary tracking-widest uppercase">Connecting admin secure node...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left col: Top Queries Table */}
                  <div className="lg:col-span-2 bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-bg/50">
                      <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <SearchIcon className="w-5 h-5 text-primary" />
                        Popular Patient Search Terms
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">Real-time keyword search tracker for analytical analysis.</p>
                    </div>
                    
                    <div data-lenis-prevent className="max-h-[500px] overflow-y-auto">
                      {searches.length === 0 ? (
                        <p className="p-10 text-center text-sm text-text-secondary italic">No search logs present in the database yet.</p>
                      ) : (
                        <table className="w-full text-left font-sans">
                          <thead className="bg-bg text-text-secondary font-bold text-[10px] uppercase tracking-wider sticky top-0 border-b border-border">
                            <tr>
                              <th className="px-6 py-4">Search Term</th>
                              <th className="px-6 py-4 text-center">Frequencies</th>
                              <th className="px-6 py-4 text-right">Last Requested</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-sm">
                            {searches.map(s => (
                              <tr key={s.id} className="hover:bg-bg/30">
                                <td className="px-6 py-4 font-bold text-text-primary uppercase tracking-tight">{s.query}</td>
                                <td className="px-6 py-4 text-center font-bold text-primary">{s.count} searches</td>
                                <td className="px-6 py-4 text-right text-xs text-text-secondary font-semibold">
                                  {s.lastSearchedAt ? new Date(s.lastSearchedAt).toLocaleDateString() : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Right col: Micro lists for Quick Watch */}
                  <div className="space-y-8">
                    {/* Recent Critical Feedback Box */}
                    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                      <h4 className="text-md font-bold text-text-primary mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Urgent Flagged Reports
                      </h4>
                      <div data-lenis-prevent className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                        {feedbacks.filter(f => f.status !== 'resolved').slice(0, 4).map(f => (
                          <div key={f.id} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs">
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="font-extrabold text-[9px] uppercase bg-amber-500/10 border border-amber-500/20 text-amber-700 px-2 py-0.5 rounded-full">{f.type}</span>
                              <span className="text-text-secondary font-semibold">{f.medicineName || 'Unknown drug'}</span>
                            </div>
                            <p className="text-text-primary mt-1 line-clamp-2">{f.message}</p>
                          </div>
                        ))}
                        {feedbacks.filter(f => f.status !== 'resolved').length === 0 && (
                          <p className="text-xs text-text-secondary text-center py-6 italic">No pending feedback to review!</p>
                        )}
                      </div>
                    </div>

                    {/* Latest contact box */}
                    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                      <h4 className="text-md font-bold text-text-primary mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-purple-600" />
                        Recent Customer Enquiries
                      </h4>
                      <div data-lenis-prevent className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                        {contactRequests.slice(0, 3).map(c => (
                          <div key={c.id} className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-xs">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-bold text-text-primary text-[11px] truncate max-w-[120px]">{c.name}</span>
                              <span className="text-[10px] text-text-secondary font-semibold">{new Date(c.createdAt || STATIC_FALLBACK_TIMESTAMP).toLocaleDateString()}</span>
                            </div>
                            <p className="text-text-secondary line-clamp-1">{c.message}</p>
                          </div>
                        ))}
                        {contactRequests.length === 0 && (
                          <p className="text-xs text-text-secondary text-center py-6 italic">No recent inquiries found.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PATIENT REGISTRY */}
              {activeTab === 'patients' && (
                <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
                  
                  {/* Registry filters bar */}
                  <div className="p-6 border-b border-border bg-bg/50 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                    <div className="relative flex-1 max-w-md">
                      <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
                      <input
                        type="text"
                        placeholder="Search patient names, email, phone..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full bg-surface border border-border pl-10 pr-4 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                      <span className="text-text-secondary flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" />
                        Plan Filter:
                      </span>
                      {(['all', 'premium', 'standard', 'admin'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setPlanFilter(f)}
                          className={`px-3 py-1.5 rounded-lg border transition-all capitalize ${
                            planFilter === f 
                              ? 'bg-primary text-white border-primary shadow-sm' 
                              : 'bg-surface hover:bg-bg text-text-secondary border-border'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List Database */}
                  <div className="overflow-x-auto">
                    {finalFilteredUsers.length === 0 ? (
                      <p className="p-16 text-center text-sm text-text-secondary italic">No users found matching query or filters.</p>
                    ) : (
                      <table className="w-full text-left border-collapse font-sans">
                        <thead className="bg-bg text-text-secondary font-bold text-[10px] uppercase tracking-wider border-b border-border">
                          <tr>
                            <th className="px-6 py-4">Patient Profile</th>
                            <th className="px-6 py-4">Auth Level / Plan</th>
                            <th className="px-6 py-4">Registration Stamp</th>
                            <th className="px-6 py-4 text-right">Registry Operations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                          {finalFilteredUsers.map(u => {
                            const isSelf = u.email === profile?.email;
                            const isActionLoadingThis = actionLoading === `premium-${u.uid}` || actionLoading === `delete-user-${u.uid}`;
                            
                            return (
                              <tr key={u.uid} className="hover:bg-bg/10">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm ${u.isPremium ? 'bg-gradient-to-br from-success to-emerald-600' : 'bg-slate-400'}`}>
                                      {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                    <div>
                                      <p className="font-bold text-text-primary capitalize">{u.displayName || 'Anonymous Patient'}</p>
                                      <p className="text-xs text-text-secondary font-medium mt-0.5">{u.email}</p>
                                      {u.phoneNumber && (
                                        <p className="text-[10px] text-emerald-700 bg-success/10 border border-success/15 px-1.5 py-0.5 rounded-md mt-1 w-fit font-medium">
                                          📞 {u.phoneNumber}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1 w-fit">
                                    {u.isPremium ? (
                                      <span className="text-[9px] font-bold bg-success text-white uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        <Star className="w-3 h-3 fill-white" />
                                        PREMIUM
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-semibold bg-bg border border-border text-text-secondary uppercase tracking-widest px-2.5 py-1 rounded-full">
                                        STANDARD
                                      </span>
                                    )}
                                    {u.role === 'admin' && (
                                      <span className="text-[9px] font-bold bg-primary text-white uppercase tracking-widest px-2.5 py-1 rounded-full mt-1 w-fit">
                                        ADMIN Tier
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <p className="text-text-primary font-semibold">{new Date(u.createdAt || STATIC_FALLBACK_TIMESTAMP).toLocaleDateString()}</p>
                                  <p className="text-[10px] text-text-secondary font-semibold mt-1">
                                    {new Date(u.createdAt || STATIC_FALLBACK_TIMESTAMP).toLocaleTimeString()}
                                  </p>
                                </td>

                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2.5">
                                    {isSelf ? (
                                      <span className="text-xs text-text-secondary italic bg-bg border border-border px-3 py-1.5 rounded-lg font-medium">
                                        Active Administrator
                                      </span>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleTogglePremium(u.uid, u.isPremium)}
                                          disabled={isActionLoadingThis}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                            u.isPremium 
                                              ? 'border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100' 
                                              : 'border-success/30 text-success bg-success/5 hover:bg-success/10'
                                          }`}
                                        >
                                          {isActionLoadingThis ? '...' : u.isPremium ? 'Set Basic' : 'Set Premium'}
                                        </button>
                                        <button
                                          onClick={() => handleDeleteUser(u.uid, u.email)}
                                          disabled={isActionLoadingThis}
                                          className="p-1.5 border border-danger/20 text-danger hover:bg-danger/5 rounded-lg transition-all"
                                          title="Deactivate account"
                                        >
                                          <UserMinus className="w-4.5 h-4.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: FEEDBACK LOGS */}
              {activeTab === 'feedback' && (
                <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border bg-bg/50 flex justify-between items-center flex-col sm:flex-row gap-4">
                    <div>
                      <h4 className="text-md font-bold text-text-primary">Banned Drugs & Quality Reports</h4>
                      <p className="text-xs text-text-secondary mt-1">Direct feedback received from user interface panels regarding pharmaceutical listings.</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="text-text-secondary">Resolution:</span>
                      {(['all', 'pending', 'resolved'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setFeedbackFilter(s)}
                          className={`px-3 py-1.5 rounded-lg border transition-all capitalize ${
                            feedbackFilter === s 
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                              : 'bg-surface hover:bg-bg text-text-secondary border-border'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {finalFilteredFeedback.length === 0 ? (
                      <p className="p-16 text-center text-sm text-text-secondary italic">No feedback entries meet this catalog filter.</p>
                    ) : (
                      finalFilteredFeedback.map(f => (
                        <div key={f.id} className={`p-6 hover:bg-bg/5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${f.status === 'resolved' ? 'opacity-65' : ''}`}>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                {f.type}
                              </span>
                              {f.medicineName && (
                                <span className="text-xs font-bold text-text-primary bg-bg border border-border px-2.5 py-0.5 rounded-md">
                                  Medication: {f.medicineName}
                                </span>
                              )}
                              <span className="text-[11px] text-text-secondary font-medium">{new Date(f.createdAt || STATIC_FALLBACK_TIMESTAMP).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm font-medium text-text-primary leading-relaxed">{f.message}</p>
                            {f.email && (
                              <p className="text-xs text-primary font-semibold flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" />
                                {f.email}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleFeedbackStatus(f.id, f.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                f.status === 'resolved'
                                  ? 'bg-emerald-500/10 border-success/30 text-success hover:bg-emerald-500/20'
                                  : 'bg-amber-500/10 border-amber-500/25 text-amber-700 hover:bg-amber-500/20'
                              }`}
                            >
                              {f.status === 'resolved' ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  RESOLVED
                                </>
                              ) : (
                                <>
                                  <CheckSquare className="w-3.5 h-3.5" />
                                  MARK RESOLVED
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteFeedback(f.id)}
                              className="p-2 border border-danger/25 text-danger hover:bg-danger/5 rounded-lg transition-all"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: GENERAL INQUIRIES */}
              {activeTab === 'contact' && (
                <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border bg-bg/50">
                    <h4 className="text-md font-bold text-text-primary">Direct Contact Requests</h4>
                    <p className="text-xs text-text-secondary mt-1">General client queries, questions, and partnerships parsed via the landing site portals.</p>
                  </div>

                  <div className="divide-y divide-border">
                    {contactRequests.length === 0 ? (
                      <p className="p-16 text-center text-sm text-text-secondary italic">No contact requests present in the registry logs.</p>
                    ) : (
                      contactRequests.map(c => (
                        <div key={c.id} className="p-6 hover:bg-bg/5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3.5">
                              <h5 className="text-sm font-black text-text-primary capitalize">{c.name}</h5>
                              <span className="text-[11px] font-semibold text-text-secondary">{new Date(c.createdAt || STATIC_FALLBACK_TIMESTAMP).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex gap-4 text-xs font-semibold">
                              <p className="text-primary hover:underline flex items-center gap-1 cursor-pointer">
                                📩 {c.email}
                              </p>
                              {c.phone && (
                                <p className="text-emerald-700">
                                  📞 {c.phone}
                                </p>
                              )}
                            </div>
                            
                            <p className="text-sm text-text-secondary pl-2 border-l-2 border-border italic py-1 leading-relaxed max-w-3xl">
                              "{c.message}"
                            </p>
                          </div>

                          <div>
                            <button
                              onClick={() => handleDeleteContactRequest(c.id)}
                              className="text-xs font-bold border border-danger/25 px-4 py-2 text-danger hover:bg-danger hover:text-white rounded-lg transition-all flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Dismiss inquiry
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: CDSCO/Gemini Dataset Manager */}
              {activeTab === 'cdsco' && (
                 <div className="space-y-8">
                  {/* CSV Upload & Manual Execution Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
                      <h4 className="text-base font-bold text-text-primary flex items-center gap-2 mb-2">
                        <UploadCloud className="w-5 h-5 text-indigo-500" /> Upload Raw Pharmeasy Crawl
                      </h4>
                      <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                        Drag and drop a <code>raw_crawled_medicines.csv</code> export file to update the baseline catalog. This CSV should contain "BrowseList_medicine__bz_e7" in the first column for the AI to parse through.
                      </p>
                      
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setIsDragOver(false);
                          if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
                          
                          const file = e.dataTransfer.files[0];
                          if (!file.name.endsWith('.csv')) {
                            showToast("Please upload a .csv file.", "error"); return;
                          }
                          
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                             setCsvUploading(true);
                             try {
                               const text = event.target?.result as string;
                               const res = await fetch("/api/admin/upload-raw-csv", {
                                 method: "POST",
                                 headers: {"Content-Type": "application/json"},
                                 body: JSON.stringify({ csvContent: text })
                               });
                               
                               if (res.ok) {
                                 const data = await res.json();
                                 if (data.success) {
                                  showToast(data.message, "success");
                                  window.location.reload();
                                 } else {
                                  showToast("Upload failed server-side.", "error");
                                 }
                               } else {
                                  showToast("Upload endpoint failed.", "error");
                               }
                             } catch (err) {
                               showToast("Network error during upload.", "error");
                             } finally {
                               setCsvUploading(false);
                             }
                          };
                          reader.readAsText(file);
                        }}
                        className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragOver ? "border-indigo-500 bg-indigo-500/10" : "border-border hover:bg-bg/50"} flex flex-col items-center justify-center min-h-[140px]`}
                      >
                         {csvUploading ? (
                           <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                         ) : (
                           <>
                             <UploadCloud className={`w-8 h-8 ${isDragOver ? "text-indigo-500" : "text-text-secondary"} mb-2 opacity-70`} />
                             <p className="text-sm font-semibold text-text-primary">Drag CSV Here to Upload</p>
                             <p className="text-xs text-text-secondary mt-1 max-w-[200px]">Data will be written to server disk safely</p>
                           </>
                         )}
                      </div>
                    </div>

                    <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm h-full flex flex-col justify-between">
                     <div>
                      <h4 className="text-base font-bold text-text-primary flex items-center gap-2 mb-2">
                        <Play className="w-5 h-5 text-indigo-500" /> Start AI Synchronization
                      </h4>
                      <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                        Manually trigger the Gemini verification engine to immediately process a chunk of pending medications from the raw crawler CSV pool.
                      </p>
                      <div className="flex items-center gap-4 mb-4">
                        <label className="text-xs font-semibold text-text-secondary">Batch Size (Max 10 per run):</label>
                        <select 
                          className="bg-bg border border-border text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 text-text-primary"
                          value={batchSize}
                          onChange={(e) => setBatchSize(Number(e.target.value))}
                        >
                          <option value="1">1 Medicine</option>
                          <option value="2">2 Medicines</option>
                          <option value="3">3 Medicines</option>
                          <option value="5">5 Medicines</option>
                          <option value="10">10 Medicines (Slow)</option>
                        </select>
                      </div>
                     </div>

                      <button
                        onClick={async () => {
                           if (!window.confirm(`Are you sure you want to run sync for ${batchSize} medicines? This process may take a minute.`)) return;
                           try {
                             showToast("Triggering backend Sync Worker...", "success");
                             const response = await fetch("/api/admin/trigger-data-update", {
                               method: "POST",
                               headers: {"Content-Type": "application/json"},
                               body: JSON.stringify({ batchSize })
                             });

                             const data = await response.json();
                             if (data.success) {
                               showToast(data.message, "success");
                               window.location.reload();
                             } else {
                               showToast("Sync failed: " + data.message, "error");
                             }
                           } catch (err) {
                             showToast("Network / API failure during manual sync trigger.", "error");
                           }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] w-full flex items-center justify-center gap-2"
                      >
                         <Cpu className="w-4 h-4" /> Start Verifying {batchSize} Medicines
                      </button>
                    </div>
                  </div>

                  {/* Pool Status Table */}
                  <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 mt-8">
                     <h4 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">Raw File Pool Queue ({unverifiedTotal} Remaining)</h4>
                     {loadingUnverified ? (
                       <p className="text-xs italic text-text-secondary">Loading backlog list...</p>
                     ) : (
                       <div className="max-h-[300px] overflow-y-auto scrollbar-thin flex flex-wrap gap-2 pr-2">
                         {unverifiedList.length > 0 ? (
                           unverifiedList.map((item, idx) => (
                             <span key={idx} className="bg-bg border border-border px-3 py-1 text-[11px] font-mono text-text-secondary rounded-lg whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                               {item}
                             </span>
                           ))
                         ) : (
                           <p className="text-xs text-success font-semibold flex items-center gap-2">
                             <Check className="w-4 h-4" /> Crawled pool is fully consumed and verified!
                           </p>
                         )}
                         {unverifiedTotal > 100 && (
                           <span className="bg-bg border border-border px-3 py-1 text-[11px] font-mono text-text-secondary rounded-lg opacity-60">
                             + {unverifiedTotal - 100} more items...
                           </span>
                         )}
                       </div>
                     )}
                  </div>

                  {/* Execution Logs */}
                  <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 mt-8">
                     <h4 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">Daily CDSCO Verification Worker Logs</h4>
                     <div className="max-h-[300px] overflow-y-auto scrollbar-thin space-y-3">
                       {datasetStats?.schedulerLogs?.length ? (
                         datasetStats.schedulerLogs.map((log, idx) => (
                           <div key={idx} className="bg-bg border border-border p-3 rounded-lg text-xs flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-text-secondary opacity-70">{new Date(log.timestamp).toLocaleString()}</span>
                                <span className={`font-bold px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-success/10 text-success' : 'bg-text-secondary/10 text-text-secondary'}`}>
                                  {log.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-text-primary text-[13px]">{log.message}</p>
                           </div>
                         ))
                       ) : (
                         <p className="text-xs italic text-text-secondary">No AI sync execution logs available.</p>
                       )}
                     </div>
                  </div>
                 </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
        
      </div>
    </div>
  );

  // Helper utility to resolve filtering safely inside standard TS map loops
  function displayedUsersOfActiveTab() {
    return finalFilteredUsers;
  }
};
