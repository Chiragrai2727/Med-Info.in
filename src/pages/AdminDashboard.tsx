import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';
import { collection, getDocs, query, orderBy, limit, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Users, ShieldCheck, Search as SearchIcon, Activity, AlertTriangle, Download, Trash2, CheckCircle2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

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

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searches, setSearches] = useState<SearchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const fetchAdminData = async () => {
    if (profile?.role !== 'admin') return;
    setLoading(true);

    try {
      // Fetch Users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers: UserData[] = [];
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data() as UserData;
        fetchedUsers.push(data);
      });
      
      // Sort users by creation date (newest first)
      fetchedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUsers(fetchedUsers);

      // Fetch Search Analytics
      const searchesQuery = query(collection(db, 'searchAnalytics'), orderBy('count', 'desc'), limit(50));
      const searchesSnapshot = await getDocs(searchesQuery);
      const fetchedSearches: SearchData[] = [];
      searchesSnapshot.forEach((doc) => {
        fetchedSearches.push({ id: doc.id, ...doc.data() } as SearchData);
      });
      setSearches(fetchedSearches);

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [profile]);

  const getTierLabel = (tier?: string) => {
    if (!tier) return 'PRO';
    if (tier === 'premium') return 'PREMIUM';
    return tier.toUpperCase();
  };

  const exportToCSV = () => {
    if (users.length === 0) return;

    const headers = ['UID', 'Name', 'Email', 'Phone', 'Role', 'Premium', 'Tier', 'Joined Date'];
    const rows = users.map(u => [
      u.uid,
      `"${u.displayName || 'Anonymous'}"`,
      u.email,
      u.phoneNumber || 'N/A',
      u.role || 'user',
      u.isPremium ? 'Yes' : 'No',
      u.subscriptionTier || 'None',
      new Date(u.createdAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `aethelcare_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearOldUsers = async () => {
    const confirmed = window.confirm("WARNING: This will permanently delete ALL user and search data to start fresh. Only your admin account will be preserved based on the email logic. PROCEED WITH CAUTION.");
    if (!confirmed) return;

    setResetting(true);
    try {
      // 1. Get all users
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      let count = 0;

      usersSnap.forEach((userDoc) => {
        const data = userDoc.data();
        // Skip self (admin)
        if (data.email !== profile?.email) {
          batch.delete(doc(db, 'users', userDoc.id));
          count++;
        }
      });

      // 2. Clear analytics
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
    } catch (error) {
      console.error("Failed to reset data:", error);
      showToast("Failed to reset data. Check permissions.", "error");
    } finally {
      setResetting(false);
    }
  };

  const totalUsers = users.length;
  const premiumUsers = users.filter(u => u.isPremium).length;
  const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0';

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center backdrop-blur-xl bg-white/70 p-20 rounded-[4rem] border-2 border-white shadow-2xl">
          <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-8 animate-bounce" />
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Access Denied</h1>
          <p className="text-slate-400 font-bold text-xl tracking-tight opacity-70">High-level clearance required for this terminal.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-12 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
          >
            Return to Surface
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pt-32 sm:pt-40 pb-24 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 flex items-center gap-6 tracking-[-0.05em] uppercase leading-none">
              <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl rotate-3">
                <ShieldCheck className="w-10 h-10" />
              </div>
              Admin Control Center
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 mt-6 font-bold tracking-tight opacity-70 leading-none italic uppercase">
              High-level pharmaceutical intelligence oversight.
            </p>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-3 px-8 py-5 backdrop-blur-md bg-white border-2 border-white rounded-[2rem] text-xs font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-2xl active:scale-95 group"
            >
              <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              Export CSV
            </button>
            <button 
              onClick={handleClearOldUsers}
              disabled={resetting}
              className="flex items-center gap-3 px-8 py-5 backdrop-blur-md bg-red-500/10 border-2 border-red-500/20 rounded-[2rem] text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-2xl disabled:opacity-50 active:scale-95 group"
            >
              {resetting ? 'Resetting...' : (
                <>
                  <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  System Reset
                </>
              )}
            </button>
          </div>
        </div>

        {resetSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 backdrop-blur-3xl bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[3rem] flex items-center gap-6 text-emerald-700 font-black uppercase tracking-widest text-xs shadow-2xl"
          >
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            Platform purged successfully. Started fresh medical registry.
          </motion.div>
        )}

        {loading ? (
          <div className="p-32 text-center">
             <div className="w-20 h-20 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-xl" />
             <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs opacity-60">Initializing Command...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <motion.div 
                whileHover={{ y: -10 }}
                className="backdrop-blur-xl bg-white/70 rounded-[4rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-2 border-white flex items-center gap-8 group hover:border-slate-900 transition-all overflow-hidden relative"
              >
                <div className="w-20 h-20 bg-blue-500/10 rounded-[2.5rem] flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white group-hover:-rotate-12 group-hover:shadow-2xl relative z-10">
                  <Users className="w-10 h-10" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2 opacity-60">Medical Registry</p>
                  <p className="text-5xl font-black text-slate-900 tracking-[-0.05em] uppercase leading-none">{totalUsers}</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -10 }}
                className="backdrop-blur-xl bg-white/70 rounded-[4rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-2 border-white flex items-center gap-8 group hover:border-slate-900 transition-all overflow-hidden relative"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white group-hover:-rotate-12 group-hover:shadow-2xl relative z-10">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2 opacity-60">Verified Premium</p>
                  <p className="text-5xl font-black text-emerald-600 tracking-[-0.05em] uppercase leading-none">{premiumUsers}</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              </motion.div>
 
              <motion.div 
                whileHover={{ y: -10 }}
                className="backdrop-blur-xl bg-white/70 rounded-[4rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-2 border-white flex items-center gap-8 group hover:border-slate-900 transition-all overflow-hidden relative"
              >
                <div className="w-20 h-20 bg-purple-500/10 rounded-[2.5rem] flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white group-hover:-rotate-12 group-hover:shadow-2xl relative z-10">
                  <Activity className="w-10 h-10" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2 opacity-60">Confidence Score</p>
                  <p className="text-5xl font-black text-purple-600 tracking-[-0.05em] uppercase leading-none">{conversionRate}<span className="text-2xl ml-1">%</span></p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              </motion.div>
            </div>
 
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Popular Searches */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-1 backdrop-blur-xl bg-white/70 rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border-2 border-white overflow-hidden flex flex-col h-[700px]"
              >
                <div className="p-10 border-b border-white/50 bg-white/30">
                  <h2 className="text-2xl font-black uppercase tracking-[-0.05em] flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl rotate-6">
                      <SearchIcon className="w-6 h-6" />
                    </div>
                    Top Searches
                  </h2>
                </div>
                <div className="overflow-y-auto flex-1 p-0 scrollbar-hide">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-white z-20">
                      <tr className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                        <th className="p-8">Medical Query</th>
                        <th className="p-8 text-right">Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {searches.map((search) => (
                        <tr key={search.id} className="border-b border-white hover:bg-slate-900 hover:text-white transition-all group">
                          <td className="p-8 font-black uppercase tracking-tight text-lg italic leading-none">{search.query}</td>
                          <td className="p-8 text-right font-black text-2xl tracking-tighter text-blue-500 group-hover:text-white leading-none">{search.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
 
              {/* User Directory */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 backdrop-blur-xl bg-white/70 rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border-2 border-white overflow-hidden flex flex-col h-[700px] hover:shadow-2xl transition-all"
              >
                <div className="p-10 border-b border-white/50 flex justify-between items-center bg-white/30">
                  <h2 className="text-2xl font-black uppercase tracking-[-0.05em] flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl -rotate-6">
                      <Users className="w-6 h-6" />
                    </div>
                    Patient Registry
                  </h2>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] backdrop-blur-md bg-white border border-white px-6 py-2 rounded-full shadow-inner">
                    {users.length} Total Patients
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 p-0 scrollbar-hide">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-white z-20">
                      <tr className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                        <th className="p-10">Personal Details</th>
                        <th className="p-10">Verified Status</th>
                        <th className="p-10">Registration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white">
                      {users.map((u) => (
                        <tr key={u.uid} className="hover:bg-slate-900 hover:text-white transition-all group">
                          <td className="p-10">
                            <div className="flex items-center gap-6">
                              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-12 ${u.isPremium ? 'bg-emerald-500 text-white' : 'backdrop-blur-md bg-white text-slate-400 border border-white'}`}>
                                {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <div className="font-black text-2xl tracking-tighter uppercase leading-none mb-2 group-hover:text-white text-slate-900">{u.displayName || 'Anonymous Patient'}</div>
                                <div className="text-slate-400 text-sm font-bold tracking-tight group-hover:text-white/50">{u.email}</div>
                                {u.phoneNumber ? (
                                  <div className="text-emerald-500 text-[10px] mt-3 font-black flex items-center gap-2 p-2 backdrop-blur-md bg-emerald-500/5 rounded-xl w-fit border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 transition-all">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse group-hover:bg-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    {u.phoneNumber}
                                  </div>
                                ) : (
                                  <div className="text-slate-200 text-[10px] mt-3 italic font-bold tracking-widest uppercase opacity-40 group-hover:opacity-100 group-hover:text-white/30">No phone linked</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-10">
                            <div className="flex flex-col gap-3">
                              {u.isPremium ? (
                                <span className="w-fit flex items-center gap-2 px-5 py-2 backdrop-blur-md bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl shadow-emerald-500/20">
                                  <CheckCircle2 className="w-4 h-4" />
                                  {getTierLabel(u.subscriptionTier)}
                                </span>
                              ) : (
                                <span className="w-fit px-5 py-2 backdrop-blur-md bg-white border border-white text-slate-400 text-[10px] font-black rounded-full uppercase tracking-widest shadow-inner group-hover:text-white group-hover:bg-white/10 group-hover:border-white/20">
                                  Standard
                                </span>
                              )}
                              {u.role === 'admin' && (
                                <span className="w-fit px-5 py-2 backdrop-blur-md bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-700 shadow-2xl group-hover:bg-white group-hover:text-slate-900 group-hover:border-white">
                                  Super Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-10">
                            <div className="text-slate-900 group-hover:text-white font-black text-lg tracking-tighter uppercase leading-none">{new Date(u.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="text-slate-400 group-hover:text-white/50 text-[10px] mt-2 font-black uppercase tracking-widest">{new Date(u.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
