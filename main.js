import { connectBLE, isBLEConnected } from "./assets/modules/bleManager.js";
import {
  requestDeviceInfo,
  submitLisensi,
  resetLisensi,
} from "./assets/modules/license.js";
import { setServo } from "./assets/modules/servo.js";
import { uploadGif } from "./assets/modules/upload.js";
import { showToast, playSound } from "./assets/modules/toast.js";
import {
  updateVendorLogo,
  loadVendorsFromAPI,
} from "./assets/modules/vendor.js";
import {
  setApiEnvironment,
  getApiEnvironment,
  setDebugEnabled,
  setDebugCardEnabled,
  setCacheEnabled,
  isCacheEnabled,
} from "./assets/modules/config.js";
import { clearAllCache } from "./assets/modules/cache.js";

import "./assets/modules/utils.js";
import("./assets/modules/gallery.js").then((module) => {
    window.galleryModule = module;
    console.log("Gallery module loaded successfully");
  });

const appendLog = window.appendLog || ((msg) => console.log("[LOG]", msg));
let deferredPrompt = null;
const installBtn = document.getElementById("installAppBtn");
const iosHint = document.getElementById("iosHint");
const blePanel = document.getElementById("blePanel");
const fabGroup = document.getElementById("fabGroup");

document.addEventListener("DOMContentLoaded", () => {
  // =====================================
  // Deteksi iOS Safari
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandalone = window.matchMedia(
    "(display-mode: standalone)"
  ).matches;

  // Jika iOS dan belum standalone, tampilkan panduan manual
  if (isIOS && !isInStandalone) {
    iosHint?.classList.remove("hidden");

    fabGroup?.classList.add("hidden");
    blePanel?.classList.add("hidden");
    installBtn?.classList.add("hidden");
  } else {
    // Deteksi event install (hanya didukung oleh Chrome/Edge)
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBtn?.classList.remove("hidden");
    });

    installBtn?.addEventListener("click", async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.log(outcome === "accepted" ? "Install accepted" : "Dismissed");
      deferredPrompt = null;
      installBtn?.classList.add("hidden");
    });

    // Jika sudah standalone, sembunyikan tombol install
    if (isInStandalone) {
      installBtn?.classList.add("hidden");
    }
  }

  // =====================================
  // Register Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("serviceWorker.js")
        .then(() => console.log("✅ Service Worker registered"))
        .catch((err) => console.error("❌ SW failed:", err));
    });
  }
  // =====================================
  // 🔌 Connect BLE
  const connectBtn = document.getElementById("connectBtn");
  connectBtn?.addEventListener("click", async () => {
    const ok = await connectBLE();
    if (ok) await requestDeviceInfo();
  });

  // =====================================
  // ⬆Upload Header
  const uploadSelectedBtn = document.getElementById("uploadSelectedHeaderBtn");
  uploadSelectedBtn?.addEventListener("click", async () => {
    const side = document.querySelector(
      'input[name="uploadSide"]:checked'
    )?.value;
    if (!side) return showToast("Pilih sisi upload terlebih dahulu", "error");

    const content =
      side === "LEFT"
        ? document.getElementById("uploadHeaderContentLeft").value
        : document.getElementById("uploadHeaderContentRight").value;

    if (!content || content.trim().length < 10) {
      return showToast("Silakan pilih animasi.", "error");
    }

    const fileName =
      window.selectedGifMeta?.[side === "LEFT" ? "headerLeft" : "headerRight"]
        ?.split("/")
        ?.pop() || `upload-${side.toLowerCase()}.h`;

    const byteArray = new TextEncoder().encode(content);

    uploadSelectedBtn.disabled = true;

    appendLog(`Mengunggah ${fileName} ke sisi ${side}...`);
    await uploadGif(fileName, side, byteArray);

    uploadSelectedBtn.disabled = false;
    uploadSelectedBtn.textContent = "Upload";
  });

  // =====================================
  // Lisensi
  const lisensiBtn = document.getElementById("submitLisensiBtn");
  lisensiBtn?.addEventListener("click", () => {
    const code = document.getElementById("lisensi").value.trim();
    if (code) {
      submitLisensi(code);
    } else {
      showToast("Masukkan kode lisensi.", "error");
    }
  });

  const resetBtn = document.getElementById("resetLisensiBtn");
  resetBtn?.addEventListener("click", async () => {
    if (confirm("Yakin ingin reset lisensi?")) {
      await resetLisensi();
    }
  });

  // =====================================
  // Servo Control
  const kiriBtn = document.getElementById("servoKiriBtn");
  kiriBtn?.addEventListener("click", () => {
    const min = parseInt(document.getElementById("servoMin").value);
    const max = parseInt(document.getElementById("servoMax").value);
    if (!isNaN(min) && !isNaN(max)) {
      setServo(min, max, "L");
    }
  });

  const kananBtn = document.getElementById("servoKananBtn");
  kananBtn?.addEventListener("click", () => {
    const min = parseInt(document.getElementById("servoMin").value);
    const max = parseInt(document.getElementById("servoMax").value);
    if (!isNaN(min) && !isNaN(max)) {
      setServo(min, max, "R");
    }
  });

  // =====================================
  // Copy SN
  const copyBtn = document.getElementById("copySNBtn");
  const snInput = document.getElementById("SN");
  copyBtn?.addEventListener("click", () => {
    const text = snInput?.value;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      copyBtn.innerText = "Disalin!";
      setTimeout(() => {
        copyBtn.innerText = "Salin";
      }, 1500);
    });
  });

  // =====================================
  // FAB: Theme & WhatsApp & Debug & Install
  const fabToggle = document.getElementById("fabToggle");
  const fabWhatsApp = document.getElementById("fabWhatsapp");
  const fabTheme = document.getElementById("fabThemeMode");
  const fabDebug = document.getElementById("fabDebug");
  const themeIcon = document.getElementById("themeIcon");

  let fabOpen = false;

  fabToggle?.addEventListener("click", () => {
    fabOpen = !fabOpen;
    fabWhatsApp?.classList.toggle("hidden", !fabOpen);
    fabTheme?.classList.toggle("hidden", !fabOpen);
    fabDebug?.classList.toggle("hidden", !fabOpen);
    installBtn?.classList.toggle("hidden", !fabOpen);

    // Ganti ikon Font Awesome
    fabIcon.className = fabOpen ? "fas fa-times" : "fas fa-bars";
  });

  // Desktop debug FAB
  fabDebug?.addEventListener("click", () => {
    document.getElementById("toggleDebugBtn")?.click();
  });

  fabTheme?.addEventListener("click", () => {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    themeIcon.className = isDark ? "fas fa-sun" : "fas fa-moon";
    localStorage.setItem("theme", isDark ? "dark" : "light");
    
    // Update vendor logo immediately when theme changes
    const vendorCode = window.currentVendorCode || "GENERIC";
    updateVendorLogo(vendorCode);
  });

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    themeIcon.className = "fas fa-sun";
  } else {
    themeIcon.className = "fas fa-moon";
  }
});
// Toolbar

document.addEventListener("DOMContentLoaded", () => {
  const uploader = document.getElementById("uploader");
  const servo = document.getElementById("servoSetting");

  const navAnimasi = document.getElementById("mobileNavAnimasi");
  const navServo = document.getElementById("mobileNavServo");

  // Navigasi Animasi
  navAnimasi?.addEventListener("click", () => {
    if (!isBLEConnected()) {
      showToast("Silakan hubungkan perangkat terlebih dahulu", "warning");
      return;
    }
    uploader?.classList.remove("hidden");
    servo?.classList.add("hidden");
  });

  // Navigasi Servo
  navServo?.addEventListener("click", () => {
    if (!isBLEConnected()) {
      showToast("Silakan hubungkan perangkat terlebih dahulu", "warning");
      return;
    }
    servo?.classList.remove("hidden");
    uploader?.classList.add("hidden");
  });

  document.getElementById("mobileNavDebug")?.addEventListener("click", () => {
  document.getElementById("toggleDebugBtn")?.click();
});

  // Theme toggle
  const bottomThemeBtn = document.getElementById("bottomThemeToggle");
  const bottomThemeIcon = document.getElementById("bottomThemeIcon");

  bottomThemeBtn?.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");

    bottomThemeIcon.className = isDark
      ? "fas fa-sun text-lg mb-1"
      : "fas fa-moon text-lg mb-1";

    // Update desktop FAB theme icon too
    const desktopThemeIcon = document.getElementById("themeIcon");
    if (desktopThemeIcon) {
      desktopThemeIcon.className = isDark ? "fas fa-sun" : "fas fa-moon";
    }

    // Update logo sesuai tema
    const vendorCode = window.currentVendorCode || "GENERIC";
    updateVendorLogo(vendorCode);
  });

  // Set icon sesuai theme tersimpan
  const saved = localStorage.getItem("theme");
  bottomThemeIcon.className =
    saved === "dark" ? "fas fa-sun text-lg mb-1" : "fas fa-moon text-lg mb-1";
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadVendorsFromAPI("/vendors.json");

  // =====================================
  // PWA Installation Card
  const pwaInstallCard = document.getElementById("pwaInstallCard");
  const mobileInstallBtn = document.getElementById("mobileInstallBtn");
  const dismissInstallCard = document.getElementById("dismissInstallCard");

  // Show PWA install card on Android devices when PWA is installable
  const isAndroid = /android/i.test(navigator.userAgent);
  const isInStandalone = window.matchMedia("(display-mode: standalone)").matches;
  
  if (isAndroid && !isInStandalone && !localStorage.getItem("pwaInstallDismissed")) {
    // Show card after a small delay
    setTimeout(() => {
      pwaInstallCard?.classList.remove("hidden");
    }, 3000);
  }

  // Mobile install button
  mobileInstallBtn?.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(outcome === "accepted" ? "Install accepted" : "Dismissed");
      deferredPrompt = null;
    }
    pwaInstallCard?.classList.add("hidden");
  });

  // Dismiss install card
  dismissInstallCard?.addEventListener("click", () => {
    pwaInstallCard?.classList.add("hidden");
    localStorage.setItem("pwaInstallDismissed", "true");
  });

  // =====================================
  // Debug Configuration Handlers
  const apiEnvironmentSelect = document.getElementById("apiEnvironmentSelect");
  const debugEnabledCheck = document.getElementById("debugEnabledCheck");
  const debugCardCheck = document.getElementById("debugCardCheck");
  const cacheEnabledCheck = document.getElementById("cacheEnabledCheck");
  const clearCacheBtn = document.getElementById("clearCacheBtn");
  const reloadGalleryBtn = document.getElementById("reloadGalleryBtn");

  // Set initial values
  if (apiEnvironmentSelect) {
    apiEnvironmentSelect.value = getApiEnvironment();
    apiEnvironmentSelect.addEventListener("change", (e) => {
      setApiEnvironment(e.target.value);
      showToast(`API Environment changed to ${e.target.value}`, "info");
    });
  }

  if (debugEnabledCheck) {
    debugEnabledCheck.addEventListener("change", (e) => {
      setDebugEnabled(e.target.checked);
      showToast(`Debug mode ${e.target.checked ? 'enabled' : 'disabled'}`, "info");
    });
  }

  if (debugCardCheck) {
    debugCardCheck.addEventListener("change", (e) => {
      setDebugCardEnabled(e.target.checked);
      showToast(`Debug card ${e.target.checked ? 'shown' : 'hidden'}`, "info");
    });
  }

  if (cacheEnabledCheck) {
    cacheEnabledCheck.checked = isCacheEnabled();
    cacheEnabledCheck.addEventListener("change", (e) => {
      setCacheEnabled(e.target.checked);
      showToast(`Cache ${e.target.checked ? 'enabled' : 'disabled'}`, "info");
    });
  }

  if (clearCacheBtn) {
    clearCacheBtn.addEventListener("click", async () => {
      try {
        await clearAllCache();
        showToast("Cache cleared successfully", "success");
      } catch (error) {
        showToast("Failed to clear cache", "error");
        console.error("Cache clear failed:", error);
      }
    });
  }

  if (reloadGalleryBtn) {
    reloadGalleryBtn.addEventListener("click", () => {
      if (window.galleryModule && window.galleryModule.updateUserContext) {
        // Trigger gallery reload with current context
        const currentSN = document.getElementById('deviceSerial')?.textContent || '';
        const currentVendor = document.getElementById('deviceVendor')?.textContent || '';
        const currentLicense = document.getElementById('deviceLicense')?.textContent || '';
        
        window.galleryModule.updateUserContext(currentSN, currentVendor, currentLicense);
        showToast("Gallery reloaded", "success");
      } else {
        showToast("Gallery module not available", "error");
      }
    });
  }

  // Mobile debug button
  const mobileNavDebug = document.getElementById("mobileNavDebug");
  const fabDebug = document.getElementById("fabDebug");

  if (mobileNavDebug) {
    mobileNavDebug.addEventListener("click", () => {
      const debugSection = document.getElementById("debugInfo");
      if (debugSection) {
        debugSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (fabDebug) {
    fabDebug.addEventListener("click", () => {
      const currentState = debugCardCheck?.checked || false;
      if (debugCardCheck) {
        debugCardCheck.checked = !currentState;
        debugCardCheck.dispatchEvent(new Event('change'));
      }
    });
  }
});

