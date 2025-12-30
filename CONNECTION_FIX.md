# 🔌 "Failed to Connect" Hatası - Hızlı Çözümler

## ✅ Çözüm 1: Tunnel Modu (ŞU AN ÇALIŞIYOR)

Tunnel modu başlatıldı. Terminal'de yeni bir URL/QR kod göreceksiniz.

**Avantajları:**
- Farklı WiFi ağlarında çalışır
- Firewall sorunlarını aşar
- Daha güvenilir bağlantı

**Dezavantajları:**
- Biraz daha yavaş olabilir
- İlk bağlantı uzun sürebilir

---

## 🔄 Çözüm 2: Manuel URL ile Bağlanma

Eğer QR kod çalışmazsa:

1. Terminal'de şu formatta bir URL göreceksiniz:
   ```
   exp://u.expo.dev/xxxxx-xxxxx
   ```
   veya
   ```
   exp://192.168.x.x:8081
   ```

2. Telefonunuzdaki development build uygulamasında:
   - "Enter URL manually" veya "Connect manually" seçeneğini seçin
   - Terminal'deki URL'i kopyalayıp yapıştırın
   - "Connect" butonuna basın

---

## 🌐 Çözüm 3: LAN Modu (Aynı WiFi'de)

Eğer telefon ve bilgisayar **kesinlikle aynı WiFi'de** ise:

```bash
# Önce mevcut server'ı durdurun (Ctrl+C)
# Sonra:
npx expo start --dev-client --lan --clear
```

**Kontrol:**
- Telefon WiFi ayarlarından aynı ağda olduğunuzu kontrol edin
- Bilgisayarınızın IP adresini öğrenin:
  ```bash
  # Mac için:
  ifconfig | grep "inet "
  ```

---

## 🔥 Çözüm 4: Firewall/Antivirus Kontrolü

Bazen firewall Metro bundler'ı engelleyebilir:

### Mac:
1. System Preferences → Security & Privacy → Firewall
2. Metro bundler'a izin verin
3. Port 8081'in açık olduğundan emin olun

### Windows:
1. Windows Defender Firewall
2. Metro bundler için exception ekleyin

---

## 📱 Çözüm 5: Telefon Ayarları

### Android:
1. **Geliştirici Seçenekleri:**
   - Ayarlar → Telefon Hakkında → Build numarasına 7 kez dokunun
   - Geliştirici seçeneklerini açın
   - "USB Debugging" açık olmalı (gerekirse)

2. **Uygulama İzinleri:**
   - Ayarlar → Uygulamalar → Development Build
   - Tüm izinleri verin

3. **Ağ Ayarları:**
   - WiFi'yi kapatıp açın
   - Mobil veriyi kapatın (sadece WiFi kullanın)

### iOS:
1. Ayarlar → WiFi → Bilgisayarınızın ağına bağlı olduğundan emin olun
2. Geliştirici modu açık olmalı (iOS 16+)

---

## 🔍 Çözüm 6: Port Değiştirme

Port 8081 kullanılıyorsa, farklı bir port deneyin:

```bash
npx expo start --dev-client --port 8082 --tunnel
```

---

## 🧹 Çözüm 7: Tam Temizlik

Her şey başarısız olursa:

```bash
# 1. Metro bundler'ı durdurun (Ctrl+C)

# 2. Cache'leri temizleyin
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --dev-client --tunnel --clear

# 3. Telefondaki uygulamayı kapatın ve yeniden açın
```

---

## ✅ Başarılı Bağlantı Kontrolü

Bağlantı başarılı olduğunda:

- ✅ Terminal'de "Connected" mesajı görünür
- ✅ Telefonda uygulama yüklenir
- ✅ Terminal'de bundle bilgileri görünür
- ✅ Kod değişiklikleri otomatik yansır

---

## 🆘 Hala Çalışmıyorsa

### Adım 1: Terminal Çıktısını Kontrol Edin

Terminal'deki tam hata mesajını okuyun. Genellikle sorunun kaynağını gösterir.

### Adım 2: Development Build'i Yeniden Yükleyin

Bazen development build'in kendisi sorunlu olabilir:

```bash
eas build --platform android --profile development
```

### Adım 3: Expo Dokümantasyonu

- https://docs.expo.dev/develop/development-builds/troubleshooting/
- https://docs.expo.dev/workflow/development-mode/

---

## 💡 İpuçları

1. **İlk bağlantı 30-60 saniye sürebilir** - Sabırlı olun
2. **Tunnel modu en güvenilir yöntemdir** - Önce bunu deneyin
3. **VPN kullanıyorsanız kapatın** - Bağlantıyı engelleyebilir
4. **Mobil veri kapalı olmalı** - Sadece WiFi kullanın
5. **Telefon ve bilgisayar yakın olmalı** - Zayıf sinyal sorun çıkarabilir

