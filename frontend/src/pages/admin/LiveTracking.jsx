
import React, { useState, useEffect, useCallback } from 'react';

import { locationService } from '../../services/locationService';
import LiveMap from '../../components/LiveMap';

import {
  Truck,
  HeartHandshake,
  Building2,
  Navigation,
  Search,
  RefreshCw,
  MapPin,
  Phone,
  Radio
} from 'lucide-react';

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

  // Fetch live tracking information
  const fetchTracking = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      }

      const response = await locationService.getLiveFeed();

      // Axios returns the API response inside response.data
      const data = response.data;

      if (!data) {
        throw new Error('Empty response received from server.');
      }

      setVolunteers(data.volunteers || []);
      setDonors(data.donors || []);
      setNgos(data.ngos || []);
      setActiveDeliveries(data.active_deliveries || []);
      setCurrentUser(data.current_user || null);

      setError(null);

    } catch (err) {
      console.error('Live tracking error:', err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Unable to load live tracking data.';

      setError(message);

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch and automatic refresh
  useEffect(() => {
    fetchTracking();

    const interval = setInterval(() => {
      fetchTracking();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTracking]);

  // Focus map on selected volunteer
  const handleFocusVolunteer = (volunteer) => {
    const latitude = Number(volunteer.latitude);
    const longitude = Number(volunteer.longitude);

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      setFocusCoords([latitude, longitude]);
    }
  };

  // Search volunteers
  const filteredVolunteers = volunteers.filter((volunteer) => {
    const query = searchQuery.toLowerCase();

    return (
      volunteer.full_name?.toLowerCase().includes(query) ||
      volunteer.vehicle_type?.toLowerCase().includes(query) ||
      volunteer.phone?.includes(query)
    );
  });

  if (loading) {
    return (
      <Loading text="Loading Live City Rescue Network & Coordinates..." />
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            City Live Rescue & Tracking Map
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Monitor donors, NGOs, volunteers and active deliveries.
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-emerald-700 font-semibold">
              Auto-refresh every 10 seconds
            </span>
          </div>
        </div>

        <button
          onClick={() => fetchTracking(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          {refreshing ? 'Refreshing...' : 'Refresh Locations'}
        </button>

      </div>

      {/* Error */}
      {error && (
        <ErrorMessage
          message={error}
          retry={() => fetchTracking(true)}
        />
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <MetricCard
          title="Volunteers"
          value={volunteers.length}
          subtitle="Registered volunteers"
          color="blue"
          icon={<Truck className="w-5 h-5" />}
        />

        <MetricCard
          title="Active Deliveries"
          value={activeDeliveries.length}
          subtitle="Missions in progress"
          color="purple"
          icon={<Navigation className="w-5 h-5" />}
        />

        <MetricCard
          title="Donors"
          value={donors.length}
          subtitle="Registered donors"
          color="emerald"
          icon={<HeartHandshake className="w-5 h-5" />}
        />

        <MetricCard
          title="NGO Hubs"
          value={ngos.length}
          subtitle="Registered NGOs"
          color="amber"
          icon={<Building2 className="w-5 h-5" />}
        />

      </div>

      {/* Live Map */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">

        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-blue-600" />

          <h3 className="font-bold text-slate-800">
            Live Location Map
          </h3>
        </div>

        <LiveMap
          volunteers={volunteers}
          donors={donors}
          ngos={ngos}
          activeDeliveries={activeDeliveries}
          userLocation={
            currentUser?.latitude != null &&
            currentUser?.longitude != null
              ? {
                  latitude: currentUser.latitude,
                  longitude: currentUser.longitude,
                  label: 'Admin Station'
                }
              : null
          }
          focusCoords={focusCoords}
          height="h-[520px]"
          onRefresh={() => fetchTracking(true)}
          isRefreshing={refreshing}
        />

      </div>

      {/* Volunteer Tracking */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Volunteer Tracking
            </h3>

            <p className="text-xs text-slate-500">
              Select a volunteer to focus on their map location.
            </p>
          </div>

          <div className="relative">

            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search volunteers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />

          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          {filteredVolunteers.length === 0 ? (

            <div className="col-span-full py-8 text-center text-sm text-slate-400">
              No volunteers found.
            </div>

          ) : (

            filteredVolunteers.map((volunteer, index) => (

              <button
                type="button"
                key={volunteer.volunteer_id || index}
                onClick={() => handleFocusVolunteer(volunteer)}
                className="text-left p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all"
              >

                <div className="flex items-center justify-between mb-3">

                  <span className="font-semibold text-slate-800">
                    {volunteer.full_name || 'Volunteer'}
                  </span>

                  <Radio className="w-4 h-4 text-emerald-600" />

                </div>

                <div className="space-y-2 text-xs text-slate-500">

                  {volunteer.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {volunteer.phone}
                    </p>
                  )}

                  {volunteer.vehicle_type && (
                    <p className="flex items-center gap-2">
                      <Truck className="w-3 h-3" />
                      {volunteer.vehicle_type}
                    </p>
                  )}

                  <p className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {volunteer.latitude != null &&
                    volunteer.longitude != null
                      ? `${volunteer.latitude}, ${volunteer.longitude}`
                      : 'Location unavailable'}
                  </p>

                </div>

                <div className="mt-3">

                  {volunteer.active_task ? (

                    <span className="text-xs text-amber-700 font-semibold">
                      Active delivery
                    </span>

                  ) : (

                    <span className="text-xs text-emerald-600 font-semibold">
                      No active delivery
                    </span>

                  )}

                </div>

              </button>

            ))

          )}

        </div>

      </div>

    </div>
  );
};


// Reusable metric card
const MetricCard = ({ title, value, subtitle, color, icon }) => {

  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase">
          {title}
        </p>

        <h3 className="text-2xl font-bold text-slate-800 mt-1">
          {value}
        </h3>

        <p className="text-[10px] text-slate-500 mt-1">
          {subtitle}
        </p>
      </div>

      <div className={`p-3 rounded-xl ${colors[color]}`}>
        {icon}
      </div>

    </div>
  );
};

export default AdminLiveTracking;
