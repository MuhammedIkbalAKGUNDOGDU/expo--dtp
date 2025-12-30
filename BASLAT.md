# 🚀 Metro Bundler'ı Başlatma

## Terminal'de Şu Komutu Çalıştırın:

```bash
npx expo start --dev-client --tunnel --clear
```

## Ne Olacak?

1. **Cache temizlenecek** (`--clear`)
2. **Tunnel modu başlayacak** (`--tunnel`)
3. **Development client modu aktif olacak** (`--dev-client`)

## Beklenen Çıktı:

Birkaç saniye sonra terminal'de şunları göreceksiniz:

```
› Metro waiting on exp://u.expo.dev/xxxxx-xxxxx
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu

› Press ? │ show all commands

Logs for your project will appear below. Press Ctrl+C to exit.
```

## URL Formatı:

Tunnel modunda URL şu formatta olacak:
```
exp://u.expo.dev/xxxxx-xxxxx
```

veya

```
exp://192.168.x.x:8081
```

## Sorun Giderme:

### Eğer hata alırsanız:

1. **Port kullanımda hatası:**
   ```bash
   # Farklı port deneyin
   npx expo start --dev-client --tunnel --port 8082 --clear
   ```

2. **Network hatası:**
   ```bash
   # LAN modu deneyin (aynı WiFi'de)
   npx expo start --dev-client --lan --clear
   ```

3. **Tunnel başlamıyor:**
   ```bash
   # Tunnel olmadan deneyin (aynı WiFi gerekli)
   npx expo start --dev-client --clear
   ```

## Telefonda Bağlanma:

1. Development build uygulamasını açın
2. QR kodu tarayın VEYA
3. "Enter URL manually" seçeneğini seçin
4. Terminal'deki URL'i girin

