# 🔵 ESP32 ile BLE Yayın Yapma Rehberi

## 🎯 ESP32 Nedir?

**ESP32** - WiFi ve Bluetooth (BLE) destekleyen geliştirme kartıdır.

### Özellikler:
- ✅ **WiFi** desteği
- ✅ **Bluetooth Low Energy (BLE)** desteği
- ✅ **Düşük maliyet**
- ✅ **Kolay programlanabilir**

---

## 📋 Gereksinimler

### Donanım:
- ✅ ESP32 geliştirme kartı (sizde var)
- ✅ USB kablosu (ESP32'yi bilgisayara bağlamak için)
- ✅ Bilgisayar (Windows/Mac/Linux)

### Yazılım:
- ✅ **Arduino IDE** veya **PlatformIO**
- ✅ ESP32 board desteği

---

## 🚀 Kurulum Adımları

### Adım 1: Arduino IDE'yi İndirin

1. **Arduino IDE**'yi indirin: https://www.arduino.cc/en/software
2. Kurulumu yapın

### Adım 2: ESP32 Board Desteğini Ekleyin

1. Arduino IDE'yi açın
2. **File → Preferences** (Mac: Arduino → Preferences)
3. **Additional Board Manager URLs** kısmına şunu ekleyin:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. **OK** butonuna basın

### Adım 3: ESP32 Board'unu Yükleyin

1. **Tools → Board → Boards Manager**
2. "esp32" arayın
3. **"esp32 by Espressif Systems"** paketini bulun
4. **Install** butonuna basın
5. Kurulum tamamlanana kadar bekleyin

### Adım 4: Board'u Seçin

1. **Tools → Board → ESP32 Arduino**
2. **ESP32 Dev Module** seçin (veya kartınıza uygun olanı)

### Adım 5: Port'u Seçin

1. ESP32'yi USB ile bilgisayara bağlayın
2. **Tools → Port**
3. ESP32'nin bağlı olduğu port'u seçin (ör: COM3, /dev/ttyUSB0, /dev/cu.usbserial-...)

---

## 💻 Kodu Yükleme

### Adım 1: Kodu Açın

1. `ESP32_BLE_YAYIN.ino` dosyasını Arduino IDE'de açın
2. Veya kodu kopyalayıp yeni bir sketch'e yapıştırın

### Adım 2: Kodu Yükleyin

1. **Sketch → Verify/Compile** (Ctrl+R / Cmd+R) - Kodu derleyin
2. Hata yoksa:
3. **Sketch → Upload** (Ctrl+U / Cmd+U) - Kodu ESP32'ye yükleyin
4. Yükleme tamamlanana kadar bekleyin

### Adım 3: Serial Monitor'ü Açın

1. **Tools → Serial Monitor** (Ctrl+Shift+M / Cmd+Shift+M)
2. **Baud rate: 115200** seçin
3. Şu mesajları görmelisiniz:
   ```
   ESP32 BLE Yayın Başlatılıyor...
   Yayın başlatıldı! Cihaz adı: ESP32-Test-Cihazi
   Telefonunuzdan 'ESP32-Test-Cihazi' adlı cihazı arayın
   ```

---

## 📱 Telefonda Test

### Adım 1: Uygulamanızı Açın

1. Development build uygulamanızı açın
2. "Cihazları Tara" butonuna basın
3. **"ESP32-Test-Cihazi"** adlı cihazı görmelisiniz!

### Adım 2: Bağlanın

1. Cihaza tıklayın
2. Bağlantı kurulur
3. Veri almaya başlarsınız!

---

## 🔧 Kod Açıklaması

### Önemli Bölümler:

```cpp
// Cihaz adı (telefonda görünecek)
#define DEVICE_NAME "ESP32-Test-Cihazi"
```

**Değiştirebilirsiniz:** İstediğiniz ismi yazabilirsiniz

```cpp
// Servis UUID'si
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
// Karakteristik UUID'si
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
```

**Değiştirebilirsiniz:** Kendi UUID'lerinizi oluşturabilirsiniz (online UUID generator kullanın)

### Veri Gönderme:

Kod her 2 saniyede bir veri gönderir:
```cpp
String message = "ESP32'den veri: " + String(millis() / 1000) + " saniye";
pCharacteristic->setValue(message.c_str());
pCharacteristic->notify(); // Bildirim gönder
```

**Değiştirebilirsiniz:** İstediğiniz veriyi gönderebilirsiniz

---

## 🎯 Özelleştirme

### Cihaz Adını Değiştirme:

```cpp
#define DEVICE_NAME "Benim-ESP32-Cihazim"
```

### Veri Gönderme Sıklığını Değiştirme:

```cpp
if (currentTime - lastTime >= 5000) { // 5 saniyede bir
```

### Farklı Veri Gönderme:

```cpp
String message = "Sıcaklık: 25.5°C";
// veya
String message = "Sensör değeri: " + String(analogRead(A0));
```

---

## ✅ Test Kontrol Listesi

### ESP32 Tarafı:
- [ ] Arduino IDE kurulu
- [ ] ESP32 board desteği yüklü
- [ ] ESP32 USB ile bağlı
- [ ] Port seçili
- [ ] Kod yüklendi
- [ ] Serial Monitor'de "Yayın başlatıldı" mesajı görünüyor

### Telefon Tarafı:
- [ ] Development build uygulaması yüklü
- [ ] Bluetooth açık
- [ ] İzinler verildi
- [ ] "Cihazları Tara" butonuna basıldı
- [ ] "ESP32-Test-Cihazi" görünüyor
- [ ] Bağlantı kuruldu
- [ ] Veri alınıyor

---

## 🔍 Sorun Giderme

### Sorun 1: Kod yüklenmiyor

**Çözüm:**
- Port'un doğru seçildiğinden emin olun
- ESP32'nin USB kablosu çalışıyor mu kontrol edin
- Board'un doğru seçildiğinden emin olun

### Sorun 2: Serial Monitor'de mesaj görünmüyor

**Çözüm:**
- Baud rate'in 115200 olduğundan emin olun
- ESP32'nin reset butonuna basın
- Serial Monitor'ü kapatıp açın

### Sorun 3: Telefonda cihaz görünmüyor

**Çözüm:**
- ESP32'nin açık olduğundan emin olun
- Serial Monitor'de "Yayın başlatıldı" mesajını görüyor musunuz?
- Telefon ve ESP32 yakında mı? (10-30 metre)
- nRF Connect ile test edin - görünüyor mu?

### Sorun 4: Bağlantı kurulamıyor

**Çözüm:**
- ESP32'yi reset edin
- Telefonun Bluetooth'unu kapatıp açın
- Uygulamayı yeniden başlatın

---

## 📊 Beklenen Sonuç

### Serial Monitor'de:
```
ESP32 BLE Yayın Başlatılıyor...
Yayın başlatıldı! Cihaz adı: ESP32-Test-Cihazi
Telefonunuzdan 'ESP32-Test-Cihazi' adlı cihazı arayın
Cihaz bağlandı!
Veri gönderildi: ESP32'den veri: 2 saniye
Veri gönderildi: ESP32'den veri: 4 saniye
...
```

### Telefonda:
- ✅ "ESP32-Test-Cihazi" cihaz listesinde görünür
- ✅ Bağlantı kurulur
- ✅ Veri alınır
- ✅ Bildirimler gelir

---

## 🎉 Başarılı!

ESP32 artık BLE yayın yapıyor! Telefonunuzdan bulabilir, bağlanabilir ve veri alabilirsiniz!

---

## 📚 Ek Kaynaklar

- ESP32 BLE Dokümantasyonu: https://docs.espressif.com/projects/arduino-esp32/en/latest/api/bluetooth.html
- Arduino IDE: https://www.arduino.cc/en/software
- ESP32 Board Manager: https://github.com/espressif/arduino-esp32

