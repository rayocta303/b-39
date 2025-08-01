import { sendBLEPayload, appendLog } from "./bleManager.js";
import { showToast, playSound } from "./toast.js";
import { showModal, hideModal } from "./modal.js";
export async function uploadGif(name, side = "LEFT", byteArray) {
  const uploadBtn = document.getElementById("uploadSelectedHeaderBtn");
  const originalText = uploadBtn?.innerText || "Upload";

  const contentText = new TextDecoder().decode(byteArray);

  // Validasi isi file
  if (!contentText || contentText.trim().length < 10) {
    appendLog(`Konten header terlalu pendek atau kosong, upload dibatalkan.`);
    showToast("File kosong atau tidak valid", "error");

    showToast("File header tidak valid", "error");
    playSound("assets/sounds/error.mp3");
    return;
  }

  if (!contentText.includes("#define") && !contentText.includes("PROGMEM")) {
    appendLog(`File tidak valid: Silahkan hubungi admin.`);
    showToast("File header tidak valid", "error");
    playSound("assets/sounds/error.mp3");
    return;
  }

  // Disable tombol
  if (uploadBtn) {
    uploadBtn.disabled = true;
    uploadBtn.classList.add("opacity-50", "cursor-not-allowed");

    // Tampilkan modal
    showModal({
      title: "Proses Upload Berlangsung",
      message: "Jangan tutup atau refresh browser hingga proses selesai.",
      type: "warning",
    });
  }

  const prefix = side === "LEFT" ? "awala" : "awalb";
  const suffix = side === "LEFT" ? "akhira" : "akhirb";

  appendLog(`Mulai upload ke ${side} (${byteArray.length} bytes)`);

  const bar = document.getElementById("uploadProgressBar");
  const fill = document.getElementById("uploadProgressFill");
  const text = document.getElementById("uploadProgressText");
  const details = document.getElementById("uploadProgressDetails");
  const totalSizeEl = document.getElementById("uploadTotalSize");
  const currentProgressEl = document.getElementById("uploadCurrentProgress");
  const totalProgressEl = document.getElementById("uploadTotalProgress");
  const currentChunkEl = document.getElementById("uploadCurrentChunk");
  const totalChunksEl = document.getElementById("uploadTotalChunks");

  if (bar && fill && text) {
    bar.classList.remove("hidden");
    text.classList.remove("hidden");
    details?.classList.remove("hidden");
    fill.style.width = "0%";
    text.textContent = "0%";
    
    // Initialize progress details
    const chunkSize = 512;
    const totalChunks = Math.ceil(byteArray.length / chunkSize);
    
    totalSizeEl && (totalSizeEl.textContent = `${byteArray.length} bytes`);
    totalProgressEl && (totalProgressEl.textContent = `${byteArray.length} bytes`);
    totalChunksEl && (totalChunksEl.textContent = totalChunks.toString());
    currentProgressEl && (currentProgressEl.textContent = "0 bytes");
    currentChunkEl && (currentChunkEl.textContent = "0");
  }

  try {
    await sendBLEPayload(prefix);

    const chunkSize = 512;

    for (let i = 0; i < byteArray.length; i += chunkSize) {
      const chunk = byteArray.slice(i, i + chunkSize);
      await new Promise((r) => setTimeout(r, 10));
      await sendBLEPayload(chunk);

      const currentBytes = i + chunk.length;
      const progress = Math.floor((currentBytes / byteArray.length) * 100);
      const currentChunkNumber = Math.floor(i / chunkSize) + 1;
      
      if (fill && text) {
        fill.style.width = progress + "%";
        text.textContent = progress + "%";
      }
      
      // Update detailed progress
      currentProgressEl && (currentProgressEl.textContent = `${currentBytes} bytes`);
      currentChunkEl && (currentChunkEl.textContent = currentChunkNumber.toString());
    }

    await sendBLEPayload(suffix);
    appendLog(`Upload ${name} selesai (${byteArray.length} bytes)`);
    showToast("Upload berhasil!", "success");
    playSound("assets/sounds/success.mp3");
    hideModal(1000); // tutup setelah 1 detik
  } catch (err) {
    appendLog(`Upload gagal: ${err.message}`);
    showToast("Upload gagal.", "error");
    playSound("assets/sounds/error.mp3");
  }

  //  Reset UI setelah delay
  setTimeout(() => {
    if (bar && fill && text) {
      //   bar.classList.add("hidden");
      text.classList.add("hidden");
      details?.classList.add("hidden");
      fill.style.width = "0%";
      text.textContent = "";
    }

    if (uploadBtn) {
      uploadBtn.disabled = false;
      uploadBtn.innerText = originalText;
      uploadBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }, 2000);
}
