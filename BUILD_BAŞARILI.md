# ✅ Build Başarılı! - Yükleme Talimatları

## 🎉 Tebrikler! Build tamamlandı

APK dosyanız hazır. Şimdi cihazınıza yükleyin.

---

## 📱 Fiziksel Cihaza Yükleme (ÖNERİLEN)

### Adım 1: Linki Açın

Terminal'deki linki kullanın:
```
https://expo.dev/accounts/ikbal2343/projects/expo-cdtp/builds/3dc7e423-f6d6-4d53-a836-e814ff415d1c
```

**VEYA** QR kodu telefonunuzla tarayın.

### Adım 2: APK'yı İndirin

1. Linke tıklayın (telefonda veya bilgisayarda)
2. APK dosyasını indirin
3. Telefonunuza aktarın (USB, email, cloud vb.)

### Adım 3: Telefonda Yükleyin

1. Telefonunuzda **Ayarlar → Güvenlik → Bilinmeyen Kaynaklardan Yükleme** seçeneğini açın
2. İndirdiğiniz APK dosyasına tıklayın
3. "Yükle" butonuna basın
4. İzinleri onaylayın

### Adım 4: Uygulamayı Başlatın

1. Uygulamayı açın
2. Terminal'de şu komutu çalıştırın:
   ```bash
   npx expo start --dev-client
   ```
3. QR kodu tarayın veya URL'i manuel girin
4. Uygulama yüklenecek!

---

## 💻 Emülatör Kullanmak İsterseniz

### Android Studio Kurulumu Gerekli

1. **Android Studio İndirin:**
   - https://developer.android.com/studio
   - Kurulum sırasında Android SDK'yı da kurun

2. **Environment Variables Ayarlayın:**
   
   `~/.zshrc` dosyanıza ekleyin:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

3. **Terminal'i Yeniden Başlatın:**
   ```bash
   source ~/.zshrc
   ```

4. **Emülatör Oluşturun:**
   - Android Studio'yu açın
   - Tools → Device Manager
   - "Create Device" butonuna tıklayın
   - Bir cihaz seçin ve emülatör oluşturun

5. **APK'yı Yükleyin:**
   ```bash
   adb install path/to/your/app.apk
   ```

---

## ⚠️ ÖNEMLİ NOTLAR

### Bluetooth Testi İçin:
- ✅ **Fiziksel cihaz kullanın** - Bluetooth emülatörde çalışmaz
- ✅ **Gerçek Bluetooth cihazına bağlanın** - Test için gerçek bir BLE cihazı gerekli

### Development Build Özellikleri:
- ✅ Hot reload çalışır
- ✅ Kod değişiklikleri otomatik yansır
- ✅ Native modüller çalışır (Bluetooth, Bildirimler)

---

## 🚀 Sonraki Adımlar

1. **APK'yı fiziksel cihazınıza yükleyin**
2. **Metro bundler'ı başlatın:**
   ```bash
   npx expo start --dev-client
   ```
3. **Telefonda QR kodu tarayın**
4. **Bluetooth cihazlarını tarayın ve test edin!**

---

## ❓ Sorun Giderme

### APK yüklenmiyor:
- Bilinmeyen kaynaklardan yükleme iznini kontrol edin
- APK dosyasının bozuk olmadığından emin olun
- Başka bir cihazda deneyin

### Metro bundler bağlanmıyor:
- `SORUN_GIDERME.md` dosyasına bakın
- Tunnel modu deneyin: `npx expo start --dev-client --tunnel`

### Bluetooth çalışmıyor:
- Telefon ayarlarından Bluetooth izinlerini kontrol edin
- Uygulamayı kapatıp yeniden açın
- Bluetooth'un açık olduğundan emin olun

---

## 📞 Yardım

Daha fazla bilgi için:
- `SORUN_GIDERME.md` - Bağlantı sorunları
- `CONNECTION_FIX.md` - Network sorunları
- `ADIM_ADIM_TALIMATLAR.md` - Genel talimatlar

