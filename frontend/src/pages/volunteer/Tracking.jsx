
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import LiveMap from '../../components/LiveMap';
import { useGeolocation } from '../../hooks/useGeolocation';
import { locationService } from '../../services/locationService';
import { volunteerService } from '../../services/volunteerService';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import { calculateDistanceKm, formatDistance } from '../../utils/distance';
import {
  Navigation,
  Truck,
  HeartHandshake,
  Building2,
  Phone,
  CheckCircle2,
  PackageCheck
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

const VolunteerTracking = () => {
  const {
    location,
    error: geoError,
    loading: geoLoading,
    refreshLocation
  } = useGeolocation(true);

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
  const [locationUpdateError, setLocationUpdateError] = useState('');

  const lastSentLocation = useRef(null);

  const fetchTracking = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      }

      const [feedRes, tasksRes] = await Promise.all([
        locationService.getLiveFeed(),
        volunteerService.getAvailableTasks()
      ]);

      if (!feedRes || feedRes.success === false) {
        throw new Error(
          feedRes?.message || 'Unable to load tracking information.'
        );
      }

      setFeedData({
        volunteers: Array.isArray(feedRes.volunteers)
          ? feedRes.volunteers : [],
        donors: Array.isArray(feedRes.donors)
          ? feedRes.donors : [],
        ngos: Array.isArray(feedRes.ngos)
          ? feedRes.ngos : [],
        active_deliveries: Array.isArray(feedRes.active_deliveries)
          ? feedRes.active_deliveries : [],
        current_user: feedRes.current_user || null
      });

      setAvailableTasks(
        Array.isArray(tasksRes?.tasks) ? tasksRes.tasks : []
      );

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load volunteer tracking.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load feed and tasks.
  useEffect(() => {
    fetchTracking();

    const interval = setInterval(() => {
      fetchTracking(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTracking]);

  const currentUser = feedData.current_user;

  // Identify this volunteer's mission using their ID.
  const myActiveMission = feedData.active_deliveries.find((delivery) => {
    const volunteerId =
      delivery.volunteer?.id ??
      delivery.volunteer_id;

    return (
      currentUser?.id !== null &&
      currentUser?.id !== undefined &&
      volunteerId !== null &&
      volunteerId !== undefined &&
      String(volunteerId) === String(currentUser.id)
    );
  });

  // Use actual browser GPS when available.
  const hasBrowserLocation = isValidCoordinate(
    location?.latitude,
    location?.longitude
  );

  const userLat = hasBrowserLocation
    ? Number(location.latitude)
    : currentUser?.latitude;

  const userLng = hasBrowserLocation
    ? Number(location.longitude)
    : currentUser?.longitude;

  const hasUserLocation = isValidCoordinate(userLat, userLng);

  // Send the volunteer's current location to the backend.
  useEffect(() => {
    if (!hasBrowserLocation) return;

    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);

    const locationKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

    if (lastSentLocation.current === locationKey) return;

    let cancelled = false;

    const sendLocation = async () => {
      try {
        await locationService.updateLocation(latitude, longitude);

        if (!cancelled) {
          lastSentLocation.current = locationKey;
          setLocationUpdateError('');
        }
      } catch (err) {
        if (!cancelled) {
          setLocationUpdateError(
            err.message || 'Unable to update volunteer location.'
          );
        }
      }
    };

    sendLocation();

    return () => {
      cancelled = true;
    };
  }, [location?.latitude, location?.longitude, hasBrowserLocation]);

  // Refresh GPS and server data.
  const handleRefresh = async () => {
    refreshLocation();
    await fetchTracking(true);
  };

  const handleUpdateStatus = async (nextStatus) => {
    if (!myActiveMission) return;

    try {
      setStatusUpdating(true);

      const res = await volunteerService.updateStatus(
        myActiveMission.assignment_id,
        nextStatus
      );

      if (!res || res.success === false) {
        throw new Error(res?.message || 'Status update failed.');
      }

      alert(`Status updated to ${nextStatus.replace(/_/g, ' ')}!`);
      await fetchTracking(true);
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleClaimTask = async (taskId) => {
    try {
      const res = await volunteerService.claimTask(taskId);

      if (!res || res.success === false) {
        throw new Error(res?.message || 'Unable to claim task.');
      }

      alert(res.message || 'Delivery task claimed!');
      await fetchTracking(true);
    } catch (err) {
      alert(err.message || 'Unable to claim task.');
    }
  };

  if (loading) {
    return <Loading text="Loading Volunteer GPS Tracking..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Volunteer GPS Tracker & Navigation
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Your current GPS location and active delivery information.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || geoLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          <Navigation className="w-4 h-4" />
          {refreshing ? 'Refreshing...' : 'Refresh GPS'}
        </button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          retry={() => fetchTracking(true)}
        />
      )}

      {geoError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          GPS warning: {geoError}
        </div>
      )}

      {locationUpdateError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          Location update failed: {locationUpdateError}
        </div>
      )}

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
        <p className="font-semibold text-slate-700">
          GPS Status
        </p>

        <p className="text-slate-500 mt-1">
          {hasBrowserLocation
            ? 'Current browser GPS location detected.'
            : 'Waiting for browser GPS location.'}
        </p>

        {hasUserLocation && (
          <p className="text-xs text-slate-500 mt-1">
            {Number(userLat).toFixed(6)}, {Number(userLng).toFixed(6)}
          </p>
        )}
      </div>

      {/* Live Map */}
      <LiveMap
        volunteers={feedData.volunteers}
        donors={feedData.donors}
        ngos={feedData.ngos}
        activeDeliveries={
          myActiveMission ? [myActiveMission] : []
        }
        userLocation={
          hasUserLocation
            ? {
                latitude: Number(userLat),
                longitude: Number(userLng),
                accuracy: location?.accuracy,
                label: 'You (Volunteer)'
              }
            : null
        }
        focusCoords={
          focusCoords ||
          (hasUserLocation
            ? [Number(userLat), Number(userLng)]
            : null)
        }
        height="h-[480px]"
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
      />

      {/* Active Mission */}
      {myActiveMission ? (
        <div className="bg-white p-5 rounded-2xl border-2 border-blue-500 shadow-md space-y-4">
          <h3 className="font-bold text-slate-800">
            Your Active Delivery Mission
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickup */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                Stop 1: Food Pickup
              </span>

              <p className="font-semibold text-slate-800">
                {myActiveMission.donor?.name || 'Donor'}
              </p>

              <p className="text-slate-600">
                {myActiveMission.donation?.pickup_address ||
                  myActiveMission.donor?.address}
              </p>

              {myActiveMission.donor?.phone && (
                <a
                  href={`tel:${myActiveMission.donor.phone}`}
                  className="inline-flex items-center gap-1 text-emerald-700 font-semibold pt-1"
                >
                  <Phone className="w-3 h-3" />
                  {myActiveMission.donor.phone}
                </a>
              )}

              {hasUserLocation &&
                isValidCoordinate(
                  myActiveMission.donation?.latitude,
                  myActiveMission.donation?.longitude
                ) && (
                  <p className="font-semibold text-emerald-700 pt-1">
                    {formatDistance(
                      calculateDistanceKm(
                        Number(userLat),
                        Number(userLng),
                        Number(myActiveMission.donation.latitude),
                        Number(myActiveMission.donation.longitude)
                      )
                    )} away
                  </p>
                )}
            </div>

            {/* NGO */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 text-xs">
              <span className="font-bold text-amber-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                Stop 2: NGO Delivery
              </span>

              <p className="font-semibold text-slate-800">
                {myActiveMission.ngo?.name || 'NGO'}
              </p>

              <p className="text-slate-600">
                {myActiveMission.ngo?.address}
              </p>

              {myActiveMission.ngo?.phone && (
                <a
                  href={`tel:${myActiveMission.ngo.phone}`}
                  className="inline-flex items-center gap-1 text-amber-700 font-semibold pt-1"
                >
                  <Phone className="w-3 h-3" />
                  {myActiveMission.ngo.phone}
                </a>
              )}

              {hasUserLocation &&
                isValidCoordinate(
                  myActiveMission.ngo?.latitude,
                  myActiveMission.ngo?.longitude
                ) && (
                  <p className="font-semibold text-amber-700 pt-1">
                    {formatDistance(
                      calculateDistanceKm(
                        Number(userLat),
                        Number(userLng),
                        Number(myActiveMission.ngo.latitude),
                        Number(myActiveMission.ngo.longitude)
                      )
                    )} away
                  </p>
                )}
            </div>
          </div>

          {/* Mission Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {myActiveMission.status === 'ACCEPTED' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('PICKED_UP')}
                disabled={statusUpdating}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                <PackageCheck className="w-4 h-4" />
                {statusUpdating ? 'Updating...' : 'I Have Picked Up Food'}
              </button>
            )}

            {myActiveMission.status === 'PICKED_UP' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY')}
                disabled={statusUpdating}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                {statusUpdating
                  ? 'Updating...'
                  : 'Start Delivery to NGO'}
              </button>
            )}

            {myActiveMission.status === 'OUT_FOR_DELIVERY' && (
              <Link
                to="/volunteer/assignments"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete & Upload Proof Photo
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {availableTasks.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                Open Food Rescue Tasks
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableTasks.map((task) => {
                  const pickupLat = task.donation?.latitude;
                  const pickupLng = task.donation?.longitude;

                  const hasPickupLocation = isValidCoordinate(
                    pickupLat,
                    pickupLng
                  );

                  const distance =
                    hasUserLocation && hasPickupLocation
                      ? calculateDistanceKm(
                          Number(userLat),
                          Number(userLng),
                          Number(pickupLat),
                          Number(pickupLng)
                        )
                      : null;

                  return (
                    <div
                      key={task.request_id || task.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-800 text-sm">
                          {task.donation?.title || task.title}
                        </p>

                        {distance !== null && (
                          <span className="font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded shrink-0">
                            {formatDistance(distance)}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-500 text-[11px]">
                        Pickup: {task.donation?.pickup_address ||
                          task.pickup_address}
                      </p>

                      <p className="text-slate-500 text-[11px]">
                        Dropoff: {task.ngo?.ngo_name || task.ngo_name}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handleClaimTask(task.request_id || task.id)
                        }
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs"
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
