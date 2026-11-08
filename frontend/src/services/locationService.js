
import api from './api';

export const locationService = {
  // Get role-based live tracking data
  // ADMIN, NGO, DONOR, VOLUNTEER
  getLiveFeed: async () => {
    try {
      const response = await api.get('/location/live-feed');
      return response;
    } catch (error) {
      console.error(
        'Live feed error:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Get all volunteer locations
  // ADMIN ONLY
  getVolunteersLocations: async () => {
    try {
      const response = await api.get('/location/volunteers');
      return response;
    } catch (error) {
      console.error(
        'Volunteer locations error:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Update authenticated user's GPS location
  // DONOR, NGO, VOLUNTEER
  updateLocation: async (latitude, longitude) => {
    try {
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new Error('Invalid GPS coordinates');
      }

      const response = await api.post('/location/update', {
        latitude,
        longitude
      });

      return response;
    } catch (error) {
      console.error(
        'Location update error:',
        error.response?.data || error.message
      );
      throw error;
    }
  }
};

export default locationService;
