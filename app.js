import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getDatabase, ref, onValue, query, orderByChild, limitToLast } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js';

// Guard config
if (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
  console.error('Missing firebaseConfig. Update firebase-config.js.');
  alert('Set your Firebase config in firebase-config.js before using Cardiolink.');
}

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const ui = {
  authSection: document.getElementById('authSection'),
  appSection: document.getElementById('appSection'),
  loginForm: document.getElementById('loginForm'),
  loginButton: document.getElementById('loginButton'),
  loginError: document.getElementById('loginError'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  doctorEmail: document.getElementById('doctorEmail'),
  signOutBtn: document.getElementById('signOutBtn'),
  patientList: document.getElementById('patientList'),
  patientCount: document.getElementById('patientCount'),
  patientName: document.getElementById('patientName'),
  patientMeta: document.getElementById('patientMeta'),
  patientStatus: document.getElementById('patientStatus'),
  lastUpdated: document.getElementById('lastUpdated'),
  heartRateValue: document.getElementById('heartRateValue'),
  heartRateTrend: document.getElementById('heartRateTrend'),
  spo2Value: document.getElementById('spo2Value'),
  spo2Trend: document.getElementById('spo2Trend'),
  tempValue: document.getElementById('tempValue'),
  tempTrend: document.getElementById('tempTrend'),
  sampleCount: document.getElementById('sampleCount'),
  liveStatus: document.getElementById('liveStatus'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  aiOverview: document.getElementById('aiOverview'),
  aiRisks: document.getElementById('aiRisks'),
  aiActions: document.getElementById('aiActions'),
  aiError: document.getElementById('aiError')
};

let chartInstance = null;
let currentPatientId = null;
let profileUnsub = null;
let readingsUnsub = null;
let currentProfile = {};
let latestReadings = [];
const AUTO_ANALYZE_STEP = 10;
let initialBaselineSet = false;
let lastSeenTimestamp = 0;
let newSinceAuto = 0;
let autoAnalysisInFlight = false;

const geminiEndpoint = window.geminiProxyUrl || '';
const geminiApiKey = window.geminiApiKey || '';

function showAppShell(show) {
  ui.authSection.classList.toggle('hidden', show);
  ui.appSection.classList.toggle('hidden', !show);
}

function setLiveStatus(connected) {
  if (!ui.liveStatus) return;
  if (connected) {
    ui.liveStatus.textContent = 'Firebase live';
    ui.liveStatus.style.background = 'rgba(107, 224, 200, 0.16)';
    ui.liveStatus.style.color = '#6be0c8';
  } else {
    ui.liveStatus.textContent = 'Firebase disconnected';
    ui.liveStatus.style.background = 'rgba(255, 123, 123, 0.16)';
    ui.liveStatus.style.color = '#ffb3b3';
  }
}

function watchConnection() {
  const infoRef = ref(db, '.info/connected');
  onValue(infoRef, (snap) => {
    setLiveStatus(snap.val() === true);
  });
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(Number(ts));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
}

function renderPatientList(patients) {
  ui.patientList.innerHTML = '';
  const entries = Object.entries(patients || {});
  ui.patientCount.textContent = `${entries.length}`;

  entries.forEach(([id, data]) => {
    const profile = data.profile || {};
    const name = profile.name || `Patient ${id}`;
    const status = profile.status || 'No status';
    const chip = document.createElement('div');
    chip.className = 'patient-chip';
    chip.dataset.id = id;
    chip.innerHTML = `
      <div class="avatar">${(name[0] || 'P').toUpperCase()}</div>
      <div class="meta">
        <div class="name">${name}</div>
        <div class="tag">${status}</div>
      </div>
      <div class="badge">${id}</div>
    `;
    chip.addEventListener('click', () => selectPatient(id));
    if (id === currentPatientId) {
      chip.classList.add('active');
    }
    ui.patientList.appendChild(chip);
  });

  if (!currentPatientId && entries.length) {
    selectPatient(entries[0][0]);
  }
}

function handleLogin(event) {
  event.preventDefault();
  ui.loginError.textContent = '';
  ui.loginButton.disabled = true;

  signInWithEmailAndPassword(auth, ui.email.value.trim(), ui.password.value)
    .catch((error) => {
      ui.loginError.textContent = error.message || 'Login failed. Check credentials.';
    })
    .finally(() => {
      ui.loginButton.disabled = false;
    });
}

function selectPatient(patientId) {
  if (patientId === currentPatientId) return;
  currentPatientId = patientId;
  latestReadings = [];
  currentProfile = {};
  initialBaselineSet = false;
  lastSeenTimestamp = 0;
  newSinceAuto = 0;
  autoAnalysisInFlight = false;

  Array.from(ui.patientList.children).forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.id === patientId);
  });

  if (profileUnsub) profileUnsub();
  if (readingsUnsub) readingsUnsub();

  profileUnsub = onValue(ref(db, `patients/${patientId}/profile`), (snap) => {
    currentProfile = snap.val() || {};
    ui.patientName.textContent = currentProfile.name || `Patient ${patientId}`;
    const metaBits = [currentProfile.age ? `${currentProfile.age} yrs` : null, currentProfile.gender, currentProfile.label];
    ui.patientMeta.textContent = metaBits.filter(Boolean).join(' · ') || 'No profile data';
    ui.patientStatus.textContent = currentProfile.status || '—';
  });

  const readingsRef = query(ref(db, `patients/${patientId}/readings`), orderByChild('timestamp'), limitToLast(50));
  readingsUnsub = onValue(readingsRef, (snap) => {
    const val = snap.val() || {};
    const arr = Object.entries(val).map(([key, item]) => ({ id: key, ...item }));
    arr.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
    latestReadings = arr;
    updateVitals(arr);
    updateChart(arr);
    handleAutoAnalysis(arr);
  });
}

function handleAutoAnalysis(readings) {
  if (!Array.isArray(readings) || !readings.length) {
    return;
  }

  const timestamps = readings.map((r) => Number(r.timestamp || 0)).filter((ts) => !Number.isNaN(ts));
  const maxTimestamp = timestamps.length ? Math.max(...timestamps) : 0;

  if (!initialBaselineSet) {
    // Seed baseline with current data so we only trigger on new entries after load.
    lastSeenTimestamp = maxTimestamp;
    initialBaselineSet = true;
    return;
  }

  const newEntries = readings.filter((r) => Number(r.timestamp || 0) > lastSeenTimestamp).length;
  if (newEntries <= 0) {
    lastSeenTimestamp = Math.max(lastSeenTimestamp, maxTimestamp);
    return;
  }

  newSinceAuto += newEntries;
  lastSeenTimestamp = Math.max(lastSeenTimestamp, maxTimestamp);
  maybeTriggerAutoAnalysis();
}

function maybeTriggerAutoAnalysis() {
  if (autoAnalysisInFlight || newSinceAuto < AUTO_ANALYZE_STEP) return;

  autoAnalysisInFlight = true;
  newSinceAuto -= AUTO_ANALYZE_STEP;

  runGemini({ autoTrigger: true })
    .catch(() => {})
    .finally(() => {
      autoAnalysisInFlight = false;
      if (newSinceAuto >= AUTO_ANALYZE_STEP) {
        maybeTriggerAutoAnalysis();
      }
    });
}

function updateVitals(readings) {
  ui.sampleCount.textContent = `${readings.length} samples`;
  if (!readings.length) {
    ui.heartRateValue.textContent = '-- bpm';
    ui.spo2Value.textContent = '-- %';
    ui.tempValue.textContent = '-- °C';
    ui.heartRateTrend.textContent = 'Awaiting data';
    ui.spo2Trend.textContent = 'Awaiting data';
    ui.tempTrend.textContent = 'Awaiting data';
    ui.lastUpdated.textContent = 'Last updated: —';
    return;
  }

  const last = readings[readings.length - 1];
  const prev = readings[readings.length - 2] || {};

  const hr = last.heartRate ?? last.heart_rate ?? last.hr;
  const spo2 = last.oxygen ?? last.spo2 ?? last.oxygen_level;
  const temp = last.temperature ?? last.body_temperature ?? last.temp;

  ui.heartRateValue.textContent = hr != null ? `${hr} bpm` : '-- bpm';
  ui.spo2Value.textContent = spo2 != null ? `${spo2} %` : '-- %';
  ui.tempValue.textContent = temp != null ? `${Number(temp).toFixed(1)} °C` : '-- °C';

  ui.heartRateTrend.textContent = trendText(hr, prev.heartRate ?? prev.heart_rate);
  ui.spo2Trend.textContent = trendText(spo2, prev.oxygen ?? prev.spo2);
  ui.tempTrend.textContent = trendText(temp, prev.temperature ?? prev.body_temperature);

  ui.lastUpdated.textContent = `Last updated: ${formatTime(last.timestamp)}`;
}

function trendText(current, previous) {
  if (current == null || previous == null) return '—';
  const delta = current - previous;
  if (Math.abs(delta) < 0.5) return 'Stable';
  return delta > 0 ? `+${delta.toFixed(1)} vs last` : `${delta.toFixed(1)} vs last`;
}

function updateChart(readings) {
  const labels = readings.map((r) => formatTime(r.timestamp));
  const hr = readings.map((r) => r.heartRate ?? r.heart_rate ?? null);
  const spo2 = readings.map((r) => r.oxygen ?? r.spo2 ?? null);
  const temp = readings.map((r) => r.temperature ?? r.body_temperature ?? null);

  const ctx = document.getElementById('vitalsChart');
  if (!ctx) return;

  if (!chartInstance) {
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Heart rate (bpm)', data: hr, borderColor: '#6be0c8', backgroundColor: 'rgba(107,224,200,0.12)', fill: true, tension: 0.35 },
          { label: 'SpO2 (%)', data: spo2, borderColor: '#8da2ff', backgroundColor: 'rgba(141,162,255,0.12)', fill: true, tension: 0.35 },
          { label: 'Temp (°C)', data: temp, borderColor: '#ffb36b', backgroundColor: 'rgba(255,179,107,0.12)', fill: true, tension: 0.35 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: '#a7b0c5' } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#a7b0c5' } }
        },
        plugins: {
          legend: { labels: { color: '#e7ecf7' } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y ?? '—'}`
            }
          }
        }
      }
    });
  } else {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = hr;
    chartInstance.data.datasets[1].data = spo2;
    chartInstance.data.datasets[2].data = temp;
    chartInstance.update('none');
  }
}

async function runGemini({ autoTrigger = false } = {}) {
  ui.aiError.textContent = '';
  ui.aiOverview.textContent = autoTrigger ? 'Auto-analyzing with Gemini...' : 'Analyzing with Gemini...';
  ui.aiRisks.textContent = '...';
  ui.aiActions.textContent = '...';
  ui.analyzeBtn.disabled = true;

  if (!currentPatientId || !latestReadings.length) {
    ui.aiError.textContent = 'Select a patient with data first.';
    ui.analyzeBtn.disabled = false;
    ui.aiOverview.textContent = 'Select a patient and run analysis.';
    return;
  }

  const hasProxy = geminiEndpoint && !geminiEndpoint.includes('your-vercel-app');
  const hasDirectKey = geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY';

  if (!hasProxy && !hasDirectKey) {
    ui.aiError.textContent = 'Set geminiProxyUrl or geminiApiKey in firebase-config.js';
    ui.aiOverview.textContent = 'Gemini not configured.';
    ui.aiRisks.textContent = 'N/A';
    ui.aiActions.textContent = 'N/A';
    ui.analyzeBtn.disabled = false;
    return;
  }

  const payload = {
    patientId: currentPatientId,
    profile: currentProfile,
    vitals: latestReadings.slice(-20)
  };

  try {
    if (hasProxy) {
      const res = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Gemini proxy error ${res.status}`);
      const data = await res.json();

      ui.aiOverview.textContent = data.overview || 'No overview returned.';
      ui.aiRisks.textContent = Array.isArray(data.risks) ? data.risks.join(' • ') : (data.risks || 'None reported.');
      ui.aiActions.textContent = Array.isArray(data.recommendations) ? data.recommendations.join(' • ') : (data.recommendations || 'No actions returned.');
    } else {
      const prompt = {
        contents: [
          {
            parts: [
              {
                text: `You are a cardiology assistant. Given patient profile and recent vitals, return JSON with keys overview (string), risks (array of short bullet strings), recommendations (array of short bullet strings). Keep responses concise. Data:\n${JSON.stringify(payload, null, 2)}`
              }
            ]
          }
        ]
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt)
      });

      if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let parsed = {};
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        parsed = { overview: text };
      }

      ui.aiOverview.textContent = parsed.overview || 'No overview returned.';
      ui.aiRisks.textContent = Array.isArray(parsed.risks) ? parsed.risks.join(' • ') : (parsed.risks || 'None reported.');
      ui.aiActions.textContent = Array.isArray(parsed.recommendations) ? parsed.recommendations.join(' • ') : (parsed.recommendations || 'No actions returned.');
    }
  } catch (err) {
    console.error(err);
    ui.aiError.textContent = err.message || 'Gemini analysis failed.';
    ui.aiOverview.textContent = 'Analysis unavailable.';
  } finally {
    ui.analyzeBtn.disabled = false;
  }
}

ui.loginForm.addEventListener('submit', handleLogin);
ui.signOutBtn.addEventListener('click', () => signOut(auth));
ui.analyzeBtn.addEventListener('click', () => runGemini());

onAuthStateChanged(auth, (user) => {
  if (user) {
    showAppShell(true);
    ui.doctorEmail.textContent = user.email;
    watchConnection();
    onValue(ref(db, 'patients'), (snap) => renderPatientList(snap.val()));
  } else {
    showAppShell(false);
  }
});
