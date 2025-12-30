/*
 * ESP32 BLE Yayın (Advertising) Kodu
 * Bu kod ESP32'yi BLE yayın yapan bir cihaz haline getirir
 * Telefonunuzdan bu cihazı bulabilir ve bağlanabilirsiniz
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Servis UUID'si (istediğiniz gibi değiştirebilirsiniz)
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
// Karakteristik UUID'si (istediğiniz gibi değiştirebilirsiniz)
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer *pServer = NULL;
BLECharacteristic *pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Cihaz adı (telefonda görünecek isim)
#define DEVICE_NAME "ESP32-Test-Cihazi"

// Callback: Cihaz bağlandığında
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Cihaz bağlandı!");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Cihaz bağlantısı kesildi!");
    }
};

// Callback: Veri yazıldığında
class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string rxValue = pCharacteristic->getValue();

      if (rxValue.length() > 0) {
        Serial.println("Alınan veri:");
        for (int i = 0; i < rxValue.length(); i++) {
          Serial.print((char)rxValue[i]);
        }
        Serial.println();
      }
    }
};

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 BLE Yayın Başlatılıyor...");

  // BLE cihazını başlat
  BLEDevice::init(DEVICE_NAME);
  
  // BLE Server oluştur
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Servis oluştur
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Karakteristik oluştur (okuma, yazma, bildirim özellikli)
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );

  pCharacteristic->setCallbacks(new MyCallbacks());

  // Descriptor ekle (bildirimler için)
  pCharacteristic->addDescriptor(new BLE2902());

  // Başlangıç değeri
  pCharacteristic->setValue("Merhaba ESP32!");
  
  // Servisi başlat
  pService->start();

  // Yayın (advertising) başlat
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);  // iOS bağlantısı için
  BLEDevice::startAdvertising();

  Serial.println("Yayın başlatıldı! Cihaz adı: " + String(DEVICE_NAME));
  Serial.println("Telefonunuzdan 'ESP32-Test-Cihazi' adlı cihazı arayın");
}

void loop() {
  // Bağlantı durumu kontrolü
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // Bluetooth stack hazır olana kadar bekle
    pServer->startAdvertising(); // Yayını yeniden başlat
    Serial.println("Yayın yeniden başlatıldı");
    oldDeviceConnected = deviceConnected;
  }
  
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  // Bağlı cihaza veri gönder (örnek: her 2 saniyede bir)
  if (deviceConnected) {
    static unsigned long lastTime = 0;
    unsigned long currentTime = millis();
    
    if (currentTime - lastTime >= 2000) { // 2 saniyede bir
      String message = "ESP32'den veri: " + String(millis() / 1000) + " saniye";
      pCharacteristic->setValue(message.c_str());
      pCharacteristic->notify(); // Bildirim gönder
      Serial.println("Veri gönderildi: " + message);
      lastTime = currentTime;
    }
  }
  
  delay(100);
}

