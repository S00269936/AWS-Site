// ---------------- CONFIG ----------------
const API_BASE_URL = 'https://n7pnvho30d.execute-api.eu-west-1.amazonaws.com/dev/appointment';

// ---------------- STATIC DATA ----------------
const doctors = [
  { id: 'd1', name: 'Dr. Sarah Chen',    spec: 'Cardiologist',          init: 'SC' },
  { id: 'd2', name: 'Dr. Liam Murphy',   spec: 'General Practitioner',  init: 'LM' },
  { id: 'd3', name: 'Dr. Anika Patel',   spec: 'Dermatologist',         init: 'AP' },
  { id: 'd4', name: "Dr. James O'Brien", spec: 'Neurologist',           init: 'JO' },
];

// ---------------- STATE ----------------
let currentRole      = 'patient';
let pendingCancelId  = null;
let pendingNoteId    = null;
let pendingStatusId  = null;
let pendingBookDoctor = null;

// Hardcoded demo IDs — swap these for real auth tokens when ready
const DEMO_PATIENT_ID = 'p1';
const DEMO_DOCTOR_ID  = 'd1';

// Today's date in YYYY-MM-DD (used to filter "today")
const TODAY = new Date().toISOString().slice(0, 10);

// ---------------- API LAYER ----------------
const api = {
  // READ — all appointments for a patient
  async getAppointmentsByPatient(patientId) {
    const res = await fetch(`${API_BASE_URL}/appointment/patient/${patientId}`);
    if (!res.ok) throw new Error(`GET patient appointments failed: ${res.status}`);
    return res.json();
  },

  // READ — all appointments for a doctor
  async getAppointmentsByDoctor(doctorId) {
    const res = await fetch(`${API_BASE_URL}/appointment/doctor/${doctorId}`);
    if (!res.ok) throw new Error(`GET doctor appointments failed: ${res.status}`);
    return res.json();
  },

  // READ — single appointment by ID
  async getAppointmentById(id) {
    const res = await fetch(`${API_BASE_URL}/appointment/${id}`);
    if (!res.ok) throw new Error(`GET appointment failed: ${res.status}`);
    return res.json();
  },

  // CREATE
  async createAppointment(data) {
    const res = await fetch(`${API_BASE_URL}/appointment`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`POST appointment failed: ${res.status}`);
    return res.json();
  },

  // UPDATE
  async updateAppointment(id, updates) {
    const res = await fetch(`${API_BASE_URL}/appointment/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`PUT appointment failed: ${res.status}`);
    return res.json();
  },

  // DELETE
  async deleteAppointment(id) {
    const res = await fetch(`${API_BASE_URL}/appointment/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`DELETE appointment failed: ${res.status}`);
    // 204 No Content — no body to parse
    return true;
  },
};

// ---------------- HELPERS ----------------
function doctorById(id) {
  return doctors.find(d => d.id === id) || {};
}

function initials(name = '') {
  return name.split(' ').map(x => x[0]).filter(Boolean).join('').toUpperCase();
}

function statusBadge(s) {
  const map = { pending: 'badge-a', confirmed: 'badge-p', completed: 'badge-t', cancelled: 'badge-r' };
  return `<span class="badge ${map[s] || 'badge-a'}">${s}</span>`;
}

function setLoading(btnId, loading, label) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading ? `<span class="spinner"></span>` : label;
}

function showError(containerId, msg) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = msg ? `<div class="error-msg">${msg}</div>` : '';
}

// ---------------- ROLE / LOGIN ----------------
function selectRole(role) {
  currentRole = role;
  document.querySelectorAll('.role-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.role === role)
  );
  const btn = document.getElementById('login-btn');
  btn.textContent = `Sign in as ${role === 'patient' ? 'Patient' : 'Doctor'}`;
  btn.className = `btn-primary ${role === 'patient' ? 'patient' : 'doctor'}`;
}

function doLogin() {
  document.getElementById('login-screen').classList.remove('active');
  const screen = currentRole === 'patient' ? 'patient-screen' : 'doctor-screen';
  document.getElementById(screen).classList.add('active');
  currentRole === 'patient' ? renderPatient() : renderDoctor();
}

function logout() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('login-screen').classList.add('active');
}

// ---------------- TAB SWITCH ----------------
function switchTab(prefix, panelId, btn) {
  const screenId = prefix === 'p' ? 'patient-screen' : 'doctor-screen';
  document.querySelectorAll(`#${screenId} .tab-panel`).forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  document.querySelectorAll(`#${screenId} .nav-tab`).forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ---------------- PATIENT RENDER ----------------
async function renderPatient() {
  document.getElementById('p-upcoming-list').innerHTML = '<div class="loading"><span class="spinner"></span>Loading…</div>';
  document.getElementById('p-all-list').innerHTML      = '<div class="loading"><span class="spinner"></span>Loading…</div>';

  try {
    const mine = await api.getAppointmentsByPatient(DEMO_PATIENT_ID);

    const upcoming  = mine.filter(a => a.status === 'confirmed' || a.status === 'pending');
    const completed = mine.filter(a => a.status === 'completed');
    const cancelled = mine.filter(a => a.status === 'cancelled');

    document.getElementById('stat-upcoming').textContent  = upcoming.length;
    document.getElementById('stat-completed').textContent = completed.length;
    document.getElementById('stat-cancelled').textContent = cancelled.length;

    document.getElementById('p-upcoming-list').innerHTML =
      upcoming.length ? upcoming.map(apptRowPatient).join('') : '<div class="empty">No upcoming appointments</div>';

    document.getElementById('p-all-list').innerHTML =
      mine.length ? mine.map(apptRowPatient).join('') : '<div class="empty">No appointments yet</div>';
  } catch (e) {
    const err = `<div class="error-msg">Failed to load appointments: ${e.message}</div>`;
    document.getElementById('p-upcoming-list').innerHTML = err;
    document.getElementById('p-all-list').innerHTML      = err;
  }

  renderDoctors();
}

// ---------------- DOCTOR RENDER ----------------
async function renderDoctor() {
  document.getElementById('d-today-list').innerHTML = '<div class="loading"><span class="spinner"></span>Loading…</div>';
  document.getElementById('d-all-list').innerHTML   = '<div class="loading"><span class="spinner"></span>Loading…</div>';

  try {
    const mine  = await api.getAppointmentsByDoctor(DEMO_DOCTOR_ID);
    const today = mine.filter(a => a.date === TODAY);

    document.getElementById('d-stat-pending').textContent   = mine.filter(a => a.status === 'pending').length;
    document.getElementById('d-stat-confirmed').textContent = mine.filter(a => a.status === 'confirmed').length;
    document.getElementById('d-stat-today').textContent     = today.length;

    document.getElementById('d-today-list').innerHTML =
      today.length ? today.map(apptRowDoctor).join('') : '<div class="empty">No appointments today</div>';

    document.getElementById('d-all-list').innerHTML =
      mine.length ? mine.map(apptRowDoctor).join('') : '<div class="empty">No appointments assigned</div>';
  } catch (e) {
    const err = `<div class="error-msg">Failed to load appointments: ${e.message}</div>`;
    document.getElementById('d-today-list').innerHTML = err;
    document.getElementById('d-all-list').innerHTML   = err;
  }
}

// ---------------- DOCTOR LIST ----------------
function renderDoctors() {
  document.getElementById('doctor-grid').innerHTML = doctors.map(d => `
    <div class="doctor-card">
      <div class="doctor-init">${d.init}</div>
      <div class="doctor-info">
        <div class="doctor-name">${d.name}</div>
        <div class="doctor-spec">${d.spec}</div>
      </div>
      <button class="btn-sm" onclick="openBook('${d.id}')">Book</button>
    </div>
  `).join('');
}

// ---------------- ROW RENDERERS ----------------
function apptRowPatient(a) {
  const doc    = doctorById(a.doctorId);
  const canAct = a.status === 'pending' || a.status === 'confirmed';
  return `
    <div class="appt-item">
      <div class="appt-icon doc">${doc.init || '?'}</div>
      <div class="appt-info">
        <div class="appt-name">${doc.name || 'Unknown Doctor'}</div>
        <div class="appt-meta">${a.date} &middot; ${a.reason}</div>
        ${a.note ? `<div class="note-bubble">${a.note}</div>` : ''}
      </div>
      <div class="appt-actions">
        ${statusBadge(a.status)}
        ${canAct ? `<button class="icon-btn danger" title="Cancel" onclick="openCancel('${a.id}')">&#x2715;</button>` : ''}
      </div>
    </div>`;
}

function apptRowDoctor(a) {
  return `
    <div class="appt-item">
      <div class="appt-icon">${initials(a.patient)}</div>
      <div class="appt-info">
        <div class="appt-name">${a.patient}</div>
        <div class="appt-meta">${a.date} &middot; ${a.reason}</div>
        ${a.note ? `<div class="note-bubble">${a.note}</div>` : ''}
      </div>
      <div class="appt-actions">
        ${statusBadge(a.status)}
        <button class="icon-btn" title="Update status" onclick="openStatus('${a.id}')">&#9998;</button>
        <button class="icon-btn" title="Add note"      onclick="openNote('${a.id}')">&#128196;</button>
        ${a.status !== 'completed'
          ? `<button class="icon-btn danger" title="Cancel" onclick="openCancel('${a.id}')">&#x2715;</button>`
          : ''}
      </div>
    </div>`;
}

// ---------------- MODAL HELPERS ----------------
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ---------------- BOOK (CREATE) ----------------
function openBook(doctorId) {
  pendingBookDoctor = doctorId;
  const doc = doctorById(doctorId);
  document.getElementById('book-doctor-name').textContent = `${doc.name} — ${doc.spec}`;
  document.getElementById('book-date').value = '';
  showError('book-error', '');
  openModal('book-modal');
}

async function confirmBook() {
  const date   = document.getElementById('book-date').value;
  const reason = document.getElementById('book-reason').value;

  if (!date) { showError('book-error', 'Please pick a date.'); return; }

  showError('book-error', '');
  setLoading('book-submit-btn', true, '');

  try {
    await api.createAppointment({
      doctorId:  pendingBookDoctor,
      patientId: DEMO_PATIENT_ID,
      date,
      reason,
      status: 'pending',
      note:   '',
    });
    closeModal('book-modal');
    await renderPatient();
  } catch (e) {
    showError('book-error', `Booking failed: ${e.message}`);
  } finally {
    setLoading('book-submit-btn', false, 'Book appointment');
  }
}

// ---------------- CANCEL (UPDATE status→cancelled) ----------------
function openCancel(id) {
  pendingCancelId = id;
  showError('cancel-error', '');
  openModal('cancel-modal');
}

async function confirmCancel() {
  showError('cancel-error', '');
  setLoading('cancel-submit-btn', true, '');

  try {
    await api.updateAppointment(pendingCancelId, { status: 'cancelled' });
    closeModal('cancel-modal');
    currentRole === 'patient' ? await renderPatient() : await renderDoctor();
  } catch (e) {
    showError('cancel-error', `Failed to cancel: ${e.message}`);
  } finally {
    setLoading('cancel-submit-btn', false, 'Yes, cancel');
  }
}

// ---------------- NOTE (UPDATE note field) ----------------
async function openNote(id) {
  pendingNoteId = id;
  showError('note-error', '');
  document.getElementById('note-text').value = '';
  openModal('note-modal');

  try {
    const appt = await api.getAppointmentById(id);
    document.getElementById('note-text').value = appt?.note || '';
  } catch (e) {
    showError('note-error', `Could not load note: ${e.message}`);
  }
}

async function confirmNote() {
  showError('note-error', '');
  setLoading('note-submit-btn', true, '');

  try {
    await api.updateAppointment(pendingNoteId, {
      note: document.getElementById('note-text').value,
    });
    closeModal('note-modal');
    await renderDoctor();
  } catch (e) {
    showError('note-error', `Failed to save note: ${e.message}`);
  } finally {
    setLoading('note-submit-btn', false, 'Save note');
  }
}

// ---------------- STATUS (UPDATE status field) ----------------
async function openStatus(id) {
  pendingStatusId = id;
  showError('status-error', '');
  document.getElementById('status-select').value = 'pending';
  openModal('status-modal');

  try {
    const appt = await api.getAppointmentById(id);
    document.getElementById('status-select').value = appt?.status || 'pending';
  } catch (e) {
    showError('status-error', `Could not load status: ${e.message}`);
  }
}

async function confirmStatus() {
  showError('status-error', '');
  setLoading('status-submit-btn', true, '');

  try {
    await api.updateAppointment(pendingStatusId, {
      status: document.getElementById('status-select').value,
    });
    closeModal('status-modal');
    await renderDoctor();
  } catch (e) {
    showError('status-error', `Failed to update status: ${e.message}`);
  } finally {
    setLoading('status-submit-btn', false, 'Update');
  }
}

// ---------------- MODAL BACKDROP CLOSE ----------------
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});