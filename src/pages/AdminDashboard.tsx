import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
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
      alert("Failed to reset data. Check permissions.");
    } finally {
      setResetting(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const premiumUsers = users.filter(u => u.isPremium).length;
  const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tighter">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              Admin Control Center
            </h1>
            <p className="text-gray-500 mt-1 font-medium italic">High-level pharmaceutical intelligence oversight.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button 
              onClick={handleClearOldUsers}
              disabled={resetting}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-sm font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : (
                <>
                  <Trash2 className="w-4 h-4" />
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
            className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 font-bold"
          >
            <CheckCircle2 className="w-5 h-5" />
            Platform purged successfully. Started fresh medical registry.
          </motion.div>
        )}

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading admin data...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 group hover:border-blue-200 transition-colors">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Medical Registry</p>
                  <p className="text-4xl font-black text-gray-900 tracking-tighter">{totalUsers}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 group hover:border-green-200 transition-colors">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 transition-transform group-hover:scale-110">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Verified Premium</p>
                  <p className="text-4xl font-black text-green-600 tracking-tighter">{premiumUsers}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 group hover:border-purple-200 transition-colors">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Confidence Score</p>
                  <p className="text-4xl font-black text-purple-600 tracking-tighter">{conversionRate}%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Popular Searches */}
              <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <SearchIcon className="w-5 h-5 text-blue-600" />
                    Top Searches
                  </h2>
                </div>
                <div className="overflow-y-auto flex-1 p-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                      <tr className="text-xs text-gray-500 uppercase tracking-wider">
                        <th className="p-4 font-bold">Query</th>
                        <th className="p-4 font-bold text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {searches.map((search) => (
                        <tr key={search.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 font-medium text-gray-900 capitalize">{search.query}</td>
                          <td className="p-4 text-right font-bold text-blue-600">{search.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User Directory */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px] hover:shadow-md transition-shadow">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-xl font-black flex items-center gap-2 tracking-tight">
                    <Users className="w-5 h-5 text-blue-600" />
                    Patient Registry
                  </h2>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                    {users.length} Total Patients
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 p-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
                      <tr className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] bg-white">
                        <th className="p-5">Personal Details</th>
                        <th className="p-5">Verified Status</th>
                        <th className="p-5">Registration</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-50">
                      {users.map((u) => (
                        <tr key={u.uid} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${u.isPremium ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 leading-none mb-1">{u.displayName || 'Anonymous Patient'}</div>
                                <div className="text-gray-400 text-[11px] font-medium">{u.email}</div>
                                {u.phoneNumber ? (
                                  <div className="text-blue-500 text-[10px] mt-1 font-black flex items-center gap-1.5 p-1 bg-blue-50 rounded-lg w-fit">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                    {u.phoneNumber}
                                  </div>
                                ) : (
                                  <div className="text-gray-300 text-[10px] mt-1 italic">No phone linked</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex flex-col gap-1.5">
                              {u.isPremium ? (
                                <span className="w-fit flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-100">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {getTierLabel(u.subscriptionTier)}
                                </span>
                              ) : (
                                <span className="w-fit px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-wider border border-gray-100">
                                  Standard
                                </span>
                              )}
                              {u.role === 'admin' && (
                                <span className="w-fit px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-wider border border-indigo-100">
                                  Super Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="text-gray-900 font-bold text-xs">{new Date(u.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="text-gray-400 text-[10px] mt-0.5">{new Date(u.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
