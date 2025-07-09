// bleManager.js
import { showToast, playSound } from "toast.js";

let bleDevice = null;
let bleServer = null;
let bleCharacteristic = null;
let isConnected = false;

export function updateBLEConnectionStatus(status) {
  isConnected = status;
}

export function isBLEConnected() {
  return isConnected;
}
export function updateBLEDot(isConnected) {
  const dot = document.getElementById("logoStatusDot");
  if (!dot) return;

  dot.classList.remove("bg-red-500", "bg-green-500");
  dot.classList.add(isConnected ? "bg-green-500" : "bg-red-500");
}
export const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
export const CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
export function updateStatus(text, connected = false) {
  const dot = document.getElementById("bleDot");
  const statusText = document.getElementById("bleStatusText");

  if (dot && statusText) {
    statusText.innerText = text;

    dot.classList.remove("bg-red-500", "bg-green-500");
    dot.classList.add(connected ? "bg-green-500" : "bg-red-500");
  }
}
export function appendLog(msg) {
  const logBox = document.getElementById("bleLog");
  const p = document.createElement("p");
  p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logBox.appendChild(p);
  logBox.scrollTop = logBox.scrollHeight;
}
export async function connectBLE() {
  try {
    appendLog("Mencari perangkat BLE...");
    // bleDevice = await navigator.bluetooth.requestDevice({
    //   acceptAllDevices: true,
    //   optionalServices: [SERVICE_UUID],
    // });
    bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }],
      optionalServices: [SERVICE_UUID],
    });
    if (!navigator.bluetooth) {
      showToast("Web Bluetooth tidak didukung di browser ini", "error");
      appendLog("Web Bluetooth tidak tersedia.");
      return false;
    }
    bleServer = await bleDevice.gatt.connect();
    const service = await bleServer.getPrimaryService(SERVICE_UUID);
    bleCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

    appendLog(`Terhubung ke ${bleDevice.name}`);
    updateStatus(`Terhubung ke ${bleDevice.name}`, true);
    showToast(`Terhubung ke ${bleDevice.name}`, "success");
    playSound("assets/sounds/connected_voice.mp3");
    updateBLEConnectionStatus(true);
    document.getElementById("mobileNavKontak")?.classList.remove("hidden");

    //elemen saat konek
    if (window.innerWidth >= 640) {
      // Desktop: langsung tampilkan
      document.getElementById("servoSetting")?.classList.remove("hidden");
    } else {
      // Mobile: tetap hidden, user harus klik toolbar
      document.getElementById("servoSetting")?.classList.add("hidden");
    }
    document.getElementById("uploader")?.classList.remove("hidden");
    document.getElementById("connectBtn")?.classList.add("hidden");

    bleDevice.addEventListener("gattserverdisconnected", () => {
      updateStatus("Terputus", false);
      showToast("Terputus.", "error");
      playSound("assets/sounds/disconnected_voice.mp3");

      appendLog("Biled Disconnected.");
      updateBLEConnectionStatus(false);
      updateBLEDot(true);
      //elemen saat disconnect
      document.getElementById("servoSetting")?.classList.add("hidden");
      document.getElementById("uploader")?.classList.add("hidden");
      document.getElementById("connectBtn")?.classList.remove("hidden");
    });

    return true;
  } catch (err) {
    appendLog(`Konskei gagal: ${err.message}`);
    showToast("Koneksi gagal.", "error");
    playSound("assets/sounds/disconnected_voice.mp3");

    updateStatus("Tidak terhubung", false);
    // elemen saat disconnect
    document.getElementById("servoSetting")?.classList.add("hidden");
    document.getElementById("uploader")?.classList.add("hidden");
    document.getElementById("connectBtn")?.classList.remove("hidden");
    document.getElementById("mobileNavKontak")?.classList.add("hidden");

    return false;
  }
}
export async function sendBLEPayload(payload) {
  if (!bleCharacteristic) {
    appendLog("Biled belum terhubung.");
    showToast("Biled belum terhubung.", "error");
    console.warn("[BLE] write gagal: characteristic null");
    return;
  }

  try {
    // Jangan encode jika payload sudah Uint8Array
    const data =
      payload instanceof Uint8Array
        ? payload
        : new TextEncoder().encode(payload);

    if (data.length > 512) {
      throw new Error(`Payload melebihi 512 bytes (${data.length})`);
    }

    console.log(`[BLE] Kirim payload: (${data.length} bytes)`, data);
    await bleCharacteristic.writeValue(data);
    appendLog(`Sending (${data.length} bytes)`);
  } catch (err) {
    console.error("[BLE] Gagal kirim:", err);
    showToast("Upload gagal.", "error");

    appendLog(`Gagal kirim: ${err.message}`);
  }
}
export async function readBLEData() {
  if (!bleCharacteristic) {
    console.warn("[BLE] read gagal: characteristic null");
    return null;
  }

  try {
    const value = await bleCharacteristic.readValue();
    const decoder = new TextDecoder("utf-8");
    const decoded = decoder.decode(value);

    console.log("[BLE] Data dibaca:", decoded);
    // appendLog(`Data dibaca: ${decoded}`);

    return decoded;
  } catch (error) {
    console.error("[BLE] Error read:", error);
    appendLog("Error membaca data: " + error.message);
    return null;
  }
}
