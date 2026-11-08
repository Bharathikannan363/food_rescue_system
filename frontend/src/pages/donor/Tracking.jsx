
import React, { useState, useEffect, useCallback } from 'react';
import { locationService } from '../../services/locationService';
import LiveMap from '../../components/LiveMap';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { calculateDistanceKm } from '../../utils/distance';
import { Truck, Phone, Building2, HeartHandshake } from 'lucide-react';

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

  const fetchTracking = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      }

      const res = await locationService.getLiveFeed();

      // api.js already unwraps response.data.
      // Therefore, use the returned response directly.
      if (!res || res.success === false) {
        throw new Error(
          res?.message || 'Unable to load live tracking information.'
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
      setError(err.message || 'Failed to load live tracking.');
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

  // Match only this donor's deliveries.
  const myPickups = feedData.active_deliveries.filter((delivery) => {
    const deliveryDonorId =
      delivery.donor?.id ??
      delivery.donor_id ??
      delivery.donation?.donor_id;

    const currentUserId = currentUser?.id;

    return (
      deliveryDonorId !== null &&
      deliveryDonorId !== undefined &&
      currentUserId !== null &&
      currentUserId !== undefined &&
      String(deliveryDonorId) === String(currentUserId)
    );
  });

  const userLocation = isValidCoordinate(
    currentUser?.latitude,
    currentUser?.longitude
  )
    ? {
        latitude: Number(currentUser.latitude),
        longitude: Number(currentUser.longitude),
        label: currentUser.name || 'Your Location'
      }
    : null;

  if (loading) {
    return <Loading text="Loading Live Food Pickup & Volunteer Tracking..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Active Food Pickup Tracking
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor volunteers and your active food pickups.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchTracking(true)}
          disabled={refreshing}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Tracking'}
        </button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          retry={() => fetchTracking(true)}
        />
      )}

      <LiveMap
        volunteers={feedData.volunteers}
        donors={feedData.donors}
        ngos={feedData.ngos}
        activeDeliveries={myPickups}
        userLocation={userLocation}
        focusCoords={focusCoords}
        height="h-[480px]"
        onRefresh={() => fetchTracking(true)}
        isRefreshing={refreshing}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-600" />
          Your Active Food Rescue Pickups
        </h3>

        {myPickups.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6" />
            </div>

            <p className="font-semibold text-slate-700">
              No active pickups found.
            </p>

            <p className="text-sm text-slate-500">
              Your active volunteer pickups will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPickups.map((delivery, index) => {
              const volunteer = delivery.volunteer;
              const donation = delivery.donation;
              const donor = delivery.donor;

              const volunteerHasLocation = isValidCoordinate(
                volunteer?.latitude,
                volunteer?.longitude
              );

              const pickupLatitude =
                donation?.latitude ?? donor?.latitude;

              const pickupLongitude =
                donation?.longitude ?? donor?.longitude;

              const pickupHasLocation = isValidCoordinate(
                pickupLatitude,
                pickupLongitude
              );

              const distanceKm =
                volunteerHasLocation && pickupHasLocation
                  ? calculateDistanceKm(
                      Number(volunteer.latitude),
                      Number(volunteer.longitude),
                      Number(pickupLatitude),
                      Number(pickupLongitude)
                    )
                  : null;

              return (
                <div
                  key={delivery.assignment_id || delivery.id || index}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {delivery.status?.replace(/_/g, ' ') || 'ACTIVE'}
                    </span>

                    <h4 className="font-bold text-slate-800 text-base mt-2">
                      {donation?.title || 'Food Donation'}
                    </h4>

                    <p className="text-xs text-slate-500">
                      Quantity: {donation?.quantity || 'Full batch'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />

                    <div>
                      <span className="font-semibold text-slate-700">
                        Delivering to NGO:{' '}
                      </span>

                      <span>{delivery.ngo?.name || 'Partner NGO'}</span>

                      {delivery.ngo?.address && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          {delivery.ngo.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">
                      Volunteer Location
                    </p>

                    {volunteerHasLocation ? (
                      <p>
                        {Number(volunteer.latitude).toFixed(5)},{' '}
                        {Number(volunteer.longitude).toFixed(5)}
                      </p>
                    ) : (
                      <p className="text-slate-400">
                        Volunteer location not available.
                      </p>
                    )}
                  </div>

                  {distanceKm !== null && (
                    <p className="text-xs text-emerald-700 font-semibold">
                      Distance to pickup: {distanceKm.toFixed(2)} km
                    </p>
                  )}

                  {volunteer?.phone && (
                    <a
                      href={`tel:${volunteer.phone}`}
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
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
    </div>
  );
};

export default DonorTracking;
