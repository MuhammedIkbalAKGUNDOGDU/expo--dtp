# 📱 nRF Connect - Ne İşe Yarar?

## 🎯 nRF Connect Nedir?

**nRF Connect** - Nordic Semiconductor tarafından geliştirilen **ücretsiz** bir Bluetooth Low Energy (BLE) test uygulamasıdır.

### Ne İşe Yarar?
- ✅ BLE cihazlarını **taramak**
- ✅ BLE cihazlarına **bağlanmak**
- ✅ Servisleri ve karakteristikleri **görmek**
- ✅ Veri **okumak/yazmak**
- ✅ **Test** ve **debug** yapmak

---

## 🔍 Neden Kullanmalıyım?

### 1. **Sorun Tespiti İçin**

Uygulamanızda cihaz bulunamıyorsa:
- ✅ nRF Connect'te cihaz görünüyorsa → **Sorun kodunuzda değil**
- ❌ nRF Connect'te cihaz görünmüyorsa → **Cihaz yayın yapmıyor veya BLE değil**

### 2. **Test ve Debug İçin**

- ✅ Hangi cihazların yayın yaptığını görebilirsiniz
- ✅ Cihazların servislerini ve karakteristiklerini görebilirsiniz
- ✅ Veri formatını anlayabilirsiniz
- ✅ UUID'leri öğrenebilirsiniz

### 3. **Geliştirme İçin**

- ✅ Bluetooth cihazınızın özelliklerini öğrenebilirsiniz
- ✅ Hangi servis ve karakteristiklerin olduğunu görebilirsiniz
- ✅ Veri formatını anlayabilirsiniz
- ✅ Kodunuzda kullanacağınız UUID'leri öğrenebilirsiniz

---

## 📥 Nasıl İndirilir?

### Android:
1. **Google Play Store**'u açın
2. "nRF Connect" arayın
3. **Nordic Semiconductor** tarafından geliştirilen uygulamayı indirin
4. Ücretsizdir

### iOS:
1. **App Store**'u açın
2. "nRF Connect" arayın
3. **Nordic Semiconductor** tarafından geliştirilen uygulamayı indirin
4. Ücretsizdir

**Link:**
- Android: https://play.google.com/store/apps/details?id=no.nordicsemi.android.mcp
- iOS: https://apps.apple.com/app/nrf-connect/id1054362403

---

## 🚀 Nasıl Kullanılır?

### Adım 1: Uygulamayı Açın

1. nRF Connect'i açın
2. İzinleri verin (Bluetooth, Konum)
3. Ana ekran açılır

### Adım 2: Cihazları Tarayın

1. **"Scan"** butonuna basın
2. Yakındaki BLE cihazları listelenir
3. Her cihaz için:
   - İsim
   - MAC adresi
   - RSSI (sinyal gücü)
   - Servisler

### Adım 3: Cihaza Bağlanın

1. Listeden bir cihaz seçin
2. **"Connect"** butonuna basın
3. Bağlantı kurulur

### Adım 4: Servisleri ve Karakteristikleri Görün

1. Bağlandıktan sonra servisler görünür
2. Her servisi açarak karakteristikleri görebilirsiniz
3. UUID'leri kopyalayabilirsiniz

### Adım 5: Veri Okuyun/Yazın

1. Karakteristiklere tıklayın
2. Veri okuyabilir/yazabilirsiniz
3. Notification'ları dinleyebilirsiniz

---

## 💡 Pratik Kullanım Senaryoları

### Senaryo 1: Cihaz Bulunamıyor Sorunu

**Sorun:** Uygulamanızda cihaz bulunamıyor

**Çözüm:**
1. nRF Connect'i açın
2. "Scan" butonuna basın
3. Cihaz görünüyorsa → Sorun kodunuzda değil, başka bir şey
4. Cihaz görünmüyorsa → Cihaz yayın yapmıyor veya BLE değil

### Senaryo 2: UUID Öğrenme

**İhtiyaç:** Bluetooth cihazınızın servis ve karakteristik UUID'lerini öğrenmek

**Çözüm:**
1. nRF Connect ile cihaza bağlanın
2. Servisleri görün
3. UUID'leri kopyalayın
4. Kodunuzda kullanın

### Senaryo 3: Veri Formatını Anlama

**İhtiyaç:** Cihazdan gelen verinin formatını anlamak

**Çözüm:**
1. nRF Connect ile cihaza bağlanın
2. Karakteristikleri görün
3. Veri okuyun
4. Formatı anlayın (hex, string, vb.)

---

## 🎯 Sizin Durumunuz İçin

### Test Senaryosu:

1. **nRF Connect'i indirin**
2. **Uygulamayı açın**
3. **"Scan" butonuna basın**
4. **Yakındaki cihazları görün**

**Sonuç:**
- ✅ Cihazlar görünüyorsa → Sizin uygulamanızda da görünmeli
- ❌ Cihazlar görünmüyorsa → Yakında yayın yapan cihaz yok

### Karşılaştırma:

| Özellik | nRF Connect | Sizin Uygulamanız |
|---------|-------------|-------------------|
| Cihaz tarama | ✅ | ✅ |
| Cihaz bağlama | ✅ | ✅ |
| Servis görüntüleme | ✅ | ⚠️ (geliştirme aşamasında) |
| UUID öğrenme | ✅ | ❌ |
| Veri okuma/yazma | ✅ | ⚠️ (geliştirme aşamasında) |
| Debug | ✅ | ⚠️ (sınırlı) |

---

## 📊 Örnek Kullanım

### Ekran Görüntüsü Açıklaması:

```
nRF Connect Ana Ekran:
┌─────────────────────────┐
│  [Scan]  [Filter]       │
├─────────────────────────┤
│ 📱 Mi Band 6            │
│    MAC: AA:BB:CC:...    │
│    RSSI: -45 dBm        │
│    Services: 3          │
├─────────────────────────┤
│ ⌚ Apple Watch           │
│    MAC: DD:EE:FF:...    │
│    RSSI: -60 dBm        │
│    Services: 5          │
└─────────────────────────┘
```

### Cihaza Bağlandıktan Sonra:

```
Servisler:
├─ Service 1 (UUID: 0000180f-...)
│  ├─ Characteristic 1 (UUID: 00002a19-...)
│  └─ Characteristic 2 (UUID: 00002a1a-...)
├─ Service 2 (UUID: 0000180a-...)
│  └─ Characteristic 1 (UUID: 00002a29-...)
└─ Service 3 (UUID: 0000180d-...)
   └─ Characteristic 1 (UUID: 00002a37-...)
```

---

## 🔧 Geliştirme İçin Kullanım

### UUID Öğrenme:

1. nRF Connect ile cihaza bağlanın
2. Servisleri görün
3. UUID'leri kopyalayın
4. Kodunuzda kullanın:

```typescript
// nRF Connect'ten öğrendiğiniz UUID'ler
const SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '00002a19-0000-1000-8000-00805f9b34fb';

// Kodunuzda kullanın
await BleManager.startNotification(
  deviceId,
  SERVICE_UUID,
  CHARACTERISTIC_UUID
);
```

---

## ✅ Özet

### nRF Connect Ne İşe Yarar?

1. **Sorun Tespiti:**
   - Cihazlar görünüyor mu?
   - Sorun kodunuzda mı, cihazda mı?

2. **Test:**
   - Bluetooth cihazlarını test edin
   - Bağlantıyı test edin

3. **Geliştirme:**
   - UUID'leri öğrenin
   - Servisleri görün
   - Veri formatını anlayın

4. **Debug:**
   - Sorunları tespit edin
   - Karşılaştırma yapın

---

## 🎯 Şimdi Ne Yapmalı?

1. **nRF Connect'i indirin** (Google Play / App Store)
2. **Uygulamayı açın**
3. **"Scan" butonuna basın**
4. **Yakındaki cihazları görün**
5. **Sonuçları karşılaştırın:**
   - nRF Connect'te görünüyorsa → Sizin uygulamanızda da görünmeli
   - nRF Connect'te görünmüyorsa → Yakında yayın yapan cihaz yok

---

## 📞 Yardım

**nRF Connect'te cihaz görünüyor ama sizin uygulamanızda görünmüyorsa:**
- Kodunuzda bir sorun var
- Event listener'ları kontrol edin
- İzinleri kontrol edin

**nRF Connect'te de cihaz görünmüyorsa:**
- Yakında yayın yapan cihaz yok
- Cihaz BLE değil (klasik Bluetooth)
- Cihaz kapalı veya yayın yapmıyor

