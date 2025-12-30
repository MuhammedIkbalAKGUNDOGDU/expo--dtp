# 🔧 "Unable to Reload Script" Hatası - Çözüm

## ❌ Hata: `java.lang.RuntimeException: Unable to reload script`

Bu hata, Metro bundler'ın development build uygulamasına bağlanamamasından kaynaklanır.

---

## ✅ Çözüm Adımları

### 1. Metro Bundler'ı Doğru Şekilde Başlatın

**ÖNEMLİ:** Development build için `--dev-client` flag'i **mutlaka** kullanılmalı!

Terminal'de şu komutu çalıştırın:

```bash
npx expo start --dev-client --clear
```

veya

```bash
npm run start:clear
```

**`--clear` flag'i cache'i temizler ve sorunları çözer.**

### 2. Telefon ve Bilgisayar Aynı WiFi'de Olmalı

- ✅ Telefon ve bilgisayarınız **aynı WiFi ağında** olmalı
- ❌ Farklı ağlarda olamazlar
- ❌ Telefon mobil veri kullanıyorsa çalışmaz

### 3. Tunnel Modu Kullanın (WiFi Sorunu Varsa)

Eğer aynı WiFi'de olamıyorsanız, tunnel modu kullanın:

```bash
npx expo start --dev-client --tunnel
```

**Not:** Tunnel modu daha yavaş olabilir ama farklı ağlarda çalışır.

### 4. Manuel URL ile Bağlanın

QR kod çalışmazsa:

1. Metro bundler başladığında terminal'de bir URL göreceksiniz:
   ```
   exp://192.168.1.100:8081
   ```

2. Telefonunuzdaki development build uygulamasında:
   - "Enter URL manually" seçeneğini seçin
   - Bu URL'i girin

### 5. Uygulamayı Yeniden Başlatın

1. Telefondaki uygulamayı **tamamen kapatın** (arka plandan da kaldırın)
2. Metro bundler'ı durdurun (Ctrl+C)
3. Cache'i temizleyin:
   ```bash
   npx expo start --dev-client --clear
   ```
4. Uygulamayı tekrar açın ve QR kodu tarayın

---

## 🔍 Detaylı Kontrol Listesi

### ✅ Kontrol Edin:

- [ ] Metro bundler `--dev-client` ile başlatıldı mı?
- [ ] Telefon ve bilgisayar aynı WiFi'de mi?
- [ ] Firewall Metro bundler'ı engelliyor mu?
- [ ] Uygulama tamamen kapatılıp yeniden açıldı mı?
- [ ] Cache temizlendi mi (`--clear` flag'i kullanıldı mı)?

### 🔄 Alternatif Çözümler:

#### A) Port Değiştirin

```bash
npx expo start --dev-client --port 8082
```

#### B) LAN Modu

```bash
npx expo start --dev-client --lan
```

#### C) Localhost Modu (Emülatör için)

```bash
npx expo start --dev-client --localhost
```

---

## 📱 Telefonda Yapılacaklar

1. **Development build uygulamasını açın**
2. **QR kodu tarayın** veya **manuel URL girin**
3. **"Reload" butonuna basın** (eğer varsa)
4. **Uygulamayı kapatıp yeniden açın**

---

## 🚨 Hala Çalışmıyorsa

### Adım 1: Tüm Cache'leri Temizleyin

```bash
# Metro bundler cache
npx expo start --dev-client --clear

# Node modules (gerekirse)
rm -rf node_modules
npm install

# Watchman cache (Mac için)
watchman watch-del-all
```

### Adım 2: Development Build'i Yeniden Yükleyin

Bazen development build'in kendisi sorunlu olabilir:

```bash
# Yeni build oluşturun
eas build --platform android --profile development
```

### Adım 3: Logları Kontrol Edin

Terminal'deki hata mesajlarını okuyun. Genellikle sorunun kaynağını gösterir.

---

## 💡 İpuçları

- **İlk bağlantı yavaş olabilir** - Sabırlı olun
- **WiFi bağlantısı güçlü olmalı** - Zayıf sinyal sorun çıkarabilir
- **VPN kullanıyorsanız kapatın** - Metro bundler bağlantısını engelleyebilir
- **Antivirus/firewall kontrol edin** - Port 8081'i engelliyor olabilir

---

## ✅ Başarılı Bağlantı Belirtileri

Metro bundler başarıyla bağlandığında:

- Terminal'de "Connected" mesajı görünür
- Telefonda uygulama yüklenir
- Kod değişiklikleri otomatik yansır (hot reload)
- Terminal'de bundle bilgileri görünür

