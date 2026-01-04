import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  NativeEventEmitter,
  NativeModules,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BleManager from 'react-native-ble-manager';
import * as Notifications from 'expo-notifications';
import * as DeviceInfo from 'expo-device';
import RemoteMonitoring from './screens/RemoteMonitoring';
import RemoteViewer from './screens/RemoteViewer';
import { sendSensorDataToBackend, checkBackendHealth } from './utils/api';
import { API_BASE_URL } from './config/api';

// Bildirim handler'ı ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface BluetoothDevice {
  id: string;
  name: string;
  rssi: number;
  advertising: any;
}

// Sensör verileri
interface SensorData {
  heartRate: number | null;      // BPM
  accelX: number | null;          // m/s²
  accelY: number | null;
  accelZ: number | null;
  movement: 'active' | 'idle' | 'fall' | 'unknown';
  timestamp: number;
  battery: number | null;         // %
}

// Alarm tipleri
type AlarmType = 
  | 'fall'              // Düşme tespiti
  | 'inactivity'        // Uzun süre hareketsizlik
  | 'low_heart_rate'    // Düşük nabız (<40)
  | 'high_heart_rate'   // Yüksek nabız (>120)
  | 'manual';           // Manuel alarm

// Alarm verisi
interface Alarm {
  id: string;
  type: AlarmType;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

// Eşik değerleri
interface Thresholds {
  minHeartRate: number;      // 40
  maxHeartRate: number;      // 120
  inactivityMinutes: number; // 5
  fallThreshold: number;     // 2.5g
}

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [receivedData, setReceivedData] = useState<string[]>([]);
  const [bleAvailable, setBleAvailable] = useState(false);
  const [bleEnabled, setBleEnabled] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'remote'>('home'); // Sayfa yönetimi
  const [sendDataText, setSendDataText] = useState(''); // ESP32'ye gönderilecek veri
  const [sentData, setSentData] = useState<string[]>([]); // Gönderilen veriler listesi
  const [phoneMode, setPhoneMode] = useState<'phone1' | 'phone2'>('phone1'); // Telefon modu: phone1 = veri gönderen, phone2 = veri alan
  const [backendConnected, setBackendConnected] = useState(false); // Backend bağlantı durumu
  
  // Yeni state'ler - Güvenlik izleme sistemi
  const [sensorData, setSensorData] = useState<SensorData>({
    heartRate: null,
    accelX: null,
    accelY: null,
    accelZ: null,
    movement: 'unknown',
    timestamp: Date.now(),
    battery: null,
  });
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [thresholds, setThresholds] = useState<Thresholds>({
    minHeartRate: 40,
    maxHeartRate: 120,
    inactivityMinutes: 5,
    fallThreshold: 2.5,
  });
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  
  const devicesRef = useRef<BluetoothDevice[]>([]); // State güncellemesi için ref
  const lastSentTimestamp = useRef<number>(0); // Son gönderilen veri zamanı (debounce için)

  useEffect(() => {
    // İzinleri kontrol et ve iste
    requestPermissions();

    // Bildirim izinlerini kontrol et
    registerForPushNotificationsAsync();

    // BleManager'ı başlat
    const initBle = async () => {
      try {
        // Önce BleManager'ı başlat
        await BleManager.start({ showAlert: false });
        console.log('BleManager başlatıldı');
        
        // Bluetooth'u aç
        await BleManager.enableBluetooth();
        console.log('Bluetooth açık');
        setBleEnabled(true);
        setBleAvailable(true);
      } catch (error) {
        console.error('Bluetooth başlatma hatası:', error);
        setBleAvailable(false);
        Alert.alert(
          'Hata',
          'Bluetooth modülü yüklenemedi. Lütfen development build kullanın. Expo Go desteklenmiyor.'
        );
      }
    };

    initBle();

    // Event listener'ları ayarla - react-native-ble-manager için doğru yöntem
    let bleManagerEmitter: NativeEventEmitter;
    
    try {
      // react-native-ble-manager için NativeEventEmitter
      // ÖNEMLİ: NativeModules.BleManager modülünü kullan
      const BleManagerModule = NativeModules.BleManager;
      if (BleManagerModule) {
        bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
        console.log('✓ EventEmitter oluşturuldu (BleManager modülü ile)');
        console.log('BleManager modülü:', BleManagerModule);
      } else {
        console.warn('BleManager modülü bulunamadı, fallback kullanılıyor');
        bleManagerEmitter = new NativeEventEmitter();
      }
    } catch (error) {
      console.error('EventEmitter oluşturma hatası:', error);
      bleManagerEmitter = new NativeEventEmitter();
    }
    
    // Cihaz bulunduğunda event listener
    // react-native-ble-manager event isimleri: 'BleManagerDiscoverPeripheral'
    const discoverPeripheralListener = bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      (data: any) => {
        console.log('🔵 === CİHAZ BULUNDU EVENT TETİKLENDİ ===');
        console.log('Ham veri:', data);
        console.log('Veri tipi:', typeof data);
        console.log('Veri keys:', Object.keys(data || {}));
        
        // Veriyi BluetoothDevice formatına çevir
        const device: BluetoothDevice = {
          id: data.id || data.peripheral || '',
          name: data.name || data.advertising?.localName || 'İsimsiz',
          rssi: data.rssi || 0,
          advertising: data.advertising || {},
        };
        
        console.log('İşlenmiş cihaz:', device);
        console.log('Cihaz ID:', device.id);
        console.log('Cihaz İsim:', device.name);
        console.log('Cihaz RSSI:', device.rssi);
        console.log('========================================');
        
        if (device && device.id) {
          console.log('Cihaz verisi işleniyor...');
          setDevices((prevDevices) => {
            const exists = prevDevices.find((d) => d.id === device.id);
            if (!exists) {
              console.log('✅ Yeni cihaz listeye eklendi:', device.name || device.id);
              const newDevices = [...prevDevices, device];
              devicesRef.current = newDevices; // Ref'i güncelle
              console.log('📊 Toplam cihaz sayısı:', newDevices.length);
              console.log('🔄 Cihaz listesi güncellendi, UI yenilenecek');
              return newDevices;
            } else {
              console.log('⚠️ Cihaz zaten listede:', device.id);
            }
            return prevDevices;
          });
        } else {
          console.warn('❌ Geçersiz cihaz verisi - ID yok:', data);
        }
      }
    );
    
    console.log('✅ Event listener kuruldu: BleManagerDiscoverPeripheral');
    console.log('Event listener aktif, cihazlar bekleniyor...');

    const stopScanListener = bleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        console.log('Tarama durdu');
        setIsScanning(false);
      }
    );

    const connectListener = bleManagerEmitter.addListener(
      'BleManagerConnectPeripheral',
      (data: { peripheral: string }) => {
        console.log('🔵 ========================================');
        console.log('🔵 === ESP32 BAĞLANTISI KURULDU! ===');
        console.log('🔵 ========================================');
        console.log('Cihaz ID:', data.peripheral);
        const deviceName = devicesRef.current.find(d => d.id === data.peripheral)?.name || 'Bilinmeyen';
        console.log('Cihaz İsim:', deviceName);
        console.log('Bağlantı zamanı:', new Date().toLocaleTimeString());
        console.log('========================================');
        
        setConnectedDevice(data.peripheral);
        Alert.alert('✅ Başarılı', `${deviceName} bağlandı!`);
        
        // Servisleri keşfet ve notification başlat
        startNotification(data.peripheral);
      }
    );

    const disconnectListener = bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      (data: { peripheral: string }) => {
        console.log('🔴 ========================================');
        console.log('🔴 === ESP32 BAĞLANTISI KESİLDİ! ===');
        console.log('🔴 ========================================');
        console.log('Cihaz ID:', data.peripheral);
        console.log('Bağlantı kesilme zamanı:', new Date().toLocaleTimeString());
        console.log('========================================');
        
        // Periyodik okuma interval'lerini durdur
        if (typeof window !== 'undefined' && (window as any).__readIntervals) {
          const intervals = (window as any).__readIntervals;
          if (intervals[data.peripheral]) {
            console.log('🔄 Periyodik okuma interval\'i durduruluyor...');
            intervals[data.peripheral].stop();
          }
        }
        
        setConnectedDevice(null);
        setReceivedData([]);
        setSentData([]);
        setSendDataText('');
        // Sensör verilerini sıfırla
        setSensorData({
          heartRate: null,
          accelX: null,
          accelY: null,
          accelZ: null,
          movement: 'unknown',
          timestamp: Date.now(),
          battery: null,
        });
        Alert.alert('Bilgi', 'Cihaz bağlantısı kesildi');
      }
    );

    const updateValueListener = bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      (data: { value: number[]; peripheral: string; characteristic: string; service: string }) => {
        console.log('📥 ========================================');
        console.log('📥 === YENİ VERİ ALINDI! (EVENT) ===');
        console.log('📥 ========================================');
        console.log('Cihaz ID:', data.peripheral);
        console.log('Servis UUID:', data.service);
        console.log('Karakteristik UUID:', data.characteristic);
        console.log('Ham veri (byte array):', data.value);
        console.log('Veri uzunluğu:', data.value?.length || 0);
        
        try {
          // Byte array'i string'e çevir
          const bytes = data.value;
          let decodedData = '';
          for (let i = 0; i < bytes.length; i++) {
            decodedData += String.fromCharCode(bytes[i]);
          }
          
          console.log('Decode edilmiş veri:', decodedData);
          console.log('Zaman:', new Date().toLocaleTimeString());
          console.log('========================================');
          
          // State'e ekle (ekranda görünecek)
          setReceivedData((prev) => {
            const newData = [decodedData, ...prev];
            console.log('📊 Toplam alınan veri sayısı:', newData.length);
            console.log('✅ Veri ekrana eklendi');
            return newData;
          });
          
          // Sensör verilerini parse et
          const parsedData = parseSensorData(decodedData);
          if (parsedData) {
            setSensorData(parsedData);
            console.log('📊 Sensör verileri güncellendi:', parsedData);
            
            // Alarm tespiti yap
            const newAlarms = detectAlarms(parsedData);
            if (newAlarms.length > 0) {
              setAlarms((prev) => [...newAlarms, ...prev]);
              console.log('🚨 Yeni alarmlar tespit edildi:', newAlarms);
              
              // Her alarm için bildirim gönder
              newAlarms.forEach((alarm) => {
                sendNotification(
                  '🚨 ACİL DURUM',
                  alarm.message
                );
              });
            }
          }
          
          console.log('🔔 İşlem tamamlandı');
        } catch (error) {
          console.error('❌ Veri decode hatası:', error);
          // Hata olsa bile raw data'yı göster
          const errorData = `Hata: ${error}`;
          setReceivedData((prev) => [errorData, ...prev]);
        }
      }
    );
    
    console.log('✅ Event listener kuruldu: BleManagerDidUpdateValueForCharacteristic');

    return () => {
      discoverPeripheralListener.remove();
      stopScanListener.remove();
      connectListener.remove();
      disconnectListener.remove();
      updateValueListener.remove();
    };
  }, []);

  // Backend bağlantı kontrolü (uygulama açıldığında ve periyodik)
  useEffect(() => {
    if (phoneMode !== 'phone1') {
      return;
    }

    // İlk kontrol
    const checkConnection = async () => {
      try {
        console.log('🔍 Backend bağlantı kontrolü başlatılıyor...');
        const isHealthy = await checkBackendHealth();
        setBackendConnected(isHealthy);
        if (isHealthy) {
          console.log('✅ Backend bağlantısı başarılı');
        } else {
          console.log('❌ Backend bağlantısı başarısız');
        }
      } catch (error) {
        console.error('❌ Backend bağlantı kontrolü hatası:', error);
        setBackendConnected(false);
      }
    };

    checkConnection();

    // Her 10 saniyede bir kontrol et
    const interval = setInterval(() => {
      checkConnection();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [phoneMode]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        if (
          granted['android.permission.BLUETOOTH_SCAN'] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted['android.permission.BLUETOOTH_CONNECT'] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert('İzin Gerekli', 'Bluetooth izinleri gerekli');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const registerForPushNotificationsAsync = async () => {
    if (!DeviceInfo.isDevice) {
      Alert.alert('Uyarı', 'Bildirimler sadece fiziksel cihazlarda çalışır');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('İzin Gerekli', 'Bildirim izinleri gerekli');
      return;
    }
  };

  // ESP32'den gelen veriyi parse et
  const parseSensorData = (data: string): SensorData | null => {
    try {
      // JSON formatında veri geliyorsa
      if (data.startsWith('{')) {
        const parsed = JSON.parse(data);
        return {
          heartRate: parsed.heartRate || null,
          accelX: parsed.accelX || null,
          accelY: parsed.accelY || null,
          accelZ: parsed.accelZ || null,
          movement: parsed.movement || 'unknown',
          timestamp: parsed.timestamp || Date.now(),
          battery: parsed.battery || null,
        };
      }
      
      // Basit format: "ESP32'den veri: X saniye" gibi
      // Şimdilik basit parse, sonra ESP32 kodunu güncelleyeceğiz
      const heartRateMatch = data.match(/HR[:\s]+(\d+)/i);
      const heartRate = heartRateMatch ? parseInt(heartRateMatch[1]) : null;
      
      return {
        heartRate,
        accelX: null,
        accelY: null,
        accelZ: null,
        movement: 'active',
        timestamp: Date.now(),
        battery: null,
      };
    } catch (error) {
      console.error('Veri parse hatası:', error);
      return null;
    }
  };

  // Alarm tespit fonksiyonu
  const detectAlarms = (data: SensorData): Alarm[] => {
    const newAlarms: Alarm[] = [];
    const now = Date.now();

    // 1. Düşme tespiti
    if (data.movement === 'fall') {
      newAlarms.push({
        id: `fall_${now}`,
        type: 'fall',
        message: 'Düşme tespit edildi! Acil müdahale gerekebilir.',
        timestamp: now,
        acknowledged: false,
      });
    }

    // 2. Anormal nabız tespiti
    if (data.heartRate !== null) {
      if (data.heartRate < thresholds.minHeartRate) {
        newAlarms.push({
          id: `low_hr_${now}`,
          type: 'low_heart_rate',
          message: `Düşük nabız tespit edildi: ${data.heartRate} BPM (Eşik: ${thresholds.minHeartRate} BPM)`,
          timestamp: now,
          acknowledged: false,
        });
      } else if (data.heartRate > thresholds.maxHeartRate) {
        newAlarms.push({
          id: `high_hr_${now}`,
          type: 'high_heart_rate',
          message: `Yüksek nabız tespit edildi: ${data.heartRate} BPM (Eşik: ${thresholds.maxHeartRate} BPM)`,
          timestamp: now,
          acknowledged: false,
        });
      }
    }

    // 3. Hareketsizlik tespiti (timer ile kontrol edilecek)
    if (data.movement === 'idle') {
      const inactivityDuration = (now - lastActivityTime) / 1000 / 60; // dakika
      if (inactivityDuration >= thresholds.inactivityMinutes) {
        newAlarms.push({
          id: `inactivity_${now}`,
          type: 'inactivity',
          message: `Uzun süre hareketsizlik tespit edildi: ${Math.round(inactivityDuration)} dakika`,
          timestamp: now,
          acknowledged: false,
        });
      }
    } else if (data.movement === 'active') {
      setLastActivityTime(now);
    }

    return newAlarms;
  };

  // Manuel alarm gönder
  const sendManualAlarm = async () => {
    const alarm: Alarm = {
      id: `manual_${Date.now()}`,
      type: 'manual',
      message: 'Manuel acil durum çağrısı gönderildi!',
      timestamp: Date.now(),
      acknowledged: false,
    };

    setAlarms((prev) => [alarm, ...prev]);
    
    // Bildirim gönder
    await sendNotification(
      '🚨 ACİL DURUM',
      'Manuel acil durum çağrısı gönderildi!'
    );

    // ESP32'ye alarm sinyali gönder
    if (connectedDevice) {
      try {
        const ESP32_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
        const ESP32_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
        const alarmData = JSON.stringify({ type: 'manual_alarm', timestamp: Date.now() });
        const dataBytes: number[] = [];
        for (let i = 0; i < alarmData.length; i++) {
          dataBytes.push(alarmData.charCodeAt(i));
        }
        await BleManager.write(connectedDevice, ESP32_SERVICE_UUID, ESP32_CHARACTERISTIC_UUID, dataBytes);
        console.log('✅ Manuel alarm ESP32\'ye gönderildi');
      } catch (error) {
        console.error('❌ Manuel alarm gönderme hatası:', error);
      }
    }

    Alert.alert('✅ Başarılı', 'Acil durum çağrısı gönderildi!');
  };

  const sendNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: true,
      },
      trigger: null, // Hemen gönder
    });
  };

  // Backend'e mock veri gönder (test için)
  const sendMockDataToBackend = async () => {
    try {
      console.log('🧪 Mock veri backend\'e gönderiliyor...');
      
      // Mock sensör verisi oluştur
      const mockSensorData: SensorData = {
        heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 arası
        accelX: parseFloat((Math.random() * 2 - 1).toFixed(2)), // -1 ile 1 arası
        accelY: parseFloat((Math.random() * 2 - 1).toFixed(2)),
        accelZ: parseFloat((9.8 + (Math.random() * 0.4 - 0.2)).toFixed(2)), // 9.6-10.0 arası
        movement: Math.random() > 0.7 ? 'fall' : 'active',
        timestamp: Date.now(),
        battery: Math.floor(Math.random() * 30) + 70, // 70-100 arası
      };

      // Mock alarm oluştur (bazen)
      const mockAlarms: Alarm[] = [];
      if (Math.random() > 0.5) {
        mockAlarms.push({
          id: `mock_${Date.now()}`,
          type: Math.random() > 0.5 ? 'fall' : 'high_heart_rate',
          message: Math.random() > 0.5 
            ? 'Test: Düşme tespit edildi!' 
            : 'Test: Yüksek kalp atışı tespit edildi!',
          timestamp: Date.now(),
          acknowledged: false,
        });
      }

      // Backend'e gönder
      const response = await sendSensorDataToBackend(mockSensorData, mockAlarms);
      
      console.log('✅ Mock veri backend\'e gönderildi:', response);
      setBackendConnected(true);
      
      // Sensör verilerini ekranda göster
      setSensorData(mockSensorData);
      if (mockAlarms.length > 0) {
        setAlarms((prev) => [...mockAlarms, ...prev]);
      }
      
      Alert.alert(
        '✅ Başarılı', 
        `Mock veri backend'e gönderildi!\n\nKalp Atışı: ${mockSensorData.heartRate} BPM\nHareket: ${mockSensorData.movement}\n${mockAlarms.length > 0 ? `Alarm: ${mockAlarms[0].message}` : 'Alarm yok'}`
      );
    } catch (error: any) {
      console.error('❌ Mock veri gönderme hatası:', error);
      setBackendConnected(false);
      Alert.alert(
        '❌ Hata', 
        `Backend'e veri gönderilemedi:\n${error?.message || error}\n\nBackend URL'ini ve internet bağlantısını kontrol edin.`
      );
    }
  };

  const startScan = async () => {
    if (isScanning || !bleAvailable || !bleEnabled) {
      Alert.alert('Uyarı', 'Bluetooth açık değil veya hazır değil');
      return;
    }

    try {
      // Bluetooth state kontrolü
      const state = await BleManager.checkState();
      console.log('Bluetooth durumu:', state);
      
      if (state !== 'on') {
        Alert.alert('Uyarı', 'Lütfen Bluetooth\'u açın');
        return;
      }

      setIsScanning(true);
      setDevices([]);
      
      console.log('Tarama başlatılıyor...');
      console.log('Not: Cihazların yayın (advertising) yapması gerekir');
      console.log('ESP32\'nin açık ve yakında olduğundan emin olun');
      
      // react-native-ble-manager scan: tüm cihazları tara
      // scan() - parametresiz, tüm cihazları tarar
      try {
        console.log('Scan() fonksiyonu çağrılıyor...');
        BleManager.scan();
        console.log('✓ Scan() fonksiyonu başarıyla çağrıldı');
        console.log('Event listener aktif, cihazlar dinleniyor...');
        console.log('BleManager modülü kontrol:', NativeModules.BleManager ? 'Mevcut ✓' : 'Yok ✗');
      } catch (scanError) {
        console.error('❌ Scan() hatası:', scanError);
        Alert.alert('Hata', `Tarama başlatılamadı: ${scanError}`);
        throw scanError;
      }
      
      console.log('Tarama başlatıldı, 10 saniye sürecek...');
      console.log('Yakındaki BLE cihazları aranıyor...');
      console.log('⚠️ Eğer cihaz görünmüyorsa, event listener çalışmıyor olabilir');
      
      // Alternatif: getDiscoveredPeripherals() ile periyodik kontrol
      // Event listener çalışmıyorsa bu yöntem kullanılabilir
      const checkInterval = setInterval(async () => {
        try {
          const discovered = await BleManager.getDiscoveredPeripherals();
          console.log('getDiscoveredPeripherals() sonucu:', discovered);
          if (discovered && discovered.length > 0) {
            console.log('✅ getDiscoveredPeripherals ile cihazlar bulundu:', discovered.length);
            const formattedDevices: BluetoothDevice[] = discovered.map((p: any) => ({
              id: p.id || p.peripheral || '',
              name: p.name || p.advertising?.localName || p.advertising?.name || 'İsimsiz',
              rssi: p.rssi || 0,
              advertising: p.advertising || {},
            }));
            // State'i güncelle - önceki cihazları koru, yeni olanları ekle
            setDevices((prevDevices) => {
              const mergedDevices = [...prevDevices];
              formattedDevices.forEach(newDevice => {
                const exists = mergedDevices.find(d => d.id === newDevice.id);
                if (!exists && newDevice.id) {
                  mergedDevices.push(newDevice);
                }
              });
              devicesRef.current = mergedDevices;
              return mergedDevices;
            });
          }
        } catch (error) {
          console.error('getDiscoveredPeripherals hatası:', error);
        }
      }, 2000); // Her 2 saniyede bir kontrol et
      
      // 10 saniye sonra otomatik durdur
      setTimeout(async () => {
        clearInterval(checkInterval); // Interval'i temizle
        console.log('10 saniye doldu, tarama durduruluyor...');
        await stopScan();
        // State güncellemesi tamamlanana kadar bekle
        setTimeout(() => {
          const currentDeviceCount = devicesRef.current.length;
          console.log('Bulunan cihaz sayısı (ref):', currentDeviceCount);
          console.log('Bulunan cihaz sayısı (state):', devices.length);
          console.log('Bulunan cihazlar:', devicesRef.current.map(d => d.name || d.id));
          
          if (currentDeviceCount === 0) {
            Alert.alert(
              'Bilgi', 
              'Cihaz bulunamadı.\n\n' +
              'Kontrol edin:\n' +
              '1. ESP32 açık ve yayın yapıyor mu?\n' +
              '2. Konum servisi açık mı? (Android)\n' +
              '3. İzinler verildi mi?\n' +
              '4. ESP32 yakında mı? (10-20 cm)\n\n' +
              'Event listener çalışmıyor olabilir, getDiscoveredPeripherals() denendi.'
            );
          } else {
            console.log('✅ Cihazlar bulundu!');
          }
        }, 500);
      }, 10000);
    } catch (error) {
      console.error('Tarama hatası:', error);
      setIsScanning(false);
      Alert.alert('Hata', `Cihaz taraması başlatılamadı: ${error}`);
    }
  };

  const stopScan = async () => {
    try {
      await BleManager.stopScan();
      setIsScanning(false);
    } catch (error) {
      console.error('Tarama durdurma hatası:', error);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      console.log('🔵 ========================================');
      console.log('🔵 === ESP32 BAĞLANTISI BAŞLATILIYOR ===');
      console.log('🔵 ========================================');
      console.log('Cihaz ID:', device.id);
      console.log('Cihaz İsim:', device.name || 'İsimsiz');
      console.log('RSSI:', device.rssi);
      console.log('Bağlantı zamanı:', new Date().toLocaleTimeString());
      
      stopScan();
      
      console.log('Bağlantı kuruluyor...');
      await BleManager.connect(device.id);
      console.log('✓ BleManager.connect() başarılı');
      
      setConnectedDevice(device.id);
      console.log('✓ State güncellendi: connectedDevice =', device.id);
      
      // Servisleri keşfet
      console.log('Servisler keşfediliyor...');
      await BleManager.retrieveServices(device.id);
      console.log('✓ Servisler keşfedildi');
      
      console.log('========================================');
      console.log('✅ ESP32 BAĞLANTISI KURULDU!');
      console.log('========================================');
      
      Alert.alert('✅ Başarılı', `${device.name || 'Cihaz'} bağlandı!`);
      
      // Notification başlat
      startNotification(device.id);
    } catch (error) {
      console.error('❌ ========================================');
      console.error('❌ === BAĞLANTI HATASI ===');
      console.error('❌ ========================================');
      console.error('Hata:', error);
      console.error('Cihaz ID:', device.id);
      console.error('========================================');
      Alert.alert('Hata', `Cihaza bağlanılamadı: ${error}`);
    }
  };

  // UUID ile direkt bağlanma (kısa scan ile)
  const connectByUUID = async () => {
    // ESP32'nin servis UUID'si (ESP32 kodundan)
    const ESP32_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
    const ESP32_DEVICE_NAME = 'ESP32-Test-Cihazi';
    
    try {
      if (!bleAvailable || !bleEnabled) {
        Alert.alert('Uyarı', 'Bluetooth hazır değil');
        return;
      }

      console.log('UUID ile bağlanma deneniyor...');
      console.log('Servis UUID:', ESP32_SERVICE_UUID);
      
      // Kısa bir tarama yap (sadece ESP32'yi bulmak için)
      setIsScanning(true);
      setDevices([]);
      
      // Servis UUID'sine göre filtreli tarama
      // Not: react-native-ble-manager scan() parametresiz veya service UUID array'i alır
      // Filtreli tarama için önce normal scan yapıp sonra filtreleriz
      BleManager.scan();
      
      console.log('Filtreli tarama başlatıldı (5 saniye)...');
      
      // 5 saniye bekle ve ESP32'yi bul
      setTimeout(async () => {
        await BleManager.stopScan();
        setIsScanning(false);
        
        console.log('Tarama tamamlandı, bulunan cihaz sayısı:', devices.length);
        
        // ESP32'yi bul (isim veya ID'ye göre)
        const esp32Device = devices.find(d => 
          d.name === ESP32_DEVICE_NAME || 
          d.name?.toLowerCase().includes('esp32')
        );
        
        if (esp32Device) {
          console.log('ESP32 bulundu:', esp32Device.name || esp32Device.id);
          console.log('Bağlanılıyor...');
          await connectToDevice(esp32Device);
        } else {
          console.log('ESP32 bulunamadı');
          Alert.alert(
            'ESP32 Bulunamadı', 
            'Lütfen ESP32\'nin açık ve yakında olduğundan emin olun.\n\n' +
            'Servis UUID: ' + ESP32_SERVICE_UUID
          );
        }
      }, 5000);
      
    } catch (error) {
      console.error('UUID bağlantı hatası:', error);
      Alert.alert('Hata', `UUID ile bağlanılamadı: ${error}`);
      setIsScanning(false);
    }
  };

  const startNotification = async (peripheralId: string) => {
    try {
      console.log('🔔 ========================================');
      console.log('🔔 === NOTIFICATION BAŞLATILIYOR ===');
      console.log('🔔 ========================================');
      console.log('Cihaz ID:', peripheralId);
      
      // ESP32'nin servis ve karakteristik UUID'leri
      const ESP32_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
      const ESP32_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
      
      console.log('Servis UUID:', ESP32_SERVICE_UUID);
      console.log('Karakteristik UUID:', ESP32_CHARACTERISTIC_UUID);
      
      try {
        console.log('Notification başlatılıyor...');
        await BleManager.startNotification(peripheralId, ESP32_SERVICE_UUID, ESP32_CHARACTERISTIC_UUID);
        console.log('✅ Notification başlatıldı!');
        console.log('📡 Veri dinleniyor, ESP32\'den veri geldiğinde görünecek...');
        console.log('========================================');
        
        // Alternatif: Event listener çalışmıyorsa periyodik olarak read yap
        // Her 2 saniyede bir veriyi oku (ESP32 her 2 saniyede bir gönderiyor)
        console.log('🔄 Periyodik veri okuma başlatılıyor...');
        console.log('🔄 Her 2 saniyede bir veri okunacak');
        
        let isReading = true; // Okuma durumu kontrolü
        const targetPeripheralId = peripheralId; // Closure için sakla
        
        const readInterval = setInterval(async () => {
          // Basit kontrol: sadece isReading flag'ini kontrol et
          if (!isReading) {
            console.log('🔄 Periyodik okuma durduruldu (isReading = false)');
            clearInterval(readInterval);
            return;
          }
          
          // Bağlantı durumunu kontrol et (her okuma öncesi)
          try {
            const isConnected = await BleManager.isPeripheralConnected(targetPeripheralId);
            if (!isConnected) {
              console.log('🔄 Bağlantı kesildi tespit edildi, periyodik okuma durduruluyor');
              isReading = false;
              clearInterval(readInterval);
              if (typeof window !== 'undefined' && (window as any).__readIntervals) {
                delete (window as any).__readIntervals[targetPeripheralId];
              }
              setConnectedDevice((current) => {
                if (current === targetPeripheralId) {
                  return null;
                }
                return current;
              });
              return;
            }
          } catch (checkError) {
            // Bağlantı kontrolü başarısız, interval'i durdur
            console.log('🔄 Bağlantı kontrolü başarısız, periyodik okuma durduruluyor');
            isReading = false;
            clearInterval(readInterval);
            if (typeof window !== 'undefined' && (window as any).__readIntervals) {
              delete (window as any).__readIntervals[targetPeripheralId];
            }
            return;
          }
          
          try {
            console.log('📖 ========================================');
            console.log('📖 === PERİYODİK VERİ OKUMA ===');
            console.log('📖 ========================================');
            console.log('📖 Cihaz ID:', targetPeripheralId);
            console.log('📖 Servis UUID:', ESP32_SERVICE_UUID);
            console.log('📖 Karakteristik UUID:', ESP32_CHARACTERISTIC_UUID);
            console.log('📖 Okuma zamanı:', new Date().toLocaleTimeString());
            
            const data = await BleManager.read(targetPeripheralId, ESP32_SERVICE_UUID, ESP32_CHARACTERISTIC_UUID);
            console.log('📖 Okunan veri (byte array):', data);
            console.log('📖 Veri uzunluğu:', data?.length || 0);
            
            if (data && data.length > 0) {
              // Byte array'i string'e çevir
              let decodedData = '';
              for (let i = 0; i < data.length; i++) {
                decodedData += String.fromCharCode(data[i]);
              }
              
              console.log('📖 Decode edilmiş veri:', decodedData);
              console.log('========================================');
              
              // State'e ekle
              setReceivedData((prev) => {
                // Aynı veriyi tekrar eklememek için kontrol et
                if (prev.length === 0 || prev[0] !== decodedData) {
                  console.log('✅ Yeni veri ekrana eklendi (read ile)');
                  console.log('📊 Toplam veri sayısı:', prev.length + 1);
                  return [decodedData, ...prev];
                } else {
                  console.log('⚠️ Aynı veri, eklenmedi');
                }
                return prev;
              });
              
              // Normal veri geldiğinde bildirim gönderme (sadece alarm durumlarında bildirim gönderilecek)
              // sendNotification(
              //   'Bluetooth Verisi Alındı',
              //   `Yeni veri: ${decodedData}`
              // );
              console.log('✅ Veri işlendi (bildirim gönderilmedi - sadece alarm durumlarında bildirim gönderilir)');
            } else {
              console.log('⚠️ Veri boş veya null');
            }
          } catch (readError: any) {
            // "Peripheral not connected" hatası durumunda interval'i durdur
            const errorMessage = readError?.message || readError?.toString() || '';
            if (errorMessage.includes('not connected') || 
                errorMessage.includes('Peripheral not connected') ||
                errorMessage.includes('disconnected')) {
              console.log('🔄 ========================================');
              console.log('🔄 Bağlantı kesildi tespit edildi!');
              console.log('🔄 Periyodik okuma durduruluyor...');
              console.log('🔄 ========================================');
              isReading = false;
              clearInterval(readInterval);
              if (typeof window !== 'undefined' && (window as any).__readIntervals) {
                delete (window as any).__readIntervals[targetPeripheralId];
              }
              // State'i güncelle
              setConnectedDevice((current) => {
                if (current === targetPeripheralId) {
                  return null;
                }
                return current;
              });
              return;
            }
            
            // Diğer hatalar için sadece log
            console.error('❌ ========================================');
            console.error('❌ === READ HATASI ===');
            console.error('❌ ========================================');
            console.error('❌ Hata:', readError);
            console.error('❌ Hata detayı:', JSON.stringify(readError, null, 2));
            console.error('========================================');
          }
        }, 2000); // ESP32 her 2 saniyede bir gönderiyor, 2 saniyede bir oku
        
        // Bağlantı kesildiğinde interval'i temizle
        // Global bir referans sakla (disconnectDevice'da kullanılacak)
        if (typeof window !== 'undefined') {
          (window as any).__readIntervals = (window as any).__readIntervals || {};
          (window as any).__readIntervals[peripheralId] = {
            interval: readInterval,
            stop: () => {
              isReading = false;
              clearInterval(readInterval);
              console.log('🔄 Periyodik okuma durduruldu (bağlantı kesildi)');
              delete (window as any).__readIntervals[peripheralId];
            }
          };
        }
        
        console.log('✅ Periyodik veri okuma başlatıldı!');
        console.log('📡 Her 2 saniyede bir ESP32\'den veri okunacak...');
        
      } catch (error) {
        console.error('❌ Notification başlatma hatası:', error);
        console.error('Hata detayı:', JSON.stringify(error, null, 2));
        Alert.alert('Uyarı', `Notification başlatılamadı: ${error}\n\nServis ve karakteristik UUID'lerini kontrol edin.`);
      }
    } catch (error) {
      console.error('❌ Notification genel hatası:', error);
    }
  };

  const disconnectDevice = async () => {
    // Periyodik okuma interval'lerini durdur
    if (connectedDevice && typeof window !== 'undefined' && (window as any).__readIntervals) {
      const intervals = (window as any).__readIntervals;
      if (intervals[connectedDevice]) {
        intervals[connectedDevice].stop();
      }
    }
    
    if (connectedDevice) {
      try {
        await BleManager.disconnect(connectedDevice);
        setConnectedDevice(null);
        setReceivedData([]);
        setSentData([]);
        setSendDataText('');
      } catch (error) {
        console.error('Bağlantı kesme hatası:', error);
      }
    }
  };

  // ESP32'ye veri gönder
  const sendDataToESP32 = async () => {
    if (!connectedDevice) {
      Alert.alert('Uyarı', 'Önce bir cihaza bağlanmalısınız');
      return;
    }

    if (!sendDataText.trim()) {
      Alert.alert('Uyarı', 'Lütfen gönderilecek veriyi girin');
      return;
    }

    try {
      const ESP32_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
      const ESP32_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

      console.log('📤 ========================================');
      console.log('📤 === ESP32\'YE VERİ GÖNDERİLİYOR ===');
      console.log('📤 ========================================');
      console.log('📤 Cihaz ID:', connectedDevice);
      console.log('📤 Servis UUID:', ESP32_SERVICE_UUID);
      console.log('📤 Karakteristik UUID:', ESP32_CHARACTERISTIC_UUID);
      console.log('📤 Gönderilecek veri:', sendDataText);
      console.log('📤 Zaman:', new Date().toLocaleTimeString());

      // String'i byte array'e çevir
      const dataBytes: number[] = [];
      for (let i = 0; i < sendDataText.length; i++) {
        dataBytes.push(sendDataText.charCodeAt(i));
      }

      console.log('📤 Byte array:', dataBytes);

      // ESP32'ye veri gönder
      await BleManager.write(
        connectedDevice,
        ESP32_SERVICE_UUID,
        ESP32_CHARACTERISTIC_UUID,
        dataBytes
      );

      console.log('✅ Veri başarıyla gönderildi!');
      console.log('========================================');

      // Gönderilen veriyi listeye ekle
      setSentData((prev) => [sendDataText, ...prev]);
      
      // Input'u temizle
      setSendDataText('');

      Alert.alert('✅ Başarılı', `Veri gönderildi: ${sendDataText}`);
    } catch (error) {
      console.error('❌ ========================================');
      console.error('❌ === VERİ GÖNDERME HATASI ===');
      console.error('❌ ========================================');
      console.error('❌ Hata:', error);
      console.error('❌ Hata detayı:', JSON.stringify(error, null, 2));
      console.error('========================================');
      
      Alert.alert('Hata', `Veri gönderilemedi: ${error}`);
    }
  };

  if (!bleAvailable) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Bluetooth Modülü Yüklenemedi</Text>
          <Text style={styles.errorText}>
            Bu uygulama native modüller gerektirir ve Expo Go'da çalışmaz.
          </Text>
          <Text style={styles.errorText}>
            Lütfen development build kullanın:
          </Text>
          <Text style={styles.codeText}>
            npx expo run:android
          </Text>
          <Text style={styles.codeText}>
            veya
          </Text>
          <Text style={styles.codeText}>
            npx expo run:ios
          </Text>
        </View>
      </View>
    );
  }

  // RemoteMonitoring sayfası (phone1 modu için)
  if (currentScreen === 'remote' && phoneMode === 'phone1') {
    return (
      <RemoteMonitoring 
        onBack={() => setCurrentScreen('home')}
        sensorData={sensorData}
        alarms={alarms}
        thresholds={thresholds}
        onThresholdsChange={setThresholds}
      />
    );
  }

  // RemoteViewer sayfası (phone2 modu için)
  if (phoneMode === 'phone2') {
    return (
      <RemoteViewer 
        onBack={() => {
          // phone2 modunda geri butonu phone1'e geçer
          setPhoneMode('phone1');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Bluetooth Veri Alıcı</Text>
        
        {/* Telefon Modu Seçimi */}
        <View style={styles.phoneModeContainer}>
          <TouchableOpacity
            style={[
              styles.phoneModeButton,
              phoneMode === 'phone1' ? styles.phoneModeButtonActive : undefined
            ]}
            onPress={() => setPhoneMode('phone1')}
          >
            <Text style={[
              styles.phoneModeText,
              phoneMode === 'phone1' ? styles.phoneModeTextActive : undefined
            ]}>
              📤 Telefon 1 (Gönderen)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.phoneModeButton,
              phoneMode === 'phone2' ? styles.phoneModeButtonActive : undefined
            ]}
            onPress={() => setPhoneMode('phone2')}
          >
            <Text style={[
              styles.phoneModeText,
              phoneMode === 'phone2' ? styles.phoneModeTextActive : undefined
            ]}>
              📥 Telefon 2 (Alan)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Backend Durumu */}
        {phoneMode === 'phone1' && (
          <View style={styles.backendStatusContainer}>
            <Text style={[
              styles.backendStatusText,
              backendConnected ? styles.backendStatusConnected : styles.backendStatusDisconnected
            ]}>
              {backendConnected ? '✅ Backend Bağlı' : '❌ Backend Bağlantısı Yok'}
            </Text>
            <Text style={styles.backendUrlText}>
              Backend URL: {API_BASE_URL}
            </Text>
            <Text style={styles.backendHelpText}>
              {!backendConnected && 'Not: Telefon ve bilgisayar aynı WiFi ağında olmalı'}
            </Text>
          </View>
        )}

        {connectedDevice && (
          <Text style={styles.connectedText}>
            Bağlı: {devices.find(d => d.id === connectedDevice)?.name || 'Cihaz'}
          </Text>
        )}
        {!bleEnabled && (
          <Text style={styles.warningText}>
            Bluetooth açık değil
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {!isScanning && !connectedDevice && (
          <>
            <TouchableOpacity 
              style={[styles.button, !bleEnabled && styles.buttonDisabled]} 
              onPress={startScan}
              disabled={!bleEnabled}
            >
              <Text style={styles.buttonText}>Cihazları Tara</Text>
            </TouchableOpacity>
            
            {phoneMode === 'phone1' && (
              <TouchableOpacity 
                style={[styles.button, styles.testButtonMain]} 
                onPress={sendMockDataToBackend}
              >
                <Text style={styles.buttonText}>🧪 Backend'e Mock Veri Gönder</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {isScanning && (
          <TouchableOpacity style={styles.button} onPress={stopScan}>
            <Text style={styles.buttonText}>Taramayı Durdur</Text>
          </TouchableOpacity>
        )}

        {connectedDevice && (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectDevice}>
            <Text style={styles.buttonText}>Bağlantıyı Kes</Text>
          </TouchableOpacity>
        )}
      </View>

      {!connectedDevice && (
        <ScrollView style={styles.deviceList}>
          <Text style={styles.sectionTitle}>Bulunan Cihazlar:</Text>
          {devices.length === 0 ? (
            <Text style={styles.emptyText}>
              {isScanning ? 'Cihazlar aranıyor...' : 'Henüz cihaz bulunamadı'}
            </Text>
          ) : (
            devices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.deviceItem}
                onPress={() => connectToDevice(device)}
              >
                <Text style={styles.deviceName}>{device.name || 'Bilinmeyen Cihaz'}</Text>
                <Text style={styles.deviceId}>{device.id}</Text>
                <Text style={styles.deviceRssi}>RSSI: {device.rssi}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {connectedDevice && (
        <ScrollView 
          style={styles.dataContainer}
          contentContainerStyle={styles.dataContainerContent}
        >
          {/* Bağlantı Durumu */}
          <View style={styles.connectionStatusCard}>
            <Text style={styles.connectionStatusText}>
              ✅ Bağlı: {devices.find(d => d.id === connectedDevice)?.name || 'Cihaz'}
            </Text>
            <Text style={styles.connectionStatusSubtext}>
              Sensör verileri bekleniyor...
            </Text>
          </View>

          {/* Manuel Alarm Butonu */}
          <View style={styles.emergencyContainer}>
            <TouchableOpacity 
              style={styles.emergencyButton}
              onPress={sendManualAlarm}
            >
              <Text style={styles.emergencyButtonText}>🚨 ACİL DURUM</Text>
              <Text style={styles.emergencyButtonSubtext}>Yardım Çağır</Text>
            </TouchableOpacity>
          </View>

          {/* Sensör Verileri */}
          <View style={styles.sensorDataContainer}>
            <Text style={styles.sectionTitle}>📊 Sensör Verileri</Text>
            
            {/* Kalp Atışı */}
            <View style={styles.sensorCard}>
              <Text style={styles.sensorLabel}>❤️ Kalp Atışı</Text>
              <Text style={styles.sensorValue}>
                {sensorData.heartRate !== null ? `${sensorData.heartRate} BPM` : '--'}
              </Text>
              {sensorData.heartRate !== null && (
                <View style={[
                  styles.statusBadge,
                  sensorData.heartRate < thresholds.minHeartRate || sensorData.heartRate > thresholds.maxHeartRate
                    ? styles.statusBadgeWarning
                    : styles.statusBadgeOk
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {sensorData.heartRate < thresholds.minHeartRate ? '⚠️ Düşük' :
                     sensorData.heartRate > thresholds.maxHeartRate ? '⚠️ Yüksek' : '✓ Normal'}
                  </Text>
                </View>
              )}
            </View>

            {/* Hareket Durumu */}
            <View style={styles.sensorCard}>
              <Text style={styles.sensorLabel}>🏃 Hareket Durumu</Text>
              <Text style={styles.sensorValue}>
                {sensorData.movement === 'active' ? 'Aktif' :
                 sensorData.movement === 'idle' ? 'Hareketsiz' :
                 sensorData.movement === 'fall' ? '🚨 Düşme!' : 'Bilinmiyor'}
              </Text>
              <View style={[
                styles.statusBadge,
                sensorData.movement === 'fall' ? styles.statusBadgeDanger :
                sensorData.movement === 'idle' ? styles.statusBadgeWarning :
                styles.statusBadgeOk
              ]}>
                <Text style={styles.statusBadgeText}>
                  {sensorData.movement === 'fall' ? '🚨 ACİL' :
                   sensorData.movement === 'idle' ? '⚠️ Uyarı' : '✓ Normal'}
                </Text>
              </View>
            </View>

            {/* İvmeölçer */}
            {(sensorData.accelX !== null || sensorData.accelY !== null || sensorData.accelZ !== null) && (
              <View style={styles.sensorCard}>
                <Text style={styles.sensorLabel}>📐 İvmeölçer</Text>
                <View style={styles.accelContainer}>
                  <Text style={styles.accelText}>X: {sensorData.accelX?.toFixed(2) || '--'}</Text>
                  <Text style={styles.accelText}>Y: {sensorData.accelY?.toFixed(2) || '--'}</Text>
                  <Text style={styles.accelText}>Z: {sensorData.accelZ?.toFixed(2) || '--'}</Text>
                </View>
              </View>
            )}

            {/* Son Güncelleme */}
            <Text style={styles.lastUpdateText}>
              Son güncelleme: {new Date(sensorData.timestamp).toLocaleTimeString()}
            </Text>
          </View>

          {/* Aktif Alarmlar */}
          {alarms.filter(a => !a.acknowledged).length > 0 && (
            <View style={styles.alarmsContainer}>
              <Text style={styles.sectionTitle}>🚨 Aktif Alarmlar</Text>
              {alarms.filter(a => !a.acknowledged).slice(0, 3).map((alarm) => (
                <View key={alarm.id} style={styles.alarmCard}>
                  <Text style={styles.alarmType}>{alarm.type.toUpperCase()}</Text>
                  <Text style={styles.alarmMessage}>{alarm.message}</Text>
                  <Text style={styles.alarmTime}>
                    {new Date(alarm.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Veri Gönderme Bölümü */}
          <View style={styles.sendDataContainer}>
            <Text style={styles.sectionTitle}>ESP32'ye Veri Gönder:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Gönderilecek veriyi yazın..."
              value={sendDataText}
              onChangeText={setSendDataText}
              multiline={false}
            />
            <TouchableOpacity 
              style={[styles.button, styles.sendButton]} 
              onPress={sendDataToESP32}
            >
              <Text style={styles.buttonText}>📤 Veri Gönder</Text>
            </TouchableOpacity>
          </View>

          {/* Gönderilen Veriler */}
          {sentData.length > 0 && (
            <View style={styles.sentDataContainer}>
              <Text style={styles.sectionTitle}>Gönderilen Veriler:</Text>
              {sentData.map((data, index) => (
                <View key={index} style={[styles.dataItem, styles.sentDataItem]}>
                  <Text style={styles.dataText}>📤 {data}</Text>
                  <Text style={styles.dataTime}>
                    {new Date().toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Alınan Veriler */}
          <View style={styles.receivedDataContainer}>
            <Text style={styles.sectionTitle}>Alınan Veriler:</Text>
            {receivedData.length === 0 ? (
              <Text style={styles.emptyText}>Henüz veri alınmadı...</Text>
            ) : (
              receivedData.map((data, index) => (
                <View key={index} style={[styles.dataItem, styles.receivedDataItem]}>
                  <Text style={styles.dataText}>📥 {data}</Text>
                  <Text style={styles.dataTime}>
                    {new Date().toLocaleTimeString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  connectedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  warningText: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButtonMain: {
    backgroundColor: '#2196F3',
    marginTop: 10,
  },
  uuidButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceList: {
    flex: 1,
    padding: 20,
  },
  dataContainer: {
    flex: 1,
  },
  dataContainerContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  deviceItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  deviceRssi: {
    fontSize: 12,
    color: '#999',
  },
  sendDataContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    marginTop: 0,
  },
  sentDataContainer: {
    marginBottom: 20,
  },
  receivedDataContainer: {
    marginBottom: 20,
  },
  dataItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  sentDataItem: {
    backgroundColor: '#e8f5e9',
    borderLeftColor: '#4CAF50',
  },
  receivedDataItem: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196F3',
  },
  dataText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  dataTime: {
    fontSize: 12,
    color: '#999',
  },
  // Telefon modu seçimi
  phoneModeContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    gap: 10,
  },
  phoneModeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  phoneModeButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  phoneModeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  phoneModeTextActive: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  // Backend durumu
  backendStatusContainer: {
    marginTop: 5,
    marginBottom: 5,
  },
  backendStatusText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  backendStatusConnected: {
    color: '#4CAF50',
  },
  backendStatusDisconnected: {
    color: '#F44336',
  },
  backendUrlText: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
    textAlign: 'center',
  },
  backendHelpText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Yeni style'lar - Güvenlik izleme sistemi
  connectionStatusCard: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  connectionStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  connectionStatusSubtext: {
    fontSize: 12,
    color: '#666',
  },
  emergencyContainer: {
    marginBottom: 20,
  },
  emergencyButton: {
    backgroundColor: '#F44336',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emergencyButtonSubtext: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  // Test butonu
  testContainer: {
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  testButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  sensorDataContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  sensorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeOk: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeWarning: {
    backgroundColor: '#FFC107',
  },
  statusBadgeDanger: {
    backgroundColor: '#F44336',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  accelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  accelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  alarmsContainer: {
    margin: 20,
    marginTop: 0,
  },
  alarmCard: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  alarmType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  alarmMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  alarmTime: {
    fontSize: 11,
    color: '#999',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  codeText: {
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    color: '#333',
  },
});
