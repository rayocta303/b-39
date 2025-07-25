import { playSound } from "./toast.js";

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loadingScreen");
  setTimeout(() => {
    loader.classList.add("opacity-0");
    setTimeout(() => loader.classList.add("hidden"), 500);
  }, 500); // Delay opsional
});

function updateLogoBasedOnTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const logo = document.getElementById("vendorLogo");

  // Cek apakah logo terkunci (vendor)
  const isLocked = logo?.dataset.lockTheme === "true";

  if (!logo || isLocked) return;

  logo.src = isDark
    ? "assets/logo/logo-dark.png"
    : "assets/logo/logo-light.png";
}
// Panggil saat load
document.addEventListener("DOMContentLoaded", updateLogoBasedOnTheme);

// Jika pakai toggle tema
document.getElementById("fabThemeMode")?.addEventListener("click", () => {
  setTimeout(updateLogoBasedOnTheme, 100); // beri delay kecil agar class dark terpasang
});

// Container Logo shrink on scroll (mobile only)
document.addEventListener("DOMContentLoaded", () => {
  playSound("assets/sounds/welcome_connect.mp3");

  const logoSection = document.getElementById("containerLogo");

  // Hanya untuk mobile
  if (window.innerWidth < 640 && logoSection) {
    window.addEventListener("scroll", () => {
      const isScrolled = window.scrollY > 10;
      logoSection.classList.toggle("shrink", isScrolled);
    });
  }
});
