import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { locationService } from '../../services/locationService';
import LiveMap from '../../components/LiveMap';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { calculateDistanceKm, formatDistance } from '../../utils/distance';
import { Truck, Phone, MapPin, Building2, HeartHandshake, Radio, RefreshCw, Navigation, PlusCircle, CheckCircle } from 'lucide-react';

const DonorTracking = () => {
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

  // Filter deliveries for this donor's donations
  const myPickups = feedData.active_deliveries.filter(del =>
    (currentUser && del.donor?.id && del.donor.id === currentUser.id) ||
    (currentUser && del.donor?.name && currentUser.name && del.donor.name.toLowerCase().includes(currentUser.name.toLowerCase()))
  );

  // Deliveries to show on map (my pickups or all active deliveries if none specific)
  const deliveriesToDisplay = myPickups.length > 0 ? myPickups : feedData.active_deliveries;

  if (loading && feedData.volunteers.length === 0) {
    return <Loading text="Loading Live Food Pickup & Volunteer Tracking..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Active Food Pickup Tracking</h2>
           
          </div>
         
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
         
         
         
        </div>
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
          label: currentUser.name || 'Your Pickup Location'
        } : null}
        focusCoords={focusCoords}
        height="h-[480px]"
        onRefresh={() => fetchTracking(true)}
        isRefreshing={refreshing}
      />

      {/* Active Food Pickups Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-600" />
          <span>Your Active Food Rescue Pickups</span>
        </h3>

        {myPickups.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPickups.map((del, idx) => {
              const volLat = del.volunteer?.latitude;
              const volLng = del.volunteer?.longitude;
              const pickupLat = currentUser?.latitude || del.donation?.latitude || del.donor?.latitude;
              const pickupLng = currentUser?.longitude || del.donation?.longitude || del.donor?.longitude;
              const distanceKm = (volLat && volLng && pickupLat && pickupLng) ? calculateDistanceKm(volLat, volLng, pickupLat, pickupLng) : null;

              const isPickedUp = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(del.status);

              return (
                <div
                  key={del.assignment_id || idx}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {del.status?.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-slate-800 text-base mt-1.5">{del.donation?.title}</h4>
                      <p className="text-xs text-slate-500">Quantity: {del.donation?.quantity || 'Full batch'}</p>
                    </div>
                  </div>

                  {/* Visual Status Steps */}
                 

                
                  {/* Destination NGO */}
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700">Delivering to NGO: </span>
                      <span>{del.ngo?.name || 'Partner NGO'}</span>
                      {del.ngo?.address && <p className="text-[11px] text-slate-400">{del.ngo.address}</p>}
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
    </div>
  );
};

export default DonorTracking;
