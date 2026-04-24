import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
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
    const fetchPayments = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.uid)
          .order('date', { ascending: false });

        if (error) {
          // If table doesn't exist yet, we just show empty
          if (error.code === '42P01') {
            setPayments([]);
          } else {
            throw error;
          }
        } else {
          setPayments(data || []);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
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
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('myDashboard')}</h1>
          <p className="text-gray-500 mt-2">{t('dashboardDesc')}</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8 flex items-center gap-6">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-20 h-20 rounded-full border-4 border-gray-50" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">
                  {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.displayName || t('user')}</h2>
              <p className="text-gray-500">{profile.email}</p>
              <div className="mt-3 flex gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                  profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {t('role')}: {profile.role}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                  {t('joined')}: {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Status Banner inside Dashboard */}
        {(!profile.isPremium && profile.role !== 'admin') && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-8">
              {!hasClaimedTrial ? (
                <div className="p-1">
                  <PhoneTrialSetup onSuccess={() => {
                    // Update layout on success
                    window.location.reload();
                  }} />
                </div>
              ) : trialActive ? (
                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                       <Clock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-indigo-900">Your Free Trial ends in {trialDaysRemaining} days</h3>
                      <p className="text-indigo-700 text-sm">Upgrade before your trial ends to avoid interruption.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSubscriptionModal(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                    Upgrade to Premium
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border-l-4 border-red-600 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                       <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-red-900">Your Trial has expired!</h3>
                      <p className="text-red-700 text-sm">You have lost access to premium features.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSubscriptionModal(true)} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm">
                    Upgrade Now
                  </button>
                </div>
              )}
          </div>
        )}

        {/* Active Plan Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
                {t('currentPlan')}
              </h2>
              {isPremium && !isExpired ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">{t('active')}</span>
              ) : isExpired ? (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">{t('expired')}</span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-bold rounded-full">{t('freeTier')}</span>
              )}
            </div>

            {isPremium && !isExpired ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium mb-1">{t('currentPlan')}</p>
                    <p className="text-xl font-bold">{getPlanName(profile.subscriptionTier)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium mb-1">{t('validUntil')}</p>
                    <p className="text-xl font-bold">{expiryDate?.toLocaleDateString()}</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium mb-1">{t('daysRemaining')}</p>
                    <p className="text-xl font-bold">{daysRemaining} {t('days')}</p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowSubscriptionModal(true)}
                    className="px-6 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> {t('changePlan')}
                  </button>
                </div>
              </div>
            ) : isExpired ? (
              <div className="bg-red-50 rounded-2xl p-6 border border-red-100 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-900 mb-2">{t('subscriptionExpired')}</h3>
                <p className="text-red-700 mb-6 max-w-md mx-auto">
                  {t('subscriptionExpiredDesc')
                    .replace('{tier}', getPlanName(profile.subscriptionTier))
                    .replace('{date}', expiryDate?.toLocaleDateString() || '')}
                </p>
                <button 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <Zap className="w-5 h-5 text-yellow-300" /> {t('renewSubscription')}
                </button>
              </div>
            ) : hasClaimedTrial && trialActive ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-600 font-medium mb-1">Current Status</p>
                    <p className="text-xl font-bold capitalize text-purple-900">14-Day Free Trial</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-600 font-medium mb-1">Trial Ends On</p>
                    <p className="text-xl font-bold text-purple-900">{trialEndsAt?.toLocaleDateString()}</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-600 font-medium mb-1">{t('daysRemaining')}</p>
                    <p className="text-xl font-bold text-purple-900">{trialDaysRemaining} {t('days')}</p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowSubscriptionModal(true)}
                    className="px-6 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-yellow-400" /> {t('upgradeToPremium')}
                  </button>
                </div>
              </div>
            ) : hasClaimedTrial && !trialActive ? (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">14-Day Free Trial Ended</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Your trial period has expired. To continue using the AI Medical Scanner and premium features, please upgrade to a subscription.
                </p>
                <button 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                >
                  <Zap className="w-5 h-5 text-yellow-400" /> {t('upgradeToPremium')}
                </button>
              </div>
            ) : (
              // Haven't claimed trial yet
              <div className="mt-4">
                <PhoneTrialSetup onSuccess={() => window.location.reload()} />
              </div>
            )}
          </div>
        </div>

        {/* Payment History Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              {t('paymentHistory')}
            </h2>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t('loadingHistory')}</div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                      <th className="p-4 font-medium">{t('date')}</th>
                      <th className="p-4 font-medium">{t('currentPlan')}</th>
                      <th className="p-4 font-medium">{t('amount')}</th>
                      <th className="p-4 font-medium">{t('status')}</th>
                      <th className="p-4 font-medium">{t('transactionId')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4 font-medium">{getPlanName(payment.tier)}</td>
                        <td className="p-4 font-bold">₹{payment.amount.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            payment.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-xs">{payment.razorpayPaymentId || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-bold mb-1">{t('noPayments')}</h3>
                <p className="text-gray-500 text-sm">{t('noPaymentsDesc')}</p>
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
