# Backend Entegrasyon Rehberi

Bu rehber, mobil uygulamayı backend ile entegre etmek için gerekli adımları içerir.

## Kurulum

### 1. Backend'i Başlat

Backend projesini başlatmak için:

```bash
cd expo-cdtp-backend
npm install
npm start
```

Backend `http://localhost:3000` adresinde çalışacak.

### 2. Backend URL'ini Yapılandır

`config/api.ts` dosyasını açın ve backend URL'ini ayarlayın:

**Geliştirme için (localhost):**
```typescript
export const API_BASE_URL = 'http://localhost:3000';
```

**Production için (cloud deployment):**
```typescript
export const API_BASE_URL = 'https://expo-cdtp-backend.railway.app';
```

**Not:** Aynı WiFi ağında olduğunuzdan emin olun (localhost için).

### 3. Telefon Modunu Seç

Uygulamada telefon modunu seçin:

- **Telefon 1 (Gönderen)**: ESP32'den veri alır ve backend'e gönderir
- **Telefon 2 (Alan)**: Backend'den veri alır ve ekran kapalıyken bildirim gösterir

## Kullanım

### Telefon 1 (Veri Gönderen)

1. Uygulamayı açın
2. "Telefon 1 (Gönderen)" modunu seçin
3. ESP32'ye bağlanın (Bluetooth ile)
4. Veriler otomatik olarak backend'e gönderilir
5. Backend bağlantı durumu header'da görünür

### Telefon 2 (Veri Alan)

1. Uygulamayı açın
2. "Telefon 2 (Alan)" modunu seçin
3. Uygulama otomatik olarak backend'den veri çekmeye başlar
4. Yeni alarmlar geldiğinde bildirim gösterilir
5. Ekran kapalıyken bile bildirimler gösterilir (background task)

## API Endpoints

### POST /api/sensor-data
Telefon 1 tarafından çağrılır. Sensör verilerini ve alarmları backend'e gönderir.

**Request:**
```json
{
  "sensorData": {
    "heartRate": 75,
    "accelX": 0.5,
    "accelY": -0.2,
    "accelZ": 9.8,
    "movement": "active",
    "timestamp": 1234567890,
    "battery": 85
  },
  "alarms": [
    {
      "id": "alarm_123",
      "type": "fall",
      "message": "Düşme tespit edildi!",
      "timestamp": 1234567890,
      "acknowledged": false
    }
  ]
}
```

### GET /api/sensor-data
Telefon 2 tarafından çağrılır. Son sensör verisini döndürür.

**Response:**
```json
{
  "data": {
    "heartRate": 75,
    "accelX": 0.5,
    "accelY": -0.2,
    "accelZ": 9.8,
    "movement": "active",
    "timestamp": 1234567890,
    "battery": 85
  },
  "timestamp": 1234567890
}
```

### GET /api/alarms
Telefon 2 tarafından çağrılır. Alarmları döndürür.

**Query Parameters:**
- `since` (optional): Timestamp - sadece bu zamandan sonraki alarmları döndürür

**Response:**
```json
{
  "alarms": [
    {
      "id": "alarm_123",
      "type": "fall",
      "message": "Düşme tespit edildi!",
      "timestamp": 1234567890,
      "acknowledged": false
    }
  ],
  "total": 1,
  "lastCheck": 1234567890
}
```

## Background Notifications

Telefon 2 modunda, uygulama ekran kapalıyken bile backend'den veri çekmeye devam eder ve yeni alarmlar için bildirim gösterir.

### Android
- Background task otomatik çalışır
- `WAKE_LOCK` ve `RECEIVE_BOOT_COMPLETED` izinleri gerekir (zaten ekli)

### iOS
- Background fetch kısıtlamaları var
- Minimum 15 saniye interval
- iOS otomatik olarak en uygun zamanı seçer

## Sorun Giderme

### Backend'e bağlanamıyorum
1. Backend'in çalıştığından emin olun
2. URL'in doğru olduğundan emin olun
3. Aynı WiFi ağında olduğunuzdan emin olun (localhost için)
4. Firewall ayarlarını kontrol edin

### Veri gönderilmiyor
1. Telefon 1 modunda olduğunuzdan emin olun
2. ESP32'ye bağlı olduğunuzdan emin olun
3. Backend bağlantı durumunu kontrol edin (header'da görünür)
4. Console loglarını kontrol edin

### Veri alınamıyor
1. Telefon 2 modunda olduğunuzdan emin olun
2. Polling'in aktif olduğundan emin olun
3. Backend'in çalıştığından emin olun
4. Console loglarını kontrol edin

### Bildirimler gelmiyor
1. Bildirim izinlerinin verildiğinden emin olun
2. Background task'ın aktif olduğundan emin olun
3. Yeni alarmların backend'de olduğundan emin olun
4. iOS'ta background fetch kısıtlamaları olabilir

## Test

### Backend'i test et
```bash
# Health check
curl http://localhost:3000/api/health

# Sensor data gönder
curl -X POST http://localhost:3000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"sensorData": {"heartRate": 75, "timestamp": 1234567890}, "alarms": []}'

# Sensor data al
curl http://localhost:3000/api/sensor-data

# Alarmlar al
curl http://localhost:3000/api/alarms
```

### Mobil uygulamayı test et
1. Backend'i başlatın
2. İki telefon veya emülatör kullanın
3. Bir telefonu "Telefon 1" moduna alın ve ESP32'ye bağlanın
4. Diğer telefonu "Telefon 2" moduna alın
5. Veri akışını kontrol edin

