import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { Users, ShieldCheck, Search as SearchIcon, Activity, AlertTriangle, Download, Trash2, CheckCircle2, MessageSquareWarning } from 'lucide-react';

interface UserData {
  id: string;
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
  const [users, setUsers] = useState<UserData[]>([]);
  const [searches, setSearches] = useState<SearchData[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const fetchAdminData = async () => {
    if (profile?.role !== 'admin') return;
    setLoading(true);

    try {
      // Fetch Users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      
      const mappedUsers = (usersData || []).map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.display_name,
        isPremium: u.plan === 'premium' || u.is_premium === true,
        subscriptionTier: u.plan,
        createdAt: u.created_at,
        role: u.role,
        phoneNumber: u.phone_number
      }));
      
      setUsers(mappedUsers as UserData[]);

      // Fetch Search Analytics
      const { data: searchData, error: searchError } = await supabase
        .from('search_analytics')
        .select('*')
        .order('count', { ascending: false })
        .limit(50);
      
      if (searchError) throw searchError;
      setSearches(searchData as SearchData[]);

      // Fetch Feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (feedbackError) throw feedbackError;
      setFeedbacks(feedbackData as FeedbackData[]);

      // Fetch Contact Requests
      const { data: contactData, error: contactError } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (contactError) throw contactError;
      setContactRequests(contactData as ContactRequestData[]);

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

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Premium', 'Tier', 'Joined Date'];
    const rows = users.map(u => [
      u.id,
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
    const confirmed = window.confirm("WARNING: This will permanently delete ALL user profiles and search data to start fresh. Only your admin account will be preserved based on the email logic. PROCEED WITH CAUTION.");
    if (!confirmed) return;

    setResetting(true);
    try {
      // 1. Delete profiles (except self)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .neq('email', profile?.email);

      if (profileError) throw profileError;

      // 2. Clear analytics
      const { error: analyticsError } = await supabase
        .from('search_analytics')
        .delete()
        .neq('id', '00000000-0000-4000-8000-000000000000'); // This is a trick to delete all if we don't have a specific ID, but usually .delete() with a wide filter works. 
        // Better: delete everything since search analytics aren't tied to an admin email easily.
      
      const { error: analyticsErrorAll } = await supabase
        .from('search_analytics')
        .delete()
        .gt('count', -1); // Deletes all where count > -1

      if (analyticsErrorAll) console.warn("Analytics clear failed:", analyticsErrorAll);

      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 5000);
      await fetchAdminData();
    } catch (error) {
      console.error("Failed to reset data:", error);
      showToast("Failed to reset data. Check permissions or RLS policies.", "error");
    } finally {
      setResetting(false);
    }
  };

  const totalUsers = users.length;
  const premiumUsers = users.filter(u => u.isPremium).length;
  const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0';

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center backdrop-blur-xl bg-surface/70 p-20 rounded-[4rem] border-2 border-surface shadow-2xl">
          <AlertTriangle className="w-24 h-24 text-danger mx-auto mb-8 animate-bounce" />
          <h1 className="text-5xl font-black text-text-primary uppercase tracking-tighter mb-4">Access Denied</h1>
          <p className="text-text-secondary font-bold text-xl tracking-tight opacity-70">High-level clearance required for this terminal.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-12 px-10 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
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
            <h1 className="text-4xl md:text-6xl font-black text-text-primary flex items-center gap-6 tracking-[-0.05em] uppercase leading-none">
              <div className="w-16 h-16 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-2xl rotate-3">
                <ShieldCheck className="w-10 h-10" />
              </div>
              Admin Control Center
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mt-6 font-bold tracking-tight opacity-50 leading-none italic uppercase">
              High-level pharmaceutical intelligence oversight.
            </p>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-3 px-8 py-5 backdrop-blur-md bg-surface border-2 border-surface rounded-[2rem] text-xs font-black uppercase tracking-widest text-text-primary hover:bg-primary hover:text-white hover:border-primary transition-all shadow-2xl active:scale-95 group"
            >
              <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              Export CSV
            </button>
            <button 
              onClick={handleClearOldUsers}
              disabled={resetting}
              className="flex items-center gap-3 px-8 py-5 backdrop-blur-md bg-danger/10 border-2 border-danger/20 rounded-[2rem] text-xs font-black uppercase tracking-widest text-danger hover:bg-danger hover:text-white transition-all shadow-2xl disabled:opacity-50 active:scale-95 group"
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
             <div className="w-20 h-20 border-4 border-dark-bg border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-xl" />
             <p className="text-text-secondary font-black uppercase tracking-[0.4em] text-xs opacity-60">Initializing Command...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <motion.div 
                whileHover={{ y: -10 }}
                className="backdrop-blur-xl bg-surface/70 rounded-[4rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-2 border-surface flex items-center gap-8 group hover:border-primary transition-all overflow-hidden relative"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:-rotate-12 group-hover:shadow-2xl relative z-10">
                  <Users className="w-10 h-10" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.3em] mb-2 opacity-60">Medical Registry</p>
                  <p className="text-5xl font-black text-text-primary tracking-[-0.05em] uppercase leading-none">{totalUsers}</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -10 }}
                className="backdrop-blur-xl bg-surface/70 rounded-[4rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-2 border-surface flex items-center gap-8 group hover:border-success transition-all overflow-hidden relative"
              >
                <div className="w-20 h-20 bg-success/10 rounded-[2.5rem] flex items-center justify-center text-success transition-transform group-hover:scale-110 group-hover:bg-success group-hover:text-white group-hover:-rotate-12 group-hover:shadow-2xl relative z-10">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.3em] mb-2 opacity-60">Verified Premium</p>
                  <p className="text-5xl font-black text-success tracking-[-0.05em] uppercase leading-none">{premiumUsers}</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              </motion.div>
  
              <motion.div 
                whileHover={{ y: -10 }}
                className="backdrop-blur-xl bg-surface/70 rounded-[4rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-2 border-surface flex items-center gap-8 group hover:border-purple-600 transition-all overflow-hidden relative"
              >
                <div className="w-20 h-20 bg-purple-500/10 rounded-[2.5rem] flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white group-hover:-rotate-12 group-hover:shadow-2xl relative z-10">
                  <Activity className="w-10 h-10" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.3em] mb-2 opacity-60">Confidence Score</p>
                  <p className="text-5xl font-black text-purple-600 tracking-[-0.05em] uppercase leading-none">{conversionRate}<span className="text-2xl ml-1">%</span></p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              </motion.div>
            </div>
 
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Feedbacks */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-surface/70 rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border-2 border-surface overflow-hidden flex flex-col max-h-[800px]"
              >
                <div className="p-10 border-b border-surface/50 bg-surface/30 flex justify-between items-center">
                  <h2 className="text-2xl font-black uppercase tracking-[-0.05em] flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-2xl text-white shadow-xl rotate-3 shadow-primary/20">
                      <MessageSquareWarning className="w-6 h-6" />
                    </div>
                    Feedback
                  </h2>
                </div>
                <div className="overflow-y-auto flex-1 p-0 scrollbar-hide">
                  {feedbacks.length === 0 ? (
                    <div className="p-20 text-center opacity-30">
                       <p className="text-sm font-black uppercase tracking-widest">No feedback received</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-surface">
                      {feedbacks.map((f) => (
                        <div key={f.id} className="p-10 hover:bg-primary/5 transition-all group">
                          <div className="flex justify-between items-start mb-4">
                            <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white">
                              {f.type}
                            </span>
                            <span className="text-[10px] font-black text-text-secondary group-hover:text-text-primary uppercase tracking-widest">
                              {new Date(f.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-relaxed mb-4 group-hover:text-text-primary">{f.message}</p>
                          {f.email && <div className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:text-primary-hover">{f.email}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
 
              {/* Contact Requests */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-surface/70 rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border-2 border-surface overflow-hidden flex flex-col max-h-[800px]"
              >
                <div className="p-10 border-b border-surface/50 bg-surface/30 flex justify-between items-center">
                  <h2 className="text-2xl font-black uppercase tracking-[-0.05em] flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-2xl text-white shadow-xl -rotate-3 shadow-primary/20">
                      <Users className="w-6 h-6" />
                    </div>
                    Contact Requests
                  </h2>
                </div>
                <div className="overflow-y-auto flex-1 p-0 scrollbar-hide">
                  {contactRequests.length === 0 ? (
                    <div className="p-20 text-center opacity-30">
                       <p className="text-sm font-black uppercase tracking-widest">No contact requests</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-surface">
                      {contactRequests.map((c) => (
                        <div key={c.id} className="p-10 hover:bg-primary/5 transition-all group">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-black uppercase tracking-tight group-hover:text-text-primary">{c.name}</span>
                            <span className="text-[10px] font-black text-text-secondary group-hover:text-text-primary uppercase tracking-widest">
                               {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-4 mb-4">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:text-primary-hover">{c.email}</span>
                            {c.phone && <span className="text-[10px] font-black text-success uppercase tracking-widest group-hover:text-emerald-500">{c.phone}</span>}
                          </div>
                          <p className="text-sm font-medium leading-relaxed group-hover:text-text-primary">{c.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
 
               {/* Popular Searches */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-1 backdrop-blur-xl bg-surface/70 rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border-2 border-surface overflow-hidden flex flex-col h-[700px]"
              >
                 <div className="p-10 border-b border-surface/50 bg-surface/30">
                  <h2 className="text-2xl font-black uppercase tracking-[-0.05em] flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-2xl text-white shadow-xl rotate-6 shadow-primary/20">
                      <SearchIcon className="w-6 h-6" />
                    </div>
                    Top Searches
                  </h2>
                </div>
                <div className="overflow-y-auto flex-1 p-0 scrollbar-hide">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-primary text-white z-20">
                      <tr className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                        <th className="p-8">Medical Query</th>
                        <th className="p-8 text-right">Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {searches.map((search) => (
                        <tr key={search.id} className="border-b border-surface hover:bg-primary/5 transition-all group">
                          <td className="p-8 font-black uppercase tracking-tight text-lg italic leading-none group-hover:text-primary transition-colors">{search.query}</td>
                          <td className="p-8 text-right font-black text-2xl tracking-tighter text-primary group-hover:text-primary leading-none transition-colors">{search.count}</td>
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
                className="lg:col-span-2 backdrop-blur-xl bg-surface/70 rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border-2 border-surface overflow-hidden flex flex-col h-[700px] hover:shadow-2xl transition-all"
              >
                 <div className="p-10 border-b border-surface/50 flex justify-between items-center bg-surface/30">
                  <h2 className="text-2xl font-black uppercase tracking-[-0.05em] flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-2xl text-white shadow-xl -rotate-6 shadow-primary/20">
                      <Users className="w-6 h-6" />
                    </div>
                    Patient Registry
                  </h2>
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] backdrop-blur-md bg-surface border border-border px-6 py-2 rounded-full shadow-inner">
                    {users.length} Total Patients
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 p-0 scrollbar-hide">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-primary text-white z-20">
                      <tr className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                        <th className="p-10">Personal Details</th>
                        <th className="p-10">Verified Status</th>
                        <th className="p-10">Registration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-primary/5 transition-all group">
                          <td className="p-10">
                            <div className="flex items-center gap-6">
                              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-12 ${u.isPremium ? 'bg-success text-white' : 'backdrop-blur-md bg-surface text-text-secondary border border-border'}`}>
                                {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <div className="font-black text-2xl tracking-tighter uppercase leading-none mb-2 group-hover:text-primary transition-colors text-text-primary">{u.displayName || 'Anonymous Patient'}</div>
                                <div className="text-text-secondary text-sm font-bold tracking-tight group-hover:text-text-primary/70 transition-colors">{u.email}</div>
                                {u.phoneNumber ? (
                                  <div className="text-success text-[10px] mt-3 font-black flex items-center gap-2 p-2 backdrop-blur-md bg-success/5 rounded-xl w-fit border border-success/20 group-hover:bg-success group-hover:text-white group-hover:border-success transition-all">
                                    <div className="w-2 h-2 bg-success rounded-full animate-pulse group-hover:bg-white shadow-[0_0_10px_rgba(5,150,105,0.5)]"></div>
                                    {u.phoneNumber}
                                  </div>
                                ) : (
                                  <div className="text-text-secondary/20 text-[10px] mt-3 italic font-bold tracking-widest uppercase group-hover:text-text-secondary transition-colors">No phone linked</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-10">
                            <div className="flex flex-col gap-3">
                              {u.isPremium ? (
                                <span className="w-fit flex items-center gap-2 px-5 py-2 backdrop-blur-md bg-success text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl shadow-success/20">
                                  <CheckCircle2 className="w-4 h-4" />
                                  {getTierLabel(u.subscriptionTier)}
                                </span>
                              ) : (
                                <span className="w-fit px-5 py-2 backdrop-blur-md bg-surface border border-border text-text-secondary text-[10px] font-black rounded-full uppercase tracking-widest shadow-inner group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                                  Standard
                                </span>
                              )}
                              {u.role === 'admin' && (
                                <span className="w-fit px-5 py-2 backdrop-blur-md bg-primary text-white text-[10px] font-black rounded-full uppercase tracking-widest border border-primary shadow-2xl group-hover:bg-white group-hover:text-primary group-hover:border-white transition-all">
                                  Super Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-10">
                            <div className="text-text-primary group-hover:text-primary font-black text-lg tracking-tighter uppercase leading-none transition-colors">{new Date(u.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="text-text-secondary/50 group-hover:text-text-secondary text-[10px] mt-2 font-black uppercase tracking-widest transition-colors">{new Date(u.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
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
