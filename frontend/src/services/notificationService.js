
import api from './api';

export const notificationService = {
  // Fetch all notifications for the logged-in user
  getNotifications: async () => {
    return await api.get('/notifications');
  },

  // Mark a notification as read
  markAsRead: async (id) => {
    if (!id) {
      throw new Error('Notification ID is required');
    }

    return await api.post(`/notifications/${id}/read`);
  },
};
