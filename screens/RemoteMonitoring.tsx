import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface SensorData {
  heartRate: number | null;
  accelX: number | null;
  accelY: number | null;
  accelZ: number | null;
  movement: 'active' | 'idle' | 'fall' | 'unknown';
  timestamp: number;
  battery: number | null;
}

interface Alarm {
  id: string;
  type: 'fall' | 'inactivity' | 'low_heart_rate' | 'high_heart_rate' | 'manual';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

interface Thresholds {
  minHeartRate: number;
  maxHeartRate: number;
  inactivityMinutes: number;
  fallThreshold: number;
}

interface RemoteMonitoringProps {
  onBack: () => void;
  sensorData: SensorData;
  alarms: Alarm[];
  thresholds: Thresholds;
  onThresholdsChange: (thresholds: Thresholds) => void;
}

export default function RemoteMonitoring({ 
  onBack, 
  sensorData, 
  alarms, 
  thresholds, 
  onThresholdsChange 
}: RemoteMonitoringProps) {
  const [showThresholds, setShowThresholds] = useState(false);
  const [tempThresholds, setTempThresholds] = useState(thresholds);

  const handleSaveThresholds = () => {
    onThresholdsChange(tempThresholds);
    setShowThresholds(false);
    Alert.alert('✅ Başarılı', 'Eşik değerleri güncellendi');
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Uzaktan Katılıyorum</Text>
      </View>

      {/* Kalp Atışı Göstergesi */}
      <View style={styles.heartRateContainer}>
        <View style={styles.heartIconContainer}>
          <Text style={styles.heartIcon}>❤️</Text>
        </View>
        <Text style={styles.heartRateLabel}>Kalp Atışı</Text>
        <Text style={styles.heartRateValue}>
          {sensorData.heartRate !== null ? sensorData.heartRate : '--'}
        </Text>
        <Text style={styles.heartRateUnit}>BPM</Text>
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

      {/* İstatistikler */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Ortalama</Text>
          <Text style={styles.statValue}>--</Text>
          <Text style={styles.statUnit}>BPM</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Maksimum</Text>
          <Text style={styles.statValue}>--</Text>
          <Text style={styles.statUnit}>BPM</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Minimum</Text>
          <Text style={styles.statValue}>--</Text>
          <Text style={styles.statUnit}>BPM</Text>
        </View>
      </View>

      {/* Grafik Alanı (Placeholder) */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartPlaceholder}>
          Kalp Atışı Grafiği
        </Text>
        <Text style={styles.chartSubtext}>
          Grafik burada gösterilecek
        </Text>
      </View>

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
              <Text style={styles.thresholdHint}>Şu anki: {thresholds.minHeartRate} BPM</Text>
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
              <Text style={styles.thresholdHint}>Şu anki: {thresholds.maxHeartRate} BPM</Text>
            </View>

            {/* Hareketsizlik Süresi */}
            <View style={styles.thresholdItem}>
              <Text style={styles.thresholdLabel}>Hareketsizlik Süresi (Dakika)</Text>
              <TextInput
                style={styles.thresholdInput}
                value={tempThresholds.inactivityMinutes.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setTempThresholds({ ...tempThresholds, inactivityMinutes: value });
                }}
                keyboardType="numeric"
                placeholder="5"
              />
              <Text style={styles.thresholdHint}>Şu anki: {thresholds.inactivityMinutes} dakika</Text>
            </View>

            {/* Kaydet Butonu */}
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveThresholds}
            >
              <Text style={styles.saveButtonText}>💾 Kaydet</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Alarm Geçmişi */}
      {alarms.length > 0 && (
        <View style={styles.alarmsContainer}>
          <Text style={styles.sectionTitle}>🚨 Alarm Geçmişi</Text>
          {alarms.slice(0, 10).map((alarm) => (
            <View 
              key={alarm.id} 
              style={[
                styles.alarmCard,
                !alarm.acknowledged && styles.alarmCardUnread
              ]}
            >
              <View style={styles.alarmHeader}>
                <Text style={styles.alarmType}>
                  {alarm.type === 'fall' ? '🚨 Düşme' :
                   alarm.type === 'inactivity' ? '⏱️ Hareketsizlik' :
                   alarm.type === 'low_heart_rate' ? '💓 Düşük Nabız' :
                   alarm.type === 'high_heart_rate' ? '💓 Yüksek Nabız' :
                   '🔔 Manuel'}
                </Text>
                {!alarm.acknowledged && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>YENİ</Text>
                  </View>
                )}
              </View>
              <Text style={styles.alarmMessage}>{alarm.message}</Text>
              <Text style={styles.alarmTime}>
                {new Date(alarm.timestamp).toLocaleString('tr-TR')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Durum Bilgisi */}
      <View style={styles.statusContainer}>
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot, 
            sensorData.heartRate !== null ? styles.statusDotActive : styles.statusDotInactive
          ]} />
          <Text style={styles.statusText}>
            {sensorData.heartRate !== null ? 'Bağlı ve Aktif' : 'Bağlantı Bekleniyor'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  heartRateContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heartIconContainer: {
    marginBottom: 15,
  },
  heartIcon: {
    fontSize: 60,
  },
  heartRateLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  heartRateValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  heartRateUnit: {
    fontSize: 18,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 12,
    color: '#999',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartPlaceholder: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  chartSubtext: {
    fontSize: 14,
    color: '#999',
  },
  statusContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusDotInactive: {
    backgroundColor: '#ccc',
  },
  statusDotActive: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
});

