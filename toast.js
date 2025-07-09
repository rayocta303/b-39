export function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : type === "warning"
      ? "bg-yellow-600"
      : "bg-gray-800";
  const toast = document.createElement("div");
  toast.className = `
    text-white px-4 py-2 rounded shadow-md mb-2 max-w-xs w-full
    ${bgColor} animate-fade-in pointer-events-auto
  `;
  toast.textContent = message;

  // Append
  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add("opacity-0", "transition");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function playSound(path) {
  const audio = new Audio(path);
  audio.volume = 0.7; // Bisa atur volume jika perlu
  audio.play().catch((e) => console.warn("Audio gagal diputar:", e));
}
