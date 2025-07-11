// vendor.js
/**
 * Ekstrak vendor dari serial number atau kode lisensi
 * Contoh input SN: SN123456789+XYZ
 * Contoh input lisensi: ABC123+XYZ
 */
let VENDORS = []; // akan diisi dari API
let vendorLoaded = false;

export async function loadVendorsFromAPI() {
  try {
    const res = await fetch("./api/vendors.json");
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

  // Set the logo source based on vendor code
  if (vendorCode && vendorCode.toUpperCase() !== "GENERIC") {
    const path = `assets/logo/vendors/${vendorCode.toUpperCase()}.png`;
    logoEl.dataset.lockTheme = "true";

    // Apply effects immediately based on theme
    logoEl.classList.remove("invert", "brightness-0"); // Reset first
    if (isDark) {
      logoEl.classList.add("invert", "brightness-0");
    }
    
    // Set source after effects are applied
    logoEl.src = path;

    // Handle error loading the vendor logo
    logoEl.onerror = () => {
      logoEl.onerror = null; // Remove the error handler to prevent infinite loop
      logoEl.src = `assets/logo/vendors/GENERIC.png`; // Fallback to generic logo
      logoEl.dataset.lockTheme = "false"; // Reset theme lock
      logoEl.classList.remove("invert", "brightness-0"); // Remove theme effects
    };
  } else {
    // For GENERIC logo, apply theme based on current mode
    logoEl.dataset.lockTheme = "false"; // Reset theme lock
    logoEl.classList.remove("invert", "brightness-0"); // Remove theme effects

    // Set the logo source based on the current theme
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
