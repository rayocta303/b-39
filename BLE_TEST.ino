#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <Preferences.h>
Preferences prefs;

#define SERVICE_UUID        "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

BLECharacteristic* pCharacteristic;

// Simulasi SN & Lisensi
String serialNumber = "SN123456789";
uint8_t licenseType = 0; // 0 = No License, 1 = Basic, 2 = Middle, 3 = Full

class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) override {
      Serial.println("🟢 Web connected via BLE");
    }

    void onDisconnect(BLEServer* pServer) override {
      Serial.println("Web disconnected. Restarting advertising...");
      delay(500);
      pServer->startAdvertising();
    }
};
class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pChar) override {
    String cmd = String(pChar->getValue().c_str());
    Serial.print("Received [");
    Serial.print(cmd.length());
    Serial.print(" bytes]: ");
    Serial.println(cmd);

    // === Respon info SN + lisensi ===
    if (cmd == "info") {
      String res = "0" + String(licenseType) + serialNumber;
      pChar->setValue(res.c_str());
      pChar->notify();
      Serial.println("📤 Sent info: " + res);
      return;
    }

    // === Reset lisensi
    if (cmd == "resetlisensi") {
      prefs.begin("lisensi", false);
      prefs.putUChar("tipe", 0);
      prefs.end();
      licenseType = 0;

      String res = "Lisensi berhasil di-reset.";
      pChar->setValue(res.c_str());
      pChar->notify();

      Serial.println("Lisensi di-reset!");
      return;
    }

    // === Aktivasi Lisensi ===
    if (cmd.startsWith("lisensi")) {
      String code = cmd.substring(7);
      Serial.println("Lisensi code: " + code);

      if (code == "ABC123") {
        licenseType = 3; // Full

        prefs.begin("lisensi", false);
        prefs.putUChar("tipe", licenseType);
        prefs.end();

        String msg = "Lisensi diterima dan aktivasi berhasil!";
        pChar->setValue(msg.c_str());
        pChar->notify();
        Serial.println("Aktivasi berhasil & disimpan ke flash");
      } else {
        String msg = "Kode lisensi salah!";
        pChar->setValue(msg.c_str());
        pChar->notify();
        Serial.println("Aktivasi gagal: kode salah");
      }
      return;
    }
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE Debug Server...");

  // Baca lisensi dari flash
  prefs.begin("lisensi", true);  // true = read-only
  licenseType = prefs.getUChar("tipe", 0);
  prefs.end();

  Serial.print("Tipe lisensi terakhir: ");
  Serial.println(licenseType);
  BLEDevice::init("BLE-Debug-ESP32");
  BLEServer* pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE |
                      BLECharacteristic::PROPERTY_WRITE_NR |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );

  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());

  pService->start();

  BLEAdvertising* advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->start();

  Serial.println("BLE ready. Waiting for commands...");
}

void loop() {
  // Tidak ada loop
}
