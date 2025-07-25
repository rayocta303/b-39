// license.js
import { sendBLEPayload, readBLEData, appendLog } from "./bleManager.js";
import { detectVendor, getVendorInfo, updateVendorLogo } from "./vendor.js";
import { updateUserContext } from "./gallery.js";
const nameLicense = ["No License", "Basic", "Middle", "Full"];

export async function requestDeviceInfo() {
  await sendBLEPayload("info");

  const response = await readBLEData();
  if (!response) {
    appendLog("Gagal baca info dari device");
    return; // Exit the function
  }

  const jenis = response[0];
  const tipeLisensi = parseInt(response[1]);
  const serial = response.slice(2);

  console.log("[DEBUG]", { jenis, tipeLisensi, serial, raw: response });

  if (jenis === "0") {
    document.getElementById("SN").value = serial;
    appendLog(`SN Diterima: ${serial}`);

    // Vendor detection
    const lisensiInput = document.getElementById("lisensi");
    const lisensiCode = lisensiInput?.value.trim() || "";
    const vendorCode =
      detectVendor({ serialNumber: serial, lisensiCode }) || "GENERIC";
    const vendorInfo = getVendorInfo(vendorCode);

    appendLog(`Vendor: ${vendorInfo.name}`);

    const vendorEl = document.getElementById("vendorName");
    if (vendorEl) vendorEl.innerText = vendorInfo.name;

    const contactEl = document.getElementById("fabWhatsapp");
    if (contactEl) {
      contactEl.href = vendorInfo.contact;
    }
    // Update untuk tombol kontak di toolbar mobile
    const mobileContactEl = document.getElementById("mobileNavKontak");
    if (mobileContactEl) {
      mobileContactEl.href = vendorInfo.contact;
    }
    // logo vendor
    updateVendorLogo(vendorCode);

    // Lisensi UI
    const lisensiValid =
      !isNaN(tipeLisensi) &&
      tipeLisensi > 0 &&
      tipeLisensi < nameLicense.length;
    document
      .getElementById("panduan")
      ?.classList.toggle("hidden", lisensiValid);
    document
      .getElementById("formLisensi")
      ?.classList.toggle("hidden", lisensiValid);

    appendLog(
      lisensiValid
        ? `Lisensi : ${nameLicense[tipeLisensi]}`
        : "Lisensi belum aktif"
    );

    // Update gallery context with user information
    const licenseTypeCode = lisensiValid ? tipeLisensi.toString().padStart(2, '0') : "00";
    updateUserContext(serial, vendorCode, licenseTypeCode);
    
    // Update device debug information
    if (typeof window.updateDeviceDebugInfo === 'function') {
      window.updateDeviceDebugInfo({
        serialNumber: serial,
        licenseType: licenseTypeCode,
        licenseName: lisensiValid ? nameLicense[tipeLisensi] : 'No License',
        vendorCode: vendorCode,
        vendorName: vendorInfo.name,
        connected: true,
        deviceType: jenis === "0" ? "BLE Device" : "Unknown",
        firmware: "v1.0", // You can get this from device if available
        lastResponse: response,
        responseTime: new Date().toLocaleTimeString()
      });
    }
  } else {
    appendLog("Jenis data tidak dikenali");
  }
}

export async function submitLisensi(code) {
  await sendBLEPayload("lisensi" + code);

  const res = await readBLEData();
  if (!res || res.length < 3 || res[0] !== "1") {
    appendLog(`Respon lisensi tidak valid: ${res || "[kosong]"}`);
    return;
  }

  const status = res[1];
  const pesan = res.slice(2);
  const success = status === "0";

  appendLog(success ? `Aktivasi: ${pesan}` : `Aktivasi gagal: ${pesan}`);

  if (success) {
    await requestDeviceInfo();
  }
}
export async function resetLisensi() {
  await sendBLEPayload("resetlisensi");

  const res = await readBLEData();
  if (!res || !res.startsWith("10")) {
    appendLog("Gagal reset lisensi");
    return;
  }

  appendLog(`${res.slice(2)}`);
  await requestDeviceInfo(); // Refresh SN & status lisensi
}
