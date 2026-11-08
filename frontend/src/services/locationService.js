import api from './api';

export const locationService = {
  getVolunteersLocations: () => api.get('/location/volunteers'),
  getLiveFeed: () => api.get('/location/live-feed'),
  updateLocation: (latitude, longitude) =>
    api.post('/location/update', { latitude, longitude })
};