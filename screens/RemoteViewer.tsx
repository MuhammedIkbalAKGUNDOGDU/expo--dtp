import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  AppState,
  AppStateStatus,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as DeviceInfo from 'expo-device';
// Background task paketleri kaldırıldı (build hatası nedeniyle)
// import * as TaskManager from 'expo-task-manager';
// import * as BackgroundFetch from 'expo-background-fetch';
import { getSensorDataFromBackend, getAlarmsFromBackend, SensorData, Alarm } from '../utils/api';
import { API_BASE_URL } from '../config/api';

// Bildirim handler'ı ayarla (component dışında)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface Thresholds {
  minHeartRate: number;
  maxHeartRate: number;
  inactivityMinutes: number;
  fallThreshold: number;
}

interface RemoteViewerProps {
  onBack: () => void;
  thresholds?: Thresholds;
  onThresholdsChange?: (thresholds: Thresholds) => void;
}

export default function RemoteViewer({ onBack, thresholds, onThresholdsChange }: RemoteViewerProps) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [pollingActive, setPollingActive] = useState(true);
  const [lastAlarmCheck, setLastAlarmCheck] = useState<number>(Date.now());
  const [backendConnected, setBackendConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Eşik değerleri için local state (varsayılan değerler)
  const defaultThresholds: Thresholds = {
    minHeartRate: 40,
    maxHeartRate: 120,
    inactivityMinutes: 5,
    fallThreshold: 2.5,
  };
  
  const currentThresholds = thresholds || defaultThresholds;
  const [showThresholds, setShowThresholds] = useState(false);
  const [tempThresholds, setTempThresholds] = useState(currentThresholds);
  
  // Thresholds değiştiğinde tempThresholds'i güncelle
  useEffect(() => {
    if (thresholds) {
      setTempThresholds(thresholds);
    }
  }, [thresholds]);

  // Bildirim izinlerini kontrol et ve iste
  useEffect(() => {
    const registerForNotifications = async () => {
      if (!DeviceInfo.isDevice) {
        console.log('⚠️ Bildirimler sadece fiziksel cihazlarda çalışır');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('📢 Bildirim izinleri isteniyor (Phone2)...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Bildirim izinleri verilmedi (Phone2)');
        Alert.alert('İzin Gerekli', 'Bildirim izinleri gerekli. Lütfen ayarlardan izin verin.');
      } else {
        console.log('✅ Bildirim izinleri verildi (Phone2)');
      }
    };

    registerForNotifications();
  }, []);
  
  const handleSaveThresholds = () => {
    if (onThresholdsChange) {
      onThresholdsChange(tempThresholds);
      setShowThresholds(false);
      Alert.alert('✅ Başarılı', 'Eşik değerleri güncellendi');
    } else {
      Alert.alert('⚠️ Uyarı', 'Eşik değerleri ayarlanamıyor (callback tanımlı değil)');
    }
  };
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousAlarmIdsRef = useRef<Set<string>>(new Set());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Bildirim gönderme fonksiyonu
  const sendNotification = async (title: string, body: string) => {
    try {
      console.log('📢 ========================================');
      console.log('📢 === BİLDİRİM GÖNDERİLİYOR (Phone2) ===');
      console.log('📢 ========================================');
      console.log('📢 Başlık:', title);
      console.log('📢 Mesaj:', body);
      console.log('📢 ========================================');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: true,
          priority: 'high',
        },
        trigger: null, // Hemen gönder
      });
      
      console.log('✅ Bildirim gönderildi (Phone2)');
    } catch (error) {
      console.error('❌ Bildirim gönderme hatası (Phone2):', error);
    }
  };

  // Backend'den veri çekme
  const fetchData = async () => {
    if (!pollingActive) return;

    try {
      setIsLoading(true);
      setConnectionError(null);
      
      console.log('📥 Backend\'den veri çekiliyor...');
      
      // Sensör verilerini çek
      const sensorResponse = await getSensorDataFromBackend();
      console.log('✅ Sensör verisi alındı:', sensorResponse);
      
      if (sensorResponse.data) {
        setSensorData(sensorResponse.data);
        setLastUpdate(sensorResponse.timestamp);
        setBackendConnected(true);
      } else {
        console.log('⚠️ Sensör verisi yok (henüz veri gönderilmemiş)');
        setBackendConnected(true); // Backend çalışıyor ama veri yok
      }

      // Alarmları çek (son kontrol zamanından sonraki alarmlar)
      const alarmsResponse = await getAlarmsFromBackend(lastAlarmCheck);
      console.log('✅ Alarmlar alındı:', alarmsResponse);
      
      if (alarmsResponse.alarms && alarmsResponse.alarms.length > 0) {
        // Yeni alarmları tespit et
        const newAlarms = alarmsResponse.alarms.filter(
          alarm => !previousAlarmIdsRef.current.has(alarm.id)
        );

        if (newAlarms.length > 0) {
          console.log('🚨 Yeni alarmlar tespit edildi:', newAlarms);
          
          // Yeni alarmları state'e ekle
          setAlarms((prev) => {
            const combined = [...newAlarms, ...prev];
            // Son 50 alarmı tut
            return combined.slice(0, 50);
          });

          // Yeni alarmlar için bildirim gönder
          newAlarms.forEach((alarm) => {
            sendNotification(
              '🚨 ACİL DURUM',
              alarm.message
            );
          });

          // Alarm ID'lerini kaydet
          newAlarms.forEach((alarm) => {
            previousAlarmIdsRef.current.add(alarm.id);
          });
        }

        setLastAlarmCheck(Date.now());
      }
    } catch (error: any) {
      console.error('❌ ========================================');
      console.error('❌ Backend\'den veri çekme hatası!');
      console.error('❌ ========================================');
      console.error('❌ Hata tipi:', error?.name || 'Unknown');
      console.error('❌ Hata mesajı:', error?.message || error);
      console.error('❌ Hata detayı:', JSON.stringify(error, null, 2));
      console.error('❌ ========================================');
      
      setBackendConnected(false);
      setConnectionError(error?.message || 'Backend\'e bağlanılamıyor');
    } finally {
      setIsLoading(false);
    }
  };

  // Polling başlatma
  useEffect(() => {
    if (pollingActive) {
      // İlk veriyi hemen çek
      fetchData();

      // Sonra her 3 saniyede bir çek
      pollingIntervalRef.current = setInterval(() => {
        fetchData();
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }
  }, [pollingActive]);

  // App state değişikliklerini dinle (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 Uygulama foreground\'a geldi');
        // Uygulama açıldığında veriyi hemen çek
        fetchData();
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('📱 Uygulama background\'a gitti');
        // Background task kaldırıldı - sadece uygulama açıkken çalışır
        // Ekran kapalıyken background task çalışmaz
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Komponent unmount olduğunda temizle
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // Background task kaldırıldı
    };
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const togglePolling = () => {
    setPollingActive(!pollingActive);
    Alert.alert(
      pollingActive ? 'Polling Durduruldu' : 'Polling Başlatıldı',
      pollingActive 
        ? 'Backend\'den veri çekme durduruldu.'
        : 'Backend\'den veri çekme başlatıldı (her 3 saniyede bir).'
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📥 Uzaktan İzleme</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, pollingActive ? styles.controlButtonActive : styles.controlButtonInactive]}
          onPress={togglePolling}
        >
          <Text style={styles.controlButtonText}>
            {pollingActive ? '⏸️ Durdur' : '▶️ Başlat'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, styles.refreshButton]}
          onPress={handleRefresh}
        >
          <Text style={styles.controlButtonText}>🔄 Yenile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Durum Göstergesi */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>📡 Bağlantı Durumu</Text>
          <Text style={[
            styles.statusText,
            backendConnected ? styles.statusConnected : styles.statusDisconnected
          ]}>
            {pollingActive 
              ? (backendConnected ? '✅ Aktif - Backend Bağlı' : '❌ Aktif - Backend Bağlantısı Yok')
              : '⏸️ Durduruldu'}
          </Text>
          <Text style={styles.backendUrlText}>
            Backend URL: {API_BASE_URL}
          </Text>
          {connectionError && (
            <Text style={styles.errorText}>
              ❌ Hata: {connectionError}
            </Text>
          )}
          {lastUpdate && (
            <Text style={styles.statusSubtext}>
              Son güncelleme: {new Date(lastUpdate).toLocaleTimeString()}
            </Text>
          )}
          {!lastUpdate && pollingActive && !backendConnected && (
            <Text style={styles.backendHelpText}>
              Backend'e bağlanılamıyor. Backend URL'ini ve internet bağlantısını kontrol edin.
            </Text>
          )}
        </View>

        {/* Sensör Verileri */}
        {sensorData ? (
          <View style={styles.sensorCard}>
            <Text style={styles.sectionTitle}>📊 Sensör Verileri</Text>
            
            {sensorData.heartRate !== null && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>❤️ Kalp Atışı:</Text>
                <Text style={styles.dataValue}>{sensorData.heartRate} BPM</Text>
              </View>
            )}

            {(sensorData.accelX !== null || sensorData.accelY !== null || sensorData.accelZ !== null) && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>📐 İvme:</Text>
                <Text style={styles.dataValue}>
                  X: {sensorData.accelX?.toFixed(2) || '--'} 
                  Y: {sensorData.accelY?.toFixed(2) || '--'} 
                  Z: {sensorData.accelZ?.toFixed(2) || '--'}
                </Text>
              </View>
            )}

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>🏃 Hareket:</Text>
              <Text style={styles.dataValue}>
                {sensorData.movement === 'active' ? 'Aktif' :
                 sensorData.movement === 'idle' ? 'Hareketsiz' :
                 sensorData.movement === 'fall' ? 'Düşme' : 'Bilinmiyor'}
              </Text>
            </View>

            {sensorData.battery !== null && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>🔋 Pil:</Text>
                <Text style={styles.dataValue}>{sensorData.battery}%</Text>
              </View>
            )}

            <Text style={styles.timestampText}>
              Zaman: {new Date(sensorData.timestamp).toLocaleString()}
            </Text>
            
            {/* Nabız Durumu Badge */}
            {sensorData.heartRate !== null && (
              <View style={[
                styles.statusBadge,
                sensorData.heartRate < currentThresholds.minHeartRate || sensorData.heartRate > currentThresholds.maxHeartRate
                  ? styles.statusBadgeWarning
                  : styles.statusBadgeOk
              ]}>
                <Text style={styles.statusBadgeText}>
                  {sensorData.heartRate < currentThresholds.minHeartRate ? '⚠️ Düşük' :
                   sensorData.heartRate > currentThresholds.maxHeartRate ? '⚠️ Yüksek' : '✓ Normal'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Henüz sensör verisi alınmadı</Text>
            <Text style={styles.emptySubtext}>
              Backend'den veri gelmesi bekleniyor...
            </Text>
          </View>
        )}

        {/* Eşik Değerleri Ayarlama */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity 
            style={styles.settingsHeader}
            onPress={() => setShowThresholds(!showThresholds)}
          >
            <Text style={styles.settingsTitle}>⚙️ Eşik Değerleri</Text>
            <Text style={styles.settingsToggle}>{showThresholds ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {showThresholds && (
            <View style={styles.thresholdsContent}>
              {/* Minimum Nabız */}
              <View style={styles.thresholdItem}>
                <Text style={styles.thresholdLabel}>Minimum Nabız (BPM)</Text>
                <TextInput
                  style={styles.thresholdInput}
                  value={tempThresholds.minHeartRate.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setTempThresholds({ ...tempThresholds, minHeartRate: value });
                  }}
                  keyboardType="numeric"
                  placeholder="40"
                />
                <Text style={styles.thresholdHint}>Şu anki: {currentThresholds.minHeartRate} BPM</Text>
              </View>

              {/* Maksimum Nabız */}
              <View style={styles.thresholdItem}>
                <Text style={styles.thresholdLabel}>Maksimum Nabız (BPM)</Text>
                <TextInput
                  style={styles.thresholdInput}
                  value={tempThresholds.maxHeartRate.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setTempThresholds({ ...tempThresholds, maxHeartRate: value });
                  }}
                  keyboardType="numeric"
                  placeholder="120"
                />
                <Text style={styles.thresholdHint}>Şu anki: {currentThresholds.maxHeartRate} BPM</Text>
              </View>

              {/* Hareketsizlik Süresi */}
              

              {/* Kaydet Butonu */}
              {onThresholdsChange && (
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveThresholds}
                >
                  <Text style={styles.saveButtonText}>💾 Kaydet</Text>
                </TouchableOpacity>
              )}
              {!onThresholdsChange && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    ℹ️ Eşik değerleri sadece görüntüleniyor. Değiştirmek için phone1 moduna geçin.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Alarmlar */}
        <View style={styles.alarmsCard}>
          <Text style={styles.sectionTitle}>🚨 Alarmlar ({alarms.length})</Text>
          {alarms.length === 0 ? (
            <Text style={styles.emptyText}>Henüz alarm yok</Text>
          ) : (
            alarms.slice(0, 10).map((alarm) => (
              <View key={alarm.id} style={styles.alarmItem}>
                <View style={styles.alarmHeader}>
                  <Text style={styles.alarmType}>{alarm.type.toUpperCase()}</Text>
                  <Text style={styles.alarmTime}>
                    {new Date(alarm.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.alarmMessage}>{alarm.message}</Text>
                {alarm.acknowledged && (
                  <Text style={styles.acknowledgedText}>✓ Onaylandı</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  headerSpacer: {
    width: 60,
  },
  controlsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  controlButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#F44336',
  },
  controlButtonInactive: {
    backgroundColor: '#4CAF50',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#999',
  },
  backendUrlText: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  backendHelpText: {
    fontSize: 10,
    color: '#F44336',
    marginTop: 5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statusConnected: {
    color: '#4CAF50',
  },
  statusDisconnected: {
    color: '#F44336',
  },
  errorText: {
    fontSize: 11,
    color: '#F44336',
    marginTop: 5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sensorCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
  alarmsCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alarmItem: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  alarmType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    textTransform: 'uppercase',
  },
  alarmTime: {
    fontSize: 12,
    color: '#856404',
  },
  alarmMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  acknowledgedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  // Eşik değerleri ayarlama stilleri
  settingsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsToggle: {
    fontSize: 16,
    color: '#666',
  },
  thresholdsContent: {
    padding: 20,
  },
  thresholdItem: {
    marginBottom: 20,
  },
  thresholdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  thresholdInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  thresholdHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#1976d2',
    textAlign: 'center',
  },
  // Status badge stilleri
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    alignSelf: 'center',
  },
  statusBadgeOk: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeWarning: {
    backgroundColor: '#FFC107',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

