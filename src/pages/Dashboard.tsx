import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Clock, CreditCard, ShieldCheck, Zap, AlertCircle, History, Trash2, Database, ChevronRight, Download, User as UserIcon } from 'lucide-react';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { AvatarSelection } from '../components/AvatarSelection';
import { useLanguage } from '../LanguageContext';
import { PhoneTrialSetup } from '../components/PhoneTrialSetup';
import { offlineService } from '../services/offlineService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ToastContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

interface PaymentRecord {
  id: string;
  amount: number;
  tier: string;
  date: string;
  status: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
    setSearchHistory(offlineService.getHistory());
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your search history?')) {
      offlineService.clearHistory();
      setSearchHistory([]);
      showToast('Search history cleared', 'success');
    }
  };

  const handleClearCache = () => {
    if (window.confirm('This will clear all offline data. You will need to re-fetch medicine details while online. Continue?')) {
      offlineService.clearCache();
      showToast('Offline cache cleared', 'success');
    }
  };

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      try {
        const paymentsRef = collection(db, 'users', user.uid, 'payments');
        const q = query(paymentsRef, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord));
        setPayments(data || []);
      } catch (error: any) {
        console.error('Error fetching payments:', error);
        // Silently handle if collection doesn't exist yet
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  if (!user || !profile) return null;

  const isPremium = profile.isPremium;
  const expiryDate = profile.subscriptionExpiry ? new Date(profile.subscriptionExpiry) : null;
  const isExpired = expiryDate ? expiryDate < new Date() : false;
  
  const hasClaimedTrial = profile.trialClaimed === true;
  const trialEndsAt = profile.trialEndsAt ? new Date(profile.trialEndsAt) : null;
  const trialActive = trialEndsAt ? trialEndsAt > new Date() : false;
  
  let daysRemaining = 0;
  if (expiryDate && !isExpired) {
    const diffTime = Math.abs(expiryDate.getTime() - new Date().getTime());
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  let trialDaysRemaining = 0;
  if (trialEndsAt && trialActive) {
    const diffTime = Math.abs(trialEndsAt.getTime() - new Date().getTime());
    trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const getPlanName = (tier?: string) => {
    if (!tier) return 'Premium';
    if (tier === 'premium') return 'Premium';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <div className="min-h-screen bg-transparent pt-32 sm:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12 relative z-10">
        
        {/* Header */}
        <div className="px-2">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-[-0.05em] leading-[0.8] mb-4 uppercase">{t('myDashboard')}</h1>
          <p className="text-slate-400 text-sm sm:text-lg font-bold tracking-tight uppercase opacity-60">{t('dashboardDesc')}</p>
        </div>
 
        {/* Profile Card */}
        <div className="backdrop-blur-xl bg-white/70 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white overflow-hidden group hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-700">
          <div className="p-8 sm:p-12 flex flex-col sm:flex-row items-center sm:items-start gap-10">
            <div className="relative group/avatar">
              <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-[3rem] overflow-hidden ring-8 ring-white shadow-2xl transition-transform group-hover:scale-105 duration-700 relative">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <button 
                  onClick={() => setShowAvatarSelection(true)}
                  className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <UserIcon className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Change</span>
                </button>
              </div>
              {isPremium && (
                <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border-4 border-white animate-bounce-slow z-10">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-[0.8] tracking-[-0.05em] uppercase">{profile.displayName || t('user')}</h2>
                <div className="flex justify-center sm:justify-start">
                  <span className={`px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] rounded-full ${
                    profile.role === 'admin' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg'
                  }`}>
                    {profile.role}
                  </span>
                </div>
              </div>
              <p className="text-slate-400 text-lg font-bold tracking-tight mb-8">{profile.email}</p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                <button 
                  onClick={() => setShowAvatarSelection(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Choose Avatar
                </button>
                <div className="px-6 py-2.5 backdrop-blur-md bg-slate-100/50 rounded-2xl border border-white flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">
                    {t('joined')} {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        {/* Subscription Status Block */}
        <div className="grid grid-cols-1 gap-8">
          {(!profile.isPremium && profile.role !== 'admin') && (
            <div className="backdrop-blur-2xl bg-white/70 rounded-[3.5rem] shadow-sm border border-white overflow-hidden transition-all duration-700">
                {!hasClaimedTrial ? (
                   <div className="p-4">
                    <PhoneTrialSetup onSuccess={() => window.location.reload()} />
                   </div>
                ) : trialActive ? (
                  <div className="bg-slate-900 p-8 sm:p-14 flex flex-col sm:flex-row items-center justify-between gap-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-[100px]" />
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 backdrop-blur-xl bg-white/10 rounded-3xl flex items-center justify-center border border-white/20 shrink-0">
                         <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-black text-2xl sm:text-3xl leading-[0.9] tracking-tight uppercase mb-2">Free Trial Active</h3>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">{trialDaysRemaining} Days Remaining</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowSubscriptionModal(true)} 
                      className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-2xl active:scale-95 z-10"
                    >
                      Unlock Full Access
                    </button>
                  </div>
                ) : (
                  <div className="bg-rose-600 p-8 sm:p-14 flex flex-col sm:flex-row items-center justify-between gap-10 text-white relative overflow-hidden">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 backdrop-blur-xl bg-white/20 rounded-3xl flex items-center justify-center border border-white/30 shrink-0">
                         <AlertCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-black text-2xl sm:text-3xl leading-[0.9] tracking-tight uppercase mb-2">Trial Expired</h3>
                        <p className="text-rose-100 text-xs font-black uppercase tracking-[0.3em] opacity-80">Upgrade to resume medical analysis</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowSubscriptionModal(true)} 
                      className="w-full sm:w-auto px-10 py-5 bg-white text-rose-600 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-red-50 transition-all shadow-2xl active:scale-95"
                    >
                      Subscribe Now
                    </button>
                  </div>
                )}
            </div>
          )}
 
          {/* Active Info Grid */}
          <div className="backdrop-blur-xl bg-white/70 rounded-[4rem] shadow-sm border border-white p-10 sm:p-14">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100/50">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-[-0.04em]">Active Plan</h2>
              </div>
              <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-sm ${
                isPremium && !isExpired ? 'bg-emerald-500 text-white' : isExpired ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600 border border-slate-300'
              }`}>
                {isPremium && !isExpired ? t('active') : isExpired ? t('expired') : t('freeTier')}
              </div>
            </div>
 
            {isPremium && !isExpired ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-50/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white text-center sm:text-left shadow-sm">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] mb-4">Tier</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{getPlanName(profile.subscriptionTier)}</p>
                </div>
                <div className="bg-slate-50/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white text-center sm:text-left shadow-sm">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] mb-4">{t('validUntil')}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{expiryDate?.toLocaleDateString()}</p>
                </div>
                <div className="bg-slate-50/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white text-center sm:text-left shadow-sm">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] mb-4">{t('daysRemaining')}</p>
                  <p className="text-2xl font-black text-blue-600 tracking-tight leading-none">{daysRemaining} {t('days')}</p>
                </div>
              </div>
            ) : (isExpired || !isPremium) && (
              <div className="text-center py-10">
                <div className="max-w-md mx-auto">
                   <p className="text-slate-400 text-lg font-bold tracking-tight mb-10 italic">"Explore the true potential of AI-powered medical insights with a premium membership."</p>
                   <button 
                     onClick={() => setShowSubscriptionModal(true)}
                     className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                   >
                     <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Explore Plans
                   </button>
                </div>
              </div>
            )}
          </div>

          {/* Search History Section */}
          <div className="backdrop-blur-xl bg-white/70 rounded-[4rem] shadow-sm border border-white overflow-hidden">
            <div className="p-10 sm:p-14 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl shadow-sm">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-[-0.04em]">Search History</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Available Offline</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleClearHistory}
                  className="p-3 text-slate-400 hover:text-red-600 transition-colors"
                  title="Clear History"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleClearCache}
                  className="p-3 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Clear All Cache"
                >
                  <Database className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 sm:p-10">
              {searchHistory.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(`/medicine/${encodeURIComponent(item.name)}`)}
                      className="w-full text-left p-6 bg-white rounded-3xl border border-slate-100 hover:border-blue-500/30 hover:shadow-xl transition-all group flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-xl font-black text-slate-900 tracking-tight">{item.name}</h4>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-md">{item.category}</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium line-clamp-1">{item.summary}</p>
                      </div>
                      <div className="p-3 bg-slate-50 text-slate-300 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                    <History className="w-8 h-8 text-slate-200" />
                  </div>
                  <h3 className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs mb-2">No Search History</h3>
                  <p className="text-slate-300 text-sm font-bold tracking-tight">Your searched medicines will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
 
        {/* Payment History Card */}
        <div className="backdrop-blur-xl bg-white/70 rounded-[4rem] shadow-sm border border-white overflow-hidden">
          <div className="p-10 sm:p-14 border-b border-black/5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-[-0.04em]">{t('paymentHistory')}</h2>
            </div>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-6">
                 <div className="w-12 h-12 border-[6px] border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                 <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{t('loadingHistory')}</p>
              </div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-black/5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                      <th className="px-14 py-8">{t('date')}</th>
                      <th className="px-14 py-8">Plan</th>
                      <th className="px-14 py-8">{t('amount')}</th>
                      <th className="px-14 py-8 text-center">{t('status')}</th>
                      <th className="px-14 py-8 text-right">{t('transactionId')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-base">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-black/5 hover:bg-slate-50/50 transition-colors">
                        <td className="px-14 py-10 text-slate-500 font-bold tracking-tight">
                          {new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-14 py-10 font-black text-slate-900 tracking-tight">{getPlanName(payment.tier)}</td>
                        <td className="px-14 py-10 font-black text-slate-900 tracking-tight">₹{payment.amount}</td>
                        <td className="px-14 py-10 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border ${
                            payment.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-14 py-10 text-right text-slate-300 font-black text-[10px] tracking-widest uppercase">{payment.razorpayPaymentId || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-32 text-center">
                <div className="w-28 h-28 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border border-slate-100 shadow-inner">
                  <CreditCard className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs mb-4">{t('noPayments')}</h3>
                <p className="text-slate-300 text-sm font-bold max-w-[240px] mx-auto leading-relaxed tracking-tight">{t('noPaymentsDesc')}</p>
              </div>
            )}
          </div>
        </div>
 
      </div>
 
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />
      <AvatarSelection
        isOpen={showAvatarSelection}
        onClose={() => setShowAvatarSelection(false)}
      />
    </div>
  );
};
