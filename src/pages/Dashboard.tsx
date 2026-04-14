import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Clock, CreditCard, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

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
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'users', user.uid, 'payments'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedPayments: PaymentRecord[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPayments.push({ id: doc.id, ...doc.data() } as PaymentRecord);
        });
        setPayments(fetchedPayments);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/payments`);
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
  
  let daysRemaining = 0;
  if (expiryDate && !isExpired) {
    const diffTime = Math.abs(expiryDate.getTime() - new Date().getTime());
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage your account, active plans, and payment history.</p>
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
              <h2 className="text-2xl font-bold text-gray-900">{profile.displayName || 'User'}</h2>
              <p className="text-gray-500">{profile.email}</p>
              <div className="mt-3 flex gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                  profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  Role: {profile.role}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                  Joined: {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Plan Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
                Current Plan
              </h2>
              {isPremium && !isExpired ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">Active</span>
              ) : isExpired ? (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">Expired</span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-bold rounded-full">Free Tier</span>
              )}
            </div>

            {isPremium && !isExpired ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium mb-1">Plan Tier</p>
                    <p className="text-xl font-bold capitalize">{profile.subscriptionTier || 'Monthly'} Pro</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium mb-1">Valid Until</p>
                    <p className="text-xl font-bold">{expiryDate?.toLocaleDateString()}</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium mb-1">Days Remaining</p>
                    <p className="text-xl font-bold">{daysRemaining} Days</p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowSubscriptionModal(true)}
                    className="px-6 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> Change Plan
                  </button>
                </div>
              </div>
            ) : isExpired ? (
              <div className="bg-red-50 rounded-2xl p-6 border border-red-100 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-900 mb-2">Your Subscription Has Expired</h3>
                <p className="text-red-700 mb-6 max-w-md mx-auto">
                  Your previous {profile.subscriptionTier || 'premium'} plan expired on {expiryDate?.toLocaleDateString()}. Renew now to regain access to unlimited AI health scanning and priority support.
                </p>
                <button 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <Zap className="w-5 h-5 text-yellow-300" /> Renew Subscription
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Subscription</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Upgrade to Premium to unlock unlimited AI health scanning, prescription analysis, and lab report insights.
                </p>
                <button 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                >
                  <Zap className="w-5 h-5 text-yellow-400" /> Upgrade to Premium
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment History Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              Payment History
            </h2>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading payment history...</div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Plan</th>
                      <th className="p-4 font-medium">Amount</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Transaction ID</th>
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
                        <td className="p-4 font-medium capitalize">{payment.tier}</td>
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
                <h3 className="text-gray-900 font-bold mb-1">No payments yet</h3>
                <p className="text-gray-500 text-sm">Your payment history will appear here once you subscribe.</p>
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
