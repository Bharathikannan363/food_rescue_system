import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LiveMap from '../../components/LiveMap';
import { useGeolocation } from '../../hooks/useGeolocation';
import { locationService } from '../../services/locationService';
import { volunteerService } from '../../services/volunteerService';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { calculateDistanceKm, formatDistance } from '../../utils/distance';
import { Navigation, Radio, RefreshCw, Truck, HeartHandshake, Building2, Phone, CheckCircle2, PackageCheck, AlertCircle, ArrowRight } from 'lucide-react';

const VolunteerTracking = () => {
  const { location, error: geoError, loading: geoLoading, refreshLocation } = useGeolocation(true);
  const [feedData, setFeedData] = useState({
    volunteers: [],
    donors: [],
    ngos: [],
    active_deliveries: [],
    current_user: null
  });
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [focusCoords, setFocusCoords] = useState(null);

  const fetchTracking = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const [feedRes, tasksRes] = await Promise.all([
        locationService.getLiveFeed(),
        volunteerService.getAvailableTasks().catch(() => ({ tasks: [] }))
      ]);

      if (feedRes.success) {
        setFeedData(feedRes);
        setError(null);
      }
      if (tasksRes.tasks) {
        setAvailableTasks(tasksRes.tasks || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(() => fetchTracking(false), 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const currentUser = feedData.current_user;

  // Active mission assigned to THIS volunteer
  const myActiveMission = feedData.active_deliveries.find(del =>
    (currentUser && del.volunteer?.id && del.volunteer.id === currentUser.id) ||
    (currentUser && del.volunteer?.name && currentUser.name && del.volunteer.name.toLowerCase().includes(currentUser.name.toLowerCase()))
  );

  const handleUpdateStatus = async (nextStatus) => {
    if (!myActiveMission) return;
    try {
      setStatusUpdating(true);
      const res = await volunteerService.updateStatus(myActiveMission.assignment_id, nextStatus);
      if (res.success) {
        alert(`Status updated to ${nextStatus.replace('_', ' ')}!`);
        await fetchTracking(true);
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleClaimTask = async (taskId) => {
    try {
      const res = await volunteerService.claimTask(taskId);
      if (res.success) {
        alert(res.message || 'Delivery task claimed! Safe travels to the pickup point.');
        await fetchTracking(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const userLat = location.latitude || currentUser?.latitude;
  const userLng = location.longitude || currentUser?.longitude;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Volunteer GPS Tracker & Navigation</h2>
            
          </div>
          
        </div>
      </div>

      {error && <ErrorMessage message={error} retry={() => fetchTracking(true)} />}

      {/* Main Interactive Live Map */}
      <LiveMap
        volunteers={feedData.volunteers}
        donors={feedData.donors}
        ngos={feedData.ngos}
        activeDeliveries={myActiveMission ? [myActiveMission] : feedData.active_deliveries}
        userLocation={userLat && userLng ? {
          latitude: userLat,
          longitude: userLng,
          accuracy: location.accuracy,
          label: 'You (Volunteer)'
        } : null}
        focusCoords={focusCoords || (userLat && userLng ? [userLat, userLng] : null)}
        height="h-[480px]"
        onRefresh={() => {
          refreshLocation();
          fetchTracking(true);
        }}
        isRefreshing={refreshing}
      />

      {/* Active Mission Card */}
      {myActiveMission ? (
        <div className="bg-white p-5 rounded-2xl border-2 border-blue-500 shadow-md space-y-4">
          {/* Route details: Pickup -> Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickup Stop */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  Stop 1: Food Pickup
                </span>
                {userLat && myActiveMission.donation?.latitude && (
                  <span className="font-mono text-emerald-700 font-semibold">
                    {formatDistance(calculateDistanceKm(userLat, userLng, myActiveMission.donation.latitude, myActiveMission.donation.longitude))} away
                  </span>
                )}
              </div>
              <p className="font-semibold text-slate-800">{myActiveMission.donor?.name || 'Donor'}</p>
              <p className="text-slate-600 text-[11px] line-clamp-2">
                {myActiveMission.donation?.pickup_address || myActiveMission.donor?.address}
              </p>
              {myActiveMission.donor?.phone && (
                <a
                  href={`tel:${myActiveMission.donor.phone}`}
                  className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline pt-1"
                >
                  <Phone className="w-3 h-3" /> {myActiveMission.donor.phone}
                </a>
              )}
            </div>

            {/* Dropoff Stop */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Stop 2: NGO Delivery
                </span>
                {userLat && myActiveMission.ngo?.latitude && (
                  <span className="font-mono text-amber-700 font-semibold">
                    {formatDistance(calculateDistanceKm(userLat, userLng, myActiveMission.ngo.latitude, myActiveMission.ngo.longitude))} away
                  </span>
                )}
              </div>
              <p className="font-semibold text-slate-800">{myActiveMission.ngo?.name || 'NGO'}</p>
              <p className="text-slate-600 text-[11px] line-clamp-2">{myActiveMission.ngo?.address}</p>
              {myActiveMission.ngo?.phone && (
                <a
                  href={`tel:${myActiveMission.ngo.phone}`}
                  className="inline-flex items-center gap-1 text-amber-700 font-semibold hover:underline pt-1"
                >
                  <Phone className="w-3 h-3" /> {myActiveMission.ngo.phone}
                </a>
              )}
            </div>
          </div>

          {/* Mission Progress Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {myActiveMission.status === 'ACCEPTED' && (
              <button
                onClick={() => handleUpdateStatus('PICKED_UP')}
                disabled={statusUpdating}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
              >
                <PackageCheck className="w-4 h-4" />
                {statusUpdating ? 'Updating...' : 'I Have Picked Up Food'}
              </button>
            )}

            {myActiveMission.status === 'PICKED_UP' && (
              <button
                onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY')}
                disabled={statusUpdating}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                {statusUpdating ? 'Updating...' : 'Start Driving to NGO (Out for Delivery)'}
              </button>
            )}

            {myActiveMission.status === 'OUT_FOR_DELIVERY' && (
              <Link
                to="/volunteer/assignments"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" /> Complete & Upload Proof Photo
              </Link>
            )}


          </div>
        </div>
      ) : (
        <div className="space-y-4">
          

          {/* Open tasks available for pickup */}
          {availableTasks.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Open Broadcasted Food Rescue Tasks Nearby</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableTasks.map((task) => {
                  const dist = (userLat && task.donation?.latitude) ?
                    calculateDistanceKm(userLat, userLng, task.donation.latitude, task.donation.longitude) : null;

                  return (
                    <div
                      key={task.request_id || task.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-800 text-sm">{task.donation?.title || task.title}</p>
                          {dist !== null && (
                            <span className="font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded shrink-0">
                              {formatDistance(dist)}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Pickup: {task.donation?.pickup_address || task.pickup_address}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Dropoff: {task.ngo?.ngo_name || task.ngo_name}
                        </p>
                      </div>

                      <button
                        onClick={() => handleClaimTask(task.request_id || task.id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm active:scale-95"
                      >
                        Claim This Rescue Task
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VolunteerTracking;
