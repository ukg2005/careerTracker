/**
 * popup.js
 * Handles all UI interactions for the CareerTracker Clipper popup.
 */

/** ── Helpers ──────────────────────────────────────────────────────────────── */

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(`view-${viewId}`);
    if (el) el.classList.add('active');
}

function showAlert(containerId, message, type = 'error') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.className = `alert alert-${type} show`;
    el.textContent = message;
}

function clearAlert(containerId) {
    const el = document.getElementById(containerId);
    if (el) { el.className = 'alert'; el.textContent = ''; }
}

function setLoading(btnId, labelId, loading, spinnerColor = 'white') {
    const btn = document.getElementById(btnId);
    const label = document.getElementById(labelId);
    if (!btn || !label) return;
    btn.disabled = loading;
    if (loading) {
        label.innerHTML = `<span class="spinner" style="border-top-color:${spinnerColor};border-color:rgba(255,255,255,.4);border-top-color:white;"></span>`;
    } else {
        label.innerHTML = label.dataset.original || label.innerHTML;
    }
}

function sendBg(message) {
    return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

/** ── State ────────────────────────────────────────────────────────────────── */
let pendingEmail = '';

/** ── Init ─────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
    // Store original button labels
    ['sendOtpLabel', 'verifyOtpLabel', 'saveJobLabel'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.dataset.original = el.innerHTML;
    });

    // Load API base into settings input
    const { apiBase } = await sendBg({ type: 'GET_API_BASE' });
    document.getElementById('apiBaseInput').value = apiBase || 'http://localhost:8000/api/';

    // Check auth state
    const auth = await sendBg({ type: 'GET_AUTH_STATE' });
    if (auth?.loggedIn) {
        initLoggedInState(auth.userEmail);
    } else {
        showTabs(false);
        showView('login-email');
    }
});

function initLoggedInState(email) {
    showTabs(true);
    setUserInfo(email);
    showView('add-job');
    activateTab('add-job');
    loadJobData();
}

function setUserInfo(email) {
    const display = document.getElementById('userEmailDisplay');
    const avatar = document.getElementById('userAvatarInitial');
    const box = document.getElementById('userInfoBox');
    if (display) display.textContent = email || '';
    if (avatar) avatar.textContent = (email || '?')[0].toUpperCase();
    if (box) box.style.display = 'flex';
}

function showTabs(visible) {
    const tabBar = document.getElementById('tabBar');
    if (tabBar) tabBar.style.display = visible ? 'flex' : 'none';
}

function activateTab(viewId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const tab = document.getElementById(`tab-${viewId}`);
    if (tab) tab.classList.add('active');
}

/** ── Tab navigation ────────────────────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const viewId = tab.dataset.view;
        showView(viewId);
        activateTab(viewId);
        if (viewId === 'add-job') loadJobData();
    });
});

/** ── LOGIN — Email step ────────────────────────────────────────────────────── */
document.getElementById('btnSendOtp').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) { showAlert('alert-login-email', 'Please enter your email.'); return; }

    clearAlert('alert-login-email');
    setLoading('btnSendOtp', 'sendOtpLabel', true);

    const res = await sendBg({ type: 'REQUEST_OTP', email });

    setLoading('btnSendOtp', 'sendOtpLabel', false);

    if (res?.ok) {
        pendingEmail = email;
        document.getElementById('otpSubtitle').textContent = `OTP sent to ${email}`;
        showView('login-otp');
    } else {
        const msg = res?.data?.detail || res?.data?.email?.[0] || 'Failed to send OTP.';
        showAlert('alert-login-email', msg);
    }
});

document.getElementById('loginEmail').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btnSendOtp').click();
});

/** ── LOGIN — OTP step ──────────────────────────────────────────────────────── */
document.getElementById('btnVerifyOtp').addEventListener('click', async () => {
    const otp = document.getElementById('otpInput').value.trim();
    if (!otp || otp.length < 6) { showAlert('alert-login-otp', 'Enter the 6-digit OTP.'); return; }

    clearAlert('alert-login-otp');
    setLoading('btnVerifyOtp', 'verifyOtpLabel', true);

    const res = await sendBg({ type: 'VERIFY_OTP', email: pendingEmail, otp });

    setLoading('btnVerifyOtp', 'verifyOtpLabel', false);

    if (res?.ok) {
        initLoggedInState(pendingEmail);
    } else {
        const msg = res?.data?.detail || res?.data?.otp?.[0] || 'Invalid OTP.';
        showAlert('alert-login-otp', msg);
    }
});

document.getElementById('otpInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btnVerifyOtp').click();
});

document.getElementById('btnBackToEmail').addEventListener('click', () => {
    clearAlert('alert-login-otp');
    showView('login-email');
});

/** ── ADD JOB — Scrape & populate ───────────────────────────────────────────── */
async function loadJobData() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url || '';

    const supportedHosts = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'naukri.com'];
    const isSupported = supportedHosts.some(h => url.includes(h));

    const notJobPage = document.getElementById('notJobPage');
    const scrapeNotice = document.getElementById('scrapeNotice');
    const sourceBadge = document.getElementById('jobSourceBadge');
    const jobForm = document.getElementById('jobForm');

    if (!isSupported) {
        if (notJobPage) notJobPage.style.display = 'block';
        if (scrapeNotice) scrapeNotice.style.display = 'none';
        if (sourceBadge) sourceBadge.style.display = 'none';
        // Still show the form so user can manually enter data
        if (jobForm) {
            document.getElementById('jobUrl').value = url;
        }
        return;
    }

    if (notJobPage) notJobPage.style.display = 'none';

    try {
        const data = await chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_DATA' });
        if (data) {
            populateJobForm(data);
            if (scrapeNotice) scrapeNotice.style.display = 'block';
            if (sourceBadge && data.source) {
                sourceBadge.textContent = `📄 Detected: ${data.source}`;
                sourceBadge.style.display = 'inline-block';
            }
        }
    } catch {
        // Content script hasn't loaded yet (e.g. page just navigated)
        if (scrapeNotice) scrapeNotice.style.display = 'none';
        if (sourceBadge) sourceBadge.style.display = 'none';
        document.getElementById('jobUrl').value = url;
    }
}

function populateJobForm(data) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('jobTitle', data.title);
    set('jobCompany', data.company);
    set('jobLocation', data.location);
    set('jobUrl', data.url);
    set('jobNotes', data.description ? `Description:\n${data.description.slice(0, 500)}` : '');
}

/** ── ADD JOB — Save ────────────────────────────────────────────────────────── */
document.getElementById('btnSaveJob').addEventListener('click', async () => {
    const title = document.getElementById('jobTitle').value.trim();
    const roleType = document.getElementById('jobRoleType').value.trim();
    const company = document.getElementById('jobCompany').value.trim();
    const status = document.getElementById('jobStatus').value;
    const confidence = document.getElementById('jobConfidence').value;
    const duration = document.getElementById('jobDuration').value.trim();
    const source = document.getElementById('jobSource').value;
    const location = document.getElementById('jobLocation').value.trim();
    const salaryRaw = document.getElementById('jobSalary').value.trim();
    const jobUrl = document.getElementById('jobUrl').value.trim();
    const notes = document.getElementById('jobNotes').value.trim();

    clearAlert('alert-add-job');

    if (!title) { showAlert('alert-add-job', 'Job title is required.'); return; }
    if (!company) { showAlert('alert-add-job', 'Company name is required.'); return; }
    if (!roleType) { showAlert('alert-add-job', 'Role type is required (e.g. Full-time).'); return; }
    if (!duration) { showAlert('alert-add-job', 'Duration is required (e.g. Full-time, 6 months).'); return; }

    const payload = {
        job_title: title,
        role_type: roleType,
        company,
        status,
        confidence,
        duration,
        source,
        notes: notes || '',
        application_link: jobUrl || '',
        location: location || '',
        salary_est: salaryRaw ? parseInt(salaryRaw, 10) : null,
    };

    setLoading('btnSaveJob', 'saveJobLabel', true);
    const res = await sendBg({ type: 'CREATE_JOB', payload });
    setLoading('btnSaveJob', 'saveJobLabel', false);

    if (res?.ok) {
        showAlert('alert-add-job', '✅ Job saved to CareerTracker!', 'success');
        // Clear form
        ['jobTitle', 'jobRoleType', 'jobCompany', 'jobDuration', 'jobLocation', 'jobSalary', 'jobUrl', 'jobNotes'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('scrapeNotice').style.display = 'none';
        document.getElementById('jobSourceBadge').style.display = 'none';
    } else if (res?.status === 401) {
        showAlert('alert-add-job', 'Session expired. Please sign in again.');
        setTimeout(() => { showTabs(false); showView('login-email'); }, 1500);
    } else {
        const detail = res?.data?.detail || JSON.stringify(res?.data) || 'Failed to save job.';
        showAlert('alert-add-job', detail);
    }
});

function getSourceFromUrl(url) {
    if (!url) return 'OTHER';
    if (url.includes('linkedin.com')) return 'LINKEDIN';
    if (url.includes('glassdoor.com')) return 'JOB_PORTAL';
    if (url.includes('indeed.com')) return 'JOB_PORTAL';
    if (url.includes('naukri.com')) return 'JOB_PORTAL';
    return 'OTHER';
}

/** ── SETTINGS ──────────────────────────────────────────────────────────────── */
document.getElementById('btnSaveSettings').addEventListener('click', async () => {
    const apiBase = document.getElementById('apiBaseInput').value.trim();
    if (!apiBase) { showAlert('alert-settings', 'Backend URL cannot be empty.'); return; }

    // Ensure trailing slash
    const normalised = apiBase.endsWith('/') ? apiBase : `${apiBase}/`;
    await sendBg({ type: 'SET_API_BASE', apiBase: normalised });
    document.getElementById('apiBaseInput').value = normalised;
    showAlert('alert-settings', '✅ Settings saved.', 'success');
});

document.getElementById('btnLogout').addEventListener('click', async () => {
    await sendBg({ type: 'LOGOUT' });
    showTabs(false);
    document.getElementById('userInfoBox').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    clearAlert('alert-login-email');
    showView('login-email');
});
