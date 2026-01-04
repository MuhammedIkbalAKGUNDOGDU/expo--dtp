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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SensorDataResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Backend\'den veri alma hatası:', error);
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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AlarmsResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Backend\'den alarm alma hatası:', error);
    throw error;
  }
};

/**
 * Backend sağlık kontrolü
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.HEALTH}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('❌ Backend sağlık kontrolü hatası:', error);
    return false;
  }
};

