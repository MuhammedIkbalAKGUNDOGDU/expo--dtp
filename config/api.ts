// Backend API Configuration
// Railway backend URL'i - Railway dashboard'dan alın (Settings > Domains veya Service URL)
// Örnek: https://expo-cdtp-backend-production.up.railway.app
// Railway dashboard'dan URL'i alıp aşağıdaki satıra yazın:
const RAILWAY_BACKEND_URL = 'https://ctdp-backend-production.up.railway.app';

// Her zaman Railway URL'ini kullan (production)
export const API_BASE_URL = RAILWAY_BACKEND_URL;

export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  SENSOR_DATA: '/api/sensor-data',
  ALARMS: '/api/alarms',
  STATUS: '/api/status',
};

