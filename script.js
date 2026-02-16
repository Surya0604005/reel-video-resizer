const videoInput = document.getElementById("videoInput");
const canvas = document.getElementById("canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const bgColorInput = document.getElementById("bgColor");
const blurRange = document.getElementById("blurRange");
const blurValue = document.getElementById("blurValue");

const spaceOptions = document.getElementById("spaceOptions");
const blurOptions = document.getElementById("blurOptions");

const timeline = document.getElementById("timeline");
const timeDisplay = document.getElementById("timeDisplay");
const playBtn = document.getElementById("playBtn");
const downloadBtn = document.getElementById("downloadBtn");

const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const exportOverlay = document.getElementById("exportOverlay");

let video = document.createElement("video");
let mode = "fit";
let exporting = false;
let mediaRecorder;
let recordedChunks = [];

if (canvas) {

video.playsInline = true;
video.crossOrigin = "anonymous";

videoInput.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  video.src = URL.createObjectURL(file);
  video.onloadedmetadata = () => {
    timeline.max = video.duration;
    video.currentTime = 0;
    video.play();
    renderFrame();
  };
});

video.addEventListener("timeupdate", () => {

  if (!exporting) {
    timeline.value = video.currentTime;
  }

  updateTimeDisplay();

  if (exporting) {
    let percent = (video.currentTime / video.duration) * 100;
    progressBar.style.width = percent + "%";
    progressText.innerText = "Exporting... " + percent.toFixed(0) + "%";
  }
});

video.addEventListener("ended", () => {
  if (!exporting) playBtn.textContent = "🔁 Replay";
});

function togglePlay() {
  if (exporting) return;

  if (video.ended) {
    video.currentTime = 0;
    video.play();
    return;
  }

  video.paused ? video.play() : video.pause();
}

window.togglePlay = togglePlay;

video.addEventListener("play", () => {
  if (!exporting) playBtn.textContent = "⏸ Pause";
});

video.addEventListener("pause", () => {
  if (!video.ended && !exporting) playBtn.textContent = "▶ Play";
});

timeline.addEventListener("input", () => {
  if (!exporting) video.currentTime = timeline.value;
});

blurRange?.addEventListener("input", () => {
  blurValue.textContent = blurRange.value + "px";
});

function setMode(selectedMode) {
  if (exporting) return;

  mode = selectedMode;

  document.querySelectorAll("#modeButtons button")
    .forEach(btn => btn.classList.remove("active"));

  document.getElementById(selectedMode + "Btn").classList.add("active");

  if (spaceOptions)
    spaceOptions.style.display = mode === "space" ? "block" : "none";

  if (blurOptions)
    blurOptions.style.display = mode === "blur" ? "block" : "none";
}

window.setMode = setMode;

function updateTimeDisplay() {
  const current = formatTime(video.currentTime || 0);
  const total = formatTime(video.duration || 0);
  timeDisplay.textContent = `${current} / ${total}`;
}

function formatTime(time) {
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function renderFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!video.videoWidth) {
    requestAnimationFrame(renderFrame);
    return;
  }

  const canvasRatio = canvas.width / canvas.height;
  const videoRatio = video.videoWidth / video.videoHeight;

  let drawWidth, drawHeight, x, y;

  if (mode === "fit" || mode === "space") {
    if (videoRatio > canvasRatio) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / videoRatio;
    } else {
      drawHeight = canvas.height;
      drawWidth = canvas.height * videoRatio;
    }

    x = (canvas.width - drawWidth) / 2;
    y = (canvas.height - drawHeight) / 2;

    ctx.fillStyle = mode === "space" ? bgColorInput.value : "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, x, y, drawWidth, drawHeight);
  }

  if (mode === "fill") {
    if (videoRatio > canvasRatio) {
      drawHeight = canvas.height;
      drawWidth = canvas.height * videoRatio;
    } else {
      drawWidth = canvas.width;
      drawHeight = canvas.width / videoRatio;
    }

    x = (canvas.width - drawWidth) / 2;
    y = (canvas.height - drawHeight) / 2;

    ctx.drawImage(video, x, y, drawWidth, drawHeight);
  }

  if (mode === "blur") {
    ctx.filter = `blur(${blurRange.value}px)`;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";

    if (videoRatio > canvasRatio) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / videoRatio;
    } else {
      drawHeight = canvas.height;
      drawWidth = canvas.height * videoRatio;
    }

    x = (canvas.width - drawWidth) / 2;
    y = (canvas.height - drawHeight) / 2;

    ctx.drawImage(video, x, y, drawWidth, drawHeight);
  }

  requestAnimationFrame(renderFrame);
}

function downloadVideo() {

  exporting = true;

  exportOverlay.style.display = "block";
  progressContainer.style.display = "block";
  progressText.style.display = "block";

  const canvasStream = canvas.captureStream(30);

  video.captureStream().getAudioTracks()
    .forEach(track => canvasStream.addTrack(track));

  recordedChunks = [];

  mediaRecorder = new MediaRecorder(canvasStream, {
    mimeType: "video/webm"
  });

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {

    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "reel-video.webm";
    a.click();

    exporting = false;
    exportOverlay.style.display = "none";
    progressContainer.style.display = "none";
    progressText.style.display = "none";
  };

  video.currentTime = 0;
  video.play();
  mediaRecorder.start();

  video.onended = () => mediaRecorder.stop();
}

window.downloadVideo = downloadVideo;

}

//<--side menu-->
function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");

  menu.classList.toggle("active");
  overlay.classList.toggle("active");
}

function closeMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");

  menu.classList.remove("active");
  overlay.classList.remove("active");
}
