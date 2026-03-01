/**
 * background.js  (Manifest V3 Service Worker)
 * Handles all API calls to the CareerTracker backend.
 * Also refreshes the access token using the stored refresh token.
 */

const DEFAULT_API_BASE = 'http://localhost:8000/api/';

async function getApiBase() {
    const { apiBase } = await chrome.storage.local.get('apiBase');
    return apiBase || DEFAULT_API_BASE;
}

async function getTokens() {
    const { accessToken, refreshToken } = await chrome.storage.local.get(['accessToken', 'refreshToken']);
    return { accessToken, refreshToken };
}

async function refreshAccessToken() {
    const base = await getApiBase();
    const { refreshToken } = await getTokens();
    if (!refreshToken) return null;

    try {
        // Token refresh URL lives at /api/refresh/, not under /api/users/
    const refreshBase = base.replace(/\/api\/.*$/, '/api/');
    const res = await fetch(`${refreshBase}refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        await chrome.storage.local.set({ accessToken: data.access });
        return data.access;
    } catch {
        return null;
    }
}

async function apiFetch(path, options = {}) {
    const base = await getApiBase();
    let { accessToken } = await getTokens();

    const doFetch = (token) =>
        fetch(`${base}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`,
            },
        });

    let res = await doFetch(accessToken);

    // 401 → try refresh once
    if (res.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) return { ok: false, status: 401, data: { detail: 'Session expired. Please log in again.' } };
        res = await doFetch(newToken);
    }

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
        const base = await getApiBase();

        switch (message.type) {
            // ── Auth ──────────────────────────────────────────────────────────────
            case 'REQUEST_OTP': {
                try {
                    const res = await fetch(`${base}users/send-otp/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: message.email }),
                    });
                    const data = await res.json().catch(() => ({}));
                    sendResponse({ ok: res.ok, data });
                } catch (e) {
                    sendResponse({ ok: false, data: { detail: 'Network error. Is the backend running?' } });
                }
                break;
            }

            case 'VERIFY_OTP': {
                try {
                    const res = await fetch(`${base}users/verify-otp/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: message.email, otp: message.otp }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.access) {
                        await chrome.storage.local.set({
                            accessToken: data.access,
                            refreshToken: data.refresh,
                            userEmail: message.email,
                        });
                    }
                    sendResponse({ ok: res.ok, data });
                } catch (e) {
                    sendResponse({ ok: false, data: { detail: 'Network error. Is the backend running?' } });
                }
                break;
            }

            case 'LOGOUT': {
                await chrome.storage.local.remove(['accessToken', 'refreshToken', 'userEmail']);
                sendResponse({ ok: true });
                break;
            }

            case 'GET_AUTH_STATE': {
                const { accessToken, userEmail } = await chrome.storage.local.get(['accessToken', 'userEmail']);
                sendResponse({ loggedIn: !!accessToken, userEmail });
                break;
            }

            // ── Jobs ─────────────────────────────────────────────────────────────
            case 'CREATE_JOB': {
                const result = await apiFetch('jobs/', {
                    method: 'POST',
                    body: JSON.stringify(message.payload),
                });
                sendResponse(result);
                break;
            }

            case 'GET_API_BASE': {
                sendResponse({ apiBase: base });
                break;
            }

            case 'SET_API_BASE': {
                await chrome.storage.local.set({ apiBase: message.apiBase });
                sendResponse({ ok: true });
                break;
            }

            default:
                sendResponse({ ok: false, data: { detail: 'Unknown message type' } });
        }
    })();
    return true; // Keep message channel open for async
});
