const video = document.getElementById("video");
const placeholder = document.getElementById("cameraPlaceholder");
const startBtn = document.getElementById("startCamera");
const captureBtn = document.getElementById("capture");
const retakeBtn = document.getElementById("retake");
const statusText = document.getElementById("status");
const countdownEl = document.getElementById("countdown");
const canvas = document.getElementById("photoCanvas");
const ctx = canvas.getContext("2d");
const shotCanvas = document.getElementById("shotCanvas");
const shotCtx = shotCanvas.getContext("2d");
const preview = document.getElementById("resultPreview");
const qrArea = document.getElementById("qrArea");
const downloadLink = document.getElementById("downloadLink");
const welcomePanel = document.getElementById("welcomePanel");
const boothScreen = document.getElementById("boothScreen");
const shotCounter = document.getElementById("shotCounter");

let cameraStream = null;
let selectedLayout = 1;
let shots = [];
let busy = false;
const assets = {};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gambar tidak ditemukan: ${src}`));
    img.src = src;
  });
}
async function loadAssets() {
  if (assets.logo) return;
  const [logo, girlOne, girlTwo] = await Promise.all([
    loadImage("assets/logo-el-caramelo.jpeg"),
    loadImage("assets/mascot-1.png"),
    loadImage("assets/mascot-2.png")
  ]);
  Object.assign(assets, {logo, girlOne, girlTwo});
}

document.getElementById("enterBooth").addEventListener("click", () => {
  welcomePanel.classList.add("hidden");
  boothScreen.classList.remove("hidden");
  window.scrollTo({top: 0, behavior: "smooth"});
});
document.getElementById("backHome").addEventListener("click", () => {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  cameraStream = null;
  video.srcObject = null;
  video.style.display = "none";
  placeholder.style.display = "block";
  captureBtn.disabled = true;
  startBtn.disabled = false;
  startBtn.textContent = "◉ Aktifkan Kamera";
  boothScreen.classList.add("hidden");
  welcomePanel.classList.remove("hidden");
});

document.querySelectorAll(".layout-option").forEach(button => {
  button.addEventListener("click", () => {
    if (busy) return;
    document.querySelectorAll(".layout-option").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    selectedLayout = Number(button.dataset.layout);
    shots = [];
    updateCounter();
    resetResult();
    captureBtn.textContent = `✦ Mulai ${selectedLayout} Foto`;
    retakeBtn.disabled = true;
    statusText.textContent = `Layout ${selectedLayout} foto dipilih. ${cameraStream ? "Kamera siap!" : "Aktifkan kamera untuk memulai."}`;
  });
});

startBtn.addEventListener("click", async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    statusText.textContent = "Browser tidak mendukung kamera. Jalankan melalui localhost atau HTTPS.";
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {facingMode: "user", width: {ideal: 1280}, height: {ideal: 960}},
      audio: false
    });
    video.srcObject = cameraStream;
    await video.play();
    video.style.display = "block";
    placeholder.style.display = "none";
    captureBtn.disabled = false;
    startBtn.textContent = "✓ Kamera Aktif";
    startBtn.disabled = true;
    statusText.textContent = "Kamera siap! Posisikan wajahmu lalu mulai sesi foto.";
  } catch (error) {
    statusText.textContent = "Kamera tidak bisa diakses. Izinkan permission kamera dan gunakan localhost atau HTTPS.";
  }
});

captureBtn.addEventListener("click", async () => {
  if (busy || !cameraStream) return;
  busy = true;
  captureBtn.disabled = true;
  retakeBtn.disabled = true;
  shots = [];
  try {
    for (let index = 0; index < selectedLayout; index++) {
      statusText.textContent = `Bersiap untuk foto ${index + 1} dari ${selectedLayout}...`;
      for (let n = 3; n >= 1; n--) {
        countdownEl.textContent = n;
        countdownEl.style.display = "block";
        await wait(750);
      }
      countdownEl.textContent = "✦";
      await wait(250);
      countdownEl.style.display = "none";
      shots.push(captureSnapshot());
      updateCounter();
      if (index < selectedLayout - 1) {
        statusText.textContent = `Foto ${index + 1} tersimpan! Siapkan pose berikutnya.`;
        await wait(900);
      }
    }
    await composePhoto();
    statusText.textContent = "Foto selesai! Menyimpan hasil dan membuat QR Code...";
    await saveAndShow();
    retakeBtn.disabled = false;
    statusText.textContent = "Yeay! Foto sudah tersimpan. Scan QR Code menggunakan HP.";
  } catch (error) {
    console.error(error);
    statusText.textContent = error.message || "Terjadi kesalahan saat membuat foto.";
    retakeBtn.disabled = false;
  } finally {
    busy = false;
    captureBtn.disabled = false;
  }
});

retakeBtn.addEventListener("click", () => {
  shots = [];
  updateCounter();
  resetResult();
  statusText.textContent = "Sesi direset. Kamu bisa mengambil foto lagi!";
  retakeBtn.disabled = true;
});

function captureSnapshot() {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) throw new Error("Kamera belum siap. Coba aktifkan ulang kamera.");
  shotCanvas.width = vw;
  shotCanvas.height = vh;
  shotCtx.save();
  shotCtx.translate(vw, 0);
  shotCtx.scale(-1, 1);
  shotCtx.drawImage(video, 0, 0, vw, vh);
  shotCtx.restore();
  return shotCanvas.toDataURL("image/jpeg", 0.92);
}
function updateCounter() {
  shotCounter.textContent = `${shots.length} / ${selectedLayout} foto`;
}
function resetResult() {
  preview.innerHTML = `<div class="empty-result"><span>🍮</span><strong>Ready for your photo?</strong><small>Hasil fotomu akan muncul di sini.</small></div>`;
  qrArea.innerHTML = `<div class="qr-placeholder">▦</div><div><strong>QR Code Download</strong><p>QR muncul setelah foto selesai dibuat.</p></div>`;
  downloadLink.href = "#";
  downloadLink.classList.add("disabled");
}

async function composePhoto() {
  await loadAssets();
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Latar berlapis: cream, caramel glow, dan bingkai sticker.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fff8e8");
  bg.addColorStop(.55, "#ffe6b7");
  bg.addColorStop(1, "#f4b45c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Shadow + outline luar seperti stiker.
  ctx.save();
  ctx.shadowColor = "rgba(74,25,8,.28)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 13;
  ctx.fillStyle = "#4a1908";
  roundRect(ctx, 24, 24, W - 48, H - 48, 66);
  ctx.restore();

  ctx.fillStyle = "#fff8e9";
  roundRect(ctx, 39, 39, W - 78, H - 78, 55);
  ctx.strokeStyle = "#f4a32b"; ctx.lineWidth = 10;
  roundRectPath(ctx, 52, 52, W - 104, H - 104, 48); ctx.stroke();
  ctx.strokeStyle = "#6a2a0d"; ctx.lineWidth = 4;
  roundRectPath(ctx, 66, 66, W - 132, H - 132, 40); ctx.stroke();

  // Confetti dan aksen kecil di tepi bingkai.
  const confetti = [
    [105,120,"#ef8b16"],[1090,125,"#ef8b16"],[100,1080,"#e6a02c"],
    [1100,1090,"#e6a02c"],[160,1430,"#e77a0b"],[1040,1430,"#e77a0b"]
  ];
  confetti.forEach(([x,y,c]) => {
    ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,13,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(x-4,y-4,4,0,Math.PI*2); ctx.fill();
  });

  // Header plaque dengan logo.
  ctx.save();
  ctx.shadowColor = "rgba(90,35,8,.18)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
  const headerGrad = ctx.createLinearGradient(0, 82, 0, 330);
  headerGrad.addColorStop(0, "#f28a13"); headerGrad.addColorStop(1, "#b94a08");
  ctx.fillStyle = headerGrad;
  roundRect(ctx, 135, 88, 930, 250, 45);
  ctx.restore();
  ctx.strokeStyle="#4a1908"; ctx.lineWidth=9;
  roundRectPath(ctx, 135, 88, 930, 250, 45); ctx.stroke();
  ctx.strokeStyle="#ffc65a"; ctx.lineWidth=5;
  roundRectPath(ctx, 151, 104, 898, 218, 34); ctx.stroke();

  // Logo berada di medali cream, agar jelas dan tidak tenggelam.
  ctx.fillStyle="#fff8e9"; roundRect(ctx, 310, 116, 580, 190, 27);
  drawImageContain(ctx, assets.logo, 325, 121, 550, 180);

  // Drip caramel pada bawah header.
  ctx.fillStyle="#8f3107";
  ctx.beginPath();
  ctx.moveTo(175,325); ctx.lineTo(1025,325); ctx.lineTo(1025,350);
  ctx.bezierCurveTo(1005,380,980,377,970,350);
  ctx.lineTo(970,338); ctx.lineTo(810,338); ctx.lineTo(810,370);
  ctx.bezierCurveTo(790,410,755,407,744,370);
  ctx.lineTo(744,338); ctx.lineTo(480,338); ctx.lineTo(480,360);
  ctx.bezierCurveTo(460,392,430,388,420,360);
  ctx.lineTo(420,338); ctx.lineTo(175,338); ctx.closePath(); ctx.fill();
  ctx.fillStyle="#e66c08";
  ctx.beginPath();
  ctx.moveTo(175,322); ctx.lineTo(1025,322); ctx.lineTo(1025,338);
  ctx.lineTo(175,338); ctx.closePath(); ctx.fill();

  // Label kecil di atas foto.
  ctx.fillStyle="#4a1908"; ctx.textAlign="center";
  ctx.font="800 29px Arial"; ctx.fillText("SWEET MOMENTS • SWEETER MEMORIES", W/2, 390);
  ctx.fillStyle="#c65a08"; ctx.font="bold 19px Arial";
  ctx.fillText("A LITTLE CARAMEL MAGIC FOR YOU", W/2, 421);

  // Area foto: double mat, frame caramel, dan sudut dekoratif.
  const imageArea = {x:105, y:455, w:990, h:825};
  ctx.save();
  ctx.shadowColor="rgba(74,25,8,.25)"; ctx.shadowBlur=18; ctx.shadowOffsetY=8;
  ctx.fillStyle="#4a1908"; roundRect(ctx, imageArea.x-20, imageArea.y-20, imageArea.w+40, imageArea.h+40, 34);
  ctx.restore();
  ctx.fillStyle="#f6a52b"; roundRect(ctx, imageArea.x-10, imageArea.y-10, imageArea.w+20, imageArea.h+20, 28);
  ctx.fillStyle="#fff4d9"; roundRect(ctx, imageArea.x, imageArea.y, imageArea.w, imageArea.h, 22);

  const gap = selectedLayout === 1 ? 0 : 18;
  const cells = selectedLayout === 1
    ? [{x:imageArea.x,y:imageArea.y,w:imageArea.w,h:imageArea.h}]
    : selectedLayout === 2
      ? [0,1].map(i => ({x:imageArea.x,y:imageArea.y+i*(imageArea.h+gap)/2,w:imageArea.w,h:(imageArea.h-gap)/2}))
      : [0,1,2,3].map(i => ({x:imageArea.x+(i%2)*(imageArea.w+gap)/2,y:imageArea.y+Math.floor(i/2)*(imageArea.h+gap)/2,w:(imageArea.w-gap)/2,h:(imageArea.h-gap)/2}));

  for (let i = 0; i < cells.length; i++) {
    const img = await loadImage(shots[i]);
    drawPhotoCrop(ctx, img, cells[i].x, cells[i].y, cells[i].w, cells[i].h);
    ctx.strokeStyle="#fff4d9"; ctx.lineWidth=7;
    roundRectPath(ctx,cells[i].x+3,cells[i].y+3,cells[i].w-6,cells[i].h-6,17); ctx.stroke();
  }

  // Ornamen sudut seperti frame dessert sticker.
  const corner = (x,y,flipX,flipY) => {
    ctx.save(); ctx.translate(x,y); ctx.scale(flipX,flipY);
    ctx.fillStyle="#f28a13"; ctx.strokeStyle="#4a1908"; ctx.lineWidth=5;
    ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle="#fff4d9"; ctx.beginPath(); ctx.arc(-7,-7,7,0,Math.PI*2); ctx.fill();
    ctx.restore();
  };
  corner(94,444,1,1); corner(1106,444,-1,1);
  corner(94,1291,1,-1); corner(1106,1291,-1,-1);

  // Footer dengan dua karakter dan pita judul.
  ctx.fillStyle="#f28a13"; roundRect(ctx, 285, 1320, 630, 175, 38);
  ctx.strokeStyle="#4a1908"; ctx.lineWidth=8;
  roundRectPath(ctx,285,1320,630,175,38); ctx.stroke();
  ctx.fillStyle="#fff4d9"; roundRect(ctx, 315, 1345, 570, 125, 27);
  ctx.drawImage(assets.girlOne, 42, 1260, 260, 285);
  ctx.drawImage(assets.girlTwo, 900, 1260, 260, 285);

  ctx.textAlign="center"; ctx.fillStyle="#4a1908";
  ctx.font="800 38px Arial"; ctx.fillText("THANK YOU, SWEETIE!", W/2, 1405);
  ctx.fillStyle="#c65a08"; ctx.font="bold 25px Arial";
  ctx.fillText(`EL CARAMELO  ♥  ${selectedLayout} PHOTO`, W/2, 1452);
  ctx.fillStyle="#8c562d"; ctx.font="bold 16px Arial";
  ctx.fillText("KEEP THIS LITTLE MEMORY FOREVER", W/2, 1490);
  ctx.textAlign="left";
}
function drawPhotoCrop(context, img, x, y, w, h) {
  context.save();
  roundRectPath(context, x, y, w, h, 14); context.clip();
  const scale = Math.max(w/img.width, h/img.height);
  const sw = w/scale, sh = h/scale;
  context.drawImage(img, (img.width-sw)/2, (img.height-sh)/2, sw, sh, x, y, w, h);
  context.restore();
}
function drawImageContain(context, img, x, y, w, h) {
  const scale = Math.min(w/img.width, h/img.height);
  const dw = img.width*scale, dh = img.height*scale;
  context.drawImage(img, x+(w-dw)/2, y+(h-dh)/2, dw, dh);
}
function roundRectPath(context,x,y,w,h,r) {
  context.beginPath(); context.roundRect(x,y,w,h,r);
}
function roundRect(context,x,y,w,h,r) {
  roundRectPath(context,x,y,w,h,r); context.fill();
}
async function saveAndShow() {
  const imageData = canvas.toDataURL("image/png");
  const response = await fetch("/api/save", {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({image:imageData})
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Gagal menyimpan foto.");

  preview.innerHTML = `<img src="${imageData}" alt="Hasil foto El Caramelo">`;
  downloadLink.href = imageData;
  downloadLink.download = `el-caramelo-${selectedLayout}-foto.png`;
  downloadLink.classList.remove("disabled");
  qrArea.innerHTML = `<div id="qrcode"></div><div><strong>Scan untuk Download!</strong><p>Scan QR dengan HP untuk membuka foto hasil photobooth.</p></div>`;
  const target = document.getElementById("qrcode");
  if (typeof QRCode === "undefined") {
    target.textContent = "QR gagal dimuat. Periksa koneksi internet.";
  } else {
    new QRCode(target, {
      text: result.photoUrl,
      width: 180,
      height: 180,
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}
