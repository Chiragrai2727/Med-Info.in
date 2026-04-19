import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, ShieldCheck, Search as SearchIcon, Activity, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    const fetchAdminData = async () => {
      if (profile?.role !== 'admin') return;

      try {
        // Fetch Users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const fetchedUsers: UserData[] = [];
        let premiumCount = 0;
        
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

    fetchAdminData();
  }, [profile]);

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-2">Overview of platform usage, users, and search analytics.</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading admin data...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Registered Users</p>
                  <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Premium Subscribers</p>
                  <p className="text-3xl font-bold text-gray-900">{premiumUsers}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
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
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    User Directory
                  </h2>
                </div>
                <div className="overflow-y-auto flex-1 p-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                      <tr className="text-xs text-gray-500 uppercase tracking-wider">
                        <th className="p-4 font-bold">User</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {users.map((u) => (
                        <tr key={u.uid} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{u.displayName || 'Anonymous'}</div>
                            <div className="text-gray-500 text-xs">{u.email}</div>
                            {u.phoneNumber && (
                              <div className="text-blue-600 text-xs mt-1 font-mono">{u.phoneNumber}</div>
                            )}
                          </td>
                          <td className="p-4">
                            {u.isPremium ? (
                              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full capitalize">
                                {u.subscriptionTier || 'Premium'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                                Free
                              </span>
                            )}
                            {u.role === 'admin' && (
                              <span className="ml-2 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                Admin
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
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
