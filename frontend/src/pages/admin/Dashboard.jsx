import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import DashboardCard from '../../components/DashboardCard';
import Loading from '../../components/Loading';

import { UtensilsCrossed, PackageCheck, Users, HeartHandshake, Building2, Truck, Activity, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAnalytics();
      if (res.success) {
        setData(res);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <Loading text="Loading Admin Dashboard" />;
  if (error) return <ErrorMessage message={error} retry={fetchAnalytics} />;

  const { metrics, charts } = data;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Overview Dashboard</h2>
          
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
          <ShieldCheck className="w-4 h-4" /> System Online & Healthy
        </span>
      </div>

      {/* 8 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Donations" value={metrics.total_donations} icon={UtensilsCrossed} color="emerald" />
        <DashboardCard title="Total Deliveries" value={metrics.total_deliveries} icon={PackageCheck} color="blue" />
        <DashboardCard title="Beneficiaries Served" value={metrics.total_beneficiaries} icon={Users} color="purple" />
        <DashboardCard title="Food Saved (Est.)" value={metrics.food_saved_kg} icon={Activity} color="rose" />
        <DashboardCard title="Active Volunteers" value={metrics.active_volunteers} icon={Truck} color="blue" />
        <DashboardCard title="Pending Requests" value={metrics.pending_requests} icon={Activity} color="amber" />
        <DashboardCard title="Registered NGOs" value={metrics.registered_ngos} icon={Building2} color="amber" />
        <DashboardCard title="Registered Donors" value={metrics.registered_donors} icon={HeartHandshake} color="emerald"/>
      </div>

      {/* Redistribution Analytics Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-1">Monthly Food Rescue & Redistribution Trends</h3>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.monthly_stats}>
              <defs>
                <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="donations" stroke="#10b981" fillOpacity={1} fill="url(#colorDonations)" name="Donations Posted" />
              <Area type="monotone" dataKey="deliveries" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDeliveries)" name="Deliveries Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
