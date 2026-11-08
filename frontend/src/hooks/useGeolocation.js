
import {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';

import { locationService } from '../services/locationService';


const isValidCoordinate = (latitude, longitude) => {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};


export const useGeolocation = (isVolunteerActive = false) => {

  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const watchIdRef = useRef(null);
  const lastSentLocationRef = useRef(null);
  const pendingLocationRef = useRef(null);
  const isMountedRef = useRef(false);
  const isVolunteerActiveRef = useRef(isVolunteerActive);


  // Keep the latest permission flag available to async callbacks.
  useEffect(() => {
    isVolunteerActiveRef.current = isVolunteerActive;
  }, [isVolunteerActive]);


  // -------------------------------------------------------
  // SYNCHRONIZE GPS WITH BACKEND
  // -------------------------------------------------------

  const syncToBackend = useCallback(async (latitude, longitude) => {

    // Never synchronize GPS for non-volunteer users.
    if (!isVolunteerActiveRef.current) {
      return;
    }

    if (!isValidCoordinate(latitude, longitude)) {
      return;
    }

    const token = sessionStorage.getItem('token');

    if (!token) {
      if (isMountedRef.current) {
        setSyncError('Login required to synchronize GPS location.');
      }
      return;
    }

    const locationKey =
      `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

    // Skip an unchanged location.
    if (lastSentLocationRef.current === locationKey) {
      return;
    }

    // Keep the latest reading if a request is already running.
    if (pendingLocationRef.current) {
      pendingLocationRef.current = {
        latitude,
        longitude,
        locationKey
      };
      return;
    }

    pendingLocationRef.current = {
      latitude,
      longitude,
      locationKey
    };

    if (isMountedRef.current) {
      setSyncing(true);
      setSyncError(null);
    }

    try {

      while (pendingLocationRef.current) {

        const current = pendingLocationRef.current;

        pendingLocationRef.current = null;

        // Recheck role flag before every request.
        if (!isVolunteerActiveRef.current) {
          break;
        }

        if (lastSentLocationRef.current === current.locationKey) {
          continue;
        }

        const response = await locationService.updateLocation(
          current.latitude,
          current.longitude
        );

        if (!response || response.success === false) {
          throw new Error(
            response?.message ||
            'Backend GPS synchronization failed.'
          );
        }

        lastSentLocationRef.current = current.locationKey;

        if (isMountedRef.current) {
          setLastSyncedAt(new Date().toISOString());
          setSyncError(null);
        }
      }

    } catch (err) {

      console.error('[GPS Backend Sync Error]', err);

      pendingLocationRef.current = null;

      if (isMountedRef.current) {
        setSyncError(
          err.response?.data?.message ||
          err.message ||
          'Unable to synchronize GPS location.'
        );
      }

    } finally {

      pendingLocationRef.current = null;

      if (isMountedRef.current) {
        setSyncing(false);
      }

    }

  }, []);


  // -------------------------------------------------------
  // HANDLE SUCCESSFUL GPS READING
  // -------------------------------------------------------

  const handlePositionSuccess = useCallback((position) => {

    if (!isMountedRef.current) {
      return;
    }

    const {
      latitude,
      longitude,
      accuracy
    } = position.coords;

    if (!isValidCoordinate(latitude, longitude)) {
      setError('Browser returned invalid GPS coordinates.');
      setLoading(false);
      return;
    }

    setLocation({
      latitude,
      longitude,
      accuracy
    });

    setError(null);
    setLoading(false);

    // Backend synchronization is role-restricted.
    syncToBackend(latitude, longitude);

  }, [syncToBackend]);


  // -------------------------------------------------------
  // HANDLE GPS ERROR
  // -------------------------------------------------------

  const handlePositionError = useCallback((err) => {

    if (!isMountedRef.current) {
      return;
    }

    let message = 'Unable to retrieve your location.';

    switch (err.code) {

      case 1:
        message =
          'Location permission denied. Allow location access in your browser.';
        break;

      case 2:
        message =
          'Your current location is unavailable. Check your GPS or network.';
        break;

      case 3:
        message =
          'Location request timed out. Please try again.';
        break;

      default:
        message = err.message || message;
    }

    setError(message);
    setLoading(false);

  }, []);


  // -------------------------------------------------------
  // START CONTINUOUS GPS TRACKING
  // -------------------------------------------------------

  const startWatching = useCallback(() => {

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLoading(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(

      handlePositionSuccess,

      handlePositionError,

      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000
      }

    );

  }, [handlePositionSuccess, handlePositionError]);


  // -------------------------------------------------------
  // INITIALIZE AND CLEAN UP GPS WATCH
  // -------------------------------------------------------

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


  // -------------------------------------------------------
  // MANUALLY REFRESH GPS
  // -------------------------------------------------------

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
        timeout: 20000
      }

    );

  }, [handlePositionSuccess, handlePositionError]);


  // -------------------------------------------------------
  // RETURN GPS INFORMATION
  // -------------------------------------------------------

  return {
    location,
    error,
    loading,
    refreshLocation,
    syncError,
    syncing,
    lastSyncedAt
  };

};
