import { sendBLEPayload, appendLog } from "./bleManager.js";
import { showToast, playSound } from "./toast.js";

function format3Digit(num) {
  return num.toString().padStart(3, "0");
}

export async function setServo(min, max, side = "L") {
  const prefix = side === "R" ? "rservo" : "servo";
  const command = `${prefix}${format3Digit(min)}${format3Digit(max)}`;

  // 🔍 DEBUG: Log sebelum kirim
  console.log("[servo.js] Kirim ke BLE:", command);
  appendLog(`Kirim ke ESP32: ${command}`);

  try {
    await sendBLEPayload(command);
    appendLog(`Servo ${side} diset ke ${min}-${max}`);
    showToast(`Servo ${side} diset ke ${min}-${max}`, "success");
    playSound("assets/sounds/success.mp3");
  } catch (err) {
    console.error("[servo.js] Gagal kirim BLE:", err);
    showToast("Gagal kirim perintah servo", "error");
    playSound("assets/sounds/error.mp3");
    appendLog(`Gagal kirim perintah servo`);
  }
}
