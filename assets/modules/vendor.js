// vendor.js
/**
 * Ekstrak vendor dari serial number atau kode lisensi
 * Contoh input SN: SN123456789+XYZ
 * Contoh input lisensi: ABC123+XYZ
 */
let VENDORS = []; // akan diisi dari API
let vendorLoaded = false;

export async function loadVendorsFromAPI(url = "./api/vendors.json") {
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (Array.isArray(data)) {
      VENDORS = data;
      vendorLoaded = true;
    } else {
      console.warn("Vendor data tidak valid");
    }
  } catch (err) {
    console.error("Gagal fetch vendor data:", err);
  }
}
export function getVendorInfo(vendorCode) {
  const safeCode = vendorCode?.trim().toUpperCase();

  if (!safeCode) {
    return {
      code: "GENERIC",
      name: "Lampubiled.id",
      contact: "https://lampubiled.id/kontak",
    };
  }

  const match = VENDORS.find((v) => v.code.toUpperCase() === safeCode);

  return (
    match || {
      code: "GENERIC",
      name: "Lampubiled.id",
      contact: "https://lampubiled.id/kontak",
    }
  );
}
export function updateVendorLogo(vendorCode) {
  const logoEl = document.getElementById("vendorLogo");
  if (!logoEl) return;

  const isDark = document.documentElement.classList.contains("dark");

  if (vendorCode && vendorCode.toUpperCase() !== "GENERIC") {
    const path = `assets/logo/vendors/${vendorCode.toUpperCase()}.png`;
    logoEl.src = path;
    logoEl.dataset.lockTheme = "true";

    // Terapkan efek putih saat dark mode
    if (isDark) {
      logoEl.classList.add("invert", "brightness-0");
    } else {
      logoEl.classList.remove("invert", "brightness-0");
    }

    logoEl.onerror = () => {
      logoEl.onerror = null;
      logoEl.src = `assets/logo/vendors/GENERIC.png`;
      logoEl.dataset.lockTheme = "false";
      logoEl.classList.remove("invert", "brightness-0");
    };
  } else {
    // GENERIC ikut tema dan tanpa filter
    logoEl.dataset.lockTheme = "false";
    logoEl.classList.remove("invert", "brightness-0");

    logoEl.src = isDark
      ? "assets/logo/logo-dark.png"
      : "assets/logo/logo-light.png";
  }
}

export function parseVendorFromSN(serial) {
  if (!serial || typeof serial !== "string") return null;
  const parts = serial.trim().split("+");
  return parts.length > 1 ? parts[1] : null;
}

export function parseVendorFromLisensi(code) {
  if (!code || typeof code !== "string") return null;
  const parts = code.trim().split("+");
  return parts.length > 1 ? parts[1] : null;
}

export function detectVendor({ serialNumber, lisensiCode }) {
  let vendor = parseVendorFromSN(serialNumber);
  if (!vendor && lisensiCode) {
    vendor = parseVendorFromLisensi(lisensiCode);
  }
  return vendor || "GENERIC";
}
