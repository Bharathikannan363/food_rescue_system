import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
import LiveMap from '../../components/LiveMap';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { calculateDistanceKm, formatDistance } from '../../utils/distance';
import { Truck, Phone, MapPin, Building2, HeartHandshake, Radio, RefreshCw, Navigation, CheckCircle2 } from 'lucide-react';

const NGOTracking = () => {
  const [feedData, setFeedData] = useState({
    volunteers: [],
    donors: [],
    ngos: [],
    active_deliveries: [],
    current_user: null
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [focusCoords, setFocusCoords] = useState(null);

  const fetchTracking = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await locationService.getLiveFeed();
      if (res.success) {
        setFeedData(res);
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
    const interval = setInterval(() => fetchTracking(false), 10000); // 10s live poll
    return () => clearInterval(interval);
  }, []);

  const currentUser = feedData.current_user;

  // Filter deliveries destined for this NGO
  const myIncomingDeliveries = feedData.active_deliveries.filter(del =>
    (currentUser && del.ngo?.id && del.ngo.id === currentUser.id) ||
    (currentUser && del.ngo?.name && currentUser.name && del.ngo.name.toLowerCase().includes(currentUser.name.toLowerCase()))
  );

  // Relevant active deliveries to display on the map (my incoming deliveries or all active deliveries if none specific)
  const deliveriesToDisplay = myIncomingDeliveries.length > 0 ? myIncomingDeliveries : feedData.active_deliveries;

  if (loading && feedData.volunteers.length === 0) {
    return <Loading text="Loading NGO Live Delivery Tracking Feed..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Live Delivery GPS Tracking</h2>
            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-semibold">
              <Radio className="w-3 h-3 animate-pulse text-amber-600" /> Live Stream
            </span>
          </div>
        </div>

        <button
          onClick={() => fetchTracking(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
          <span>{refreshing ? 'Updating...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} retry={() => fetchTracking(true)} />}

      {/* Live Map */}
      <LiveMap
        volunteers={feedData.volunteers}
        donors={feedData.donors}
        ngos={feedData.ngos}
        activeDeliveries={deliveriesToDisplay}
        userLocation={currentUser?.latitude && currentUser?.longitude ? {
          latitude: currentUser.latitude,
          longitude: currentUser.longitude,
          label: currentUser.name || 'Your NGO Center'
        } : null}
        focusCoords={focusCoords}
        height="h-[480px]"
        onRefresh={() => fetchTracking(true)}
        isRefreshing={refreshing}
      />

      {/* Active Incoming Deliveries Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" />
          <span>Active Food Deliveries to Your NGO</span>
          {myIncomingDeliveries.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-semibold">
              {myIncomingDeliveries.length} in transit
            </span>
          )}
        </h3>

        {myIncomingDeliveries.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Active Deliveries In-Transit Right Now</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Once you request surplus food and a volunteer accepts the pickup, their real-time moving coordinates will appear above with estimated distance and phone contact.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myIncomingDeliveries.map((del, idx) => {
              const volLat = del.volunteer?.latitude;
              const volLng = del.volunteer?.longitude;
              const ngoLat = currentUser?.latitude || del.ngo?.latitude;
              const ngoLng = currentUser?.longitude || del.ngo?.longitude;
              const distanceKm = (volLat && volLng && ngoLat && ngoLng) ? calculateDistanceKm(volLat, volLng, ngoLat, ngoLng) : null;

              return (
                <div
                  key={del.assignment_id || idx}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {del.status?.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-slate-800 text-base mt-1.5">{del.donation?.title}</h4>
                      <p className="text-xs text-slate-500">Qty: {del.donation?.quantity || 'As stated'}</p>
                    </div>

                    <button
                      onClick={() => volLat && volLng && setFocusCoords([volLat, volLng])}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Locate
                    </button>
                  </div>

                  {/* Delivery Route Stops */}
                  <div className="space-y-2 border-t border-b border-slate-100 py-3 text-xs">
                    <div className="flex items-start gap-2 text-slate-600">
                      <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">Pickup: {del.donor?.name || 'Food Donor'}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{del.donation?.pickup_address || del.donor?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600">
                      <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">Destination: {del.ngo?.name || 'Your NGO'}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{del.ngo?.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Volunteer Details & Distance */}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {del.volunteer?.name?.charAt(0) || 'V'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{del.volunteer?.name || 'Volunteer'}</p>
                        <p className="text-[10px] text-slate-500">{del.volunteer?.vehicle_type || 'Delivery Van'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {distanceKm !== null ? (
                        <div>
                          <p className="text-xs font-mono font-bold text-slate-800">{formatDistance(distanceKm)}</p>
                          <p className="text-[10px] text-slate-400">to your hub</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">GPS streaming</span>
                      )}
                    </div>
                  </div>

                  {del.volunteer?.phone && (
                    <a
                      href={`tel:${del.volunteer.phone}`}
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Volunteer ({del.volunteer.phone})
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Volunteer Fleet nearby */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600" />
          <span>City Volunteer Fleet on Standby</span>
        </h3>
        <p className="text-xs text-slate-500">
          Volunteers currently broadcasting live location and available for food rescue operations
        </p>

      </div>
    </div>
  );
};

export default NGOTracking;
