import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ngoService } from '../../services/ngoService';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { UtensilsCrossed, FileText, CheckCircle2, PackageCheck, Truck } from 'lucide-react';

const NGODashboard = () => {
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [donRes, reqRes] = await Promise.all([
        ngoService.getAvailableDonations(),
        ngoService.getMyRequests()
      ]);
      if (donRes.success) setDonations(donRes.donations);
      if (reqRes.success) setRequests(reqRes.requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Loading text="Loading NGO Dashboard..." />;
  if (error) return <ErrorMessage message={error} retry={fetchData} />;

  const pendingReqs = requests.filter(r => r.status === 'PENDING');
  const acceptedReqs = requests.filter(r => r.status === 'ACCEPTED');
  const completedReqs = requests.filter(r => r.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">NGO Shelter Dashboard</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard title="Available Food" value={donations.length} icon={UtensilsCrossed} color="emerald" />
        <DashboardCard title="My Requests" value={requests.length} icon={FileText} color="blue"  />
        <DashboardCard title="Pending Donor" value={pendingReqs.length} icon={FileText} color="amber" />
        <DashboardCard title="Accepted Requests" value={acceptedReqs.length} icon={CheckCircle2} color="purple"  />
        <DashboardCard title="Completed Deliveries" value={completedReqs.length} icon={PackageCheck} color="emerald" />
      </div>

      {/* Available Food Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">Latest Available Surplus Food Donations</h3>
          <Link to="/ngo/donations" className="text-xs text-emerald-600 font-bold hover:underline">View All ({donations.length})</Link>
        </div>

        {donations.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-400">No surplus food currently posted by donors.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donations.slice(0, 4).map((d) => (
              <div key={d.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{d.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{d.donor_name}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{d.quantity}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{d.description || 'Fresh surplus meals available for distribution.'}</p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">📍 {d.pickup_address}</span>
                  <Link to="/ngo/donations">
                    <Button size="sm">Request Food</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NGODashboard;
