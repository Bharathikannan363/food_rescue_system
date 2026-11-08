
import { useState, useEffect, useCallback, useRef } from 'react';
import { volunteerService } from '../services/volunteerService';

export const useGeolocation = (isVolunteerActive = false) => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const watchIdRef = useRef(null);
  const lastSentLocationRef = useRef(null);
  const isMountedRef = useRef(false);

  // Send the volunteer's latest GPS coordinates to the backend.
  const syncToBackend = useCallback(
    async (latitude, longitude) => {
      if (!isVolunteerActive) return;

      const token = sessionStorage.getItem('token');
      if (!token) return;

      const locationKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

      // Avoid sending the same coordinates repeatedly.
      if (lastSentLocationRef.current === locationKey) return;

      try {
        await volunteerService.updateLocation(latitude, longitude);
        lastSentLocationRef.current = locationKey;
      } catch (err) {
        console.error('[GPS Backend Sync Error]', err);
      }
    },
    [isVolunteerActive]
  );

  // Handle successful GPS readings.
  const handlePositionSuccess = useCallback(
    (position) => {
      if (!isMountedRef.current) return;

      const { latitude, longitude, accuracy } = position.coords;

      setLocation({
        latitude,
        longitude,
        accuracy,
      });

      setError(null);
      setLoading(false);

      syncToBackend(latitude, longitude);
    },
    [syncToBackend]
  );

  // Handle GPS errors.
  const handlePositionError = useCallback((err) => {
    if (!isMountedRef.current) return;

    let message = 'Unable to retrieve your location.';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location permission denied. Allow location access in your browser.';
        break;

      case err.POSITION_UNAVAILABLE:
        message = 'Your current location is unavailable. Check your GPS or network.';
        break;

      case err.TIMEOUT:
        message = 'Location request timed out. Please try again.';
        break;

      default:
        message = err.message || message;
    }

    setError(message);
    setLoading(false);
  }, []);

  // Start continuous GPS tracking.
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setLoading(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }, [handlePositionSuccess, handlePositionError]);

  // Start tracking when the hook is mounted.
  useEffect(() => {
    isMountedRef.current = true;
    startWatching();

    return () => {
      isMountedRef.current = false;

      if (
        watchIdRef.current !== null &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [startWatching]);

  // Manually request a fresh GPS reading.
  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  }, [handlePositionSuccess, handlePositionError]);

  return {
    location,
    error,
    loading,
    refreshLocation,
  };
};
