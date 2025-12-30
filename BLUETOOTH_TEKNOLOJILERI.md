# 📱 Bluetooth Bağlantısı - Teknoloji Seçenekleri

## 🎯 İhtiyacınıza Göre En İyi Seçenekler

---

## 1️⃣ **Flutter** ⭐ (ÖNERİLEN - En Kolay)

### Avantajlar:
- ✅ Bluetooth için **mükemmel destek**
- ✅ **Kolay kurulum** ve kullanım
- ✅ **Cross-platform** (Android + iOS)
- ✅ **Hot reload** çalışır
- ✅ **Native performans**
- ✅ **Çok iyi dokümantasyon**

### Kurulum:
```bash
# 1. Flutter kurulumu
# https://flutter.dev/docs/get-started/install

# 2. Proje oluştur
flutter create bluetooth_app
cd bluetooth_app

# 3. Bluetooth paketi ekle
flutter pub add flutter_blue_plus

# 4. Çalıştır
flutter run
```

### Örnek Kod:
```dart
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

// Cihazları tara
FlutterBluePlus.startScan(timeout: Duration(seconds: 4));

// Cihazları dinle
FlutterBluePlus.scanResults.listen((results) {
  for (ScanResult result in results) {
    print('Cihaz: ${result.device.name}');
  }
});

// Bağlan
await device.connect();

// Veri oku
List<int> value = await characteristic.read();
```

### Paketler:
- `flutter_blue_plus` - En popüler ve aktif
- `flutter_reactive_ble` - Reactive yaklaşım
- `flutter_blue` - Eski ama stabil

**⭐ Flutter en kolay ve en güvenilir seçenek!**

---

## 2️⃣ **React Native (Expo Olmadan)** 

### Avantajlar:
- ✅ JavaScript/TypeScript kullanır (mevcut bilginiz)
- ✅ Daha fazla native kontrol
- ✅ Expo kısıtlamaları yok

### Dezavantajlar:
- ❌ Expo kadar kolay değil
- ❌ Native modül kurulumu gerekir

### Kurulum:
```bash
# 1. React Native CLI ile proje oluştur
npx react-native init BluetoothApp

# 2. Bluetooth paketi ekle
npm install react-native-ble-manager
# veya
npm install react-native-ble-plx

# 3. Native modülü link et (otomatik)
cd ios && pod install && cd ..

# 4. Çalıştır
npx react-native run-android
```

### Paketler:
- `react-native-ble-plx` - En popüler
- `react-native-ble-manager` - Daha basit API
- `@react-native-community/bluetooth` - Community paketi

---

## 3️⃣ **Expo ile Alternatif Bluetooth Paketi**

Mevcut Expo projenizde farklı bir paket deneyebilirsiniz:

### Seçenek A: `react-native-ble-manager`
```bash
npm install react-native-ble-manager
```

**Avantaj:** Daha basit API, daha az hata

### Seçenek B: Expo Config Plugin ile Custom Native Modül
```bash
npx expo install expo-build-properties
```

**Avantaj:** Expo ekosisteminde kalırsınız

---

## 4️⃣ **Native Android (Kotlin/Java)**

### Avantajlar:
- ✅ **Tam kontrol**
- ✅ **En iyi performans**
- ✅ **Tüm özellikler**

### Dezavantajlar:
- ❌ Sadece Android
- ❌ Daha uzun geliştirme süresi
- ❌ Java/Kotlin bilgisi gerekir

### Örnek (Kotlin):
```kotlin
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.le.ScanCallback

val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()

// Tarama
val scanner = bluetoothAdapter?.bluetoothLeScanner
scanner?.startScan(scanCallback)

// Bağlan
device.connectGatt(context, false, gattCallback)
```

---

## 5️⃣ **Native iOS (Swift)**

### Avantajlar:
- ✅ **Tam kontrol**
- ✅ **iOS özellikleri**

### Dezavantajlar:
- ❌ Sadece iOS
- ❌ Swift/Objective-C bilgisi gerekir

### Örnek (Swift):
```swift
import CoreBluetooth

class BluetoothManager: NSObject, CBCentralManagerDelegate {
    var centralManager: CBCentralManager!
    
    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            central.scanForPeripherals(withServices: nil)
        }
    }
}
```

---

## 6️⃣ **Web Bluetooth API** (Sadece Web)

### Avantajlar:
- ✅ Tarayıcıda çalışır
- ✅ Kurulum gerekmez

### Dezavantajlar:
- ❌ Sadece web
- ❌ Chrome/Edge gerekir
- ❌ HTTPS gerekir

### Örnek:
```javascript
navigator.bluetooth.requestDevice({
  filters: [{ services: ['battery_service'] }]
})
.then(device => device.gatt.connect())
.then(server => server.getPrimaryService('battery_service'))
.then(service => service.getCharacteristic('battery_level'))
.then(characteristic => characteristic.readValue())
```

---

## 🎯 Hangi Teknolojisi Seçmeliyim?

### Eğer:
- **Hızlı başlamak istiyorsanız** → **Flutter** ⭐
- **JavaScript/React biliyorsanız** → **React Native (Expo olmadan)**
- **Expo'da kalmak istiyorsanız** → **Alternatif Bluetooth paketi deneyin**
- **Sadece Android** → **Native Android**
- **Sadece iOS** → **Native iOS**
- **Web'de çalışması yeterli** → **Web Bluetooth API**

---

## 💡 Önerim: **Flutter**

### Neden Flutter?
1. ✅ Bluetooth için **en kolay** ve **en güvenilir**
2. ✅ **Hızlı geliştirme** (hot reload)
3. ✅ **İyi dokümantasyon**
4. ✅ **Aktif topluluk**
5. ✅ **Cross-platform** (tek kod, iki platform)

### Flutter Kurulumu:
```bash
# 1. Flutter'ı indirin
# https://flutter.dev/docs/get-started/install/macos

# 2. Proje oluşturun
flutter create bluetooth_app
cd bluetooth_app

# 3. Bluetooth paketi ekleyin
flutter pub add flutter_blue_plus

# 4. Çalıştırın
flutter run
```

### Flutter Bluetooth Örnek Proje:
```dart
// main.dart
import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: BluetoothScreen(),
    );
  }
}

class BluetoothScreen extends StatefulWidget {
  @override
  _BluetoothScreenState createState() => _BluetoothScreenState();
}

class _BluetoothScreenState extends State<BluetoothScreen> {
  List<BluetoothDevice> devices = [];

  void scanDevices() {
    FlutterBluePlus.startScan(timeout: Duration(seconds: 4));
    
    FlutterBluePlus.scanResults.listen((results) {
      setState(() {
        devices = results.map((r) => r.device).toList();
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Bluetooth Cihazları')),
      body: Column(
        children: [
          ElevatedButton(
            onPressed: scanDevices,
            child: Text('Cihazları Tara'),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: devices.length,
              itemBuilder: (context, index) {
                return ListTile(
                  title: Text(devices[index].name ?? 'Bilinmeyen'),
                  subtitle: Text(devices[index].remoteId.toString()),
                  onTap: () async {
                    await devices[index].connect();
                    // Bağlandı!
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 🔄 Mevcut Expo Projenizde Devam Etmek İsterseniz

### Seçenek 1: Farklı Bluetooth Paketi
```bash
npm uninstall react-native-ble-plx
npm install react-native-ble-manager
```

### Seçenek 2: Expo Config Plugin
```bash
npx expo install expo-build-properties
```

### Seçenek 3: Development Build Yapın
```bash
eas build --platform android --profile development
```

---

## 📚 Kaynaklar

### Flutter:
- https://pub.dev/packages/flutter_blue_plus
- https://flutter.dev/docs

### React Native:
- https://github.com/dotintent/react-native-ble-plx
- https://reactnative.dev/docs/bluetooth

### Native Android:
- https://developer.android.com/guide/topics/connectivity/bluetooth

### Native iOS:
- https://developer.apple.com/documentation/corebluetooth

---

## ❓ Hangi Teknolojiyi Seçmeliyim?

**Kısa cevap:** **Flutter** - Bluetooth için en kolay ve en güvenilir!

**Uzun cevap:** İhtiyacınıza göre yukarıdaki tabloya bakın.

