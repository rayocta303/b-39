// gallery.js
import { appendLog } from "./bleManager.js";
import { isCacheEnabled } from "./config.js";

window.selectedGifMeta = null; // Metadata global animasi terpilih
const gifPreviewCache = new Map(); // { [url]: HTMLImageElement }
const headerCache = new Map(); // { [url]: { text, size } }
const gifThumbCache = new Map(); // untuk thumbnail galeri
let galleryData = [];

async function loadGalleryData() {
  try {
    const res = await fetch("http://localhost:5500/biled/api/gallery.json");
    if (!res.ok) throw new Error("Gagal memuat galeri");
    galleryData = await res.json();

    // Tampilkan setelah load
    renderGallery("all");
  } catch (err) {
    appendLog("Gagal mengambil galeri: " + err.message);
  }
}
function renderGallery(filter = "all") {
  const container = document.getElementById("galleryList");
  container.innerHTML = "";

  const filtered = galleryData.filter((item) =>
    filter === "all" ? true : item.category === filter
  );

  filtered.forEach((gif) => {
    const src = gif.image;

    // Cek apakah thumbnail sudah di-cache
    if (gifThumbCache.has(src)) {
      const btn = createGifButton(gif, gifThumbCache.get(src));
      container.appendChild(btn);
    } else {
      // Preload dulu, jika gagal jangan tampilkan
      const preload = new Image();
      preload.onload = () => {
        gifThumbCache.set(src, preload.src);
        const btn = createGifButton(gif, preload.src);
        container.appendChild(btn);
      };
      preload.onerror = () => {
        console.warn(`Thumbnail gagal dimuat dan disembunyikan: ${src}`);
      };
      preload.src = src;
    }
  });
}

function createGifButton(gif, imgSrc) {
  const btn = document.createElement("button");
  btn.className = "focus:outline-none";

  btn.innerHTML = `
    <img
      src="${imgSrc}"
      alt="${gif.name}"
      title="${gif.name}"
      class="rounded shadow hover:scale-105 transition w-full aspect-[4/3] object-cover"
    >
  `;

  btn.addEventListener("click", async () => {
    window.selectedGifMeta = gif;
    appendLog(`Animasi dipilih: ${gif.name}`);
    document.getElementById("selectedAnimationTitle").innerText = gif.name;

    try {
      const [leftRes, rightRes] = await Promise.all([
        fetch(gif.headerLeft),
        fetch(gif.headerRight),
      ]);
      const [leftText, rightText] = await Promise.all([
        leftRes.text(),
        rightRes.text(),
      ]);

      document.getElementById("uploadHeaderContentLeft").value = leftText;
      document.getElementById("uploadHeaderContentRight").value = rightText;

      const fileInput = document.getElementById("uploadFileName");
      if (fileInput) fileInput.value = gif.name;

      const currentSide =
        document.querySelector('input[name="uploadSide"]:checked')?.value ||
        "LEFT";
      updatePreviewGif(gif, currentSide);

      appendLog(`Header kiri & kanan untuk "${gif.name}" telah dimuat.`);
      closeGalleryModal();
    } catch (err) {
      appendLog("Gagal memuat file header: " + err.message);
    }
  });

  return btn;
}

export async function selectGif(gif, isDefault = false) {
  window.selectedGifMeta = gif;
  if (!isDefault) appendLog(`Animasi dipilih: ${gif.name}`);
  updateMarquee(gif.name);

  const fileInput = document.getElementById("uploadFileName");
  if (fileInput) fileInput.value = gif.name;

  const currentSide =
    document.querySelector('input[name="uploadSide"]:checked')?.value || "LEFT";
  updatePreviewGif(gif, currentSide);

  let leftText = "",
    rightText = "",
    leftSize = 0,
    rightSize = 0;

  try {
    const [leftRes, rightRes] = await Promise.all([
      fetch(gif.headerLeft, { cache: "no-store" }),
      fetch(gif.headerRight, { cache: "no-store" }),
    ]);

    // LEFT
    if (leftRes.ok) {
      const url = gif.headerLeft;
      const text = await leftRes.text();
      const size = new TextEncoder().encode(text).length;

      if (
        isCacheEnabled() &&
        headerCache.has(url) &&
        headerCache.get(url).size === size
      ) {
        leftText = headerCache.get(url).text;
      } else {
        leftText = text;
        headerCache.set(url, { text, size });
      }
      leftSize = size;
      document.getElementById("uploadHeaderContentLeft").value = leftText;
    } else {
      document.getElementById("uploadHeaderContentLeft").value = "";
      if (!isDefault) appendLog("Header kiri tidak ditemukan.");
    }

    // RIGHT
    if (rightRes.ok) {
      const url = gif.headerRight;
      const text = await rightRes.text();
      const size = new TextEncoder().encode(text).length;

      if (
        isCacheEnabled() &&
        headerCache.has(url) &&
        headerCache.get(url).size === size
      ) {
        rightText = headerCache.get(url).text;
      } else {
        rightText = text;
        headerCache.set(url, { text, size });
      }
      rightSize = size;
      document.getElementById("uploadHeaderContentRight").value = rightText;
    } else {
      document.getElementById("uploadHeaderContentRight").value = "";
      if (!isDefault) appendLog("Header kanan tidak ditemukan.");
    }

    if (!isDefault && (leftRes.ok || rightRes.ok)) {
      appendLog(`Header untuk "${gif.name}" telah dimuat.`);
      appendLog(
        `Size Header: Kiri = ${leftSize} bytes, Kanan = ${rightSize} bytes`
      );
    }
  } catch (err) {
    if (!isDefault) appendLog("Gagal memuat file header: " + err.message);
  }
}

// Update preview GIF sesuai sisi
function updatePreviewGif(gif, side = "LEFT") {
  const imgEl = document.getElementById("gifPreviewImage");
  if (!imgEl || !gif) return;

  const src = gif.imagePreview || gif.image;

  if (gifPreviewCache.has(src)) {
    console.log(`[CACHE] Menggunakan gambar dari cache: ${src}`);
    imgEl.src = gifPreviewCache.get(src);
  } else {
    console.log(`[FETCH] Memuat gambar baru: ${src}`);
    const preloadImg = new Image();
    preloadImg.onload = () => {
      gifPreviewCache.set(src, preloadImg.src); // ← simpan URL, bukan elemen
      imgEl.src = preloadImg.src;
    };
    preloadImg.onerror = () => {
      console.warn(`Gagal memuat gambar: ${src}`);
    };
    preloadImg.src = src;
  }

  imgEl.style.transform = side === "RIGHT" ? "scaleX(-1)" : "scaleX(1)";
}

// Saat radio kiri/kanan diubah → ubah preview gif
document.querySelectorAll('input[name="uploadSide"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const side = radio.value;
    if (window.selectedGifMeta) {
      updatePreviewGif(window.selectedGifMeta, side);
    }
  });
});

// Modal controls
function openGalleryModal() {
  document.getElementById("galleryModal")?.classList.remove("hidden");
}
function closeGalleryModal() {
  document.getElementById("galleryModal")?.classList.add("hidden");
}

document.getElementById("openGalleryBtn")?.addEventListener("click", () => {
  renderGallery("all");
  openGalleryModal();
});
document
  .getElementById("closeGalleryBtn")
  ?.addEventListener("click", closeGalleryModal);

document.getElementById("categoryFilter")?.addEventListener("change", (e) => {
  renderGallery(e.target.value);
});
// Load animasi pertama saat halaman dimuat, tanpa log
document.addEventListener("DOMContentLoaded", () => {
  const defaultGif = galleryData[0];
  if (defaultGif) {
    selectGif(defaultGif, true); // true → agar tidak log
  }
});

// SELECTED TITLE
function updateMarquee(titleText) {
  const container = document.getElementById("selectedAnimationTitle");
  if (!container) return;

  container.innerHTML = "";

  const span = document.createElement("span");
  span.textContent = titleText.toUpperCase();
  span.className = "inline-block";
  container.appendChild(span);

  requestAnimationFrame(() => {
    const isOverflowing = span.scrollWidth > container.clientWidth;
    if (isOverflowing) {
      span.classList.add("animate-marquee");
    } else {
      span.classList.remove("animate-marquee");
    }
  });
}

// Load Data Gallery
document.addEventListener("DOMContentLoaded", async () => {
  await loadGalleryData();
  // Jika ingin langsung pilih default (tanpa log)
  if (galleryData.length > 0) {
    selectGif(galleryData[0], true);
  }
});
