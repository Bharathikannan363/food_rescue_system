
import React, { useState, useEffect, useCallback } from 'react';
import { locationService } from '../../services/locationService';
import LiveMap from '../../components/LiveMap';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { calculateDistanceKm, formatDistance } from '../../utils/distance';
import {
  Truck,
  Phone,
  Building2,
  HeartHandshake,
  Radio,
  RefreshCw,
  Navigation
} from 'lucide-react';

const isValidCoordinate = (latitude, longitude) => {
  if (
    latitude === null ||
    latitude === undefined ||
    latitude === '' ||
    longitude === null ||
    longitude === undefined ||
    longitude === ''
  ) {
    return false;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

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

  const fetchTracking = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      }

      // api.js already returns response.data directly.
      const res = await locationService.getLiveFeed();

      if (!res || res.success === false) {
        throw new Error(
          res?.message || 'Unable to load NGO tracking information.'
        );
      }

      setFeedData({
        volunteers: Array.isArray(res.volunteers) ? res.volunteers : [],
        donors: Array.isArray(res.donors) ? res.donors : [],
        ngos: Array.isArray(res.ngos) ? res.ngos : [],
        active_deliveries: Array.isArray(res.active_deliveries)
          ? res.active_deliveries
          : [],
        current_user: res.current_user || null
      });

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load NGO tracking.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTracking();

    const interval = setInterval(() => {
      fetchTracking(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTracking]);

  const currentUser = feedData.current_user;

  // Match deliveries belonging to this NGO.
  const myIncomingDeliveries = feedData.active_deliveries.filter(
    (delivery) => {
      const deliveryNgoId =
        delivery.ngo?.id ??
        delivery.ngo_id ??
        delivery.request?.ngo_id;

      const currentNgoId = currentUser?.id;

      return (
        deliveryNgoId !== null &&
        deliveryNgoId !== undefined &&
        currentNgoId !== null &&
        currentNgoId !== undefined &&
        String(deliveryNgoId) === String(currentNgoId)
      );
    }
  );

  const userLocation = isValidCoordinate(
    currentUser?.latitude,
    currentUser?.longitude
  )
    ? {
        latitude: Number(currentUser.latitude),
        longitude: Number(currentUser.longitude),
        label: currentUser.name || currentUser.ngo_name || 'Your NGO Center'
      }
    : null;

  if (loading) {
    return <Loading text="Loading NGO Live Delivery Tracking Feed..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-800">
              Live Delivery GPS Tracking
            </h2>

            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-semibold">
              <Radio className="w-3 h-3 animate-pulse text-amber-600" />
              Live Stream
            </span>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            Track volunteers delivering food to your NGO.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchTracking(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-sm disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              refreshing ? 'animate-spin text-amber-600' : ''
            }`}
          />
          <span>{refreshing ? 'Updating...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          retry={() => fetchTracking(true)}
        />
      )}

      {/* Live Map */}
      <LiveMap
        volunteers={feedData.volunteers}
        donors={feedData.donors}
        ngos={feedData.ngos}
        activeDeliveries={myIncomingDeliveries}
        userLocation={userLocation}
        focusCoords={focusCoords}
        height="h-[480px]"
        onRefresh={() => fetchTracking(true)}
        isRefreshing={refreshing}
      />

      {/* Incoming Deliveries */}
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

            <h4 className="font-bold text-slate-800 text-sm">
              No Active Deliveries In Transit
            </h4>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When a volunteer accepts a delivery assigned to your NGO,
              the volunteer's location will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myIncomingDeliveries.map((delivery, index) => {
              const volunteer = delivery.volunteer;
              const donation = delivery.donation;
              const donor = delivery.donor;
              const ngo = delivery.ngo;

              const volunteerHasLocation = isValidCoordinate(
                volunteer?.latitude,
                volunteer?.longitude
              );

              const ngoLatitude =
                currentUser?.latitude ?? ngo?.latitude;

              const ngoLongitude =
                currentUser?.longitude ?? ngo?.longitude;

              const ngoHasLocation = isValidCoordinate(
                ngoLatitude,
                ngoLongitude
              );

              const distanceKm =
                volunteerHasLocation && ngoHasLocation
                  ? calculateDistanceKm(
                      Number(volunteer.latitude),
                      Number(volunteer.longitude),
                      Number(ngoLatitude),
                      Number(ngoLongitude)
                    )
                  : null;

              return (
                <div
                  key={delivery.assignment_id || delivery.id || index}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {delivery.status?.replace(/_/g, ' ') || 'ACTIVE'}
                      </span>

                      <h4 className="font-bold text-slate-800 text-base mt-1.5">
                        {donation?.title || 'Food Donation'}
                      </h4>

                      <p className="text-xs text-slate-500">
                        Qty: {donation?.quantity || 'As stated'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (volunteerHasLocation) {
                          setFocusCoords([
                            Number(volunteer.latitude),
                            Number(volunteer.longitude)
                          ]);
                        }
                      }}
                      disabled={!volunteerHasLocation}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Locate
                    </button>
                  </div>

                  {/* Delivery Route Stops */}
                  <div className="space-y-2 border-t border-b border-slate-100 py-3 text-xs">
                    <div className="flex items-start gap-2 text-slate-600">
                      <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />

                      <div>
                        <p className="font-bold text-slate-800">
                          Pickup: {donor?.name || 'Food Donor'}
                        </p>

                        <p className="text-[11px] text-slate-500">
                          {donation?.pickup_address || donor?.address || 'Address unavailable'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600">
                      <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />

                      <div>
                        <p className="font-bold text-slate-800">
                          Destination: {ngo?.name || currentUser?.name || 'Your NGO'}
                        </p>

                        <p className="text-[11px] text-slate-500">
                          {ngo?.address || currentUser?.address || 'Address unavailable'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Volunteer Details */}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {volunteer?.name?.charAt(0) || 'V'}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-slate-800">
                          {volunteer?.name || 'Volunteer'}
                        </p>

                        <p className="text-[10px] text-slate-500">
                          {volunteer?.vehicle_type || 'Delivery Vehicle'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {distanceKm !== null ? (
                        <>
                          <p className="text-xs font-mono font-bold text-slate-800">
                            {formatDistance(distanceKm)}
                          </p>

                          <p className="text-[10px] text-slate-400">
                            to your hub
                          </p>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          GPS unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  {volunteer?.phone && (
                    <a
                      href={`tel:${volunteer.phone}`}
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call Volunteer ({volunteer.phone})
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Volunteer Fleet */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600" />
          <span>City Volunteer Fleet on Standby</span>
        </h3>

        <p className="text-xs text-slate-500">
          Volunteers currently broadcasting their location and available for food rescue operations.
        </p>

        {feedData.volunteers.length === 0 ? (
          <p className="text-xs text-slate-400">
            No volunteer locations are currently available.
          </p>
        ) : (
          <div className="space-y-2">
            {feedData.volunteers.map((volunteer, index) => {
              const hasLocation = isValidCoordinate(
                volunteer.latitude,
                volunteer.longitude
              );

              return (
                <div
                  key={volunteer.id || volunteer.volunteer_id || index}
                  className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {volunteer.full_name || volunteer.name || 'Volunteer'}
                    </p>

                    <p className="text-xs text-slate-400">
                      {hasLocation
                        ? 'Location available'
                        : 'Location unavailable'}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!hasLocation}
                    onClick={() =>
                      setFocusCoords([
                        Number(volunteer.latitude),
                        Number(volunteer.longitude)
                      ])
                    }
                    className="text-xs font-semibold text-blue-600 disabled:text-slate-300"
                  >
                    Locate
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NGOTracking;
