import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { donorService } from '../../services/donorService';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { UtensilsCrossed, PlusCircle, PackageCheck, Activity, HeartHandshake, MapPin } from 'lucide-react';

const DonorDashboard = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await donorService.getMyDonations();
      if (res.success) setDonations(res.donations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  if (loading) return <Loading text="Loading Donor Dashboard..." />;
  if (error) return <ErrorMessage message={error} retry={fetchDonations} />;

  const activeDonations = donations.filter(d => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(d.status));
  const completedDonations = donations.filter(d => d.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Donor Portal Dashboard</h2>
         
        </div>
        <Link to="/donor/post-food">
          <Button icon={PlusCircle}>Post Surplus Food</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Donations" value={donations.length} icon={UtensilsCrossed} color="emerald"  />
        <DashboardCard title="Active Surplus Posts" value={activeDonations.length} icon={Activity} color="amber" />
        <DashboardCard title="Completed Deliveries" value={completedDonations.length} icon={PackageCheck} color="blue"  />
        <DashboardCard title="Food Rescued" value={`${donations.length * 2.5} kg`} icon={HeartHandshake} color="purple" />
      </div>

      {/* Recent Surplus Posts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">Your Active Surplus Food Posts</h3>
          <Link to="/donor/donations" className="text-xs text-emerald-600 font-bold hover:underline">View All ({donations.length})</Link>
        </div>

        {activeDonations.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-sm text-slate-500">You have no active food posts right now.</p>
            <Link to="/donor/post-food" className="mt-3 inline-block">
              <Button size="sm">Post Food Now</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDonations.slice(0, 3).map((d) => (
              <div key={d.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">{d.title}</h4>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{d.quantity} • {d.food_type}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" /> {d.pickup_address}
                  </p>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;
