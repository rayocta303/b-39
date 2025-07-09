export function showModal({ title = "", message = "", type = "info" }) {
  const modal = document.getElementById("globalModal");
  const icon = document.getElementById("modalIcon");
  const titleEl = document.getElementById("modalTitle");
  const msgEl = document.getElementById("modalMessage");

  const icons = {
    info: '<i class="fas fa-info-circle text-blue-500"></i>',
    success: '<i class="fas fa-check-circle text-green-500"></i>',
    warning: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
    error: '<i class="fas fa-times-circle text-red-500"></i>',
  };

  icon.innerHTML = icons[type] || icons.info;
  titleEl.textContent = title;
  msgEl.textContent = message;

  modal.classList.remove("hidden");
}
// Menyembunyikan Modal
export function hideModal(delay = 0) {
  const modal = document.getElementById("globalModal");
  if (!modal) return;

  if (delay > 0) {
    setTimeout(() => {
      modal.classList.add("hidden");
    }, delay);
  } else {
    modal.classList.add("hidden");
  }
}

document.getElementById("modalCloseBtn").addEventListener("click", () => {
  document.getElementById("globalModal").classList.add("hidden");
});
