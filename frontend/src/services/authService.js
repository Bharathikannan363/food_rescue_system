
import api from './api';

export const authService = {
  getCaptcha: () => api.get('/auth/captcha'),
  verifyCaptcha: (data) => api.post('/auth/captcha/verify', data),
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me')
};
