# Development Build Kurulum Talimatları

## ⚠️ ÖNEMLİ: Expo Go ÇALIŞMAZ!

Bu uygulama native modüller (Bluetooth, Bildirimler) kullanıyor ve Expo Go'da çalışmaz.

## Seçenek 1: EAS Build (Önerilen - En Kolay)

### Adımlar:

1. **EAS'a giriş yapın:**
   ```bash
   eas login
   ```
   (Expo hesabınız yoksa ücretsiz oluşturun: https://expo.dev/signup)

2. **Development build oluşturun:**
   
   **Android için:**
   ```bash
   eas build --platform android --profile development
   ```
   
   **iOS için:**
   ```bash
   eas build --platform ios --profile development
   ```

3. **Build tamamlandığında QR kod ile cihazınıza yükleyin**

4. **Uygulamayı başlatın:**
   ```bash
   npx expo start --dev-client
   ```

## Seçenek 2: Yerel Build (iOS - Mac'te)

### Önkoşullar:
- Xcode kurulu (App Store'dan)
- CocoaPods kurulu

### CocoaPods Kurulumu:
```bash
sudo gem install cocoapods
```

### Build:
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

## Seçenek 3: Yerel Build (Android)

### Önkoşullar:
- Android Studio kurulu
- ANDROID_HOME environment variable ayarlı

### Android Studio Kurulumu:
1. https://developer.android.com/studio adresinden indirin
2. Kurulum sırasında Android SDK'yı da kurun
3. ~/.zshrc dosyanıza ekleyin:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```
4. Terminalde:
   ```bash
   source ~/.zshrc
   npx expo run:android
   ```

## Hızlı Başlangıç (EAS Build)

En hızlı yol EAS Build kullanmaktır:

```bash
# 1. Giriş yap
eas login

# 2. Android build (yaklaşık 15-20 dakika)
eas build --platform android --profile development

# 3. Build tamamlandıktan sonra
npx expo start --dev-client
```

Build tamamlandığında size bir link verilecek, bu linkten APK'yı indirip cihazınıza yükleyebilirsiniz.

