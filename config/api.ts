// Backend API Configuration
// Cloud deployment URL'i buraya eklenecek
// Geliştirme için: http://localhost:3000 (aynı WiFi'da)
// Production için: Cloud servis URL'i (örnek: https://expo-cdtp-backend.railway.app)

export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // Geliştirme
  : 'https://expo-cdtp-backend.railway.app';  // Production (deploy sonrası güncellenecek)

export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  SENSOR_DATA: '/api/sensor-data',
  ALARMS: '/api/alarms',
  STATUS: '/api/status',
};

