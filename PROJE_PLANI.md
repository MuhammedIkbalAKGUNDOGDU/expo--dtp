# 🏥 Güvenlik İzleme Sistemi - Proje Planı

## 📋 GENEL BAKIŞ

Bu proje, giyilebilir sensörlerden veri toplayarak acil durumları tespit eden bir sistemdir.

---

## 🎯 EKRAN YAPISI

### 1️⃣ ANA EKRAN (Home Screen) - Giyilebilir Cihaz Bağlantısı

**Amaç:** ESP32'ye bağlanmak ve sensör verilerini almak

**Bileşenler:**
- ✅ Bluetooth bağlantı bölümü (mevcut)
- ✅ Cihaz tarama ve bağlantı (mevcut)
- 🆕 **Sensör Verileri Gösterimi:**
  - Kalp Atışı (BPM) - Gerçek zamanlı
  - İvmeölçer verileri (X, Y, Z)
  - Hareket durumu (Aktif/Pasif)
  - Son güncelleme zamanı
- 🆕 **Manuel Alarm Butonu:**
  - Büyük, kolay erişilebilir buton
  - Acil durum çağrısı gönderir
- 🆕 **Durum Göstergesi:**
  - Bağlantı durumu
  - Sensör durumu
  - Pil durumu (simüle)

---

### 2️⃣ UZAKTAN İZLEME EKRANI (RemoteMonitoring Screen) - Bakıcı/İzleyici

**Amaç:** Uzaktan izleme, alarm yönetimi, bildirimler

**Bileşenler:**
- 🆕 **Gerçek Zamanlı Durum:**
  - Kalp atışı (büyük gösterge)
  - Hareket durumu
  - Son aktivite zamanı
  - Bağlantı durumu
- 🆕 **Alarm Geçmişi:**
  - Düşme alarmları
  - Hareketsizlik uyarıları
  - Anormal nabız uyarıları
  - Manuel alarmlar
  - Zaman damgalı liste
- 🆕 **Eşik Değerleri Ayarlama:**
  - Minimum nabız (varsayılan: 40)
  - Maksimum nabız (varsayılan: 120)
  - Hareketsizlik süresi (dakika)
  - Düşme algılama hassasiyeti
- 🆕 **Bildirim Yönetimi:**
  - Aktif alarmlar
  - Bildirim geçmişi
  - Bildirim ayarları
- 🆕 **Grafikler:**
  - Kalp atışı grafiği (zaman serisi)
  - Hareket aktivitesi grafiği

---

## 📊 VERİ YAPISI

### ESP32'den Gelen Veri Formatı:
```json
{
  "heartRate": 75,           // BPM
  "accelX": 0.5,             // m/s²
  "accelY": -0.2,
  "accelZ": 9.8,
  "gyroX": 0.1,              // rad/s
  "gyroY": 0.0,
  "gyroZ": 0.0,
  "movement": "active",      // "active" | "idle" | "fall"
  "timestamp": 1234567890,
  "battery": 85              // %
}
```

### Alarm Tipleri:
```typescript
type AlarmType = 
  | 'fall'              // Düşme tespiti
  | 'inactivity'        // Uzun süre hareketsizlik
  | 'low_heart_rate'    // Düşük nabız (<40)
  | 'high_heart_rate'   // Yüksek nabız (>120)
  | 'manual'            // Manuel alarm
```

---

## 🔔 ALARM TESPİT MANTIĞI

### 1. Düşme Tespiti:
- İvmeölçer: Ani değişim (threshold: 2.5g)
- Jiroskop: Yön değişimi
- Hareketsizlik: Düşme sonrası 5 saniye hareketsizlik
- **Alarm:** "Düşme tespit edildi!"

### 2. Uzun Süre Hareketsizlik:
- İvmeölçer değişimi < threshold (5 dakika)
- **Alarm:** "Uzun süre hareketsizlik tespit edildi!"

### 3. Anormal Nabız:
- Nabız < 40 BPM → "Düşük nabız uyarısı"
- Nabız > 120 BPM → "Yüksek nabız uyarısı"
- **Alarm:** Anlık bildirim

### 4. Manuel Alarm:
- Kullanıcı butona basar
- **Alarm:** "Manuel acil durum çağrısı"

---

## 🎨 UI/UX TASARIMI

### Ana Ekran Renkleri:
- **Normal durum:** Mavi (#2196F3)
- **Uyarı:** Sarı (#FFC107)
- **Alarm:** Kırmızı (#F44336)
- **Başarılı:** Yeşil (#4CAF50)

### Uzaktan İzleme Ekranı:
- **Durum kartları:** Beyaz arka plan, gölge
- **Alarm kartları:** Kırmızı kenarlık, kırmızı ikon
- **Grafikler:** Mavi çizgi, yeşil alan

---

## 📱 BİLDİRİM SİSTEMİ

### Bildirim Tipleri:
1. **Acil Alarm Bildirimi:**
   - Ses + Titreşim
   - Ekran kilidi açılsa bile göster
   - Tekrarlayan bildirim

2. **Uyarı Bildirimi:**
   - Sessiz bildirim
   - Bildirim merkezinde göster

3. **Bilgi Bildirimi:**
   - Normal bildirim
   - Bildirim merkezinde göster

---

## 🔧 TEKNİK DETAYLAR

### State Yönetimi:
```typescript
interface SensorData {
  heartRate: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  movement: 'active' | 'idle' | 'fall';
  timestamp: number;
  battery: number;
}

interface Alarm {
  id: string;
  type: AlarmType;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

interface Thresholds {
  minHeartRate: number;      // 40
  maxHeartRate: number;      // 120
  inactivityMinutes: number; // 5
  fallThreshold: number;     // 2.5g
}
```

### Veri İşleme:
- ESP32'den gelen veriyi parse et
- Alarm tespiti yap
- State güncelle
- Bildirim gönder
- RemoteMonitoring ekranına yayınla

---

## 📝 UYGULAMA ADIMLARI

### Faz 1: Ana Ekran İyileştirmeleri
1. ✅ Sensör verileri gösterimi ekle
2. ✅ Manuel alarm butonu ekle
3. ✅ Durum göstergeleri ekle
4. ✅ Alarm tespit mantığı ekle

### Faz 2: Uzaktan İzleme Ekranı
1. ✅ Gerçek zamanlı durum gösterimi
2. ✅ Alarm geçmişi listesi
3. ✅ Eşik değerleri ayarlama
4. ✅ Bildirim yönetimi
5. ✅ Grafik gösterimi (basit)

### Faz 3: Bildirim Sistemi
1. ✅ Alarm bildirimleri
2. ✅ Uyarı bildirimleri
3. ✅ Bildirim geçmişi

### Faz 4: Test ve İyileştirme
1. ✅ Senaryo testleri
2. ✅ UI/UX iyileştirmeleri
3. ✅ Performans optimizasyonu

---

## 🎯 ÖNCELİKLER

### Yüksek Öncelik:
1. ✅ Ana ekranda sensör verileri gösterimi
2. ✅ Manuel alarm butonu
3. ✅ Alarm tespit mantığı
4. ✅ Bildirim sistemi

### Orta Öncelik:
1. ✅ Uzaktan izleme ekranı iyileştirmeleri
2. ✅ Eşik değerleri ayarlama
3. ✅ Alarm geçmişi

### Düşük Öncelik:
1. ✅ Grafik gösterimi
2. ✅ Pil durumu simülasyonu
3. ✅ Gelişmiş UI animasyonları

---

## 📌 NOTLAR

- ESP32 kodu şu an sadece test verisi gönderiyor
- Gerçek sensörler için ESP32 kodunu güncellemek gerekecek
- Simülasyon modu eklenebilir (gerçek sensör yoksa)
- Bildirimler expo-notifications ile yapılıyor (mevcut)


