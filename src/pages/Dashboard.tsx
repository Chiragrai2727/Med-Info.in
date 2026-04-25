import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Clock, CreditCard, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { useLanguage } from '../LanguageContext';
import { PhoneTrialSetup } from '../components/PhoneTrialSetup';

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
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

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
    <div className="min-h-screen bg-[#FDFCFB] pt-20 sm:pt-32 pb-12 px-2 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -ml-64 -mb-64" />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 relative z-10">
        
        {/* Header */}
        <div className="px-2">
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">{t('myDashboard')}</h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-base font-medium">{t('dashboardDesc')}</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          <div className="p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8">
            <div className="relative">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-20 h-20 sm:w-28 sm:h-28 rounded-[2rem] object-cover ring-4 ring-gray-50 shadow-md" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gray-50 rounded-[2rem] flex items-center justify-center border-2 border-gray-100">
                  <span className="text-2xl sm:text-4xl font-black text-gray-300">
                    {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {isPremium && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h2 className="text-xl sm:text-3xl font-black text-gray-900 leading-none">{profile.displayName || t('user')}</h2>
                <div className="flex justify-center sm:justify-start gap-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                    profile.role === 'admin' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-900 text-white shadow-sm'
                  }`}>
                    {profile.role}
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-sm font-medium">{profile.email}</p>
              
              <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-2">
                <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">
                    {t('joined')} {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status Block */}
        <div className="grid grid-cols-1 gap-6">
          {(!profile.isPremium && profile.role !== 'admin') && (
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden transform transition-all hover:scale-[1.01]">
                {!hasClaimedTrial ? (
                  <div className="p-1">
                    <PhoneTrialSetup onSuccess={() => window.location.reload()} />
                  </div>
                ) : trialActive ? (
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shrink-0">
                         <Zap className="w-7 h-7 text-yellow-300" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg sm:text-xl leading-tight">Your Free Trial is Active</h3>
                        <p className="text-blue-100 text-sm font-medium mt-1 uppercase tracking-widest">{trialDaysRemaining} Days Remaining</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowSubscriptionModal(true)} 
                      className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95 z-10"
                    >
                      Unlock Full Access
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-red-600 to-rose-700 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shrink-0">
                         <AlertCircle className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg sm:text-xl leading-tight">Your Trial Expired</h3>
                        <p className="text-red-100 text-sm font-medium opacity-80">Upgrade now to resume medical analysis</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowSubscriptionModal(true)} 
                      className="w-full sm:w-auto px-8 py-4 bg-white text-red-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-50 transition-all shadow-xl active:scale-95"
                    >
                      Subscribe Now
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* Active Info Grid */}
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 p-5 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-tight">Active Plan</h2>
              </div>
              <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                isPremium && !isExpired ? 'bg-green-500 text-white' : isExpired ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {isPremium && !isExpired ? t('active') : isExpired ? t('expired') : t('freeTier')}
              </div>
            </div>

            {isPremium && !isExpired ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center sm:text-left">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tier</p>
                  <p className="text-base sm:text-xl font-black text-gray-900">{getPlanName(profile.subscriptionTier)}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center sm:text-left">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{t('validUntil')}</p>
                  <p className="text-base sm:text-xl font-black text-gray-900">{expiryDate?.toLocaleDateString()}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center sm:text-left">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{t('daysRemaining')}</p>
                  <p className="text-base sm:text-xl font-black text-blue-600">{daysRemaining} {t('days')}</p>
                </div>
              </div>
            ) : (isExpired || !isPremium) && (
              <div className="text-center py-6">
                <div className="max-w-xs mx-auto">
                   <p className="text-gray-500 text-sm font-medium mb-6">Upgrade to Premium for unlimited scans, advanced AI, and expert medical analysis insights.</p>
                   <button 
                     onClick={() => setShowSubscriptionModal(true)}
                     className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                   >
                     <Zap className="w-4 h-4 text-yellow-400" /> Explore Plans
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment History Card */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-tight">{t('paymentHistory')}</h2>
            </div>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('loadingHistory')}</p>
              </div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <th className="p-6">{t('date')}</th>
                      <th className="p-6">Plan</th>
                      <th className="p-6">{t('amount')}</th>
                      <th className="p-6">{t('status')}</th>
                      <th className="p-6 text-right">{t('transactionId')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <td className="p-6 text-gray-600 font-bold">
                          {new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-6 font-black text-gray-900">{getPlanName(payment.tier)}</td>
                        <td className="p-6 font-black text-gray-900">₹{payment.amount}</td>
                        <td className="p-6">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            payment.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="p-6 text-right text-gray-400 font-mono text-[10px] tracking-tight">{payment.razorpayPaymentId || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-gray-50 shadow-inner">
                  <CreditCard className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-gray-400 font-black uppercase tracking-widest text-sm mb-1">{t('noPayments')}</h3>
                <p className="text-gray-300 text-xs font-medium max-w-[200px] mx-auto leading-relaxed">{t('noPaymentsDesc')}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />
    </div>
  );
};
;
