import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
import LiveMap from '../../components/LiveMap';
import { MapPin, RefreshCw, Truck, HeartHandshake, Building2, Phone, Search, Radio, Navigation } from 'lucide-react';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';

const AdminLiveTracking = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [donors, setDonors] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusCoords, setFocusCoords] = useState(null);

  const fetchTracking = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await locationService.getLiveFeed();
      if (res.success) {
        setVolunteers(res.volunteers || []);
        setDonors(res.donors || []);
        setNgos(res.ngos || []);
        setActiveDeliveries(res.active_deliveries || []);
        setCurrentUser(res.current_user || null);
        setError(null);
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

  const handleFocusVolunteer = (v) => {
    if (v.latitude && v.longitude) {
      setFocusCoords([v.latitude, v.longitude]);
    }
  };

  const filteredVolunteers = volunteers.filter(v =>
    v.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vehicle_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.phone?.includes(searchQuery)
  );

  if (loading && volunteers.length === 0) {
    return <Loading text="Loading Live City Rescue Network & Coordinates..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">City Live Rescue & Tracking Map</h2>
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold">
            
            </span>
          </div>
         
        </div>
      </div>

      {error && <ErrorMessage message={error} retry={() => fetchTracking(true)} />}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Volunteers Active</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{volunteers.length}</h3>
            <p className="text-[10px] text-blue-600 mt-0.5">Live GPS Broadcasting</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active In-Transit</p>
            <h3 className="text-2xl font-bold text-purple-700 mt-1">{activeDeliveries.length}</h3>
            <p className="text-[10px] text-purple-600 mt-0.5">Missions in Progress</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Pickup Points</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">{donors.length}</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5">Registered Donors</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">NGO Hubs</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">{ngos.length}</h3>
            <p className="text-[10px] text-amber-600 mt-0.5">Distribution Centers</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Interactive Live Map */}
      <LiveMap
        volunteers={volunteers}
        donors={donors}
        ngos={ngos}
        activeDeliveries={activeDeliveries}
        userLocation={currentUser?.latitude && currentUser?.longitude ? {
          latitude: currentUser.latitude,
          longitude: currentUser.longitude,
          label: 'Admin Station'
        } : null}
        focusCoords={focusCoords}
        height="h-[520px]"
        onRefresh={() => fetchTracking(true)}
        isRefreshing={refreshing}
      />

      {/* Active Tracking Feed */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVolunteers.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
            </div>
          ) : (
            filteredVolunteers.map((v, idx) => (
              <div
                key={v.volunteer_id || idx}
                onClick={() => handleFocusVolunteer(v)}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs space-y-2 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                 
                  
                </div>

                <div className="space-y-1 text-slate-500">
                  <p className="flex items-center gap-1.5">
                   
                  </p>
                  {v.phone && (
                    <p className="flex items-center gap-1.5">
                    </p>
                  )}
                </div>

                {v.active_task ? (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900">
                   
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLiveTracking;
