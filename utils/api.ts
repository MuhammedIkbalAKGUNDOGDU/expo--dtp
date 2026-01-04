import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

// SensorData interface
export interface SensorData {
  heartRate: number | null;
  accelX: number | null;
  accelY: number | null;
  accelZ: number | null;
  movement: 'active' | 'idle' | 'fall' | 'unknown';
  timestamp: number;
  battery: number | null;
}

// Alarm interface
export interface Alarm {
  id: string;
  type: 'fall' | 'inactivity' | 'low_heart_rate' | 'high_heart_rate' | 'manual';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

// API Response types
export interface SensorDataResponse {
  data: SensorData | null;
  timestamp: number | null;
}

export interface AlarmsResponse {
  alarms: Alarm[];
  total: number;
  lastCheck: number;
}

export interface PostSensorDataResponse {
  success: boolean;
  timestamp: number;
  message?: string;
}

// API Helper Functions

/**
 * Backend'e sensör verisi ve alarmları gönder (Telefon 1)
 */
export const sendSensorDataToBackend = async (
  sensorData: SensorData | null,
  alarms: Alarm[]
): Promise<PostSensorDataResponse> => {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.SENSOR_DATA}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sensorData,
        alarms,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PostSensorDataResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Backend\'e veri gönderme hatası:', error);
    throw error;
  }
};

/**
 * Backend'den sensör verisi al (Telefon 2)
 */
export const getSensorDataFromBackend = async (): Promise<SensorDataResponse> => {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.SENSOR_DATA}`;
    console.log('📥 Backend\'den sensör verisi çekiliyor:', url);
    
    // Timeout için AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📡 Sensör verisi yanıt durumu:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data: SensorDataResponse = await response.json();
    console.log('✅ Sensör verisi alındı:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Backend\'den veri alma hatası:', error);
    console.error('❌ Hata detayı:', error?.message || error);
    throw error;
  }
};

/**
 * Backend'den alarmları al (Telefon 2)
 * @param since - Opsiyonel: Belirli bir zamandan sonraki alarmları al
 */
export const getAlarmsFromBackend = async (since?: number): Promise<AlarmsResponse> => {
  try {
    let url = `${API_BASE_URL}${API_ENDPOINTS.ALARMS}`;
    if (since) {
      url += `?since=${since}`;
    }
    console.log('📥 Backend\'den alarmlar çekiliyor:', url);
    
    // Timeout için AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📡 Alarmlar yanıt durumu:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data: AlarmsResponse = await response.json();
    console.log('✅ Alarmlar alındı:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Backend\'den alarm alma hatası:', error);
    console.error('❌ Hata detayı:', error?.message || error);
    throw error;
  }
};

/**
 * Backend sağlık kontrolü
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.HEALTH}`;
    console.log('🔍 ========================================');
    console.log('🔍 Backend sağlık kontrolü başlatılıyor...');
    console.log('🔍 URL:', url);
    console.log('🔍 ========================================');
    
    // Timeout için AbortController kullan
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📡 Backend yanıt durumu:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Backend yanıt hatası:', response.status, response.statusText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Backend yanıt:', JSON.stringify(data, null, 2));
    console.log('✅ Backend bağlantısı başarılı!');
    return data.status === 'ok';
  } catch (error: any) {
    console.error('❌ ========================================');
    console.error('❌ Backend sağlık kontrolü hatası!');
    console.error('❌ ========================================');
    console.error('❌ Hata tipi:', error?.name || 'Unknown');
    console.error('❌ Hata mesajı:', error?.message || error);
    console.error('❌ Backend URL:', `${API_BASE_URL}${API_ENDPOINTS.HEALTH}`);
    console.error('❌ ========================================');
    return false;
  }
};

