# 📱 Development Build - Adım Adım Talimatlar

## ⚠️ ÖNEMLİ: Expo Go ÇALIŞMAZ!

Telefonda gördüğünüz hata mesajı normaldir. Development build yapmanız gerekiyor.

---

## 🚀 Hızlı Başlangıç (EAS Build)

### Adım 1: EAS'a Giriş Yapın

Terminal'de şu komutu çalıştırın:

```bash
eas login
```

- Eğer Expo hesabınız yoksa, ücretsiz oluşturun: https://expo.dev/signup
- Email ve şifrenizi girin

### Adım 2: Android Development Build Oluşturun

Terminal'de şu komutu çalıştırın:

```bash
eas build --platform android --profile development
```

**Bu işlem yaklaşık 15-20 dakika sürecek.**

Build başladığında:
- Build ID alacaksınız
- Build durumunu takip edebilirsiniz: https://expo.dev/accounts/[your-account]/builds

### Adım 3: Build Tamamlandığında

Build tamamlandığında:
1. Terminal'de bir QR kod veya link göreceksiniz
2. Bu linke tıklayın veya QR kodu telefonunuzla tarayın
3. APK dosyasını indirin
4. Telefonunuza yükleyin (Bilinmeyen kaynaklardan yükleme izni gerekebilir)

### Adım 4: Uygulamayı Başlatın

Development build yüklendikten sonra, terminal'de şu komutu çalıştırın:

```bash
npx expo start --dev-client
```

Bu komut:
- Metro bundler'ı başlatır
- QR kod gösterir
- Telefonunuzdaki development build uygulaması ile bağlanır

### Adım 5: Telefonda Bağlanın

1. Telefonunuzdaki development build uygulamasını açın
2. QR kodu tarayın veya "Enter URL manually" ile bağlanın
3. Uygulama yüklenecek ve çalışacak!

---

## 🔄 Sonraki Kullanımlar

Development build bir kez yüklendikten sonra:
- Sadece `npx expo start --dev-client` komutunu çalıştırmanız yeterli
- Kod değişiklikleriniz otomatik olarak yüklenecek (hot reload)

---

## ❓ Sorun Giderme

### Build başarısız olursa:
- `eas build:list` ile build durumunu kontrol edin
- Hata mesajlarını okuyun

### Telefonda uygulama açılmazsa:
- `npx expo start --dev-client --clear` ile cache'i temizleyin
- Telefon ve bilgisayarın aynı WiFi ağında olduğundan emin olun

### Bluetooth hala çalışmazsa:
- Telefon ayarlarından Bluetooth izinlerini kontrol edin
- Uygulamayı kapatıp tekrar açın

---

## 📞 Yardım

Daha fazla bilgi için:
- EAS Build dokümantasyonu: https://docs.expo.dev/build/introduction/
- Development Build: https://docs.expo.dev/develop/development-builds/introduction/

