# 🔵 Bluetooth Test Rehberi

## ❓ Cihaz Bulunamıyor - Ne Yapmalı?

### ⚠️ ÖNEMLİ: BLE (Bluetooth Low Energy) Hakkında

**BLE cihazları için:**
- ✅ **Pairing (eşleştirme) GEREKMEZ** - Direkt bağlanabilirsiniz
- ✅ **Cihazın yayın (advertising) yapması GEREKİR** - Cihaz görünür olmalı
- ✅ **Yakında olmalı** - Genellikle 10-30 metre mesafe

---

## 📱 Test İçin Ne Gerekli?

### 1. Bluetooth Cihazı

Test için bir **BLE cihazı** gerekli:

**Örnekler:**
- ✅ Fitness tracker (Fitbit, Xiaomi Mi Band, vb.)
- ✅ Akıllı saat (Apple Watch, Samsung Galaxy Watch, vb.)
- ✅ Bluetooth kulaklık (bazı modeller)
- ✅ IoT cihazları (sensörler, butonlar)
- ✅ Başka bir telefon (BLE yayın yapıyorsa)

**Çalışmayanlar:**
- ❌ Klasik Bluetooth cihazları (BLE değilse)
- ❌ Çok eski cihazlar
- ❌ Yayın yapmayan cihazlar

---

## 🔍 Cihaz Bulunamıyorsa Kontrol Listesi

### 1. Bluetooth Açık mı?
- ✅ Telefon ayarlarından Bluetooth'u açın
- ✅ Uygulamada "Bluetooth açık" mesajını görüyor musunuz?

### 2. İzinler Verildi mi?
- ✅ **Bluetooth izinleri** - Uygulama ayarlarından kontrol edin
- ✅ **Konum izni** - Android'de Bluetooth için gerekli!
- ✅ **Bildirim izinleri** - Bildirimler için

### 3. Cihaz Yayın Yapıyor mu?
- ✅ Cihazın **açık** olduğundan emin olun
- ✅ Cihazın **yayın (advertising) modunda** olduğundan emin olun
- ✅ Başka bir uygulamayla (ör. nRF Connect) test edin

### 4. Yakında mı?
- ✅ Cihaz **10-30 metre** yakında olmalı
- ✅ Engeller olmamalı (duvarlar, metal objeler)

### 5. Konum Servisi Açık mı? (Android)
- ✅ Android'de Bluetooth tarama için **konum servisi** gerekli
- ✅ Ayarlar → Konum → Açık

---

## 🧪 Test Adımları

### Adım 1: Uygulamayı Açın
1. Development build uygulamasını açın
2. "Bluetooth açık" mesajını görüyor musunuz?

### Adım 2: İzinleri Kontrol Edin
1. Telefon ayarlarına gidin
2. Uygulamalar → [Uygulama Adı]
3. İzinler bölümünden kontrol edin:
   - ✅ Bluetooth
   - ✅ Konum (Android)
   - ✅ Bildirimler

### Adım 3: Bluetooth Cihazını Hazırlayın
1. Test cihazınızı açın
2. Yayın (advertising) modunda olduğundan emin olun
3. Yakına getirin (1-2 metre)

### Adım 4: Tarama Yapın
1. Uygulamada "Cihazları Tara" butonuna basın
2. Terminal'de logları kontrol edin:
   ```
   Tarama başlatılıyor...
   Tarama başlatıldı, 10 saniye sürecek...
   === CİHAZ BULUNDU ===
   ```

### Adım 5: Sonuçları Kontrol Edin
- ✅ Cihaz bulunduysa → Listede görünecek
- ❌ Cihaz bulunamadıysa → Aşağıdaki sorun gidermeyi deneyin

---

## 🔧 Sorun Giderme

### Sorun 1: "Cihaz bulunamadı" Mesajı

**Çözümler:**
1. **Başka bir uygulamayla test edin:**
   - nRF Connect (Android/iOS)
   - LightBlue (iOS)
   - Bu uygulamalarda cihaz görünüyorsa, sorun kodunuzda değil

2. **Cihazı yeniden başlatın:**
   - Test cihazınızı kapatıp açın
   - Telefonun Bluetooth'unu kapatıp açın

3. **Uygulamayı yeniden başlatın:**
   - Uygulamayı tamamen kapatın
   - Yeniden açın
   - Tekrar tarayın

4. **Konum servisini kontrol edin (Android):**
   - Ayarlar → Konum → Açık
   - Uygulama izinlerinde konum izni verildiğinden emin olun

### Sorun 2: "Bluetooth açık değil" Hatası

**Çözüm:**
- Telefon ayarlarından Bluetooth'u açın
- Uygulamayı yeniden başlatın

### Sorun 3: İzin Hatası

**Çözüm:**
- Uygulama ayarlarından tüm izinleri verin
- Uygulamayı yeniden başlatın

---

## 📱 Test İçin Alternatif Yöntemler

### Yöntem 1: Başka Bir Telefon Kullanın

Eğer başka bir telefonunuz varsa:
1. BLE yayın yapan bir uygulama kurun
2. İki telefonu yakına getirin
3. Birinde tarama yapın, diğerinde yayın yapın

### Yöntem 2: nRF Connect ile Test

1. **nRF Connect** uygulamasını indirin (ücretsiz)
2. Bu uygulamayla cihazları tarayın
3. Cihaz görünüyorsa → Sorun kodunuzda değil
4. Cihaz görünmüyorsa → Cihaz yayın yapmıyor veya BLE değil

### Yöntem 3: Basit BLE Cihazı Satın Alın

Test için ucuz BLE cihazları:
- Xiaomi Mi Band (fitness tracker)
- BLE butonları (IoT)
- BLE sensörleri

---

## 💡 İpuçları

1. **İlk test için basit bir cihaz kullanın:**
   - Fitness tracker'lar genellikle iyi çalışır
   - Akıllı saatler de iyi seçenek

2. **Terminal loglarını takip edin:**
   - "Cihaz bulundu" mesajlarını arayın
   - Hata mesajlarını okuyun

3. **Sabırlı olun:**
   - İlk tarama 10-30 saniye sürebilir
   - Cihazlar hemen görünmeyebilir

4. **Mesafeyi kontrol edin:**
   - Çok uzakta olmamalı
   - Engeller olmamalı

---

## ✅ Başarılı Test Belirtileri

Terminal'de şunları görmelisiniz:
```
BleManager başlatıldı
Bluetooth açık
Tarama başlatılıyor...
Tarama başlatıldı, 10 saniye sürecek...
=== CİHAZ BULUNDU ===
ID: XX:XX:XX:XX:XX:XX
İsim: [Cihaz Adı]
RSSI: -XX
Yeni cihaz listeye eklendi: [Cihaz Adı]
```

Uygulamada:
- ✅ Cihaz listesinde görünür
- ✅ Tıklanabilir
- ✅ Bağlanabilir

---

## 🆘 Hala Çalışmıyorsa

1. **Terminal loglarını paylaşın** - Hangi mesajları görüyorsunuz?
2. **Cihaz tipini belirtin** - Hangi cihazı test ediyorsunuz?
3. **Başka uygulamalarla test edin** - nRF Connect'te görünüyor mu?

