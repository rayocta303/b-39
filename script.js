const totalGIF = [45, 18, 24, 17, 25, 3, 7]; //jumlah gif setiap tab
const nameTab = [
  "Eye Collection",
  "Emoticon Collection",
  "Circular Collection",
  "Action Collection",
  "Meme Collection",
  "Customer Request",
  "Solid Color",
];
const nameLicense = [
  "No License",
  "Basic Version",
  "Middle Version",
  "Full Version",
];

var ja = document.querySelector(".infoAnim");
var numAn =
  totalGIF[0] +
  totalGIF[1] +
  totalGIF[2] +
  totalGIF[3] +
  totalGIF[4] +
  totalGIF[6];
ja.innerText = "Total " + numAn + " Animasi !!";

let tipeLisensi = 0;

let selected_tab = 1;
let device;
let tft;
let success = "#D1E7DD";
let failed = "#F8D7DA";
let uuidService = "7cbc778a-aae2-4205-952f-1f39d058a83a";
let uuidChar = "7cbc779a-aae2-4205-952f-1f39d058a83a";

var nameLisensii = document.querySelector(".nameLisensii");
nameLisensii.innerText = nameLicense[tipeLisensi];

document.onkeydown = function (e) {
  if (event.keyCode == 123) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == "I".charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == "C".charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == "J".charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.keyCode == "U".charCodeAt(0)) {
    return false;
  }
};

function addLog(message) {
  var logDiv = document.getElementById("log");
  logDiv.innerHTML += message + "<br>";
  logDiv.scrollTop = logDiv.scrollHeight; // Auto scroll to bottom
}
// Fungsi untuk mendapatkan indeks radio button yang dipilih
function getIndexTab() {
  const container = document.getElementById("radioContainer");
  const radios = container.querySelectorAll('input[type="radio"]');

  let selectedIndex = -1;

  // Loop melalui setiap radio button untuk mencari yang dipilih
  radios.forEach((radio, index) => {
    if (radio.checked) {
      selectedIndex = index + 1; // Karena index dimulai dari 0, tambahkan 1 untuk mendapatkan nomor indeks yang benar
    }
  });

  return selectedIndex;
}

function checkSwitch() {
  const leftRadio = document.getElementById("left");
  const rightRadio = document.getElementById("right");

  if (leftRadio.checked) {
    return "LEFT";
  } else if (rightRadio.checked) {
    return "RIGHT";
  } else {
    return "NO";
  }
}

// function simulateLogging() {
//     var count = 0;
//     setInterval(function () {
//         addLog(checkSwitch());
//     }, 1000);
// }
// simulateLogging();
function convertFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(2) + "  KB";
  } else if (bytes < 1073741824) {
    return (bytes / 1048576).toFixed(2) + " MB";
  } else {
    return (bytes / 1073741824).toFixed(2) + " GB";
  }
}
function showAlert(color, text) {
  var alertDiv = document.querySelector(".alert");
  alertDiv.classList.remove("hidden");
  alertDiv.style.backgroundColor = color;
  alertDiv.querySelector("p").innerText = text;
  setTimeout(function () {
    alertDiv.classList.add("hidden");
  }, 3000);
}
function showAlert2(color, text, klos) {
  var alertDiv = document.querySelector(".alert");
  alertDiv.style.backgroundColor = color;
  alertDiv.querySelector("p").innerText = text;
  if (klos == "open") {
    alertDiv.classList.remove("hidden");
  } else if (klos == "close") {
    alertDiv.classList.add("hidden");
  }
}
let progress = 0;
let countt = 0;
let startTime = Date.now();
let previousTime = startTime;
async function updateProgress(data, sije) {
  // Update progress
  progress = Math.min(100, Math.round((data / sije) * 100));
  // showAlert(success, 'Tunggu ! Gif Sedang Di Update!');

  // Memperbarui indikator persentase
  const progressIndicator = document.getElementById("progressIndicator");
  progressIndicator.style.width = `${progress}%`;

  // Memperbarui nilai persentase
  const progressPercentage = document.getElementById("progressPercentage");
  progressPercentage.innerText = `${progress}%`;

  // Menghitung estimasi waktu yang tersisa
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  const estimatedTotalTime = (elapsed / data) * sije;
  const remainingTime = estimatedTotalTime - elapsed;

  // Memperbarui estimasi waktu tersisa
  const timeRemaining = document.getElementById("timeRemaining");
  timeRemaining.innerText = `Estimated time remaining: ${formatTime(
    remainingTime
  )}`;

  // Memperbarui jmlah data
  const jmlData = document.getElementById("jmlData");
  jmlData.innerText = `Data Terkirim :${convertFileSize(
    data
  )}, dari ${convertFileSize(sije)} Bytes`;

  // Jeda antar pengiriman potongan untuk memastikan waktu pengiriman per potongan
  // await delay(500);

  // Catat waktu selesai iterasi sebelumnya untuk menghitung kecepatan
  previousTime = currentTime;
  // console.log(`Data berhasil dikirim:`, sije);
}

async function writeDataTo(data) {
  // await tft.writeValue(data);
  addLog(data);
}

async function writeDataSequentially(data) {
  const panjangData = data.length;
  const chunkSize = 512; // Ukuran chunk (disesuaikan dengan batas BLE)
  try {
    console.log(tft);
    let textToSend;
    let encoder;
    let dataArray;

    if (checkSwitch() == "LEFT") {
      textToSend = "awala";
    } else if (checkSwitch() == "RIGHT") {
      textToSend = "awalb";
    }

    encoder = new TextEncoder();
    dataArray = encoder.encode(textToSend);
    await tft.writeValue(dataArray);

    for (let i = 0; i < data.length; i += chunkSize) {
      let chunk = data.slice(i, i + chunkSize);
      // Konversi chunk menjadi Uint8Array
      let uintArray = new Uint8Array(chunk);
      // Mengonversi uintArray ke ArrayBuffer
      let arrayBuffer = uintArray.buffer;

      // Menampilkan alert loading
      const loadingAlert = document.getElementById("loadingAlert");
      loadingAlert.style.display = "block";

      // Memperbarui pesan loading
      const loadingMessage = document.getElementById("loadingMessage");
      loadingMessage.innerText = "Writing data...";

      showAlert2(
        success,
        "Sedang dikirim, jangan tutup browsernya yak !!",
        "open"
      );
      // Potong bagian data sesuai dengan chunkSize

      await tft.writeValue(arrayBuffer); // console.log(`Bagian data terkirim: ${indeksAwal} dari ${panjangData} bytes`);
      updateProgress(i, panjangData);
      // Tunggu sebelum mengirim bagian berikutnya (opsional)
      // await new Promise(resolve => setTimeout(resolve, 100)); // Tunggu 100ms antara pengiriman
    }

    if (checkSwitch() == "LEFT") {
      textToSend = "akhira";
    } else if (checkSwitch() == "RIGHT") {
      textToSend = "akhirb";
    }
    dataArray = encoder.encode(textToSend);
    // writeDataTo(dataArray);
    await tft.writeValue(dataArray);

    console.log(
      `Awal : ${indeksAwal} , Akhir : ${indeksAkhir} , total : ${data.length} `
    );
    showAlert2(success, "  !", "close");
    console.log("Seluruh data telah dikirim.");
    // Kosongkan chunk untuk mengumpulkan data baru
    chunk = "";
  } catch (error) {
    // Handle specific GATT errors
    if (error.code === 0x85) {
      console.error("GATT Error: Characteristic Not Found");
    } else if (error.code === 0x81) {
      console.error("GATT Error: Write Not Permitted");
    } else {
      console.error("GATT Error: Unknown Error");
    }
    // Sembunyikan alert loading setelah selesai
    loadingAlert.style.display = "none";
    // Tangani kesalahan jika ada
    console.error("Gagal mengubah nilai:", error);
    showAlert(failed, "Gif Gagal Di Update!");
  } finally {
    // Sembunyikan alert loading setelah selesai
    loadingAlert.style.display = "none";
    // Jika semua data berhasil ditulis
    console.log("Seluruh data telah berhasil ditulis.");
    showAlert(
      success,
      `GIF sudah update !!\nData Terkirim ${convertFileSize(
        data.length
      )} \nMemulai Ulang Perangkat....`
    );
  }
}

// Fungsi untuk menunda eksekusi dalam milidetik
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fungsi untuk memformat waktu dalam format jam:menit:detik
function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

async function changegif(newValue) {
  let fileName = `${newValue}.h`; // Nama file .h berdasarkan indeks, misalnya gif1.h, gif2.h, dll.
  let gifData;
  let data;
  // Lakukan pengambilan data GIF dari file .h
  try {
    // Ambil definisi array byte dari file .h
    let pilihan;

    if (checkSwitch() == "LEFT") {
      pilihan = "left";
    } else if (checkSwitch() == "RIGHT") {
      pilihan = "right";
    }
    // addLog(pilihan + `/code/${fileName}`);
    let response = await fetch(
      pilihan + `/tab${selected_tab}/code/${fileName}`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${fileName}: ${response.status} ${response.statusText}`
      );
    }
    data = await response.text();
  } catch (error) {
    showAlert(
      failed,
      `Gagal mengambil file ${fileName}. Pastikan file tersedia.`
    );
    console.error("Error:", error);
  }

  // Ekstrak definisi array byte dari isi file .h
  let match = data.match(
    /const uint8_t\s+(\w+)\[\]\s+PROGMEM\s+=\s+\{([^}]*)\};/s
  );
  let byteData;
  if (match) {
    // Ambil data byte dan ubah ke dalam Uint8Array
    byteData = match[2]
      .trim()
      .split(",")
      .map((item) => parseInt(item.trim(), 16));
    gifData = new Uint8Array(byteData);
    console.log(`Data GIF dari ${fileName} berhasil diambil dan diproses.`);
    // return gifData;
  } else {
    throw new Error(`Format file ${fileName} tidak valid.`);
  }

  // if (1) {
  if (device && device.gatt && device.gatt.connected && tft) {
    writeDataSequentially(gifData);
  } else {
    showAlert(failed, "Tidak Ada Device Terhubung, Harap Reload Halaman!");
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  const leftRadio = document.getElementById("left");
  const rightRadio = document.getElementById("right");
  var num = document.querySelector(".num");

  function handleSwitchChange() {
    var existingSwiper = document.querySelector(".mySwiper");
    if (existingSwiper) {
      existingSwiper.swiper.destroy(true, true); // Hancurkan Swiper dengan membersihkan DOM juga
    }
    showSwiper();
    var swiper = document.querySelector(".mySwiper").swiper;
    getSizeData(num.innerText);
    swiper.slideTo(num.innerText - 1); // Pindah ke slide dengan indeks yang sesuai
  }

  leftRadio.addEventListener("change", handleSwitchChange);
  rightRadio.addEventListener("change", handleSwitchChange);
});

function generateSwiperSlides(numSlides) {
  var swiperWrapper = document.querySelector(".swiper-wrapper");
  swiperWrapper.replaceChildren(); // Menghapus semua elemen anak dari swiperWrapper

  for (var i = 1; i <= numSlides; i++) {
    var div = document.createElement("div");
    div.classList.add("swiper-slide");
    div.dataset.value = i;
    var img = document.createElement("img");
    let pilihan;

    if (checkSwitch() == "LEFT") {
      pilihan = "left";
    } else if (checkSwitch() == "RIGHT") {
      pilihan = "right";
    }

    let fileTab = `tab${selected_tab}`;
    let sauce = pilihan + "/" + fileTab + "/GIF/" + i + ".gif";
    img.src = sauce;
    // writeDataTo(sauce);
    div.appendChild(img);
    swiperWrapper.appendChild(div);
  }
}
function showSwiper() {
  openMenu();

  generateSwiperSlides(totalGIF[selected_tab - 1]);
  var swiper = new Swiper(".mySwiper", {
    effect: "cube",
    grabCursor: true,
    loop: true,
    cubeEffect: {
      shadow: true,
      slideShadows: true,
      shadowOffset: 30,
      shadowScale: 0.94,
    },
    on: {
      doubleTap: function () {
        var activeSlide = this.slides[this.activeIndex];
        var value = activeSlide.getAttribute("data-value");
        console.log("Nilai data-value:", value);
        console.log("Double tap terdeteksi!");
        changegif(value);
      },
    },
  });
  // Mengupdate nilai .num berdasarkan slide aktif saat ini
  swiper.on("slideChange", function () {
    var activeSlide = swiper.slides[swiper.activeIndex];
    var val = activeSlide.getAttribute("data-value");
    var num = document.querySelector(".num");
    num.innerText = val;
    getSizeData(val);
    // console.log(dt.length);
  });
}

async function getSizeData(newValue) {
  let fileName = `${newValue}.h`; // Nama file .h berdasarkan indeks, misalnya gif1.h, gif2.h, dll.
  let gifData;
  let data;
  let size;

  // Lakukan pengambilan data GIF dari file .h
  try {
    let pilihan;

    if (checkSwitch() == "LEFT") {
      pilihan = "left";
    } else if (checkSwitch() == "RIGHT") {
      pilihan = "right";
    }

    let fileTab = `/tab${selected_tab}`;
    let response = await fetch(pilihan + fileTab + `/code/${fileName}`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${fileName}: ${response.status} ${response.statusText}`
      );
    }

    // Coba dapatkan ukuran dari header Content-Length

    data = await response.text();
  } catch (error) {
    console.error("Error:", error);
    document.querySelector(".sizeData").innerText = "0";
    return null;
  }

  // Ekstrak definisi array byte dari isi file .h
  let match = data.match(
    /const uint8_t\s+(\w+)\[\]\s+PROGMEM\s+=\s+\{([^}]*)\};/s
  );
  let byteData;
  if (match) {
    // Ambil data byte dan ubah ke dalam Uint8Array
    byteData = match[2]
      .trim()
      .split(",")
      .map((item) => parseInt(item.trim(), 16));
    gifData = new Uint8Array(byteData);
    console.log(`Data GIF dari ${fileName} berhasil diambil dan diproses.`);
    size = new TextEncoder().encode(byteData).length;
    // Tampilkan ukuran data
    // console.log(gifData.length);
    document.querySelector(".sizeData").innerText = convertFileSize(
      gifData.length
    );
    return gifData;
  } else {
    throw new Error(`Format file ${fileName} tidak valid.`);
  }
}

async function connect() {
  // showSwiper();

  try {
    //INITIALIZE CODE DISINI
    var tn = document.querySelector(".tabName");
    tn.innerText = nameTab[getIndexTab() - 1];
    getSizeData(1);
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [uuidService] }],
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(uuidService);
    tft = await service.getCharacteristic(uuidChar);

    console.log("Connected to ESP32");
    showAlert(success, "Device Terhubung!");

    let textToSend = "info";
    let encoder;
    let dataArray;
    encoder = new TextEncoder();
    dataArray = encoder.encode(textToSend);

    if (device && device.gatt && device.gatt.connected && tft) {
      await tft.writeValue(dataArray);
      // showAlert(success, "Get Config");
    } else {
      showAlert(failed, "Tidak Ada Device Terhubung, Harap Reload Halaman!");
    }
  } catch (error) {
    console.error("Error connecting to ESP32:", error);
    showAlert(failed, "Device Gagal Terhubung!");
  }
}

function openMenu() {
  var connect = document.querySelector(".connect");
  connect.classList.add("hidden");
  var swiper = document.querySelector(".swiper");
  var num = document.querySelector(".num");
  var sc = document.querySelector(".switch-container");
  var sizeData = document.querySelector(".sizeData");

  // var lisensi = document.querySelector('.lisensi');
  // lisensi.classList.remove('hidden');
  var infoAnim = document.querySelector(".infoAnim");
  infoAnim.classList.remove("hidden");
  var servoControls = document.querySelector(".servoControls");
  servoControls.classList.remove("hidden");
  var container = document.querySelector(".container");
  var tn = document.querySelector(".tabName");
  container.classList.remove("hidden");
  tn.classList.remove("hidden");
  swiper.classList.remove("hidden");
  num.classList.remove("hidden");
  sc.classList.remove("hidden");
  sizeData.classList.remove("hidden");
}

// Mendapatkan elemen radio container
const radioContainer = document.getElementById("radioContainer");
// Mendapatkan semua radio button di dalam radio container
const radios = radioContainer.querySelectorAll('input[type="radio"]');
// Menambahkan event listener untuk setiap radio button
radios.forEach((radio) => {
  radio.addEventListener("change", function () {
    // Ketika sebuah radio button dipilih
    console.log("Tombol dengan ID:", this.id, "dipilih.");
    var tn = document.querySelector(".tabName");
    tn.innerText = nameTab[getIndexTab() - 1];
    selected_tab = getIndexTab();
    var existingSwiper = document.querySelector(".mySwiper");
    if (existingSwiper) {
      existingSwiper.swiper.destroy(true, true); // Hancurkan Swiper dengan membersihkan DOM juga
    }
    showSwiper();
    var num = document.querySelector(".num");
    num.innerText = 1;
    getSizeData(num.innerText);
  });
});

let scrollPosition = 0;
const scrollAmount = 60; // Adjust this value based on the width of the buttons

function scrollLeftt() {
  const container = document.getElementById("radioContainer");
  scrollPosition = Math.max(scrollPosition - scrollAmount, 0);
  container.scrollTo({
    left: scrollPosition,
    behavior: "smooth",
  });
}

function scrollRight() {
  const container = document.getElementById("radioContainer");
  const maxScroll = container.scrollWidth - container.clientWidth;
  scrollPosition = Math.min(scrollPosition + scrollAmount, maxScroll);
  container.scrollTo({
    left: scrollPosition,
    behavior: "smooth",
  });
}

function konversi3Digit(input) {
  // Pastikan input adalah angka
  const num = Number(input);

  // Cek apakah input adalah angka yang valid
  if (isNaN(num)) {
    throw new Error("Input harus berupa angka");
  }

  // Format angka menjadi string dengan 3 digit
  return num.toString().padStart(3, "0");
}

async function servoClick() {
  // Ambil elemen input
  const minInput = document.querySelector("#servoMinValue");
  const maxInput = document.querySelector("#servoMaxValue");

  // Ambil nilai dari input
  const minValue = minInput.value;
  const maxValue = maxInput.value;

  let textToSend =
    "servo" + konversi3Digit(minValue) + konversi3Digit(maxValue);
  let encoder;
  let dataArray;
  encoder = new TextEncoder();
  dataArray = encoder.encode(textToSend);

  if (device && device.gatt && device.gatt.connected && tft) {
    await tft.writeValue(dataArray);
    showAlert(success, "Servo Di Atur !");
  } else {
    showAlert(failed, "Tidak Ada Device Terhubung, Harap Reload Halaman!");
  }
}

async function servoKananClick() {
  // Ambil elemen input
  const minInput = document.querySelector("#servoMinValue");
  const maxInput = document.querySelector("#servoMaxValue");

  // Ambil nilai dari input
  const minValue = minInput.value;
  const maxValue = maxInput.value;

  let textToSend =
    "rservo" + konversi3Digit(minValue) + konversi3Digit(maxValue);
  let encoder;
  let dataArray;
  encoder = new TextEncoder();
  dataArray = encoder.encode(textToSend);

  if (device && device.gatt && device.gatt.connected && tft) {
    await tft.writeValue(dataArray);
    showAlert(success, "Servo Kanan Di Atur !");
  } else {
    showAlert(failed, "Tidak Ada Device Terhubung, Harap Reload Halaman!");
  }
}

let lastData = null; // Variable to store the last received data
let stopReading = false; // Flag to control stopping of periodic reading
let license;
let serialNumber;

// Function to read data from the characteristic
async function readData() {
  try {
    if (!tft) {
      console.error("Characteristic not found");
      return;
    }

    const value = await tft.readValue();
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(value);

    await tft.writeValue(new TextEncoder().encode("")); // Menulis string kosong

    // Only show the alert if the new data is different from the last data
    // if (text !== lastData) {
    //     lastData = text;
    //     showAlert('success', `Received Data: ${text}`);

    const jenisPesan = text.slice(0, 1);

    if (jenisPesan == "0" /* CONFIG */) {
      tipeLisensi = text.slice(1, 2);
      if (tipeLisensi == 0) {
        var SNN = document.getElementById("SN");
        SNN.value = text.slice(2, text.length);

        var lisensi = document.querySelector(".lisensi");
        lisensi.classList.remove("hidden");
        var connect = document.querySelector(".connect");
        connect.classList.add("hidden");
      } else {
        // showAlert(success, "Your License is : " + nameLicense[tipeLisensi - 1]);
        nameLisensii.innerText = nameLicense[tipeLisensi];
        limitGif(tipeLisensi);
        showSwiper();
      }
    } else if (jenisPesan == "1" /* INFO GENERATE LISENSI */) {
      const messageee = text.slice(2, text.length);
      showAlert(text.slice(1, 2) == "0" ? success : failed, messageee); // Show alert in case of error
      if (text.slice(1, 2) == "0") {
        // showAlert(success, "Your License is : " + nameLicense[tipeLisensi - 1]);
        nameLisensii.innerText = nameLicense[tipeLisensi];
        limitGif(tipeLisensi);
        var lisensi = document.querySelector(".lisensi");
        lisensi.classList.add("hidden");
        showSwiper();
      }
    }

    // }
    // else {
    // Optionally, handle the case when the data is the same
    // showAlert('info', `Received Data (same as previous): ${text}`);
    // }
  } catch (error) {
    console.error("Error reading data:", error);
    showAlert("failed", "Error reading data: " + error.message); // Show alert in case of error
  }
}

// Function to periodically read data
async function readDataPeriodically() {
  while (true) {
    await readData();
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds
  }
}

// Start reading data periodically
readDataPeriodically();

async function submitLisensi() {
  const lisensi = document.getElementById("lisensi").value;
  // showAlert(success, lisensi);        // Only show the alert if the new data is different from the last data

  let textToSend = "lisensi" + lisensi;
  let encoder;
  let dataArray;
  encoder = new TextEncoder();
  dataArray = encoder.encode(textToSend);

  if (device && device.gatt && device.gatt.connected && tft) {
    await tft.writeValue(dataArray);
  } else {
    showAlert(failed, "Tidak Ada Device Terhubung, Harap Reload Halaman!");
  }
}
// Fungsi untuk menempelkan data dari clipboard ke input lisensi
async function pasteLisensi() {
  try {
    // Meminta izin untuk mengakses clipboard
    const text = await navigator.clipboard.readText();
    document.getElementById("lisensi").value = text;
  } catch (error) {
    console.error("Gagal menempelkan data:", error);
  }
}

function copySN() {
  const input = document.getElementById("SN");
  input.select(); // Select the text in the input
  input.setSelectionRange(0, 99999); // For mobile devices

  try {
    // Copy the text to the clipboard
    document.execCommand("copy");
    showAlert(success, "SN Sudah di copy, Silahkan kirim ke Admin !");
  } catch (err) {
    showAlert(success, "Failed to copy the serial number.");
  }
}

function limitGif(dt) {
  // [44, 18, 24, 17, 25, 1];
  if (dt == 1) {
    //Basic 10 Animasi
    totalGIF[0] = 10;
    totalGIF[1] = 0;
    totalGIF[2] = 0;
    totalGIF[3] = 0;
    totalGIF[4] = 0;
    totalGIF[5] = 0;
  } else if (dt == 2) {
    //Middle 30 animasi
    totalGIF[0] = 30;
    totalGIF[1] = 0;
    totalGIF[2] = 0;
    totalGIF[3] = 0;
    totalGIF[4] = 0;
    totalGIF[5] = 0;
  } else if (dt == 3) {
    // Full Unlocked
    //Full version tidak perlu seting totalGif
  }
}
