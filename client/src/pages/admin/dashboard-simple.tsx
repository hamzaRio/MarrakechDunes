import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { Calendar, Users, TrendingUp, Activity, LogOut } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface Booking {
  _id: string;
  customerName: string;
  activity: {
    name: string;
    price: number;
  };
  date: string;
  status: 'pending' | 'confirmed' | 'completed';
  totalAmount: number;
}

interface AdminStats {
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  recentBookings: Booking[];
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings'>('overview');

  // Simple queries - no complex analytics
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch<AdminStats>("/admin/stats"),
    enabled: !!user
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<Booking[]>("/bookings"),
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'completed') => {
    try {
      await apiFetch(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        data: { status }
      });
      // Simple success feedback
      alert(`Booking ${status} successfully!`);
      window.location.reload(); // Simple refresh
    } catch (error) {
      alert('Error updating booking status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Simple Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.username}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Simple Tab Navigation */}
      <div className="mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'overview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'bookings' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Bookings
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Simple Stats Cards */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{stats?.totalBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats?.pendingBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">${stats?.totalRevenue || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-2xl font-bold text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
            
            {bookings.length === 0 ? (
              <p className="text-gray-500">No bookings found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Activity</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{booking.customerName}</td>
                        <td className="p-2">{booking.activity?.name}</td>
                        <td className="p-2">{new Date(booking.date).toLocaleDateString()}</td>
                        <td className="p-2">${booking.totalAmount}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="p-2">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 mr-2"
                            >
                              Confirm
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(booking._id, 'completed')}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
