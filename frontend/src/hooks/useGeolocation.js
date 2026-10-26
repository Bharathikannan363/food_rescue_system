```javascript
import { useState, useEffect, useCallback } from 'react';
import { volunteerService } from '../services/volunteerService';

export const useGeolocation = (isVolunteerActive = false) => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncToBackend = useCallback(
    (lat, lng) => {
      const token = sessionStorage.getItem('token');

      if (isVolunteerActive && token) {
        volunteerService.updateLocation(lat, lng).catch((err) => {
          console.warn('[Geolocation API Sync Error]', err);
        });
      }
    },
    [isVolunteerActive]
  );

  const handlePositionSuccess = useCallback(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      setLocation({ latitude, longitude, accuracy });
      setError(null);
      setLoading(false);

      syncToBackend(latitude, longitude);
    },
    [syncToBackend]
  );

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation API is not supported by your browser');
      setLoading(false);
      return;
    }

    setLoading(true);

    // Try high accuracy first.
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      (err) => {
        console.warn(
          'High accuracy geolocation failed; falling back to standard accuracy:',
          err.message
        );

        // Fall back to standard accuracy.
        navigator.geolocation.getCurrentPosition(
          handlePositionSuccess,
          (fallbackErr) => {
            setError(fallbackErr.message);
            setLoading(false);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 30000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000,
      }
    );
  }, [handlePositionSuccess]);

  useEffect(() => {
    requestPosition();

    if (!navigator.geolocation) return undefined;

    // Watch for continuous location updates.
    const watchId = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      (err) => {
        // Background watch errors are non-critical.
        console.debug('[Geolocation Watch Notice]', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [requestPosition, handlePositionSuccess]);

  return {
    location,
    error,
    loading,
    refreshLocation: requestPosition,
  };
};
```