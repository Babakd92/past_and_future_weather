const SIGNUP_ENDPOINT = "";
const FALLBACK_EMAIL = "dialameh.babak@gmail.com";
const SENSOR_LATITUDE = 40.743336;
const SENSOR_LONGITUDE = -84.24808;

const precipData = [
  { date: "05-04", value: 0.0, type: "past" },
  { date: "05-05", value: 1.8, type: "past" },
  { date: "05-06", value: 4.5, type: "past" },
  { date: "05-07", value: 0.2, type: "past" },
  { date: "05-08", value: 0.0, type: "past" },
  { date: "05-09", value: 0.0, type: "past" },
  { date: "05-10", value: 2.1, type: "past" },
  { date: "05-12", value: 0.0, type: "future" },
  { date: "05-13", value: 3.3, type: "future" },
  { date: "05-14", value: 0.0, type: "future" },
  { date: "05-15", value: 0.4, type: "future" },
  { date: "05-16", value: 17.6, type: "future" },
  { date: "05-17", value: 2.1, type: "future" },
  { date: "05-18", value: 0.0, type: "future" }
];

const tempData = [
  { date: "05-04", pastMin: 5.8, pastMax: 19.3 },
  { date: "05-05", pastMin: 8.1, pastMax: 21.4 },
  { date: "05-06", pastMin: 7.2, pastMax: 18.0 },
  { date: "05-07", pastMin: 9.4, pastMax: 23.1 },
  { date: "05-08", pastMin: 10.2, pastMax: 25.0 },
  { date: "05-09", pastMin: 12.0, pastMax: 27.3 },
  { date: "05-10", pastMin: 11.5, pastMax: 25.8 },
  { date: "05-12", futureMin: 4.6, futureMax: 22.8 },
  { date: "05-13", futureMin: 8.4, futureMax: 18.2 },
  { date: "05-14", futureMin: 4.7, futureMax: 14.7 },
  { date: "05-15", futureMin: 6.8, futureMax: 19.3 },
  { date: "05-16", futureMin: 15.5, futureMax: 26.9 },
  { date: "05-17", futureMin: 15.5, futureMax: 25.8 },
  { date: "05-18", futureMin: 19.2, futureMax: 28.5 }
];

function formatDateLabel(date) {
  const [month, day] = date.split("-").map(Number);
  return new Date(2026, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const chartHeight = Math.max(320, rect.width * 0.58);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(chartHeight * ratio));
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return { ctx, width: rect.width, height: chartHeight };
}

function drawAxes(ctx, width, height, maxValue, labels, yAxisLabel, minValue = 0) {
  const pad = { top: 66, right: 22, bottom: 98, left: 64 };
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#d7dee8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, height - pad.bottom);
  ctx.lineTo(width - pad.right, height - pad.bottom);
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = "11px Arial";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  for (let i = 0; i <= 4; i += 1) {
    const value = minValue + ((maxValue - minValue) / 4) * i;
    const y = height - pad.bottom - ((height - pad.top - pad.bottom) * i) / 4;
    ctx.fillText(value.toFixed(0), pad.left - 8, y + 4);
    ctx.strokeStyle = "rgba(215, 222, 232, 0.65)";
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(14, pad.top + (height - pad.top - pad.bottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#334155";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(yAxisLabel, 0, 0);
  ctx.restore();

  ctx.textAlign = "center";
  labels.forEach((label, index) => {
    const x = pad.left + ((width - pad.left - pad.right) * (index + 0.5)) / labels.length;

    ctx.strokeStyle = "rgba(215, 222, 232, 0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, height - pad.bottom);
    ctx.stroke();

    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(x, height - pad.bottom);
    ctx.lineTo(x, height - pad.bottom + 5);
    ctx.stroke();

    ctx.save();
    ctx.translate(x, height - pad.bottom + 8);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#64748b";
    ctx.font = "11px Arial";
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
  return pad;
}

function drawLegend(ctx, items, x, y, maxWidth) {
  ctx.font = "11px Arial";
  ctx.textAlign = "left";
  let cursorX = x;
  let cursorY = y;

  items.forEach((item) => {
    const markerWidth = item.kind === "bar" ? 18 : 24;
    const itemWidth = markerWidth + ctx.measureText(item.label).width + 20;
    if (cursorX > x && cursorX + itemWidth > x + maxWidth) {
      cursorX = x;
      cursorY += 18;
    }

    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = 2;

    if (item.kind === "bar") {
      ctx.fillRect(cursorX, cursorY - 8, 13, 9);
    } else {
      if (item.dashed) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cursorX, cursorY - 4);
      ctx.lineTo(cursorX + 18, cursorY - 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(cursorX + 9, cursorY - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#334155";
    ctx.fillText(item.label, cursorX + markerWidth, cursorY - 1);
    cursorX += itemWidth;
  });
}

function drawPrecipChart() {
  const canvas = document.getElementById("precipChart");
  const { ctx, width, height } = setupCanvas(canvas);
  const labels = precipData.map((item) => formatDateLabel(item.date));
  const maxValue = Math.max(...precipData.map((item) => item.value), 1) * 1.15;
  const pad = drawAxes(ctx, width, height, maxValue, labels, "Precipitation (mm)");
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const barWidth = Math.max(6, (plotWidth / precipData.length) * 0.58);

  drawLegend(ctx, [
    { label: "Last week", color: "#5b9bd5", kind: "bar" },
    { label: "Forecast", color: "#70ad47", kind: "bar" }
  ], pad.left, 24, plotWidth);

  precipData.forEach((item, index) => {
    const x = pad.left + (plotWidth * (index + 0.5)) / precipData.length - barWidth / 2;
    const barHeight = (item.value / maxValue) * plotHeight;
    const y = height - pad.bottom - barHeight;
    ctx.fillStyle = item.type === "past" ? "#5b9bd5" : "#70ad47";
    ctx.fillRect(x, y, barWidth, barHeight);
  });
}

function drawLine(ctx, points, color, dashed) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawTempChart() {
  const canvas = document.getElementById("tempChart");
  const { ctx, width, height } = setupCanvas(canvas);
  const labels = tempData.map((item) => formatDateLabel(item.date));
  const values = tempData.flatMap((item) => [
    item.pastMin,
    item.pastMax,
    item.futureMin,
    item.futureMax
  ]).filter((value) => Number.isFinite(value));
  const maxValue = Math.max(...values) + 3;
  const minValue = Math.min(...values) - 3;
  const pad = drawAxes(ctx, width, height, maxValue, labels, "Temperature (C)", minValue);
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;

  drawLegend(ctx, [
    { label: "Past min", color: "#5b9bd5", dashed: true },
    { label: "Past max", color: "#c00000", dashed: true },
    { label: "Future min", color: "#5b9bd5", dashed: false },
    { label: "Future max", color: "#c00000", dashed: false }
  ], pad.left, 24, plotWidth);

  function pointFor(item, value) {
    const index = tempData.indexOf(item);
    const x = pad.left + (plotWidth * (index + 0.5)) / tempData.length;
    const y = height - pad.bottom - ((value - minValue) / (maxValue - minValue)) * plotHeight;
    return { x, y };
  }

  const pastMin = tempData.filter((item) => Number.isFinite(item.pastMin)).map((item) => pointFor(item, item.pastMin));
  const pastMax = tempData.filter((item) => Number.isFinite(item.pastMax)).map((item) => pointFor(item, item.pastMax));
  const futureMin = tempData.filter((item) => Number.isFinite(item.futureMin)).map((item) => pointFor(item, item.futureMin));
  const futureMax = tempData.filter((item) => Number.isFinite(item.futureMax)).map((item) => pointFor(item, item.futureMax));

  drawLine(ctx, pastMin, "#5b9bd5", true);
  drawLine(ctx, pastMax, "#c00000", true);
  drawLine(ctx, futureMin, "#5b9bd5", false);
  drawLine(ctx, futureMax, "#c00000", false);
}

async function submitSignup(email) {
  if (!SIGNUP_ENDPOINT) {
    const subject = encodeURIComponent("Zentra weekly report signup");
    const body = encodeURIComponent(`Please add this email to the Zentra weekly report list:\n\n${email}`);
    window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${subject}&body=${body}`;
    return "Your email app should open with a prepared request.";
  }

  const response = await fetch(SIGNUP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source: "zentra-dashboard" })
  });

  if (!response.ok) {
    throw new Error("Signup request failed.");
  }
  return "Thanks. Your request was submitted.";
}

document.getElementById("signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.getElementById("formMessage");
  const email = new FormData(form).get("email");
  message.className = "form-message";
  message.textContent = "Submitting...";

  try {
    const result = await submitSignup(email);
    message.classList.add("success");
    message.textContent = result;
    form.reset();
  } catch (error) {
    message.classList.add("error");
    message.textContent = "The request could not be submitted. Please try again.";
  }
});

document.getElementById("togglePreview").addEventListener("click", (event) => {
  const preview = document.getElementById("emailPreview");
  const compact = preview.classList.toggle("compact");
  event.currentTarget.textContent = compact ? "Full view" : "Compact view";
  event.currentTarget.setAttribute("aria-expanded", String(!compact));
});

function drawCharts() {
  drawPrecipChart();
  drawTempChart();
}

function initSensorMap() {
  const mapElement = document.getElementById("sensorMap");
  if (!mapElement || typeof L === "undefined") {
    return;
  }

  const map = L.map(mapElement, {
    scrollWheelZoom: false
  }).setView([SENSOR_LATITUDE, SENSOR_LONGITUDE], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  L.marker([SENSOR_LATITUDE, SENSOR_LONGITUDE])
    .addTo(map)
    .bindPopup("<strong>Zentra sensor z6-27971</strong><br>Port 6")
    .openPopup();
}

window.addEventListener("resize", drawCharts);
drawCharts();
initSensorMap();
