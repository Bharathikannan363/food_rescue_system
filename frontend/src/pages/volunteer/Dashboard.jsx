import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { volunteerService } from '../../services/volunteerService';
import { useGeolocation } from '../../hooks/useGeolocation';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { Truck, CheckSquare, PackageCheck, MapPin, Navigation, Radio, ArrowRight } from 'lucide-react';

const VolunteerDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [openTasks, setOpenTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // HTML5 Geolocation WatchPosition Hook (broadcasts location to Flask API)
  const { location, error: geoError } = useGeolocation(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignsRes, tasksRes] = await Promise.all([
        volunteerService.getAssignments(),
        volunteerService.getAvailableTasks()
      ]);
      if (assignsRes.success) setAssignments(assignsRes.assignments || []);
      if (tasksRes.success) setOpenTasks(tasksRes.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && assignments.length === 0 && openTasks.length === 0) {
    return <Loading text="Loading Volunteer Dashboard..." />;
  }
  if (error && assignments.length === 0 && openTasks.length === 0) {
    return <ErrorMessage message={error} retry={fetchData} />;
  }

  const activeAssign = assignments.find(a => ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(a.status));
  const completedAssigns = assignments.filter(a => ['DELIVERED', 'COMPLETED'].includes(a.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Volunteer Delivery Dashboard</h2>
         
        </div>
      </div>

     

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Open Broadcasts"
          value={openTasks.length}
          icon={Radio}
          color="emerald"
          subtitle="Ready for claim"
        />
        <DashboardCard
          title="Active Duty"
          value={activeAssign ? 1 : 0}
          icon={Truck}
          color="blue"
          subtitle={activeAssign ? activeAssign.status?.replace(/_/g, ' ') : 'Free'}
        />
        <DashboardCard
          title="My Completed Runs"
          value={completedAssigns.length}
          icon={PackageCheck}
          color="purple"
          subtitle="Delivered to NGOs"
        />
        <DashboardCard
          title="GPS Broadcasting"
          value={location.latitude ? 'Active' : 'Standby'}
          icon={Navigation}
          color="amber"
          subtitle="HTML5 Geolocation API"
        />
      </div>

      {/* Active Assignment Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Current Active Assignment</h3>
          <Link to="/volunteer/assignments">
            <Button size="sm" variant="outline">View All ({assignments.length})</Button>
          </Link>
        </div>

        {activeAssign ? (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-base">{activeAssign.request_details?.donation_title}</h4>
                <p className="text-xs text-slate-500">NGO: {activeAssign.request_details?.ngo_name}</p>
              </div>
              <StatusBadge status={activeAssign.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <p>📍 <strong>Pickup:</strong> {activeAssign.request_details?.donation_pickup_address}</p>
              <p>🏢 <strong>Delivery NGO:</strong> {activeAssign.request_details?.ngo_address}</p>
            </div>

            <div className="pt-2">
              <Link to="/volunteer/assignments">
                <Button size="sm" className="w-full sm:w-auto">Update Delivery Workflow Status</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm">
            You currently have no active delivery assignment on duty.
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;
