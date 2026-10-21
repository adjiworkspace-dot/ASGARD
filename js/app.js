/**
 * ASGARD (Askrindo Geospatial Analytics for Risk Detection)
 * Formerly AEGIS (Askrindo Environmental & Geospatial Intelligence System)
 * Main Application Controller (app.js)
 * Mengintegrasikan UI Model "Panel Interface" (15 Halaman PDF) dengan Framework Askrindo Georisk
 */

/**
 * SafeStorage: Resilient Storage Abstraction for ASGARD
 * - Provides seamless fallback to in-memory store if localStorage or sessionStorage
 *   throws SecurityError (e.g. file:// protocol, sandboxed iframe, private browsing)
 *   or QuotaExceededError (5MB browser limit exceeded).
 * - Transparently cleans up obsolete/legacy keys to reclaim storage quota.
 * - Guarantees zero unhandled exceptions on storage operations.
 */
const SafeStorage = {
    _memory: new Map(),

    _isStorageAvailable(type) {
        try {
            const storage = window[type];
            if (!storage) return false;
            const testKey = '__asgard_test__';
            storage.setItem(testKey, '1');
            storage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },

    get isLocalAvailable() {
        return this._isStorageAvailable('localStorage');
    },

    get isSessionAvailable() {
        return this._isStorageAvailable('sessionStorage');
    },

    clearLegacyKeys() {
        const legacyKeys = [
            'AEGIS_POLICIES_V2_3_1000',
            'ASGARD_POLICIES_V3_0_1000',
            'AEGIS_USER',
            'AEGIS_POLICIES_V1',
            'AEGIS_CUSTOM_POLICIES'
        ];
        if (this.isLocalAvailable) {
            try {
                legacyKeys.forEach(k => {
                    try { window.localStorage.removeItem(k); } catch (e) {}
                });
            } catch (e) {}
        }
        if (this.isSessionAvailable) {
            try {
                window.sessionStorage.removeItem('AEGIS_USER');
            } catch (e) {}
        }
    },

    getLocal(key) {
        if (this.isLocalAvailable) {
            try {
                const val = window.localStorage.getItem(key);
                if (val !== null) return val;
            } catch (e) {
                console.warn(`[SafeStorage] getLocal(${key}) failed:`, e);
            }
        }
        return this._memory.get(`local:${key}`) ?? null;
    },

    setLocal(key, value) {
        this._memory.set(`local:${key}`, value);
        if (this.isLocalAvailable) {
            try {
                window.localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.warn(`[SafeStorage] setLocal(${key}) failed, attempting quota cleanup:`, e);
                this.clearLegacyKeys();
                try {
                    window.localStorage.setItem(key, value);
                    return true;
                } catch (e2) {
                    console.warn(`[SafeStorage] Storage quota or access blocked, data preserved in memory:`, e2);
                    return false;
                }
            }
        }
        return false;
    },

    removeLocal(key) {
        this._memory.delete(`local:${key}`);
        if (this.isLocalAvailable) {
            try {
                window.localStorage.removeItem(key);
            } catch (e) {}
        }
    },

    getSession(key) {
        if (this.isSessionAvailable) {
            try {
                const val = window.sessionStorage.getItem(key);
                if (val !== null) return val;
            } catch (e) {
                console.warn(`[SafeStorage] getSession(${key}) failed:`, e);
            }
        }
        return this._memory.get(`session:${key}`) ?? null;
    },

    setSession(key, value) {
        this._memory.set(`session:${key}`, value);
        if (this.isSessionAvailable) {
            try {
                window.sessionStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.warn(`[SafeStorage] setSession(${key}) failed, stored in memory:`, e);
                return false;
            }
        }
        return false;
    },

    removeSession(key) {
        this._memory.delete(`session:${key}`);
        if (this.isSessionAvailable) {
            try {
                window.sessionStorage.removeItem(key);
            } catch (e) {}
        }
    }
};

window.SafeStorage = SafeStorage;
window.ASGARD_STORAGE = SafeStorage;

const AsgardApp = {
    policies: [],
    filteredPolicies: [],
    selectedPolicy: null,
    selectedRiskEval: null,
    activePerilSwitch: 'composite', // Default tetap 'composite', fokus visualisasi heatmap wilayah pada Flood Risk
    activePerilsSet: new Set(['flood', 'earthquake']), // Multi-peril stackable selection (e.g., Flood + Earthquake)
    heatmapEnabled: true,
    heatmapOpacity: 0.65,
    activeView: 'analysis',
    clusterModeAuto: true,
    forceClusterMode: false,

    // Leaflet Map & Layer Groups
    map: null,
    detailsMap: null,
    baseLayers: {},
    overlayGroups: {
        heatmapLayer: null,
        policies: null,
        clusters: null,
        rivers: null,
        faults: null,
        volcanoes: null,
        earthquakes: null,
        hazardZones: null,
        analysisHighlights: null,
        monitoringLayer: null,
        radarLayer: null
    },

    // Chart.js Instances
    charts: {
        floodHistory: null,
        elevationProfile: null,
        siDistribution: null,
        monCategoryBar: null,
        monCategoryPie: null,
        monRecTrend: null,
        monCompletion: null
    },

    // Pending Excel Rows in Acceptations Step 2
    pendingExcelRows: [],

    // Current Event Monitoring Mode
    currentMonitorMode: null,

    async init() {
        if (window.location.protocol === 'file:') {
            const banner = document.getElementById('protocol-warning-banner');
            if (banner) banner.classList.remove('hidden');
            console.info('[ASGARD] Berjalan dalam mode mandiri (file://). SafeStorage in-memory fallback aktif.');
        }

        this.loadPoliciesFromStorage();
        this.bindAuthEvents();
        this.bindNavigationEvents();
        this.initMainMap();
        this.populateRiskSwitchUI();
        this.populateFilterDropdowns();
        this.bindFilterEvents();
        this.bindAnalyzeDrawerEvents();
        this.bindDetailsViewEvents();
        this.bindAcceptationsEvents();
        this.bindMonitoringEvents();
        this.bindSimulationAndProfileModals();
        this.bindStreetViewModalEvents();

        // Load initial spatial layers, BMKG/MAGMA earthquakes & volcanoes
        this.renderStaticVectorLayers();
        await this.refreshEarthquakeLayer();
        this.refreshMapMarkers();
        this.renderMultiPerilHeatmapLayer();
        this.updateHeaderCounters();
        this.renderLeftPolicyList();
        this.populateNotificationsCenter();
    },

    // =========================================================================
    // 1. STORAGE & PORTFOLIO STATE
    // =========================================================================
    loadPoliciesFromStorage() {
        const mapToc = (t) => {
            const raw = String(t || '').toUpperCase();
            if (raw.includes('0101') || raw.includes('PSAKI')) return '0101 PSAKI';
            if (raw.includes('0102') || raw.includes('PSAGBI')) return '0102 PSAGBI';
            if (raw.includes('0104') || raw.includes('IAR')) return '0104 IAR';
            return '0103 PAR';
        };

        try {
            SafeStorage.clearLegacyKeys();
            const saved = SafeStorage.getLocal('ASGARD_POLICIES_V3_2_1000');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length >= 1000 && parsed[0].lon !== undefined) {
                    parsed.forEach(p => {
                        p.toc = mapToc(p.toc || p.lineOfBusiness);
                        p.typeOfClass = p.toc;
                        if (!p.coverageDuration) p.coverageDuration = '5 Tahun (17 Oktober 2026 – 17 Oktober 2031)';
                        if (!p.occupationCode || p.occupationCode === '2900') {
                            p.occupationCode = '2971';
                        }
                        if (typeof getSeojkOccupation === 'function') {
                            const meta = getSeojkOccupation(p.occupationCode);
                            p.occupationName = `${meta.nameId} (${meta.name})`;
                        }
                    });
                    this.policies = parsed;
                    this.filteredPolicies = [...this.policies];
                    return;
                }
            }
        } catch (e) {
            console.warn('Gagal membaca portofolio dari storage, menggunakan INITIAL_POLICIES (1.000 polis).', e);
        }
        this.policies = JSON.parse(JSON.stringify(INITIAL_POLICIES));
        this.filteredPolicies = [...this.policies];
    },

    savePoliciesToStorage() {
        try {
            SafeStorage.setLocal('ASGARD_POLICIES_V3_2_1000', JSON.stringify(this.policies));
        } catch (e) {
            console.warn('Gagal menyimpan portofolio ke storage:', e);
        }
        this.updateHeaderCounters();
    },

    formatIDR(amount) {
        return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
    },

    showToast(message) {
        const toast = document.getElementById('aegis-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3800);
    },

    updateHeaderCounters() {
        const countEl = document.getElementById('header-policy-count');
        const tsiEl = document.getElementById('header-total-tsi');
        if (countEl) countEl.textContent = String(this.policies.length);
        if (tsiEl) {
            const totalTsi = this.policies.reduce((sum, p) => sum + (Number(p.tsi) || 0), 0);
            const inTrillion = totalTsi >= 1e12
                ? `Rp ${(totalTsi / 1e12).toFixed(2)} T`
                : `Rp ${(totalTsi / 1e9).toFixed(1)} M`;
            tsiEl.textContent = inTrillion;
            tsiEl.title = this.formatIDR(totalTsi);
        }
    },

    // =========================================================================
    // 2. AUTHENTICATION & LOGIN OVERLAY (PDF Hal 1 & Hal 5)
    // =========================================================================
    bindAuthEvents() {
        const modal = document.getElementById('login-modal');
        const form = document.getElementById('login-form');
        const pwInput = document.getElementById('login-password');
        const showPw = document.getElementById('login-show-pw');
        const userInput = document.getElementById('login-username');
        const errorEl = document.getElementById('login-error');
        const rememberCb = document.getElementById('login-remember');

        // Check active session (sessionStorage or persistent localStorage)
        let savedUser = null;
        try {
            savedUser = SafeStorage.getSession('ASGARD_USER') ||
                        SafeStorage.getLocal('ASGARD_USER') ||
                        SafeStorage.getSession('AEGIS_USER') ||
                        SafeStorage.getLocal('AEGIS_USER');
        } catch (err) {
            console.warn('[ASGARD Auth] Error checking session:', err);
        }

        if (savedUser && modal) {
            modal.classList.add('hidden');
            this.updateUserDisplay(savedUser);
        }

        if (showPw && pwInput) {
            showPw.addEventListener('change', () => {
                pwInput.type = showPw.checked ? 'text' : 'password';
            });
        }

        const clearError = () => {
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.classList.add('hidden');
            }
        };
        userInput?.addEventListener('input', clearError);
        pwInput?.addEventListener('input', clearError);

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                clearError();

                const username = (userInput?.value || '').trim();
                const password = (pwInput?.value || '').trim();

                if (!username) {
                    if (errorEl) {
                        errorEl.textContent = 'Silakan masukkan username atau email korporat underwriter.';
                        errorEl.classList.remove('hidden');
                    }
                    userInput?.focus();
                    return;
                }

                const validPasswords = ['asgard2026', 'askrindo2026', 'aegis2026'];
                if (!password || (!validPasswords.includes(password.toLowerCase()) && password !== 'asgard2026')) {
                    if (errorEl) {
                        errorEl.textContent = 'Password otorisasi tidak valid. Masukkan password underwriter resmi ASGARD (default: asgard2026).';
                        errorEl.classList.remove('hidden');
                    }
                    pwInput?.focus();
                    return;
                }

                const remember = rememberCb ? rememberCb.checked : true;

                try {
                    SafeStorage.setSession('ASGARD_USER', username);
                    if (remember) {
                        SafeStorage.setLocal('ASGARD_USER', username);
                    } else {
                        SafeStorage.removeLocal('ASGARD_USER');
                    }
                } catch (err) {
                    console.warn('[ASGARD Auth] Storage error on login:', err);
                }

                this.updateUserDisplay(username);
                if (modal) modal.classList.add('hidden');
                this.showToast(`Selamat datang di ASGARD, ${username}`);

                setTimeout(() => {
                    if (this.map) this.map.invalidateSize();
                }, 150);
            });
        }

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                try {
                    SafeStorage.removeSession('ASGARD_USER');
                    SafeStorage.removeLocal('ASGARD_USER');
                    SafeStorage.removeSession('AEGIS_USER');
                    SafeStorage.removeLocal('AEGIS_USER');
                } catch (err) {
                    console.warn('[ASGARD Auth] Storage error on logout:', err);
                }

                const profModal = document.getElementById('modal-profile');
                if (profModal) profModal.classList.add('hidden');

                if (pwInput) pwInput.value = '';
                clearError();

                if (modal) modal.classList.remove('hidden');
                this.showToast('Sesi telah ditutup. Silakan login kembali.');
            });
        }
    },

    updateUserDisplay(username) {
        const shortName = username.split('@')[0].replace(/[._]/g, ' ');
        const headerName = document.getElementById('header-user-name');
        const profName = document.getElementById('profile-modal-name');
        const profEmail = document.getElementById('profile-modal-email');
        if (headerName) headerName.textContent = shortName.charAt(0).toUpperCase() + shortName.slice(1);
        if (profName) profName.textContent = shortName.toUpperCase() + ' (Underwriter)';
        if (profEmail) profEmail.textContent = username.includes('@') ? username : `${username}@askrindo.co.id`;
    },

    // =========================================================================
    // 3. TOP NAVIGATION, SUB-HEADER & NOTIFICATIONS (PDF Hal 1, 5, 6, 10)
    // =========================================================================
    bindNavigationEvents() {
        // Warning banner dismiss
        document.getElementById('btn-close-protocol-banner')?.addEventListener('click', () => {
            document.getElementById('protocol-warning-banner')?.classList.add('hidden');
        });

        // Brand home button
        document.getElementById('brand-home-btn')?.addEventListener('click', () => {
            this.switchWorkspaceView('analysis');
            this.resetToNationalView();
        });

        document.getElementById('breadcrumb-national')?.addEventListener('click', () => {
            this.switchWorkspaceView('analysis');
            this.resetToNationalView();
        });

        // Main buttons
        document.getElementById('nav-risk-analysis')?.addEventListener('click', () => {
            this.closeEventMonitoringPanel();
            this.switchWorkspaceView('analysis');
        });

        document.getElementById('nav-acceptations')?.addEventListener('click', () => {
            this.switchWorkspaceView('acceptations');
        });

        // Province quick jumper
        const provJump = document.getElementById('select-province-jump');
        if (provJump) {
            provJump.addEventListener('change', () => {
                const val = provJump.value;
                this.switchWorkspaceView('analysis');
                const bm = PROVINCE_BOOKMARKS[val];
                if (bm && this.map) {
                    this.map.flyTo([bm.lat, bm.lon], bm.zoom, { duration: 1.1 });
                }
                const bcRegion = document.getElementById('breadcrumb-region');
                if (bcRegion) {
                    bcRegion.textContent = val === 'ALL' ? 'Seluruh Indonesia (Fokus Pilot DKI Jakarta)' : `Provinsi ${val}`;
                }
            });
        }

        // Global search (Location via Nominatim or Policy keyword)
        const searchInput = document.getElementById('global-location-search');
        const searchBtn = document.getElementById('btn-global-search');
        const runGlobalSearch = async () => {
            const q = (searchInput?.value || '').trim();
            if (!q) return;
            this.switchWorkspaceView('analysis');

            // 1. Check if matches an existing policy first
            const qLower = q.toLowerCase();
            const matchedPolicy = this.policies.find(p =>
                p.policyNumber.toLowerCase().includes(qLower) ||
                p.objectCode.toLowerCase().includes(qLower) ||
                p.insuredName.toLowerCase().includes(qLower) ||
                p.village.toLowerCase().includes(qLower) ||
                p.district.toLowerCase().includes(qLower)
            );

            if (matchedPolicy) {
                this.focusOnPolicy(matchedPolicy, true);
                this.showToast(`Objek ditemukan: ${matchedPolicy.insuredName} (${matchedPolicy.objectCode})`);
                return;
            }

            // 2. Otherwise query Nominatim Indonesia
            this.showToast(`Mencari lokasi "${q}" di OpenStreetMap...`);
            const results = await AegisApi.searchLocationNominatim(q);
            if (results && results.length > 0) {
                const top = results[0];
                const lat = parseFloat(top.lat);
                const lon = parseFloat(top.lon);
                this.map.flyTo([lat, lon], 14, { duration: 1.2 });
                this.inspectCoordinateArea(lat, lon, top.display_name);
            } else {
                this.showToast(`Lokasi "${q}" tidak ditemukan.`);
            }
        };

        searchBtn?.addEventListener('click', runGlobalSearch);
        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') runGlobalSearch();
        });

        // Basemap switcher
        document.querySelectorAll('.basemap-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-basemap');
                this.switchBasemap(mode);
                document.querySelectorAll('.basemap-btn').forEach(b => {
                    b.className = 'basemap-btn px-2 py-0.5 rounded text-slate-400 hover:text-white cursor-pointer';
                });
                btn.className = 'basemap-btn px-2 py-0.5 rounded bg-blue-600 text-white font-semibold cursor-pointer';
            });
        });

        // Share button
        document.getElementById('btn-share-view')?.addEventListener('click', () => {
            const center = this.map ? this.map.getCenter() : { lat: -6.175, lng: 106.827 };
            const zoom = this.map ? this.map.getZoom() : 6;
            const shareText = `ASGARD Georisk Link — Lat: ${center.lat.toFixed(4)}, Lon: ${center.lng.toFixed(4)}, Zoom: ${zoom}, Peril: ${this.activePerilSwitch.toUpperCase()}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareText).catch(() => {});
            }
            this.showToast(`Tautan koordinat disalin: ${shareText}`);
        });

        // Notifications bell popover
        const notifBtn = document.getElementById('btn-notifications');
        const notifPopover = document.getElementById('notif-popover');
        notifBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            notifPopover?.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (notifPopover && !notifPopover.contains(e.target) && e.target !== notifBtn) {
                notifPopover.classList.add('hidden');
            }
        });
    },

    switchWorkspaceView(viewName) {
        this.activeView = viewName;
        const mapSec = document.getElementById('workspace-map-section');
        const detSec = document.getElementById('workspace-details-section');
        const accSec = document.getElementById('workspace-acceptations-section');
        const grdSec = document.getElementById('workspace-grading-section');

        mapSec?.classList.add('hidden');
        detSec?.classList.add('hidden');
        accSec?.classList.add('hidden');
        grdSec?.classList.add('hidden');

        // Highlight active nav button
        document.querySelectorAll('.nav-main-btn').forEach(btn => {
            btn.className = 'nav-main-btn px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-1.5 transition cursor-pointer';
        });

        if (viewName === 'analysis') {
            mapSec?.classList.remove('hidden');
            document.getElementById('nav-risk-analysis').className = 'nav-main-btn px-3 py-2 rounded-lg text-xs font-bold text-white bg-blue-600/25 border border-blue-500/40 flex items-center gap-1.5 transition cursor-pointer';
            setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 100);
        } else if (viewName === 'details') {
            detSec?.classList.remove('hidden');
            document.getElementById('nav-risk-analysis').className = 'nav-main-btn px-3 py-2 rounded-lg text-xs font-bold text-white bg-blue-600/25 border border-blue-500/40 flex items-center gap-1.5 transition cursor-pointer';
            setTimeout(() => { if (this.detailsMap) this.detailsMap.invalidateSize(); }, 150);
        } else if (viewName === 'acceptations') {
            accSec?.classList.remove('hidden');
            document.getElementById('nav-acceptations').className = 'nav-main-btn px-3 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600/25 border border-emerald-500/40 flex items-center gap-1.5 transition cursor-pointer';
        } else if (viewName === 'grading') {
            grdSec?.classList.remove('hidden');
            document.getElementById('nav-risk-monitoring').className = 'nav-main-btn px-3 py-2 rounded-lg text-xs font-bold text-white bg-cyan-600/25 border border-cyan-500/40 flex items-center gap-1.5 transition cursor-pointer';
            this.renderGradingMonitoringDashboard();
        }
    },

    populateNotificationsCenter() {
        const listEl = document.getElementById('notif-list');
        const badgeEl = document.getElementById('notif-badge');
        if (!listEl) return;

        const eqFeatures = (AegisApi.earthquakeCache && AegisApi.earthquakeCache.features) || AegisApi.getFallbackEarthquakes().features;
        const topEqs = eqFeatures.slice(0, 3);

        const items = [
            ...topEqs.map(eq => ({
                type: 'EARTHQUAKE',
                title: `Gempa M${eq.properties.mag.toFixed(1)} — ${eq.properties.place}`,
                time: new Date(eq.properties.time).toLocaleString('id-ID'),
                lat: eq.geometry.coordinates[1],
                lon: eq.geometry.coordinates[0]
            })),
            {
                type: 'POLICY',
                title: 'Pilot DKI Jakarta: 6 Polis Korporasi Aktif Terverifikasi',
                time: 'Hari ini • Portofolio Askrindo',
                lat: -6.1754,
                lon: 106.8272
            }
        ];

        if (badgeEl) badgeEl.textContent = String(items.length);

        listEl.innerHTML = items.map((it, idx) => `
            <div data-idx="${idx}" class="notif-row p-3 hover:bg-slate-800/70 cursor-pointer transition">
                <div class="flex items-center justify-between text-[10px] mb-0.5">
                    <span class="font-bold ${it.type === 'EARTHQUAKE' ? 'text-red-400' : 'text-emerald-400'}">${it.type === 'EARTHQUAKE' ? '🔴 USGS SEISMIC ALERT' : '📋 PORTFOLIO UPDATE'}</span>
                    <span class="text-slate-400">${it.time}</span>
                </div>
                <div class="text-xs font-semibold text-slate-100">${it.title}</div>
            </div>
        `).join('');

        listEl.querySelectorAll('.notif-row').forEach((row, i) => {
            row.addEventListener('click', () => {
                const it = items[i];
                document.getElementById('notif-popover')?.classList.add('hidden');
                this.switchWorkspaceView('analysis');
                this.map.flyTo([it.lat, it.lon], 10, { duration: 1.1 });
            });
        });
    },

    // =========================================================================
    // 4. LEAFLET MAP, PIE CLUSTERS, RISK PINS & VECTOR OVERLAYS
    // =========================================================================
    initMainMap() {
        this.map = L.map('map', {
            center: [-2.5489, 118.0149],
            zoom: 5,
            zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Create custom pane for Hybrid Area & Street Labels above satellite tiles
        this.map.createPane('labelsPane');
        this.map.getPane('labelsPane').style.zIndex = 390;
        this.map.getPane('labelsPane').style.pointerEvents = 'none';

        this.baseLayers.dark = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors (ASGARD Dark GIS)',
            className: 'aegis-dark-tiles',
            maxZoom: 19
        });

        this.baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
            maxZoom: 19
        });

        this.baseLayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        });

        this.baseLayers.dark.addTo(this.map);

        // Hybrid Reference Labels Layer (Nama Provinsi, Kota, Kecamatan, Kelurahan & Jalan di atas Peta Satelit)
        const esriPlaceLabels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            pane: 'labelsPane',
            maxZoom: 19,
            attribution: '&copy; Esri Boundaries & Places'
        });
        const esriRoadLabels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
            pane: 'labelsPane',
            maxZoom: 19,
            opacity: 0.85
        });
        this.overlayGroups.placeLabels = L.layerGroup([esriRoadLabels, esriPlaceLabels]).addTo(this.map);

        // Create custom pane for INARISK Multi-Peril Heatmap below vectors & labels
        this.map.createPane('heatmapPane');
        this.map.getPane('heatmapPane').style.zIndex = 250;
        this.map.getPane('heatmapPane').style.pointerEvents = 'none';

        // Initialize LayerGroups
        this.overlayGroups.heatmapLayer = L.layerGroup().addTo(this.map);
        this.overlayGroups.hazardZones = L.layerGroup().addTo(this.map);
        this.overlayGroups.rivers = L.layerGroup().addTo(this.map);
        this.overlayGroups.faults = L.layerGroup().addTo(this.map);
        this.overlayGroups.volcanoes = L.layerGroup().addTo(this.map);
        this.overlayGroups.earthquakes = L.layerGroup().addTo(this.map);
        this.overlayGroups.monitoringLayer = L.layerGroup().addTo(this.map);
        this.overlayGroups.analysisHighlights = L.layerGroup().addTo(this.map);
        this.overlayGroups.clusters = L.layerGroup().addTo(this.map);
        this.overlayGroups.policies = L.layerGroup().addTo(this.map);

        // Switch between Provincial Pie Clusters (zoom <= 6) and Individual Pins (zoom >= 7)
        this.map.on('zoomend', () => {
            this.refreshMapMarkers();
        });

        // Refresh INARISK BNPB Raster Heatmap on pan / zoom (debounced)
        this.map.on('moveend', () => {
            clearTimeout(this._heatmapMoveDebounce);
            this._heatmapMoveDebounce = setTimeout(() => {
                if (this.heatmapEnabled && this.activePerilSwitch !== 'none') {
                    this.renderMultiPerilHeatmapLayer();
                }
            }, 260);
        });

        // Setup Direct Map Click & Interactive Draw Rectangle / Area Analysis
        this.initMapClickAndDrawArea();

        // Quick toolbar map controls
        document.getElementById('btn-reset-indonesia')?.addEventListener('click', () => this.resetToNationalView());
        document.getElementById('btn-focus-jakarta')?.addEventListener('click', () => {
            this.forceClusterMode = false;
            this.map.flyTo([-6.1754, 106.8272], 12, { duration: 1.2 });
            document.getElementById('select-province-jump').value = 'DKI Jakarta';
            document.getElementById('breadcrumb-region').textContent = 'Fokus Pilot: Provinsi DKI Jakarta';
        });
        document.getElementById('btn-toggle-clusters')?.addEventListener('click', () => {
            this.forceClusterMode = !this.forceClusterMode;
            this.refreshMapMarkers();
            this.showToast(this.forceClusterMode ? 'Mode Pie-Cluster Provinsi Diaktifkan' : 'Mode Otomatis (Zoom Cluster / Pin Objek)');
        });
    },

    /**
     * Direct Map Click & Custom Draw Rectangle / Area Analysis (Sesuai Screenshot Referensi User)
     */
    initMapClickAndDrawArea() {
        this.isDrawMode = false;
        this.isDrawingRect = false;
        this.drawStartLatLng = null;
        this.tempDrawRect = null;
        this._justFinishedDragDraw = false;

        const drawBtn = document.getElementById('btn-draw-rectangle');
        const clearBtn = document.getElementById('btn-clear-area-box');
        const banner = document.getElementById('draw-mode-banner');
        const cancelBtn = document.getElementById('btn-cancel-draw-mode');

        const setDrawMode = (active) => {
            this.isDrawMode = active;
            const container = this.map.getContainer();
            if (active) {
                this.map.dragging.disable();
                container.style.cursor = 'crosshair';
                banner?.classList.remove('hidden');
                if (drawBtn) drawBtn.className = 'p-2 rounded-lg bg-emerald-600 text-white shadow-lg transition cursor-pointer';
            } else {
                this.map.dragging.enable();
                container.style.cursor = '';
                banner?.classList.add('hidden');
                if (drawBtn) drawBtn.className = 'p-2 rounded-lg text-emerald-400 hover:bg-emerald-600 hover:text-white transition cursor-pointer';
            }
        };

        drawBtn?.addEventListener('click', () => {
            setDrawMode(!this.isDrawMode);
        });

        cancelBtn?.addEventListener('click', () => {
            setDrawMode(false);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDrawMode) {
                setDrawMode(false);
            }
        });

        clearBtn?.addEventListener('click', () => {
            this.overlayGroups.analysisHighlights.clearLayers();
            this.map.closePopup();
            clearBtn.classList.add('hidden');
            this.showToast('Kotak area analisis dibersihkan.');
        });

        // Mouse Down for Draw Rectangle (either via Draw Button or Shift + Drag)
        this.map.on('mousedown', (e) => {
            if (!this.isDrawMode && !(e.originalEvent && e.originalEvent.shiftKey)) return;
            if (e.originalEvent && e.originalEvent.target && e.originalEvent.target.closest('.leaflet-marker-icon, .leaflet-popup, .aegis-panel')) return;

            this.isDrawingRect = true;
            this.drawStartLatLng = e.latlng;
            this.map.dragging.disable();

            if (this.tempDrawRect) {
                this.map.removeLayer(this.tempDrawRect);
            }
            this.tempDrawRect = L.rectangle([this.drawStartLatLng, this.drawStartLatLng], {
                color: '#60A5FA',
                weight: 2,
                dashArray: '6, 4',
                fillColor: '#3B82F6',
                fillOpacity: 0.25
            }).addTo(this.map);
        });

        this.map.on('mousemove', (e) => {
            if (!this.isDrawingRect || !this.drawStartLatLng || !this.tempDrawRect) return;
            this.tempDrawRect.setBounds(L.latLngBounds(this.drawStartLatLng, e.latlng));
        });

        this.map.on('mouseup', (e) => {
            if (!this.isDrawingRect) return;
            this.isDrawingRect = false;

            const endLatLng = e.latlng;
            const startLatLng = this.drawStartLatLng;
            if (this.tempDrawRect) {
                this.map.removeLayer(this.tempDrawRect);
                this.tempDrawRect = null;
            }

            setDrawMode(false);

            if (startLatLng && endLatLng) {
                const bounds = L.latLngBounds(startLatLng, endLatLng);
                const distMeters = this.map.distance(startLatLng, endLatLng);
                if (distMeters > 30) {
                    this._justFinishedDragDraw = true;
                    setTimeout(() => { this._justFinishedDragDraw = false; }, 250);
                    this.renderAreaAnalysisBoxAndPopup(bounds, true);
                }
            }
        });

        // Direct Click Anywhere on Map -> Precise Point Inspection (No Rectangle / No Scatter Box)
        this.map.on('click', (e) => {
            if (this._justFinishedDragDraw || this.isDrawMode) return;
            if (e.originalEvent && e.originalEvent.target && e.originalEvent.target.closest('.leaflet-marker-icon, .leaflet-popup, .aegis-panel')) {
                return;
            }

            this.renderPrecisePointPopup(e.latlng.lat, e.latlng.lng);
        });
    },

    /**
     * Render Precise Point Marker + Dark Popup when user clicks directly on the map (No Rectangle Box)
     */
    async renderPrecisePointPopup(lat, lon) {
        this.overlayGroups.analysisHighlights.clearLayers();
        document.getElementById('btn-clear-area-box')?.classList.remove('hidden');

        // Draw a precise target pin / pulse ring at the exact clicked coordinate
        L.circleMarker([lat, lon], {
            radius: 14,
            color: '#38BDF8',
            weight: 1.5,
            fillColor: '#0EA5E9',
            fillOpacity: 0.20
        }).addTo(this.overlayGroups.analysisHighlights);

        L.circleMarker([lat, lon], {
            radius: 6,
            color: '#FFFFFF',
            weight: 2.5,
            fillColor: '#2563EB',
            fillOpacity: 1
        }).addTo(this.overlayGroups.analysisHighlights);

        const buildPointPopupHtml = (addressStr) => `
            <div class="p-4 text-center text-slate-100 select-text" style="background:#1E293B; border-radius:10px;">
                <div class="text-xs font-extrabold text-white tracking-wide pb-2.5 border-b border-slate-600/80 font-mono">
                    ${lon.toFixed(6)}, ${lat.toFixed(6)}
                </div>
                <div class="py-3 text-xs text-slate-200 leading-relaxed font-medium">
                    ${addressStr}
                </div>
                <div class="mb-3 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-[10px] text-sky-300 font-semibold">
                    📍 Titik Presisi Koordinat (Single-Point Inspection)
                </div>
                <div class="space-y-2">
                    <button id="btn-popup-analyze-area-now"
                        class="w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-lg transition cursor-pointer">
                        Analyze Point / Area
                    </button>
                    <button id="btn-popup-street-view-now"
                        class="w-full py-2 px-4 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-blue-400 font-bold text-xs block transition cursor-pointer">
                        🏢 Show Street View &amp; Gedung
                    </button>
                </div>
            </div>
        `;

        const popup = L.popup({ maxWidth: 320, closeButton: true, autoPan: true })
            .setLatLng([lat, lon])
            .setContent(buildPointPopupHtml('Memuat alamat titik koordinat...'))
            .openOn(this.map);

        const bindPopupBtn = (resolvedAddr) => {
            const el = popup.getElement();
            if (!el) return;
            const btn = el.querySelector('#btn-popup-analyze-area-now');
            if (btn) {
                btn.addEventListener('click', () => {
                    this.inspectCoordinateArea(lat, lon, resolvedAddr, {
                        isCustomDrawn: false,
                        policiesInBox: [],
                        scatterPointsCount: 12
                    });
                });
            }
            const svBtn = el.querySelector('#btn-popup-street-view-now');
            if (svBtn) {
                svBtn.addEventListener('click', () => {
                    this.openStreetViewModal(lat, lon, `Inspeksi Gedung & Lingkungan (${lat.toFixed(5)}, ${lon.toFixed(5)})`, resolvedAddr);
                });
            }
        };

        bindPopupBtn(`Koordinat (${lon.toFixed(6)}, ${lat.toFixed(6)})`);

        const geoInfo = await AegisApi.reverseGeocodeNominatim(lat, lon);
        if (this.map.hasLayer(popup)) {
            popup.setContent(buildPointPopupHtml(geoInfo.displayName));
            bindPopupBtn(geoInfo.displayName);
        }

        const drawer = document.getElementById('analyze-area-drawer');
        if (drawer && !drawer.classList.contains('hidden')) {
            this.inspectCoordinateArea(lat, lon, geoInfo.displayName, {
                isCustomDrawn: false,
                policiesInBox: [],
                scatterPointsCount: 12
            });
        }
    },

    /**
     * Render Blue Shaded Analysis Rectangle + Scatter Exposure Dots + Dark Popup (ONLY when drawn via Draw Rectangle menu)
     */
    async renderAreaAnalysisBoxAndPopup(bounds, isCustomDrawn = true) {
        this.overlayGroups.analysisHighlights.clearLayers();
        document.getElementById('btn-clear-area-box')?.classList.remove('hidden');

        const center = bounds.getCenter();
        const lat = center.lat;
        const lon = center.lng;

        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const nw = bounds.getNorthWest();
        const se = bounds.getSouthEast();

        const polyCoords = [
            [nw.lat, nw.lng],
            [ne.lat, ne.lng],
            [se.lat, se.lng],
            [sw.lat, sw.lng]
        ];

        // 1. Draw Shaded Blue Analysis Rectangle
        L.polygon(polyCoords, {
            color: '#60A5FA',
            weight: 1.8,
            fillColor: '#3B82F6',
            fillOpacity: 0.24
        }).addTo(this.overlayGroups.analysisHighlights);

        // 2. Check how many portfolio policies fall inside this rectangle
        const policiesInBox = this.policies.filter(p => bounds.contains([p.lat, p.lon]));
        const widthKm = this.map.distance([sw.lat, sw.lng], [sw.lat, ne.lng]) / 1000;
        const heightKm = this.map.distance([sw.lat, sw.lng], [ne.lat, sw.lng]) / 1000;
        const areaKm2 = Math.max(0.01, Math.round(widthKm * heightKm * 100) / 100);

        // Hanya tampilkan polis yang berada pada area kotak tersebut
        this.filteredPolicies = policiesInBox;
        this.forceClusterMode = false;
        this.refreshMapMarkers();
        this.renderLeftPolicyList();

        // 3. Open Dark Popup immediately with loading address, then update with live Nominatim Reverse Geocode
        const buildPopupHtml = (addressStr) => `
            <div class="p-4 text-center text-slate-100 select-text" style="background:#1E293B; border-radius:10px;">
                <div class="text-xs font-extrabold text-white tracking-wide pb-2.5 border-b border-slate-600/80 font-mono">
                    ${lon.toFixed(6)}, ${lat.toFixed(6)}
                </div>
                <div class="py-3 text-xs text-slate-200 leading-relaxed font-medium">
                    ${addressStr}
                </div>
                <div class="mb-3 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-[10px] text-cyan-300 font-semibold">
                    📐 Area Analisis: ${areaKm2} km² • ${policiesInBox.length} Polis Portofolio
                </div>
                <div class="space-y-2">
                    <button id="btn-popup-analyze-area-now"
                        class="w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-lg transition cursor-pointer">
                        Analyze Area
                    </button>
                    <button id="btn-popup-street-view-now"
                        class="w-full py-2 px-4 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-blue-400 font-bold text-xs block transition cursor-pointer">
                        🏢 Show Street View &amp; Gedung
                    </button>
                </div>
            </div>
        `;

        const popup = L.popup({ maxWidth: 320, closeButton: true, autoPan: true })
            .setLatLng([lat, lon])
            .setContent(buildPopupHtml('Memuat alamat lokasi geospasial...'))
            .openOn(this.map);

        const bindPopupBtn = (resolvedAddr) => {
            const el = popup.getElement();
            if (!el) return;
            const btn = el.querySelector('#btn-popup-analyze-area-now');
            if (btn) {
                btn.addEventListener('click', () => {
                    this.inspectCoordinateArea(lat, lon, resolvedAddr, {
                        isCustomDrawn: true,
                        areaKm2,
                        policiesInBox
                    });
                });
            }
            const svBtn = el.querySelector('#btn-popup-street-view-now');
            if (svBtn) {
                svBtn.addEventListener('click', () => {
                    this.openStreetViewModal(lat, lon, `Area Analisis (${areaKm2} km²)`, resolvedAddr);
                });
            }
        };

        bindPopupBtn(`Koordinat (${lon.toFixed(6)}, ${lat.toFixed(6)})`);

        const geoInfo = await AegisApi.reverseGeocodeNominatim(lat, lon);
        if (this.map.hasLayer(popup)) {
            popup.setContent(buildPopupHtml(geoInfo.displayName));
            bindPopupBtn(geoInfo.displayName);
        }

        const drawer = document.getElementById('analyze-area-drawer');
        if (drawer && !drawer.classList.contains('hidden')) {
            this.inspectCoordinateArea(lat, lon, geoInfo.displayName, {
                isCustomDrawn: true,
                areaKm2,
                policiesInBox
            });
        }
    },

    resetToNationalView() {
        if (!this.map) return;
        this.map.flyTo([-2.5489, 118.0149], 5, { duration: 1.1 });
        const provJump = document.getElementById('select-province-jump');
        if (provJump) provJump.value = 'ALL';
        const bcRegion = document.getElementById('breadcrumb-region');
        if (bcRegion) bcRegion.textContent = 'Seluruh Indonesia (Fokus Pilot DKI Jakarta)';
    },

    switchBasemap(mode) {
        if (!this.map) return;
        Object.values(this.baseLayers).forEach(layer => {
            if (this.map.hasLayer(layer)) this.map.removeLayer(layer);
        });
        if (this.baseLayers[mode]) {
            this.baseLayers[mode].addTo(this.map);
        }
        // Automatically ensure Hybrid Place & Road Labels are active on Satellite basemap
        if (mode === 'satellite' && this.overlayGroups.placeLabels) {
            if (!this.map.hasLayer(this.overlayGroups.placeLabels)) {
                this.map.addLayer(this.overlayGroups.placeLabels);
            }
            const lblCheckbox = document.getElementById('toggle-layer-labels');
            if (lblCheckbox) lblCheckbox.checked = true;
            this.showToast('Mode Satellite Hybrid: Citra Satelit + Layer Nama Daerah & Jalan Aktif');
        }
    },

    renderStaticVectorLayers() {
        // 1. Rivers Layer
        this.overlayGroups.rivers.clearLayers();
        L.geoJSON(MAJOR_RIVERS_GEOJSON, {
            style: { color: '#38BDF8', weight: 2.5, opacity: 0.75 },
            onEachFeature: (feature, layer) => {
                layer.bindTooltip(`🌊 ${feature.properties.name} (${feature.properties.city})`, { sticky: true });
            }
        }).addTo(this.overlayGroups.rivers);

        // 2. Active Faults Layer
        this.overlayGroups.faults.clearLayers();
        L.geoJSON(ACTIVE_FAULTS_GEOJSON, {
            style: { color: '#F97316', weight: 2.5, dashArray: '6, 6', opacity: 0.85 },
            onEachFeature: (feature, layer) => {
                layer.bindTooltip(`⚡ ${feature.properties.name} | Slip: ${feature.properties.slipRate} | Mmax: ${feature.properties.maxMagEst}`, { sticky: true });
            }
        }).addTo(this.overlayGroups.faults);

        // 3. Active Volcanoes + KRB Circles
        this.overlayGroups.volcanoes.clearLayers();
        ACTIVE_VOLCANOES.forEach(v => {
            // KRB I (Outer)
            L.circle([v.lat, v.lon], {
                radius: v.krb1RadiusKm * 1000,
                color: '#F59E0B',
                weight: 1,
                fillColor: '#F59E0B',
                fillOpacity: 0.08
            }).bindTooltip(`${v.name} — Zona KRB I (${v.krb1RadiusKm} km)`).addTo(this.overlayGroups.volcanoes);

            // KRB III (Inner High Hazard)
            L.circle([v.lat, v.lon], {
                radius: v.krb3RadiusKm * 1000,
                color: '#DC2626',
                weight: 1.5,
                fillColor: '#DC2626',
                fillOpacity: 0.22
            }).bindTooltip(`${v.name} — Zona KRB III (${v.krb3RadiusKm} km)`).addTo(this.overlayGroups.volcanoes);

            const vIcon = L.divIcon({
                className: 'custom-volcano-icon',
                html: `<div class="w-6 h-6 rounded-full bg-red-900/90 border border-red-400 flex items-center justify-center text-xs shadow-lg" title="${v.name}">🌋</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            L.marker([v.lat, v.lon], { icon: vIcon })
                .bindTooltip(`<strong>${v.name}</strong> (${v.province})<br/>Status: ${v.status}<br/>${v.pvmbgNote}`)
                .addTo(this.overlayGroups.volcanoes);
        });
    },

    async refreshEarthquakeLayer() {
        this.overlayGroups.earthquakes.clearLayers();
        const eqData = await AegisApi.fetchRecentEarthquakes();
        if (!eqData || !eqData.features) return;

        // Also enrich volcanoes from live MAGMA ESDM if available
        AegisApi.fetchMagmaVolcanoes().catch(() => {});

        eqData.features.forEach(eq => {
            const coords = eq.geometry.coordinates;
            const mag = eq.properties.mag || 4.5;
            const isVolcanic = (eq.properties.type || '').includes('Volcanic');
            const color = isVolcanic ? '#DC2626' : (mag >= 6.0 ? '#EF4444' : mag >= 5.0 ? '#F97316' : '#FBBF24');
            const radius = Math.max(5, (mag - 3.5) * 4.5);

            L.circleMarker([coords[1], coords[0]], {
                radius,
                color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.50
            })
            .bindTooltip(`<strong>${isVolcanic ? '🌋 Gempa Vulkanik' : '🔴 Gempa Tektonik'} M${mag.toFixed(1)}</strong> (${eq.properties.provider || 'BMKG TEWS'})<br/>${eq.properties.place}<br/>Kedalaman: ${coords[2] || 10} km<br/>Waktu: ${new Date(eq.properties.time).toLocaleString('id-ID')}`)
            .addTo(this.overlayGroups.earthquakes);
        });
    },

    /**
     * Get the score & classification of a policy under the currently selected Risk Switch (Single, Stacked Multi-Peril, or Composite)
     */
    getPolicyActiveRisk(policy) {
        if (this.activePerilSwitch === 'none' || (this.activePerilSwitch === 'stacked' && this.activePerilsSet.size === 0)) {
            return {
                score: '-',
                status: 'OK',
                cls: { code: 'NONE', label: 'Non-Aktif', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.20)' },
                perilLabel: 'Layer Bahaya Non-Aktif'
            };
        }

        if (this.activePerilSwitch === 'composite') {
            const valid = Object.values(policy.perilScores || {})
                .filter(p => p && p.status === 'OK' && typeof p.score === 'number')
                .map(p => p.score);
            const max = valid.length ? Math.max(...valid) : 0;
            const avg = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
            const comp = valid.length ? Math.round(max * 0.6 + avg * 0.4) : null;
            return {
                score: comp,
                status: comp === null ? 'NO_DATA' : 'OK',
                cls: AegisApi.classifyScore(comp, comp === null ? 'NO_DATA' : 'OK'),
                perilLabel: 'Multi-Hazard Composite (H×V×C)'
            };
        }

        if (this.activePerilSwitch === 'stacked') {
            const selectedIds = [...this.activePerilsSet];
            if (selectedIds.length === 1) {
                const singleId = selectedIds[0];
                const pObj = (policy.perilScores && policy.perilScores[singleId]) || { score: null, status: 'NO_DATA' };
                const perilMeta = AEGIS_PERILS.find(x => x.id === singleId);
                return {
                    score: pObj.score,
                    status: pObj.status,
                    cls: AegisApi.classifyScore(pObj.score, pObj.status),
                    perilLabel: perilMeta ? `${perilMeta.name} (${perilMeta.providerBadge || 'INARISK'})` : singleId
                };
            }
            const validScores = selectedIds
                .map(id => policy.perilScores && policy.perilScores[id])
                .filter(p => p && p.status === 'OK' && typeof p.score === 'number')
                .map(p => p.score);
            const max = validScores.length ? Math.max(...validScores) : 0;
            const avg = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
            const stackedScore = validScores.length ? Math.round(max * 0.65 + avg * 0.35) : null;
            const namesShort = selectedIds.map(id => {
                const m = AEGIS_PERILS.find(x => x.id === id);
                return m ? m.name.split(' ')[0] : id;
            }).join(' + ');
            return {
                score: stackedScore,
                status: stackedScore === null ? 'NO_DATA' : 'OK',
                cls: AegisApi.classifyScore(stackedScore, stackedScore === null ? 'NO_DATA' : 'OK'),
                perilLabel: `Stacked (${namesShort})`
            };
        }

        const pObj = (policy.perilScores && policy.perilScores[this.activePerilSwitch]) || { score: null, status: 'NO_DATA' };
        const perilMeta = AEGIS_PERILS.find(x => x.id === this.activePerilSwitch);
        return {
            score: pObj.score,
            status: pObj.status,
            cls: AegisApi.classifyScore(pObj.score, pObj.status),
            perilLabel: perilMeta ? perilMeta.name : this.activePerilSwitch
        };
    },

    /**
     * Helper: Ray-casting Point-in-Polygon check against INDONESIA_ISLAND_POLYGONS
     * Ensures the Flood Risk Heatmap strictly conforms to Indonesian island coastlines (no ocean blocks)
     */
    isPointOnIndonesianLand(lat, lon) {
        if (typeof INDONESIA_ISLAND_POLYGONS === 'undefined' || !Array.isArray(INDONESIA_ISLAND_POLYGONS)) {
            return lat >= -10.5 && lat <= 5.8 && lon >= 95.1 && lon <= 141.0;
        }
        for (let p = 0; p < INDONESIA_ISLAND_POLYGONS.length; p++) {
            const poly = INDONESIA_ISLAND_POLYGONS[p];
            let inside = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const xi = poly[i][0], yi = poly[i][1];
                const xj = poly[j][0], yj = poly[j][1];
                const intersect = ((yi > lat) !== (yj > lat)) &&
                    (lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-9) + xi);
                if (intersect) inside = !inside;
            }
            if (inside) return true;
        }
        return false;
    },

    /**
     * Render Interactive Flood-Focused Spatial Risk Heatmap Layer across All Indonesian Regions
     * Color Ramp matching Reference Screenshots:
     *   Green (Low: 20-40) -> Yellow (Medium: 40-60) -> Orange (High: 60-80) -> Red (Very High: 80-100)
     * Default Risk Switch remains 'composite', while regional heatmap visualization focuses on Flood Risk
     * across Sumatera, Jawa, Kalimantan, Sulawesi, Bali, NTB, NTT, Maluku, and Papua.
     */
    async renderMultiPerilHeatmapLayer() {
        if (!this.map || !this.overlayGroups.heatmapLayer) return;

        if (!this.heatmapEnabled || this.activePerilSwitch === 'none') {
            this.overlayGroups.heatmapLayer.clearLayers();
            return;
        }

        const activePerils = this.activePerilSwitch === 'composite'
            ? AEGIS_PERILS.map(p => p.id)
            : (this.activePerilSwitch === 'stacked' ? [...this.activePerilsSet] : [this.activePerilSwitch]);

        if (activePerils.length === 0) {
            this.overlayGroups.heatmapLayer.clearLayers();
            return;
        }

        this._heatmapRenderSeq = (this._heatmapRenderSeq || 0) + 1;
        const currentSeq = this._heatmapRenderSeq;

        const mapBounds = this.map.getBounds();
        const west = Math.max(94.80, Math.min(141.10, mapBounds.getWest()));
        const south = Math.max(-11.20, Math.min(5.95, mapBounds.getSouth()));
        const east = Math.max(west + 0.02, Math.min(141.20, mapBounds.getEast()));
        const north = Math.max(south + 0.02, mapBounds.getNorth() <= 6.2 ? mapBounds.getNorth() : 6.20);

        if (east <= west || north <= south) return;

        const overlayBounds = [[south, west], [north, east]];

        const pointToSegmentDistKm = (pLat, pLon, aLat, aLon, bLat, bLon) => {
            const cosLat = Math.cos(pLat * Math.PI / 180);
            const px = pLon * 111.32 * cosLat;
            const py = pLat * 110.57;
            const ax = aLon * 111.32 * cosLat;
            const ay = aLat * 110.57;
            const bx = bLon * 111.32 * cosLat;
            const by = bLat * 110.57;
            const dx = bx - ax;
            const dy = by - ay;
            const lenSq = dx * dx + dy * dy;
            if (lenSq === 0) return Math.hypot(px - ax, py - ay);
            const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
            return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
        };

        // Collect visible Flood Corridors across Indonesia
        const visibleFloodCorridors = [];
        if (typeof INDONESIA_FLOOD_CORRIDORS !== 'undefined') {
            INDONESIA_FLOOD_CORRIDORS.forEach(cor => {
                const pts = cor.points || [];
                for (let i = 0; i < pts.length - 1; i++) {
                    const [lonA, latA] = pts[i];
                    const [lonB, latB] = pts[i + 1];
                    if (Math.max(latA, latB) >= south - 1.2 && Math.min(latA, latB) <= north + 1.2 &&
                        Math.max(lonA, lonB) >= west - 1.2 && Math.min(lonA, lonB) <= east + 1.2) {
                        visibleFloodCorridors.push({
                            latA, lonA, latB, lonB,
                            widthKm: cor.widthKm || 28,
                            peakScore: cor.peakScore || 88
                        });
                    }
                }
            });
        }

        // Collect visible Major Rivers
        const visibleRiverSegments = [];
        if (typeof MAJOR_RIVERS_GEOJSON !== 'undefined' && MAJOR_RIVERS_GEOJSON.features) {
            MAJOR_RIVERS_GEOJSON.features.forEach(feat => {
                const coords = feat.geometry && feat.geometry.coordinates;
                if (!coords) return;
                for (let i = 0; i < coords.length - 1; i++) {
                    const [lonA, latA] = coords[i];
                    const [lonB, latB] = coords[i + 1];
                    if (Math.max(latA, latB) >= south - 0.8 && Math.min(latA, latB) <= north + 0.8 &&
                        Math.max(lonA, lonB) >= west - 0.8 && Math.min(lonA, lonB) <= east + 0.8) {
                        visibleRiverSegments.push({ latA, lonA, latB, lonB });
                    }
                }
            });
        }

        // Collect visible Flood Hazard Zones
        const visibleFloodZones = [];
        if (typeof FLOOD_HAZARD_ZONES !== 'undefined') {
            FLOOD_HAZARD_ZONES.forEach(fz => {
                const zLon = fz.lng !== undefined ? fz.lng : fz.lon;
                if (fz.lat >= south - 0.8 && fz.lat <= north + 0.8 && zLon >= west - 0.8 && zLon >= 0 && zLon <= east + 0.8) {
                    visibleFloodZones.push({ lat: fz.lat, lon: zLon, radiusKm: fz.dangerRadiusKm || 6.0, riskScore: fz.riskScore || 88 });
                }
            });
        }

        // Collect visible Active Faults & Volcanoes (for single-peril switch support)
        const visibleFaultSegments = [];
        if (typeof ACTIVE_FAULTS_GEOJSON !== 'undefined' && ACTIVE_FAULTS_GEOJSON.features) {
            ACTIVE_FAULTS_GEOJSON.features.forEach(feat => {
                const coords = feat.geometry && feat.geometry.coordinates;
                if (!coords) return;
                for (let i = 0; i < coords.length - 1; i++) {
                    const [lonA, latA] = coords[i];
                    const [lonB, latB] = coords[i + 1];
                    if (Math.max(latA, latB) >= south - 1 && Math.min(latA, latB) <= north + 1 &&
                        Math.max(lonA, lonB) >= west - 1 && Math.min(lonA, lonB) <= east + 1) {
                        visibleFaultSegments.push({ latA, lonA, latB, lonB });
                    }
                }
            });
        }

        const visibleVolcanoes = [];
        if (typeof ACTIVE_VOLCANOES !== 'undefined') {
            ACTIVE_VOLCANOES.forEach(v => {
                const vLon = v.lon ?? v.lng;
                if (v.lat >= south - 1.2 && v.lat <= north + 1.2 && vLon >= west - 1.2 && vLon <= east + 1.2) {
                    visibleVolcanoes.push({ lat: v.lat, lon: vLon, radiusKm: v.dangerRadiusKm || 8.0 });
                }
            });
        }

        /**
         * Map a normalized Risk Score (20..100) to the exact vivid Reference Screenshot RGBA palette:
         *   20-40: Vivid Green (#10B981 -> #84CC16) [Low Risk]
         *   40-60: Vivid Yellow (#EAB308 -> #F59E0B) [Moderate Risk]
         *   60-80: Vivid Orange (#F97316 -> #EA580C) [High Risk]
         *   80-100: Vivid Red (#EF4444 -> #DC2626) [Very High Risk]
         */
        const scoreToRgba = (score) => {
            if (score < 20) return [0, 0, 0, 0];
            if (score < 40) {
                const t = (score - 20) / 20;
                return [
                    Math.round(22 + t * 110),   // 22 -> 132 (Green -> Lime)
                    Math.round(180 + t * 24),   // 180 -> 204
                    Math.round(95 - t * 73),    // 95 -> 22
                    195
                ];
            }
            if (score < 60) {
                const t = (score - 40) / 20;
                return [
                    Math.round(132 + t * 118),  // 132 -> 250 (Lime -> Yellow/Amber)
                    Math.round(204 - t * 14),   // 204 -> 190
                    Math.round(22 - t * 10),    // 22 -> 12
                    212
                ];
            }
            if (score < 80) {
                const t = (score - 60) / 20;
                return [
                    Math.round(250 - t * 5),    // 250 -> 245 (Yellow -> Orange)
                    Math.round(190 - t * 95),   // 190 -> 95
                    Math.round(12 + t * 10),    // 12 -> 22
                    228
                ];
            }
            const t = Math.min(1, (score - 80) / 20);
            return [
                Math.round(245 - t * 25),       // 245 -> 220 (Orange -> Deep Red)
                Math.round(95 - t * 67),        // 95 -> 28
                Math.round(22 + t * 12),        // 22 -> 34
                242
            ];
        };

        // 1. Compute 140x140 High-Speed Spatial Grid (Synchronously renders in ~12ms for instant interactivity)
        const GW = 140;
        const GH = 140;
        const gridScores = new Float32Array(GW * GH);

        const checkPerils = new Set(activePerils);
        const isComposite = this.activePerilSwitch === 'composite' || checkPerils.size >= 5;
        // Focus regional heatmap on Flood Risk when in default Composite or Flood mode
        const focusFloodHeatmap = isComposite || this.activePerilSwitch === 'flood' || checkPerils.has('flood');

        for (let gy = 0; gy < GH; gy++) {
            const pLat = north - (gy / (GH - 1)) * (north - south);
            const cosLat = Math.cos(pLat * Math.PI / 180);

            for (let gx = 0; gx < GW; gx++) {
                const pLon = west + (gx / (GW - 1)) * (east - west);
                const gIdx = gy * GW + gx;

                // Strictly clip to Indonesian island landmass polygons so ocean remains transparent
                if (!this.isPointOnIndonesianLand(pLat, pLon)) {
                    gridScores[gIdx] = 0;
                    continue;
                }

                // Multi-frequency organic spatial texture (simulates micro-topography & alluvial Sub-DAS contours)
                const tex1 = Math.sin(pLon * 11.5 + pLat * 9.2) * Math.cos(pLat * 14.8 - pLon * 7.4);
                const tex2 = Math.sin(pLon * 29.0 - pLat * 23.5) * Math.cos(pLat * 31.0 + pLon * 19.0);
                const terrainVariation = tex1 * 8.5 + tex2 * 5.0;

                // Base landmass flood risk (Green low-risk baseline 27..38 across hills/inland)
                let floodScore = Math.max(22, Math.min(48, Math.round(31 + terrainVariation)));

                // A. Evaluate proximity to Indonesian Flood Corridors (DAS & Alluvial Lowlands across all islands)
                for (let c = 0; c < visibleFloodCorridors.length; c++) {
                    const cor = visibleFloodCorridors[c];
                    const dKm = pointToSegmentDistKm(pLat, pLon, cor.latA, cor.lonA, cor.latB, cor.lonB);
                    if (dKm < cor.widthKm * 1.65) {
                        const norm = dKm / (cor.widthKm * 1.65);
                        // Smooth bell-shaped hydrological floodplain profile with micro-topography modulation
                        const profile = Math.pow(1 - norm, 1.35);
                        const localMod = 1 + (tex2 * 0.12);
                        const cScore = Math.round((28 + (cor.peakScore - 28) * profile) * localMod);
                        if (cScore > floodScore) floodScore = Math.min(96, cScore);
                    }
                }

                // B. Evaluate proximity to detailed Major Rivers (Ciliwung, Cisadane, Pesanggrahan, Citarum, Brantas, etc.)
                for (let r = 0; r < visibleRiverSegments.length; r++) {
                    const seg = visibleRiverSegments[r];
                    const dKm = pointToSegmentDistKm(pLat, pLon, seg.latA, seg.lonA, seg.latB, seg.lonB);
                    if (dKm < 14) {
                        const rProfile = Math.pow(1 - dKm / 14, 1.45);
                        const rScore = Math.round(32 + 60 * rProfile + tex2 * 3);
                        if (rScore > floodScore) floodScore = Math.min(96, rScore);
                    }
                }

                // C. Evaluate proximity to Urban & Coastal Flood Hotspots (Pluit, Kelapa Gading, Kaligawe, Dayeuhkolot, etc.)
                for (let fz = 0; fz < visibleFloodZones.length; fz++) {
                    const z = visibleFloodZones[fz];
                    const zDist = Math.hypot((pLon - z.lon) * 111.32 * cosLat, (pLat - z.lat) * 110.57);
                    const effRad = z.radiusKm * 2.4;
                    if (zDist < effRad) {
                        const zProfile = Math.pow(1 - zDist / effRad, 1.3);
                        const zScore = Math.round(34 + (z.riskScore - 30) * zProfile);
                        if (zScore > floodScore) floodScore = Math.min(96, zScore);
                    }
                }

                // Select final score based on activePerilSwitch
                let finalScore = floodScore;

                if (!focusFloodHeatmap) {
                    if (this.activePerilSwitch === 'earthquake') {
                        let eqScore = Math.max(24, Math.round(30 + terrainVariation));
                        for (let s = 0; s < visibleFaultSegments.length; s++) {
                            const seg = visibleFaultSegments[s];
                            const d = pointToSegmentDistKm(pLat, pLon, seg.latA, seg.lonA, seg.latB, seg.lonB);
                            if (d < 55) {
                                const sc = Math.round(30 + 62 * Math.pow(1 - d / 55, 1.3));
                                if (sc > eqScore) eqScore = sc;
                            }
                        }
                        finalScore = eqScore;
                    } else if (this.activePerilSwitch === 'volcano') {
                        let volcScore = 24;
                        for (let v = 0; v < visibleVolcanoes.length; v++) {
                            const volc = visibleVolcanoes[v];
                            const vDist = Math.hypot((pLon - volc.lon) * 111.32 * cosLat, (pLat - volc.lat) * 110.57);
                            if (vDist < volc.radiusKm * 3.0) {
                                const sc = Math.round(28 + 66 * Math.pow(1 - vDist / (volc.radiusKm * 3.0), 1.4));
                                if (sc > volcScore) volcScore = sc;
                            }
                        }
                        finalScore = volcScore;
                    }
                } else if (isComposite) {
                    // Default 'composite' keeps Flood Risk as the primary visible regional contour while incorporating seismic/volcanic peaks
                    let compScore = floodScore;
                    for (let s = 0; s < visibleFaultSegments.length; s++) {
                        const seg = visibleFaultSegments[s];
                        const d = pointToSegmentDistKm(pLat, pLon, seg.latA, seg.lonA, seg.latB, seg.lonB);
                        if (d < 18) {
                            const eqBoost = Math.round(78 * (1 - d / 18));
                            if (eqBoost > compScore) compScore = Math.round(compScore * 0.45 + eqBoost * 0.55);
                        }
                    }
                    finalScore = compScore;
                }

                gridScores[gIdx] = finalScore;
            }
        }

        // Helper to render the 512x512 canvas from gridScores (+ optional BNPB pixel data) and mount on map
        const W = 512;
        const H = 512;
        const paintHeatmapToMap = (bnpbPixelData = []) => {
            if (currentSeq !== this._heatmapRenderSeq) return;

            const outCanvas = document.createElement('canvas');
            outCanvas.width = W;
            outCanvas.height = H;
            const outCtx = outCanvas.getContext('2d');
            const outImgData = outCtx.createImageData(W, H);
            const outData = outImgData.data;

            for (let y = 0; y < H; y++) {
                const gyFloat = (y / (H - 1)) * (GH - 1);
                const gy0 = Math.floor(gyFloat);
                const gy1 = Math.min(GH - 1, gy0 + 1);
                const fy = gyFloat - gy0;

                for (let x = 0; x < W; x++) {
                    const gxFloat = (x / (W - 1)) * (GW - 1);
                    const gx0 = Math.floor(gxFloat);
                    const gx1 = Math.min(GW - 1, gx0 + 1);
                    const fx = gxFloat - gx0;

                    const s00 = gridScores[gy0 * GW + gx0];
                    const s10 = gridScores[gy0 * GW + gx1];
                    const s01 = gridScores[gy1 * GW + gx0];
                    const s11 = gridScores[gy1 * GW + gx1];

                    // If majority of surrounding grid cells are ocean (0), keep coastline crisp
                    const landCount = (s00 > 0 ? 1 : 0) + (s10 > 0 ? 1 : 0) + (s01 > 0 ? 1 : 0) + (s11 > 0 ? 1 : 0);
                    if (landCount < 2) continue;

                    let score = (s00 * (1 - fx) + s10 * fx) * (1 - fy) + (s01 * (1 - fx) + s11 * fx) * fy;
                    const pIdx = (y * W + x) * 4;

                    // Blend live BNPB flood raster ground truth where available on land
                    if (bnpbPixelData.length > 0 && score >= 20) {
                        for (let b = 0; b < bnpbPixelData.length; b++) {
                            const bSrc = bnpbPixelData[b];
                            const r = bSrc[pIdx];
                            const g = bSrc[pIdx + 1];
                            const bl = bSrc[pIdx + 2];
                            const al = bSrc[pIdx + 3];
                            if (al >= 30 && !(r > 240 && g > 240 && bl > 240) && !(r < 10 && g < 10 && bl < 10)) {
                                const maxC = Math.max(r, g, b);
                                const minC = Math.min(r, g, b);
                                if (maxC - minC >= 16) {
                                    const bSc = r >= g
                                        ? Math.min(96, Math.max(48, Math.round(50 + (1 - g / Math.max(1, r)) * 46)))
                                        : Math.min(50, Math.max(24, Math.round(24 + (r / Math.max(1, g)) * 26)));
                                    score = Math.round(score * 0.45 + bSc * 0.55);
                                }
                            }
                        }
                    }

                    if (score >= 20) {
                        const [r, g, b, a] = scoreToRgba(score);
                        outData[pIdx] = r;
                        outData[pIdx + 1] = g;
                        outData[pIdx + 2] = b;
                        outData[pIdx + 3] = a;
                    }
                }
            }

            outCtx.putImageData(outImgData, 0, 0);
            this.overlayGroups.heatmapLayer.clearLayers();
            const dataUrl = outCanvas.toDataURL('image/png');
            L.imageOverlay(dataUrl, overlayBounds, {
                pane: 'heatmapPane',
                opacity: this.heatmapOpacity,
                interactive: false
            }).addTo(this.overlayGroups.heatmapLayer);
        };

        // 2. Render IMMEDIATELY so pan/zoom/switch is 100% interactive with zero delay
        paintHeatmapToMap([]);

        // 3. Asynchronously fetch official BNPB Flood raster tile and blend if available
        const bboxStr = `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(4)},${north.toFixed(4)}`;
        if (!this._inariskImageCache) this._inariskImageCache = new Map();
        const perilToFetch = focusFloodHeatmap ? 'flood' : (activePerils[0] || 'flood');
        const cacheKey = `${perilToFetch}:${bboxStr}:png24`;

        if (this._inariskImageCache.has(cacheKey)) {
            const cachedImg = this._inariskImageCache.get(cacheKey);
            if (cachedImg) {
                const sc = document.createElement('canvas');
                sc.width = W; sc.height = H;
                const sCtx = sc.getContext('2d');
                sCtx.drawImage(cachedImg, 0, 0, W, H);
                paintHeatmapToMap([sCtx.getImageData(0, 0, W, H).data]);
            }
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (this._inariskImageCache.size > 60) {
                const firstKey = this._inariskImageCache.keys().next().value;
                this._inariskImageCache.delete(firstKey);
            }
            this._inariskImageCache.set(cacheKey, img);
            if (currentSeq === this._heatmapRenderSeq && img.width > 0) {
                const sc = document.createElement('canvas');
                sc.width = W; sc.height = H;
                const sCtx = sc.getContext('2d');
                sCtx.drawImage(img, 0, 0, W, H);
                paintHeatmapToMap([sCtx.getImageData(0, 0, W, H).data]);
            }
        };
        img.src = `/api/inarisk-tile?peril=${encodeURIComponent(perilToFetch)}&bbox=${encodeURIComponent(bboxStr)}&size=512,512&format=png24`;
    },

    /**
     * Refresh Map Markers:
     * Revisi: Angka yang terlihat di peta adalah JUMLAH POLIS DI SETIAP WILAYAH (Blue Circular Bubble Markers),
     * bukan skor risiko masing-masing polis. Dinamis menyesuaikan level zoom:
     *   - Zoom <= 6: Jumlah Polis per Kota/Kabupaten atau Provinsi (atau Pie Provinsi jika tombol Toggle Cluster aktif)
     *   - Zoom 7..10: Jumlah Polis per Kota/Kabupaten (City/Regency)
     *   - Zoom 11..13: Jumlah Polis per Kecamatan (District)
     *   - Zoom >= 14: Jumlah Polis per Kelurahan / Titik Lokasi (Village / Spot)
     */
    refreshMapMarkers() {
        if (!this.map) return;
        this.overlayGroups.clusters.clearLayers();
        this.overlayGroups.policies.clearLayers();
        this.overlayGroups.hazardZones.clearLayers();

        if (this.forceClusterMode) {
            this.renderProvincialPieClusters();
        } else {
            this.renderRegionalPolicyCountMarkers();
        }
    },

    /**
     * Render Provincial Pie/Donut Cluster Markers (Mode Alternatif Saat Toggle Cluster Diaktifkan)
     */
    renderProvincialPieClusters() {
        const byProvince = {};
        this.filteredPolicies.forEach(p => {
            const prov = p.province || 'Lainnya';
            if (!byProvince[prov]) byProvince[prov] = [];
            byProvince[prov].push(p);
        });

        Object.entries(byProvince).forEach(([prov, list]) => {
            const avgLat = list.reduce((s, p) => s + p.lat, 0) / list.length;
            const avgLon = list.reduce((s, p) => s + p.lon, 0) / list.length;

            const counts = { VERY_HIGH: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0, NO_DATA: 0 };
            list.forEach(p => {
                const r = this.getPolicyActiveRisk(p);
                counts[r.cls.code] = (counts[r.cls.code] || 0) + 1;
            });

            const total = list.length;
            const colorMap = {
                VERY_HIGH: '#EF4444',
                HIGH: '#F97316',
                MEDIUM: '#F59E0B',
                LOW: '#10B981',
                NONE: '#38BDF8',
                NO_DATA: '#64748B'
            };

            let currentDeg = 0;
            const stops = [];
            Object.entries(counts).forEach(([code, cnt]) => {
                if (cnt > 0) {
                    const deg = (cnt / total) * 360;
                    stops.push(`${colorMap[code]} ${currentDeg}deg ${currentDeg + deg}deg`);
                    currentDeg += deg;
                }
            });
            const gradientStr = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : '#3B82F6';

            const iconHtml = `
                <div class="relative flex items-center justify-center cursor-pointer group" style="width:54px;height:54px;">
                    <div class="w-12 h-12 rounded-full shadow-xl flex items-center justify-center border-2 border-slate-900" style="background: ${gradientStr};">
                        <div class="w-7 h-7 rounded-full bg-slate-950 flex flex-col items-center justify-center text-white leading-none border border-slate-700">
                            <span class="text-[11px] font-black">${total}</span>
                        </div>
                    </div>
                    <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[9px] font-bold text-slate-200 shadow">
                        ${prov}
                    </div>
                </div>
            `;

            const clusterIcon = L.divIcon({
                className: 'aegis-cluster-marker',
                html: iconHtml,
                iconSize: [54, 62],
                iconAnchor: [27, 27]
            });

            const marker = L.marker([avgLat, avgLon], { icon: clusterIcon });
            marker.bindTooltip(`<strong>Provinsi ${prov}</strong>: <strong>${total} Polis</strong><br/>Klik untuk memperbesar ke wilayah ini.`);
            marker.on('click', () => {
                const bm = PROVINCE_BOOKMARKS[prov];
                if (bm) {
                    this.map.flyTo([bm.lat, bm.lon], bm.zoom, { duration: 1.0 });
                } else {
                    this.map.flyTo([avgLat, avgLon], 10, { duration: 1.0 });
                }
                document.getElementById('breadcrumb-region').textContent = `Provinsi ${prov} (${total} Polis)`;
            });
            marker.addTo(this.overlayGroups.clusters);
        });
    },

    /**
     * Render Blue Circular Markers Displaying the NUMBER OF POLICIES PER REGION
     * Matches User Reference Images (Blue bubbles with white border showing policy counts per region across zoom levels)
     */
    renderRegionalPolicyCountMarkers() {
        const zoom = this.map ? this.map.getZoom() : 5;
        const groups = {};

        // Determine administrative grouping level based on current map zoom
        this.filteredPolicies.forEach(p => {
            let groupKey = '';
            let groupLabel = '';
            let subLabel = '';

            if (zoom <= 9) {
                // National & Island View: Group by City / Regency (so Sumatera, Jawa, Kalimantan, Sulawesi, etc. show regional city bubbles like the reference screenshot)
                groupKey = `${p.province}||${p.city}`;
                groupLabel = p.city || p.province;
                subLabel = `Provinsi ${p.province}`;
            } else if (zoom <= 12) {
                // City / Metropolitan View: Group by District / Kecamatan
                groupKey = `${p.province}||${p.city}||${p.district}`;
                groupLabel = `Kec. ${p.district || p.city}`;
                subLabel = `${p.city}, ${p.province}`;
            } else if (zoom <= 14) {
                // Sub-district View: Group by Village / Kelurahan
                groupKey = `${p.province}||${p.city}||${p.district}||${p.village}`;
                groupLabel = `Kel. ${p.village || p.district}`;
                subLabel = `Kec. ${p.district}, ${p.city}`;
            } else {
                // Street View (zoom >= 15): Individual policy or exact building coordinate cluster
                groupKey = `${p.lat.toFixed(4)}||${p.lon.toFixed(4)}||${p.id}`;
                groupLabel = p.insuredName;
                subLabel = `${p.village}, Kec. ${p.district}`;
            }

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    key: groupKey,
                    label: groupLabel,
                    subLabel: subLabel,
                    province: p.province,
                    city: p.city,
                    district: p.district,
                    village: p.village,
                    policies: []
                };
            }
            groups[groupKey].policies.push(p);
        });

        Object.values(groups).forEach((grp) => {
            const count = grp.policies.length;
            const avgLat = grp.policies.reduce((s, p) => s + p.lat, 0) / count;
            const avgLon = grp.policies.reduce((s, p) => s + p.lon, 0) / count;
            const totalTsi = grp.policies.reduce((s, p) => s + (Number(p.tsi) || 0), 0);

            // Compute average Flood Risk & Active Risk for the region
            let avgFlood = 0;
            let avgActive = 0;
            grp.policies.forEach(p => {
                const fl = p.perilScores?.flood?.score ?? 50;
                avgFlood += fl;
                const act = this.getPolicyActiveRisk(p);
                avgActive += (typeof act.score === 'number' ? act.score : fl);
            });
            avgFlood = Math.round(avgFlood / count);
            avgActive = Math.round(avgActive / count);
            const floodCls = AegisApi.classifyScore(avgFlood, 'OK');

            // Size the blue circle proportionally to policy count (matching the reference screenshot bubbles)
            const sizePx = count >= 150 ? 48 : count >= 75 ? 42 : count >= 30 ? 36 : count >= 10 ? 31 : count >= 3 ? 27 : 24;
            const fontPx = count >= 100 ? 12 : count >= 10 ? 11 : 10;

            const bubbleHtml = `
                <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                     style="width:${sizePx}px;height:${sizePx}px;">
                    <div class="w-full h-full rounded-full flex items-center justify-center text-white font-extrabold shadow-xl"
                         style="background: radial-gradient(circle at 32% 30%, #3B82F6, #1D4ED8 70%, #1E3A8A); border: 2px solid rgba(255,255,255,0.92); font-size:${fontPx}px; box-shadow: 0 3px 10px rgba(15,23,42,0.65);">
                        ${count}
                    </div>
                </div>
            `;

            const icon = L.divIcon({
                className: 'aegis-policy-count-bubble',
                html: bubbleHtml,
                iconSize: [sizePx, sizePx],
                iconAnchor: [Math.round(sizePx / 2), Math.round(sizePx / 2)],
                popupAnchor: [0, -Math.round(sizePx / 2)]
            });

            const marker = L.marker([avgLat, avgLon], { icon });

            marker.bindTooltip(
                `<div class="text-xs"><strong>${grp.label}</strong><br/>Jumlah Polis: <strong class="text-sky-300">${count} Polis</strong> • Flood Risk: <strong style="color:${floodCls.color}">${avgFlood}/100 (${floodCls.label})</strong></div>`,
                { direction: 'top', offset: [0, -Math.round(sizePx / 2)] }
            );

            // If this bubble represents a single policy, show the full single-policy card popup
            if (count === 1) {
                const policy = grp.policies[0];
                const riskInfo = this.getPolicyActiveRisk(policy);
                const isNoData = riskInfo.cls.code === 'NO_DATA';
                const singlePopupHtml = `
                    <div class="p-4 text-xs text-slate-100 space-y-3 select-text">
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5 pr-4">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[10px]">1 Polis di Titik Ini</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${isNoData ? 'badge-nodata' : ''}"
                                      style="${isNoData ? '' : `background:${riskInfo.cls.bg};color:${riskInfo.cls.color};border:1px solid ${riskInfo.cls.color}`}">
                                    Flood Risk: ${avgFlood}/100 (${floodCls.label})
                                </span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                            <div>
                                <span class="text-slate-400 block text-[10px]">Policy Number (ACS)</span>
                                <strong class="text-amber-400">${policy.policyNumber}</strong>
                            </div>
                            <div>
                                <span class="text-slate-400 block text-[10px]">Type of Class (TOC)</span>
                                <strong class="text-cyan-400">${policy.toc || policy.lineOfBusiness || 'PAR'}</strong>
                            </div>
                            <div class="col-span-2">
                                <span class="text-slate-400 block text-[10px]">Durasi Pertanggungan</span>
                                <span class="text-white text-xs">${policy.coverageDuration || '5 Tahun (17 Oktober 2026 – 17 Oktober 2031)'}</span>
                            </div>
                            <div class="col-span-2">
                                <span class="text-slate-400 block text-[10px]">Insured Name</span>
                                <strong class="text-white text-xs">${policy.insuredName}</strong>
                            </div>
                            <div class="col-span-2">
                                <span class="text-slate-400 block text-[10px]">Address</span>
                                <span class="text-slate-200">${policy.address}</span>
                            </div>
                            <div>
                                <span class="text-slate-400 block text-[10px]">Coordinate (Lat, Lon)</span>
                                <span class="text-cyan-300 font-mono">${policy.lat}, ${policy.lon}</span>
                            </div>
                            <div>
                                <span class="text-slate-400 block text-[10px]">Total Sum Insured</span>
                                <strong class="text-emerald-400">${this.formatIDR(policy.tsi)}</strong>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                            <button data-action="policy-details" data-id="${policy.id}"
                                class="popup-action-btn py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-[11px] text-center cursor-pointer">
                                Details for this Policy
                            </button>
                            <button data-action="analyze-area" data-id="${policy.id}"
                                class="popup-action-btn py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] text-center cursor-pointer">
                                Analyze Area
                            </button>
                            <button data-action="street-view" data-id="${policy.id}"
                                class="col-span-2 popup-action-btn py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-[11px] text-center cursor-pointer">
                                🏢 Show Street View &amp; Gedung
                            </button>
                        </div>
                    </div>
                `;
                marker.bindPopup(singlePopupHtml, { maxWidth: 360 });
            } else {
                // Multi-policy regional cluster popup showing policy count, TSI, Flood Risk, and top policies in that region
                const topList = grp.policies.slice(0, 6);
                const clusterPopupHtml = `
                    <div class="p-4 text-xs text-slate-100 space-y-3 select-text">
                        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5 pr-4">
                            <div>
                                <div class="text-sm font-extrabold text-white">${grp.label}</div>
                                <div class="text-[10px] text-slate-400">${grp.subLabel}</div>
                            </div>
                            <span class="px-2.5 py-1 rounded-full bg-blue-600 text-white font-black text-xs shadow">
                                ${count} Polis
                            </span>
                        </div>

                        <div class="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                            <div>
                                <span class="text-slate-400 block text-[10px]">Total Sum Insured Wilayah</span>
                                <strong class="text-emerald-400">${this.formatIDR(totalTsi)}</strong>
                            </div>
                            <div>
                                <span class="text-slate-400 block text-[10px]">Rata-rata Risiko Banjir</span>
                                <strong style="color:${floodCls.color}">${avgFlood}/100 (${floodCls.label})</strong>
                            </div>
                        </div>

                        <div>
                            <div class="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Daftar Polis di Wilayah Ini (${ Math.min(6, count) } dari ${count}):</div>
                            <div class="space-y-1 max-h-40 overflow-y-auto pr-1">
                                ${topList.map(p => `
                                    <div class="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-900/70 hover:bg-slate-800 border border-slate-800/80">
                                        <div class="truncate">
                                            <div class="font-bold text-amber-300 text-[10px]">${p.policyNumber}</div>
                                            <div class="text-white truncate text-[11px]">${p.insuredName}</div>
                                            <div class="text-[9px] text-slate-400">${p.village}, Kec. ${p.district}</div>
                                        </div>
                                        <button data-action="analyze-area" data-id="${p.id}"
                                            class="popup-action-btn shrink-0 px-2 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-bold text-[10px] cursor-pointer">
                                            Inspeksi
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                            <button data-action="zoom-region"
                                class="popup-action-btn py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] text-center cursor-pointer">
                                🔍 Perbesar Wilayah (${count} Polis)
                            </button>
                            <button data-action="analyze-area" data-id="${grp.policies[0].id}"
                                class="popup-action-btn py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-[11px] text-center cursor-pointer">
                                📊 Analyze Area Wilayah
                            </button>
                        </div>
                    </div>
                `;
                marker.bindPopup(clusterPopupHtml, { maxWidth: 380 });
            }

            marker.on('popupopen', (e) => {
                const container = e.popup.getElement();
                if (!container) return;
                container.querySelectorAll('.popup-action-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const act = btn.getAttribute('data-action');
                        const pid = btn.getAttribute('data-id');
                        if (act === 'zoom-region') {
                            this.map.closePopup();
                            const targetZoom = Math.min(16, (this.map.getZoom() || 6) + 3);
                            this.map.flyTo([avgLat, avgLon], targetZoom, { duration: 0.9 });
                            const bc = document.getElementById('breadcrumb-region');
                            if (bc) bc.textContent = `${grp.label} (${count} Polis)`;
                            return;
                        }
                        const targetPol = this.policies.find(p => p.id === pid);
                        if (!targetPol) return;
                        if (act === 'policy-details' || act === 'object-details') {
                            this.openPolicyDetailsView(targetPol);
                        } else if (act === 'analyze-area') {
                            this.openAnalyzeAreaDrawer(targetPol);
                        } else if (act === 'street-view') {
                            this.openStreetViewModal(targetPol.lat, targetPol.lon, `${targetPol.insuredName} (${targetPol.objectCode})`, targetPol.address);
                        }
                    });
                });
            });

            marker.addTo(this.overlayGroups.policies);
        });
    },

    // =========================================================================
    // 5. RIGHT FLOATING "RISK SWITCH" (Multi-Peril Stackable + INARISK Heatmap)
    // =========================================================================
    populateRiskSwitchUI() {
        const listEl = document.getElementById('risk-switch-peril-list');
        if (!listEl) return;

        listEl.innerHTML = AEGIS_PERILS.map(p => `
            <div data-peril-row="${p.id}" class="risk-peril-row flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 transition">
                <button data-peril="${p.id}" class="risk-switch-btn flex-1 text-left flex items-center gap-2 cursor-pointer" title="Fokuskan peta ke ${p.name} (${p.nameId})">
                    <span class="text-sm shrink-0">${p.icon}</span>
                    <span class="text-[11px] font-semibold text-slate-100">${p.name} <span class="text-slate-400 font-normal">/ ${p.nameId}</span></span>
                </button>
                <button data-eye-peril="${p.id}" class="peril-eye-btn px-2 py-0.5 rounded text-[11px] border transition cursor-pointer shrink-0" title="Klik ikon mata 👁️ untuk menumpuk (stack) risiko ini">
                    👁️
                </button>
            </div>
        `).join('');

        const updateRiskSwitchVisuals = () => {
            const compBtn = document.getElementById('btn-peril-composite');
            const compPill = document.getElementById('composite-status-pill');
            const reopenBadge = document.getElementById('reopen-risk-badge');

            const isCompositeActive = this.activePerilSwitch === 'composite';

            // Update Multi-Hazard (Composite) button & status badge
            if (compBtn) {
                compBtn.className = isCompositeActive
                    ? 'risk-switch-btn w-full text-left px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-between cursor-pointer transition shadow'
                    : 'risk-switch-btn w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-semibold flex items-center justify-between cursor-pointer transition';
            }
            if (compPill) {
                if (isCompositeActive) {
                    compPill.textContent = '9/9 Aktif';
                    compPill.className = 'text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-bold';
                } else if (this.activePerilSwitch === 'stacked') {
                    compPill.textContent = `${this.activePerilsSet.size} Dipilih`;
                    compPill.className = 'text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40';
                } else {
                    compPill.textContent = 'Non-Aktif';
                    compPill.className = 'text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700';
                }
            }

            // Update 9 individual peril rows and their 👁️ eye buttons
            document.querySelectorAll('#risk-switch-peril-list .risk-peril-row').forEach(row => {
                const pid = row.getAttribute('data-peril-row');
                const eyeBtn = row.querySelector('.peril-eye-btn');
                const isSelected = isCompositeActive ||
                    this.activePerilSwitch === pid ||
                    (this.activePerilSwitch === 'stacked' && this.activePerilsSet.has(pid));

                if (isSelected) {
                    row.className = 'risk-peril-row flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-blue-600/25 border border-blue-500/60 text-white transition shadow-sm';
                    if (eyeBtn) {
                        eyeBtn.className = 'peril-eye-btn px-1.5 py-0.5 rounded text-[11px] bg-blue-600 text-white border border-blue-400 font-bold transition cursor-pointer';
                        eyeBtn.textContent = '👁️';
                    }
                } else {
                    row.className = 'risk-peril-row flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-slate-400 transition';
                    if (eyeBtn) {
                        eyeBtn.className = 'peril-eye-btn px-1.5 py-0.5 rounded text-[11px] bg-slate-900 text-slate-500 border border-slate-700 hover:text-white transition cursor-pointer opacity-60';
                        eyeBtn.textContent = '👁️';
                    }
                }
            });

            // Update Re-open floating badge text
            if (reopenBadge) {
                if (this.activePerilSwitch === 'none' || (this.activePerilSwitch === 'stacked' && this.activePerilsSet.size === 0)) {
                    reopenBadge.textContent = 'Non-Aktif';
                    reopenBadge.className = 'text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300';
                } else if (this.activePerilSwitch === 'composite') {
                    reopenBadge.textContent = 'Composite (9 Risiko)';
                    reopenBadge.className = 'text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white';
                } else if (this.activePerilSwitch === 'stacked') {
                    reopenBadge.textContent = `${this.activePerilsSet.size} Risiko Aktif`;
                    reopenBadge.className = 'text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white';
                } else {
                    const pMeta = AEGIS_PERILS.find(x => x.id === this.activePerilSwitch);
                    reopenBadge.textContent = pMeta ? pMeta.name : 'Aktif';
                    reopenBadge.className = 'text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white';
                }
            }
        };

        // Clicking Multi-Hazard Composite toggles ALL perils ON/OFF
        document.getElementById('btn-peril-composite')?.addEventListener('click', () => {
            if (this.activePerilSwitch === 'composite') {
                this.activePerilSwitch = 'none';
                this.activePerilsSet.clear();
                this.showToast('Semua Layer Bahaya & Heatmap: Non-Aktif');
            } else {
                this.activePerilSwitch = 'composite';
                this.activePerilsSet = new Set(AEGIS_PERILS.map(p => p.id));
                this.showToast('Multi-Hazard (All Combined H×V×C) — 9 Risiko Aktif');
            }
            updateRiskSwitchVisuals();
            this.refreshMapMarkers();
            this.renderMultiPerilHeatmapLayer();
            this.renderLeftPolicyList();
        });

        // Clicking the Peril Name selects that single peril (or toggles it off if already the sole active peril)
        document.querySelectorAll('#risk-switch-peril-list .risk-switch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const perilId = btn.getAttribute('data-peril');
                if (this.activePerilSwitch === perilId || (this.activePerilSwitch === 'stacked' && this.activePerilsSet.size === 1 && this.activePerilsSet.has(perilId))) {
                    this.activePerilSwitch = 'none';
                    this.activePerilsSet.clear();
                    this.showToast('Layer Bahaya: Non-Aktif');
                } else {
                    this.activePerilSwitch = 'stacked';
                    this.activePerilsSet = new Set([perilId]);
                    const pMeta = AEGIS_PERILS.find(x => x.id === perilId);
                    this.showToast(`Fokus Risiko Tunggal: ${pMeta ? `${pMeta.name} (${pMeta.providerBadge})` : perilId}`);
                }
                updateRiskSwitchVisuals();
                this.refreshMapMarkers();
                this.renderMultiPerilHeatmapLayer();
                this.renderLeftPolicyList();
            });
        });

        // Clicking the 👁️ Eye button stacks / unstacks that peril with currently active perils!
        document.querySelectorAll('#risk-switch-peril-list .peril-eye-btn').forEach(eyeBtn => {
            eyeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const perilId = eyeBtn.getAttribute('data-eye-peril');

                if (this.activePerilSwitch === 'composite') {
                    this.activePerilSwitch = 'stacked';
                    this.activePerilsSet = new Set(AEGIS_PERILS.map(p => p.id));
                } else if (this.activePerilSwitch === 'none') {
                    this.activePerilSwitch = 'stacked';
                    this.activePerilsSet = new Set();
                } else if (this.activePerilSwitch !== 'stacked') {
                    this.activePerilsSet = new Set([this.activePerilSwitch]);
                    this.activePerilSwitch = 'stacked';
                }

                if (this.activePerilsSet.has(perilId)) {
                    this.activePerilsSet.delete(perilId);
                } else {
                    this.activePerilsSet.add(perilId);
                }

                if (this.activePerilsSet.size === 0) {
                    this.activePerilSwitch = 'none';
                } else if (this.activePerilsSet.size === AEGIS_PERILS.length) {
                    this.activePerilSwitch = 'composite';
                }

                updateRiskSwitchVisuals();
                this.refreshMapMarkers();
                this.renderMultiPerilHeatmapLayer();
                this.renderLeftPolicyList();

                const activeNames = [...this.activePerilsSet].map(id => AEGIS_PERILS.find(x => x.id === id)?.name).filter(Boolean);
                this.showToast(activeNames.length > 0 ? `Layer Ditumpuk (${activeNames.length}): ${activeNames.join(' + ')}` : 'Semua Layer Risiko Non-Aktif');
            });
        });

        // Quick "Pilih Semua" & "Reset" buttons
        document.getElementById('btn-stack-all-perils')?.addEventListener('click', () => {
            this.activePerilSwitch = 'composite';
            this.activePerilsSet = new Set(AEGIS_PERILS.map(p => p.id));
            updateRiskSwitchVisuals();
            this.refreshMapMarkers();
            this.renderMultiPerilHeatmapLayer();
            this.renderLeftPolicyList();
            this.showToast('Semua 9 Risiko Digabungkan (Multi-Hazard H×V×C Aktif)');
        });

        document.getElementById('btn-clear-all-perils')?.addEventListener('click', () => {
            this.activePerilSwitch = 'none';
            this.activePerilsSet.clear();
            updateRiskSwitchVisuals();
            this.refreshMapMarkers();
            this.renderMultiPerilHeatmapLayer();
            this.renderLeftPolicyList();
            this.showToast('Semua Layer Risiko Dikosongkan (Non-Aktif)');
        });

        // Heatmap Toggle & Opacity Slider
        const hmToggle = document.getElementById('toggle-risk-heatmap');
        const hmSlider = document.getElementById('heatmap-opacity-slider');
        const hmLabel = document.getElementById('heatmap-opacity-label');

        hmToggle?.addEventListener('change', () => {
            this.heatmapEnabled = hmToggle.checked;
            this.renderMultiPerilHeatmapLayer();
            this.showToast(this.heatmapEnabled ? 'INARISK Regional Risk Heatmap: Aktif' : 'INARISK Regional Risk Heatmap: Disembunyikan');
        });

        hmSlider?.addEventListener('input', () => {
            const val = Number(hmSlider.value) || 72;
            this.heatmapOpacity = val / 100;
            if (hmLabel) hmLabel.textContent = `${val}%`;
            this.renderMultiPerilHeatmapLayer();
        });

        updateRiskSwitchVisuals();

        // Minimize Risk Switch Body (_)
        const collapseBtn = document.getElementById('btn-collapse-risk-switch');
        const bodyEl = document.getElementById('risk-switch-body');
        collapseBtn?.addEventListener('click', () => {
            bodyEl?.classList.toggle('hidden');
            collapseBtn.textContent = bodyEl?.classList.contains('hidden') ? '+' : '_';
        });

        // Hide / Show Entire Risk Switch Panel (× <-> Floating Pill Button)
        const panelEl = document.getElementById('floating-risk-switch');
        const hideBtn = document.getElementById('btn-hide-risk-switch');
        const reopenBtn = document.getElementById('btn-reopen-risk-switch');

        hideBtn?.addEventListener('click', () => {
            panelEl?.classList.add('hidden');
            reopenBtn?.classList.remove('hidden');
        });

        reopenBtn?.addEventListener('click', () => {
            reopenBtn?.classList.add('hidden');
            panelEl?.classList.remove('hidden');
            bodyEl?.classList.remove('hidden');
            if (collapseBtn) collapseBtn.textContent = '_';
        });

        // Vector Overlay Checkboxes
        const bindToggle = (id, groupKey) => {
            const el = document.getElementById(id);
            el?.addEventListener('change', () => {
                const grp = this.overlayGroups[groupKey];
                if (!grp) return;
                if (el.checked) this.map.addLayer(grp);
                else this.map.removeLayer(grp);
            });
        };
        bindToggle('toggle-layer-labels', 'placeLabels');
        bindToggle('toggle-layer-rivers', 'rivers');
        bindToggle('toggle-layer-faults', 'faults');
        bindToggle('toggle-layer-volcanoes', 'volcanoes');
        bindToggle('toggle-layer-usgs', 'earthquakes');

        // RainViewer Live Weather Radar Toggle
        const radarCheck = document.getElementById('toggle-layer-radar');
        radarCheck?.addEventListener('change', async () => {
            if (radarCheck.checked) {
                const tileUrl = await AegisApi.fetchRainViewerTileUrl();
                if (tileUrl) {
                    this.overlayGroups.radarLayer = L.tileLayer(tileUrl, { opacity: 0.55, attribution: 'RainViewer Live Radar' }).addTo(this.map);
                    this.showToast('Radar Curah Hujan Live (RainViewer) Diaktifkan');
                } else {
                    radarCheck.checked = false;
                    this.showToast('Radar hujan sedang tidak dapat dijangkau.');
                }
            } else if (this.overlayGroups.radarLayer) {
                this.map.removeLayer(this.overlayGroups.radarLayer);
            }
        });
    },

    // =========================================================================
    // 6. LEFT FILTER DRAWER & POLICY LIST (PDF Hal 2 + Auto-Connect Partial Area)
    // =========================================================================
    populateFilterDropdowns() {
        const provSelect = document.getElementById('filter-province');
        if (!provSelect) return;
        const allProvs = new Set([
            ...this.policies.map(p => p.province),
            'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
            'Banten', 'Bali', 'Sumatera Utara', 'Sumatera Barat', 'Aceh',
            'Kalimantan Timur', 'Sulawesi Selatan'
        ]);
        const provinces = [...allProvs].sort();
        provSelect.innerHTML = `<option value="">Semua Provinsi (${this.policies.length} Polis)</option>` +
            provinces.map(pr => `<option value="${pr}">${pr}</option>`).join('');
    },

    bindFilterEvents() {
        const drawer = document.getElementById('left-filter-drawer');
        document.getElementById('btn-toggle-filter-drawer')?.addEventListener('click', () => {
            drawer?.classList.toggle('hidden');
        });
        document.getElementById('btn-close-filter-drawer')?.addEventListener('click', () => {
            drawer?.classList.add('hidden');
        });

        // Auto-connect to map when Province changes
        document.getElementById('filter-province')?.addEventListener('change', () => {
            this.applyMultiAttributeFilter('auto');
        });

        // Auto-Generate Wilayah Spesifik & Connect Peta saat Titik Koordinat (#filter-coords) diisi
        const filterCoordsInput = document.getElementById('filter-coords');
        const filterCoordsStatus = document.getElementById('filter-coords-status');

        const handleFilterCoordinateAutoGenerate = async () => {
            if (!filterCoordsInput) return;
            const rawVal = filterCoordsInput.value.trim();
            if (!rawVal) {
                if (filterCoordsStatus) {
                    filterCoordsStatus.textContent = 'Auto-Detect Wilayah';
                    filterCoordsStatus.className = 'text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold';
                }
                return;
            }

            const parsed = AegisApi.parseUnifiedCoordinateString(rawVal);
            if (!parsed.valid) {
                if (filterCoordsStatus) {
                    filterCoordsStatus.textContent = 'Format Koordinat Belum Valid';
                    filterCoordsStatus.className = 'text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold';
                }
                return;
            }

            if (filterCoordsStatus) {
                filterCoordsStatus.textContent = '⏳ Mendeteksi Wilayah...';
                filterCoordsStatus.className = 'text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold';
            }

            // Fly map immediately to the coordinate and draw precision highlight
            if (this.map) {
                this.overlayGroups.analysisHighlights.clearLayers();
                this.map.flyTo([parsed.lat, parsed.lon], 15, { duration: 1.0 });
                L.circle([parsed.lat, parsed.lon], {
                    radius: 400,
                    color: '#22D3EE',
                    weight: 2.5,
                    dashArray: '6, 4',
                    fillColor: '#06B6D4',
                    fillOpacity: 0.22
                }).bindTooltip(`📍 Titik Koordinat Filter: ${parsed.lat}, ${parsed.lon}`, { permanent: true, direction: 'top' })
                  .addTo(this.overlayGroups.analysisHighlights);
            }

            // Reverse geocode coordinate to auto-populate Province, City, District, Village & Address
            const geo = await AegisApi.reverseGeocodeNominatim(parsed.lat, parsed.lon);
            const addrObj = geo.address || {};

            let prov = addrObj.state || addrObj.province || addrObj.region || '';
            let city = addrObj.city || addrObj.county || addrObj.regency || addrObj.town || addrObj.municipality || '';
            let dist = addrObj.city_district || addrObj.suburb || addrObj.municipality || '';
            let vill = addrObj.village || addrObj.neighbourhood || addrObj.quarter || addrObj.suburb || '';
            let fullAddr = geo.displayName || '';

            // Normalize DKI Jakarta naming if detected
            if (prov.toLowerCase().includes('jakarta') || city.toLowerCase().includes('jakarta')) {
                prov = 'DKI Jakarta';
            }

            // Enrich from local INDONESIA_AREA_COORDS if Nominatim fields are partial
            if (typeof INDONESIA_AREA_COORDS !== 'undefined' && (!prov || !city || !dist)) {
                let bestArea = null;
                let bestDist = 999999;
                INDONESIA_AREA_COORDS.forEach(item => {
                    const d = Math.hypot(item.lat - parsed.lat, item.lon - parsed.lon);
                    if (d < bestDist) {
                        bestDist = d;
                        bestArea = item;
                    }
                });
                if (bestArea && bestDist < 0.25) {
                    const parts = bestArea.label.split(',').map(s => s.trim());
                    if (!dist && parts[0]) dist = parts[0].replace(/^Kec\.\s*/i, '');
                    if (!city && parts[1]) city = parts[1];
                    if (!prov && parts[2]) prov = parts[2];
                }
            }

            const provSelect = document.getElementById('filter-province');
            const cityEl = document.getElementById('filter-city');
            const distEl = document.getElementById('filter-district');
            const villEl = document.getElementById('filter-village');
            const addrEl = document.getElementById('filter-address');

            if (provSelect && prov) {
                const matchOpt = [...provSelect.options].find(o => o.value && (o.value.toLowerCase() === prov.toLowerCase() || prov.toLowerCase().includes(o.value.toLowerCase())));
                if (matchOpt) provSelect.value = matchOpt.value;
            }
            if (cityEl && city) cityEl.value = city;
            if (distEl && dist) distEl.value = dist;
            if (villEl && vill) villEl.value = vill;
            if (addrEl && fullAddr) addrEl.value = fullAddr;

            if (filterCoordsStatus) {
                filterCoordsStatus.textContent = `✓ ${vill || dist || city || prov || 'Wilayah Terdeteksi'}`;
                filterCoordsStatus.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold';
            }

            this.applyMultiAttributeFilter('coords', parsed);
        };

        filterCoordsInput?.addEventListener('input', () => {
            clearTimeout(this._coordFilterDebounce);
            this._coordFilterDebounce = setTimeout(() => {
                handleFilterCoordinateAutoGenerate();
            }, 420);
        });
        filterCoordsInput?.addEventListener('paste', () => {
            setTimeout(() => {
                const p = AegisApi.parseUnifiedCoordinateString(filterCoordsInput.value);
                if (p.valid) filterCoordsInput.value = p.normalizedText;
                handleFilterCoordinateAutoGenerate();
            }, 40);
        });

        // Filter TOC (Type Of Class) dropdown change listener
        const filterTocSelect = document.getElementById('filter-toc');
        filterTocSelect?.addEventListener('change', () => {
            clearTimeout(this._filterDebounce);
            this.applyMultiAttributeFilter('auto');
        });

        // Auto-connect to map as user types partial City, District, Village, Address, Policy No, or Insured Name
        const textInputs = ['filter-policy-no', 'filter-insured', 'filter-city', 'filter-district', 'filter-village', 'filter-address'];
        textInputs.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', () => {
                clearTimeout(this._filterDebounce);
                this._filterDebounce = setTimeout(() => {
                    this.applyMultiAttributeFilter('auto');
                }, 450);
            });
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(this._filterDebounce);
                    this.applyMultiAttributeFilter('enter');
                }
            });
        });

        document.getElementById('btn-apply-filter')?.addEventListener('click', () => {
            clearTimeout(this._filterDebounce);
            this.applyMultiAttributeFilter('button');
        });

        document.getElementById('btn-clear-filter')?.addEventListener('click', () => {
            ['filter-toc', 'filter-policy-no', 'filter-insured', 'filter-coords', 'filter-province', 'filter-city', 'filter-district', 'filter-village', 'filter-address'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            if (filterCoordsStatus) {
                filterCoordsStatus.textContent = 'Auto-Detect Wilayah';
                filterCoordsStatus.className = 'text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold';
            }
            this.overlayGroups.analysisHighlights.clearLayers();
            this.filteredPolicies = [...this.policies];
            this.renderLeftPolicyList();
            this.refreshMapMarkers();
            this.resetToNationalView();
        });
    },

    async applyMultiAttributeFilter(triggerSource = 'button', parsedCoordOverride = null) {
        const tocVal = (document.getElementById('filter-toc')?.value || '').trim().toUpperCase();
        const provRaw = (document.getElementById('filter-province')?.value || '').trim();
        const prov = provRaw.toLowerCase();
        const city = (document.getElementById('filter-city')?.value || '').trim().toLowerCase();
        const dist = (document.getElementById('filter-district')?.value || '').trim().toLowerCase();
        const vill = (document.getElementById('filter-village')?.value || '').trim().toLowerCase();
        const polNo = (document.getElementById('filter-policy-no')?.value || '').trim().toLowerCase();
        const ins = (document.getElementById('filter-insured')?.value || '').trim().toLowerCase();
        const addr = (document.getElementById('filter-address')?.value || '').trim().toLowerCase();
        const coordsRaw = (document.getElementById('filter-coords')?.value || '').trim();

        const coordParsed = parsedCoordOverride || (coordsRaw ? AegisApi.parseUnifiedCoordinateString(coordsRaw) : { valid: false });
        const hasAnyInput = Boolean((tocVal && tocVal !== 'ALL') || prov || city || dist || vill || polNo || ins || addr || coordParsed.valid);

        this.filteredPolicies = this.policies.filter(p => {
            if (tocVal && tocVal !== 'ALL') {
                const pToc = (p.toc || p.lineOfBusiness || '').toUpperCase();
                const matches = pToc === tocVal || pToc.includes(tocVal) || tocVal.includes(pToc);
                if (!matches) return false;
            }
            if (polNo && !(p.policyNumber || '').toLowerCase().includes(polNo) && !(p.objectCode || '').toLowerCase().includes(polNo) && !(p.riskBlockCode || '').toLowerCase().includes(polNo)) return false;
            if (ins && !(p.insuredName || '').toLowerCase().includes(ins)) return false;

            // If user entered a specific coordinate in #filter-coords, match policies within ~6km radius OR matching the auto-detected city/district
            if (coordParsed.valid && !polNo && !ins) {
                const distDeg = Math.hypot(p.lat - coordParsed.lat, p.lon - coordParsed.lon);
                if (distDeg <= 0.06) return true;
            }

            if (prov && !(p.province || '').toLowerCase().includes(prov)) return false;
            if (city && !(p.city || '').toLowerCase().includes(city) && !(p.address || '').toLowerCase().includes(city)) return false;
            if (dist && !(p.district || '').toLowerCase().includes(dist) && !(p.address || '').toLowerCase().includes(dist)) return false;
            if (vill && !(p.village || '').toLowerCase().includes(vill) && !(p.address || '').toLowerCase().includes(vill)) return false;
            if (addr && !(p.address || '').toLowerCase().includes(addr) && !(p.village || '').toLowerCase().includes(addr) && !(p.district || '').toLowerCase().includes(addr)) return false;
            return true;
        });

        this.renderLeftPolicyList();
        this.forceClusterMode = false;
        this.refreshMapMarkers();

        if (!this.map || !hasAnyInput) return;

        // If triggered by coordinate input, keep focus on the exact coordinate point
        if (coordParsed.valid && triggerSource === 'coords') {
            this.overlayGroups.analysisHighlights.clearLayers();
            this.map.flyTo([coordParsed.lat, coordParsed.lon], 14, { duration: 1.0 });
            const cCircle = L.circle([coordParsed.lat, coordParsed.lon], {
                radius: 500,
                color: '#22D3EE',
                weight: 2.5,
                dashArray: '6, 4',
                fillColor: '#06B6D4',
                fillOpacity: 0.22
            }).bindTooltip(`📍 Titik Koordinat: ${coordParsed.lat.toFixed(6)}, ${coordParsed.lon.toFixed(6)} (${this.filteredPolicies.length} Polis Wilayah)`, { permanent: true, direction: 'top' })
              .addTo(this.overlayGroups.analysisHighlights);
            cCircle.on('click', () => {
                this.inspectCoordinateArea(coordParsed.lat, coordParsed.lon, addr || `${vill}, ${dist}, ${city}`);
            });
            return;
        }

        // 1. Check if user typed a specific sub-area (Village / District / City / Address) in INDONESIA_AREA_COORDS
        const searchTerms = [vill, dist, addr, city].filter(Boolean);
        let matchedArea = null;
        if (typeof INDONESIA_AREA_COORDS !== 'undefined' && searchTerms.length > 0) {
            for (const term of searchTerms) {
                if (term.length < 3) continue;
                matchedArea = INDONESIA_AREA_COORDS.find(item =>
                    item.keywords.some(k => k.includes(term) || term.includes(k))
                );
                if (matchedArea) break;
            }
        }

        this.overlayGroups.analysisHighlights.clearLayers();

        // Case A: Policies matched the partial filter -> Fly to their position / bounds & show area highlight
        if (this.filteredPolicies.length > 0) {
            if (this.filteredPolicies.length === 1) {
                const target = this.filteredPolicies[0];
                this.map.flyTo([target.lat, target.lon], 15, { duration: 1.0 });
                L.circle([target.lat, target.lon], {
                    radius: 350,
                    color: '#38BDF8',
                    weight: 2.5,
                    dashArray: '6, 4',
                    fillColor: '#0284C7',
                    fillOpacity: 0.20
                }).bindTooltip(`📍 Fokus Objek: ${target.insuredName} (${target.policyNumber})`, { permanent: true, direction: 'top' })
                  .addTo(this.overlayGroups.analysisHighlights);
            } else {
                const latLngs = this.filteredPolicies.map(p => [p.lat, p.lon]);
                const bounds = L.latLngBounds(latLngs);
                this.map.flyToBounds(bounds.pad(0.35), { maxZoom: matchedArea ? matchedArea.zoom : 13, duration: 1.0 });

                if (matchedArea) {
                    L.circle([matchedArea.lat, matchedArea.lon], {
                        radius: 1800,
                        color: '#06B6D4',
                        weight: 2,
                        dashArray: '6, 4',
                        fillColor: '#06B6D4',
                        fillOpacity: 0.12
                    }).bindTooltip(`📍 Area Filter: ${matchedArea.label} (${this.filteredPolicies.length} Polis)`, { permanent: true, direction: 'top' })
                      .addTo(this.overlayGroups.analysisHighlights);
                }
            }
            const bcRegion = document.getElementById('breadcrumb-region');
            if (bcRegion) {
                bcRegion.textContent = matchedArea ? matchedArea.label : (provRaw ? `Provinsi ${provRaw} (${this.filteredPolicies.length} Polis)` : `Hasil Filter (${this.filteredPolicies.length} Polis)`);
            }
            return;
        }

        // Case B: 0 policies matched in dummy portfolio, OR user filled partial area not having a policy yet -> STILL connect & fly map to that area!
        if (matchedArea) {
            this.map.flyTo([matchedArea.lat, matchedArea.lon], matchedArea.zoom, { duration: 1.0 });
            const areaCircle = L.circle([matchedArea.lat, matchedArea.lon], {
                radius: 1500,
                color: '#F59E0B',
                weight: 2.5,
                dashArray: '6, 4',
                fillColor: '#F59E0B',
                fillOpacity: 0.16
            }).bindTooltip(`📍 Posisi Wilayah: ${matchedArea.label}<br/><span style="font-size:10px">Klik area untuk inspeksi risiko lokasi ini</span>`, { permanent: true, direction: 'top' })
              .addTo(this.overlayGroups.analysisHighlights);

            areaCircle.on('click', () => {
                this.inspectCoordinateArea(matchedArea.lat, matchedArea.lon, matchedArea.label);
            });
            document.getElementById('breadcrumb-region').textContent = `Wilayah: ${matchedArea.label}`;
            return;
        }

        // Check Province Bookmark if only Province was selected
        if (provRaw && PROVINCE_BOOKMARKS[provRaw]) {
            const bm = PROVINCE_BOOKMARKS[provRaw];
            this.map.flyTo([bm.lat, bm.lon], bm.zoom, { duration: 1.0 });
            L.circle([bm.lat, bm.lon], {
                radius: 15000,
                color: '#38BDF8',
                weight: 2,
                dashArray: '6, 4',
                fillColor: '#0284C7',
                fillOpacity: 0.12
            }).bindTooltip(`📍 Provinsi ${provRaw}`, { permanent: true, direction: 'top' })
              .addTo(this.overlayGroups.analysisHighlights);
            document.getElementById('breadcrumb-region').textContent = `Provinsi ${provRaw}`;
            return;
        }

        // Fallback: Live Nominatim Geocoding for any partial Village / District / City / Address in Indonesia
        const queryParts = [vill, dist, city, provRaw, addr].filter(Boolean);
        if (queryParts.length > 0 && queryParts.join('').length >= 3) {
            const geoQuery = queryParts.join(', ');
            const results = await AegisApi.searchLocationNominatim(geoQuery);
            if (results && results.length > 0) {
                const top = results[0];
                const lat = parseFloat(top.lat);
                const lon = parseFloat(top.lon);
                this.map.flyTo([lat, lon], 14, { duration: 1.1 });
                const locCircle = L.circle([lat, lon], {
                    radius: 1000,
                    color: '#38BDF8',
                    weight: 2.5,
                    dashArray: '6, 4',
                    fillColor: '#0284C7',
                    fillOpacity: 0.18
                }).bindTooltip(`📍 Posisi Area: ${top.display_name.split(',').slice(0, 3).join(', ')}`, { permanent: true, direction: 'top' })
                  .addTo(this.overlayGroups.analysisHighlights);

                locCircle.on('click', () => {
                    this.inspectCoordinateArea(lat, lon, top.display_name);
                });
                document.getElementById('breadcrumb-region').textContent = top.display_name.split(',').slice(0, 2).join(', ');
            }
        }
    },

    renderLeftPolicyList() {
        const listEl = document.getElementById('left-policy-list');
        const countEl = document.getElementById('filtered-count-label');
        if (countEl) countEl.textContent = `${this.filteredPolicies.length} objek`;
        if (!listEl) return;

        // Render up to 100 items in the sidebar list for snappy DOM performance with 1,000 policies
        const displaySlice = this.filteredPolicies.slice(0, 100);
        listEl.innerHTML = displaySlice.map(p => {
            const r = this.getPolicyActiveRisk(p);
            return `
                <div data-id="${p.id}" class="left-policy-item p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 cursor-pointer transition">
                    <div class="flex items-center justify-between text-[10px]">
                        <span class="font-bold text-amber-400">${p.policyNumber || p.objectCode}</span>
                        <span class="px-1.5 py-0.5 rounded font-bold" style="background:${r.cls.bg};color:${r.cls.color}">${r.cls.label}</span>
                    </div>
                    <div class="text-xs font-bold text-white truncate mt-0.5">${p.insuredName}</div>
                    <div class="text-[10px] text-slate-400 truncate">${p.village}, ${p.city} • ${this.formatIDR(p.tsi)}</div>
                </div>
            `;
        }).join('') + (this.filteredPolicies.length > 100
            ? `<div class="p-2 text-center text-[10px] text-slate-400 bg-slate-900/50 rounded-lg border border-slate-800">Menampilkan 100 dari ${this.filteredPolicies.length} polis. Gunakan filter di atas untuk menyaring lebih spesifik.</div>`
            : '');

        listEl.querySelectorAll('.left-policy-item').forEach(el => {
            el.addEventListener('click', () => {
                const pid = el.getAttribute('data-id');
                const pol = this.policies.find(x => x.id === pid);
                if (pol) this.focusOnPolicy(pol, true);
            });
        });
    },

    focusOnPolicy(policy, openDrawer = false) {
        if (!this.map || !policy) return;
        this.forceClusterMode = false;
        this.map.flyTo([policy.lat, policy.lon], 15, { duration: 1.0 });
        if (openDrawer) {
            this.openAnalyzeAreaDrawer(policy);
        }
    },

    // =========================================================================
    // 7. RIGHT DRAWER: "ANALYZE AREA" MULTI-TAB (PDF Hal 7, 8, 9)
    // =========================================================================
    bindAnalyzeDrawerEvents() {
        const drawer = document.getElementById('analyze-area-drawer');
        document.getElementById('btn-close-analyze-drawer')?.addEventListener('click', () => {
            drawer?.classList.add('hidden');
            this.overlayGroups.analysisHighlights.clearLayers();
            setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 150);
        });

        // Right vertical tab buttons
        const tabTitles = {
            summary: 'Hazard Summary',
            fire: 'Fire Risk Assessment',
            earthquake: 'Earthquake Risk Assessment',
            landslide: 'Landslide Risk Assessment',
            flood: 'Flood Risk Assessment'
        };

        document.querySelectorAll('.drawer-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-drawer-tab');
                document.querySelectorAll('.drawer-tab-btn').forEach(b => {
                    b.className = 'drawer-tab-btn w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center text-base cursor-pointer';
                });
                btn.className = 'drawer-tab-btn w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center text-base cursor-pointer';

                document.querySelectorAll('.drawer-tab-pane').forEach(pane => pane.classList.add('hidden'));
                document.getElementById(`drawer-tab-${tab}`)?.classList.remove('hidden');
                const titleEl = document.getElementById('drawer-panel-title');
                if (titleEl) titleEl.textContent = tabTitles[tab] || 'Hazard Analysis';

                if (tab === 'flood' && this.selectedRiskEval) {
                    this.renderFloodDrawerCharts(this.selectedRiskEval);
                }
            });
        });

        // Open Full Details from Drawer
        document.getElementById('btn-drawer-open-details')?.addEventListener('click', () => {
            if (this.selectedPolicy) {
                this.openPolicyDetailsView(this.selectedPolicy);
            }
        });

        // Open Building & Street View Modal from Drawer Header
        document.getElementById('btn-drawer-street-view')?.addEventListener('click', () => {
            if (this.selectedPolicy) {
                this.openStreetViewModal(
                    this.selectedPolicy.lat,
                    this.selectedPolicy.lon,
                    `${this.selectedPolicy.insuredName} (${this.selectedPolicy.objectCode})`,
                    this.selectedPolicy.address
                );
            }
        });

        // Emergency Fire Route on Map (PDF Hal 7)
        document.getElementById('btn-show-fire-route')?.addEventListener('click', () => {
            if (!this.selectedPolicy || !this.selectedPolicy.nearestFireStation) return;
            const fs = this.selectedPolicy.nearestFireStation;
            this.overlayGroups.analysisHighlights.clearLayers();

            const routeLine = L.polyline([
                [fs.lat, fs.lon],
                [this.selectedPolicy.lat, this.selectedPolicy.lon]
            ], { color: '#06B6D4', weight: 4, dashArray: '8, 6' }).addTo(this.overlayGroups.analysisHighlights);

            L.marker([fs.lat, fs.lon]).bindTooltip(`🚒 ${fs.name} (${fs.distanceKm} km / ~${fs.durationMins} menit)`, { permanent: true }).addTo(this.overlayGroups.analysisHighlights);

            this.map.fitBounds(routeLine.getBounds().pad(0.35));
            this.showToast(`Menampilkan rute tanggap darurat dari ${fs.name}`);
        });

        // Fire Risk Radius Apply Button (PDF Hal 7: Radius (meters) + Apply)
        document.getElementById('btn-apply-fire-radius')?.addEventListener('click', () => {
            if (!this.selectedPolicy) return;
            const radiusM = Math.max(10, Math.min(1000, Number(document.getElementById('fire-radius-input')?.value) || 20));
            this.overlayGroups.analysisHighlights.clearLayers();

            const circle = L.circle([this.selectedPolicy.lat, this.selectedPolicy.lon], {
                radius: radiusM,
                color: '#F97316',
                weight: 2,
                fillColor: '#EA580C',
                fillOpacity: 0.28
            }).bindTooltip(`🔥 Radius Eksposur Kebakaran: ${radiusM} meter`).addTo(this.overlayGroups.analysisHighlights);

            const baseBld = this.selectedPolicy.nearbyBuildings20m || 14;
            const scaledBld = Math.round(baseBld * Math.pow(radiusM / 20, 1.35));
            const bldEl = document.getElementById('fire-total-buildings');
            if (bldEl) bldEl.textContent = `${scaledBld} Unit`;

            this.map.fitBounds(circle.getBounds().pad(0.5));
            this.showToast(`Radius analisis kebakaran ${radiusM}m diterapkan (${scaledBld} bangunan terdeteksi).`);
        });
    },

    async openAnalyzeAreaDrawer(policy, keepHighlights = false) {
        this.selectedPolicy = policy;
        const drawer = document.getElementById('analyze-area-drawer');
        drawer?.classList.remove('hidden');
        setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 150);

        // Highlight object on map (keep existing drawn rectangle if triggered from Map Click / Draw Area)
        if (!keepHighlights) {
            this.overlayGroups.analysisHighlights.clearLayers();
            L.circle([policy.lat, policy.lon], {
                radius: 150,
                color: '#38BDF8',
                weight: 2,
                fillColor: '#0284C7',
                fillOpacity: 0.18
            }).addTo(this.overlayGroups.analysisHighlights);
        }

        const riskEval = await AegisApi.evaluateLocationRisk(policy.lat, policy.lon, policy);
        this.selectedRiskEval = riskEval;
        this.populateAnalyzeDrawerUI(policy, riskEval);
    },

    async inspectCoordinateArea(lat, lon, addressLabel, areaMeta = null) {
        // If there is exactly 1 portfolio policy inside the drawn/clicked box, use its real TSI/details or enrich the inspection
        const matchedPolicies = areaMeta?.policiesInBox || [];
        const totalBoxTsi = matchedPolicies.reduce((sum, p) => sum + (Number(p.tsi) || 0), 0);
        const scatterCount = areaMeta?.scatterPointsCount || 14;
        const areaKm2Label = areaMeta?.areaKm2 ? ` (${areaMeta.areaKm2 < 0.01 ? areaMeta.areaKm2.toFixed(4) : areaMeta.areaKm2.toFixed(2)} km²)` : '';

        const pseudoPolicy = {
            id: 'ADHOC-COORD',
            policyNumber: matchedPolicies.length > 0
                ? `${matchedPolicies.length} POLIS PORTOFOLIO DI AREA INI`
                : (areaMeta?.isCustomDrawn ? 'ANALISIS-AREA-RECTANGLE' : 'INSPEKSI-TITIK-KLIK'),
            objectCode: areaMeta?.isCustomDrawn ? `BBOX${areaKm2Label}` : 'COORD-CLICK',
            riskBlockCode: matchedPolicies[0]?.riskBlockCode || 'RBC-ADHOC',
            toc: matchedPolicies[0]?.toc || '0103 PAR',
            typeOfClass: matchedPolicies[0]?.typeOfClass || '0103 PAR — Properti All Risk',
            coverageDuration: matchedPolicies[0]?.coverageDuration || '5 Tahun (17 Oktober 2026 – 17 Oktober 2031)',
            insuredName: matchedPolicies.length === 1
                ? `${matchedPolicies[0].insuredName}`
                : (matchedPolicies.length > 1
                    ? `Akumulasi ${matchedPolicies.length} Objek Polis Askrindo`
                    : `Area Inspeksi Geospasial${areaKm2Label}`),
            productType: matchedPolicies[0]?.productType || 'Calon Objek / Akumulasi Area',
            underwriteYear: 2026,
            insuredType: matchedPolicies.length > 0 ? 'Akumulasi Portofolio & Area' : 'Simulasi Lokasi Baru',
            occupationCode: matchedPolicies[0]?.occupationCode || '2971',
            occupationName: matchedPolicies[0]?.occupationName || 'Apartemen / Gedung Perkantoran (<= 6 lantai)',
            constructionClass: matchedPolicies[0]?.constructionClass || 'Kelas 1 (Asumsi Standar)',
            currency: 'IDR',
            tsi: totalBoxTsi,
            siBreakdown: matchedPolicies.length === 1 ? matchedPolicies[0].siBreakdown : {
                building: Math.round(totalBoxTsi * 0.6),
                machinery: Math.round(totalBoxTsi * 0.2),
                stock: Math.round(totalBoxTsi * 0.15),
                others: Math.round(totalBoxTsi * 0.05),
                bi: 0
            },
            lat: Number(lat.toFixed(6)),
            lon: Number(lon.toFixed(6)),
            province: matchedPolicies[0]?.province || 'Indonesia',
            city: matchedPolicies[0]?.city || '-',
            district: matchedPolicies[0]?.district || '-',
            village: matchedPolicies[0]?.village || '-',
            address: addressLabel,
            slopeDeg: matchedPolicies[0]?.slopeDeg || 3.5,
            landCoverType: matchedPolicies[0]?.landCoverType || 'Area Terbangun / Campuran',
            soilType: matchedPolicies[0]?.soilType || 'Aluvial / Sedimen Lokal',
            nearestFireStation: matchedPolicies[0]?.nearestFireStation || {
                name: 'Pos Damkar Terdekat (Estimasi Radius)',
                distanceKm: 2.8,
                durationMins: 8,
                lat: lat + 0.011,
                lon: lon + 0.011
            },
            nearbyBuildings20m: matchedPolicies.length,
            nearbyGasStations: matchedPolicies[0]?.nearbyGasStations || [
                { name: 'SPBU / Tangki BBM Terdekat (Deteksi Area)', distanceMeters: 620 }
            ],
            claimHistory: matchedPolicies.flatMap(p => p.claimHistory || []),
            assessmentHistory: matchedPolicies.flatMap(p => p.assessmentHistory || [])
        };
        await this.openAnalyzeAreaDrawer(pseudoPolicy, true);
    },

    populateAnalyzeDrawerUI(policy, riskEval) {
        // Shared Identity Card
        document.getElementById('drawer-coords').textContent = `Lon: ${policy.lon}, Lat: ${policy.lat}`;
        const tocLabel = policy.toc || policy.lineOfBusiness || 'PAR';
        const durLabel = policy.coverageDuration ? ` • ${policy.coverageDuration}` : '';
        document.getElementById('drawer-policy-no').textContent = `${policy.policyNumber} [${tocLabel}]${durLabel}`;
        document.getElementById('drawer-insured-name').textContent = policy.insuredName;
        document.getElementById('drawer-address').textContent = policy.address;

        // Composite Natural Hazard Score
        const compCls = riskEval.compositeClass;
        const compScoreEl = document.getElementById('summary-composite-score');
        const compBadgeEl = document.getElementById('summary-composite-badge');
        const compBarEl = document.getElementById('summary-composite-bar');
        const noDataWarnEl = document.getElementById('summary-nodata-warning');

        if (compScoreEl) compScoreEl.textContent = riskEval.compositeScore !== null ? String(riskEval.compositeScore) : 'N/A';
        if (compBadgeEl) {
            compBadgeEl.textContent = compCls.label.toUpperCase();
            compBadgeEl.style.backgroundColor = compCls.bg;
            compBadgeEl.style.color = compCls.color;
            compBadgeEl.style.border = `1px solid ${compCls.color}`;
        }
        if (compBarEl) {
            compBarEl.style.width = `${riskEval.compositeScore || 0}%`;
            compBarEl.style.backgroundColor = compCls.color;
        }
        if (noDataWarnEl) {
            if (riskEval.noDataCount > 0) {
                noDataWarnEl.classList.remove('hidden');
                noDataWarnEl.textContent = `${riskEval.noDataCount} Peril NO DATA (≠ Aman)`;
            } else {
                noDataWarnEl.classList.add('hidden');
            }
        }

        // 9 Individual Peril Progress Bars (Formula risiko disembunyikan sesuai arahan Underwriting)
        const barsContainer = document.getElementById('summary-peril-bars');
        if (barsContainer) {
            barsContainer.innerHTML = AEGIS_PERILS.map(p => {
                const pObj = (riskEval.perilScores && riskEval.perilScores[p.id]) || { score: null, status: 'NO_DATA' };
                const cls = AegisApi.classifyScore(pObj.score, pObj.status);
                const isNoData = cls.code === 'NO_DATA';

                return `
                    <div class="space-y-1 pt-1.5 pb-0.5 border-b border-slate-900/60">
                        <div class="flex items-center justify-between text-[11px]">
                            <span class="font-semibold text-slate-200 flex items-center gap-1.5">
                                <span>${p.icon}</span>
                                <span>${p.name} <span class="text-slate-400 font-normal">(${p.nameId})</span></span>
                            </span>
                            ${isNoData
                                ? `<span class="px-2 py-0.2 rounded text-[10px] font-bold badge-nodata" title="Data belum tersedia, bukan berarti aman">NO DATA</span>`
                                : `<span class="font-bold text-xs" style="color:${cls.color}">${cls.label} (${pObj.score})</span>`
                            }
                        </div>
                        <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                            ${isNoData
                                ? `<div class="h-full w-full badge-nodata"></div>`
                                : `<div class="h-full rounded-full" style="width:${pObj.score}%;background-color:${cls.color}"></div>`
                            }
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Emergency Responses (Nearest Fire Station)
        const fs = policy.nearestFireStation || { name: 'Pos Damkar Lokal', distanceKm: 3.2, durationMins: 9 };
        document.getElementById('summary-fire-station').textContent = fs.name;
        document.getElementById('summary-fire-dist').textContent = `${fs.distanceKm} km (~${fs.durationMins} mins)`;

        // Historical Disasters
        const histContainer = document.getElementById('summary-historical-list');
        if (histContainer) {
            const localHist = HISTORICAL_DISASTERS_SAMPLE.filter(h =>
                policy.province.toLowerCase().includes(h.province.toLowerCase()) || h.province === 'DKI Jakarta'
            ).slice(0, 3);
            histContainer.innerHTML = localHist.map(h => `
                <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <div class="flex items-center justify-between text-[10px] text-amber-400 font-bold">
                        <span>${h.peril}</span>
                        <span>${h.date}</span>
                    </div>
                    <div class="text-xs font-bold text-white mt-0.5">${h.title}</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">${h.impactNote}</div>
                </div>
            `).join('');
        }

        // TAB 2: Fire Risk Assessment
        const fireObj = (riskEval.perilScores && riskEval.perilScores.fire) || { score: 50, status: 'OK' };
        const fireCls = AegisApi.classifyScore(fireObj.score, fireObj.status);
        const fireBadge = document.getElementById('fire-tab-badge');
        if (fireBadge) {
            fireBadge.textContent = `${fireCls.label} (${fireObj.score ?? 'N/A'})`;
            fireBadge.style.color = fireCls.color;
        }
        document.getElementById('fire-radius-input').value = 20;
        document.getElementById('fire-total-buildings').textContent = `${policy.nearbyBuildings20m || 15} Unit`;
        document.getElementById('fire-construction-class').textContent = policy.constructionClass || 'Kelas 1';

        const gasList = document.getElementById('fire-gas-stations-list');
        if (gasList) {
            const stations = policy.nearbyGasStations || [{ name: 'SPBU Pertamina Terdekat', distanceMeters: 650 }];
            gasList.innerHTML = stations.map(g => `
                <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span class="font-semibold text-slate-200">⛽ ${g.name}</span>
                    <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px]">${g.distanceMeters} m</span>
                </div>
            `).join('');
        }

        // TAB 3: Earthquake Risk Assessment
        const eqObj = (riskEval.perilScores && riskEval.perilScores.earthquake) || { score: 45, status: 'OK' };
        const eqCls = AegisApi.classifyScore(eqObj.score, eqObj.status);
        const liqObj = (riskEval.perilScores && riskEval.perilScores.liquefaction) || { score: null, status: 'NO_DATA' };
        const liqCls = AegisApi.classifyScore(liqObj.score, liqObj.status);

        document.getElementById('eq-tab-badge').textContent = `${eqCls.label} (${eqObj.score ?? 'N/A'})`;
        document.getElementById('eq-events-count').textContent = `${riskEval.earthquake.countWithin10km} (10km) / ${riskEval.earthquake.countWithin100km} (100km)`;
        document.getElementById('eq-elevation-val').textContent = riskEval.elevationMdpl !== null ? `${riskEval.elevationMdpl} mdpl` : 'NO DATA';
        document.getElementById('eq-liquefaction-val').textContent = liqCls.code === 'NO_DATA' ? 'NO DATA (Belum Tersedia)' : `${liqCls.label} (${liqObj.score}/100)`;
        document.getElementById('eq-soil-type').textContent = policy.soilType || 'SD - Tanah Sedang';
        document.getElementById('eq-fault-info').textContent = `${riskEval.earthquake.faultDistKm} km dari ${riskEval.earthquake.faultName}`;

        // TAB 4: Landslide Risk Assessment
        const lsObj = (riskEval.perilScores && riskEval.perilScores.landslide) || { score: null, status: 'NO_DATA' };
        const lsCls = AegisApi.classifyScore(lsObj.score, lsObj.status);
        document.getElementById('ls-tab-badge').textContent = lsCls.code === 'NO_DATA' ? 'NO DATA' : `${lsCls.label} (${lsObj.score})`;
        document.getElementById('ls-score-val').textContent = lsCls.code === 'NO_DATA' ? 'NO DATA' : `${lsObj.score} / 100`;
        document.getElementById('ls-slope-val').textContent = `${policy.slopeDeg ?? 2.0}°`;
        document.getElementById('ls-landcover-val').textContent = policy.landCoverType || 'Kawasan Terbangun';
        document.getElementById('ls-soil-val').textContent = policy.soilType || 'Aluvial';

        // TAB 5: Flood Risk Assessment
        const flObj = (riskEval.perilScores && riskEval.perilScores.flood) || { score: 50, status: 'OK' };
        const flCls = AegisApi.classifyScore(flObj.score, flObj.status);
        document.getElementById('fl-tab-badge').textContent = flCls.code === 'NO_DATA' ? 'NO DATA' : `${flCls.label} (${flObj.score})`;
        document.getElementById('fl-river-dist').textContent = `${riskEval.river.distanceMeters} m (${riskEval.river.riverName})`;
        document.getElementById('fl-elev-river').textContent = `+${riskEval.river.elevFromRiver} m`;
        document.getElementById('fl-basin-area').textContent = `${riskEval.river.basinAreaKm2} km²`;
        document.getElementById('fl-basin-name').textContent = riskEval.river.basinName;

        this.renderFloodDrawerCharts(riskEval);
    },

    renderFloodDrawerCharts(riskEval) {
        if (typeof Chart === 'undefined') return;

        // 1. Historical Flood Events in Basin (Bar Chart 2017-2026 - PDF Hal 8 & 9)
        const ctxHist = document.getElementById('chart-flood-history')?.getContext('2d');
        if (ctxHist) {
            if (this.charts.floodHistory) this.charts.floodHistory.destroy();
            const isHighFlood = (riskEval.perilScores?.flood?.score || 50) >= 70;
            const counts = BASIN_FLOOD_FREQUENCY_BY_YEAR.counts.map(c => isHighFlood ? c : Math.max(0, Math.round(c * 0.45)));

            this.charts.floodHistory = new Chart(ctxHist, {
                type: 'bar',
                data: {
                    labels: BASIN_FLOOD_FREQUENCY_BY_YEAR.years,
                    datasets: [{
                        label: 'Kejadian Banjir DAS',
                        data: counts,
                        backgroundColor: '#3B82F6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94A3B8', font: { size: 9 } }, grid: { display: false } },
                        y: { ticks: { color: '#94A3B8', font: { size: 9 }, stepSize: 2 }, grid: { color: 'rgba(51,65,85,0.4)' } }
                    }
                }
            });
        }

        // 2. Elevation Profile (River to Site Profile Line Chart - PDF Hal 9)
        const ctxElev = document.getElementById('chart-elevation-profile')?.getContext('2d');
        if (ctxElev) {
            if (this.charts.elevationProfile) this.charts.elevationProfile.destroy();
            this.charts.elevationProfile = new Chart(ctxElev, {
                type: 'line',
                data: {
                    labels: riskEval.river.profileLabels,
                    datasets: [{
                        label: 'Elevasi (mdpl)',
                        data: riskEval.river.profileValues,
                        borderColor: '#06B6D4',
                        backgroundColor: 'rgba(6, 182, 212, 0.2)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                        pointBackgroundColor: '#38BDF8'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94A3B8', font: { size: 9 } }, grid: { display: false } },
                        y: { ticks: { color: '#94A3B8', font: { size: 9 } }, grid: { color: 'rgba(51,65,85,0.4)' } }
                    }
                }
            });
        }
    },

    // =========================================================================
    // 8. POLICY & OBJECT DETAILS FULL VIEW & PDF EXPORT (PDF Hal 4 & 5)
    // =========================================================================
    bindDetailsViewEvents() {
        document.getElementById('btn-details-back-map')?.addEventListener('click', () => {
            this.switchWorkspaceView('analysis');
        });

        document.getElementById('btn-details-analyze-area')?.addEventListener('click', () => {
            this.switchWorkspaceView('analysis');
            if (this.selectedPolicy) {
                this.focusOnPolicy(this.selectedPolicy, true);
            }
        });

        document.getElementById('btn-details-export-pdf')?.addEventListener('click', async () => {
            if (!this.selectedPolicy) return;
            const riskEval = this.selectedRiskEval || await AegisApi.evaluateLocationRisk(this.selectedPolicy.lat, this.selectedPolicy.lon, this.selectedPolicy);
            AegisApi.exportObjectInformationPDF(this.selectedPolicy, riskEval);
            this.showToast(`PDF "Object Information" (${this.selectedPolicy.policyNumber || this.selectedPolicy.toc || 'Polis'}) berhasil diunduh.`);
        });

        // + Add a New Risk Assessment Form (PDF Hal 4)
        const formAss = document.getElementById('form-add-assessment');
        document.getElementById('btn-add-assessment')?.addEventListener('click', () => {
            formAss?.classList.toggle('hidden');
        });
        document.getElementById('btn-cancel-assessment')?.addEventListener('click', () => {
            formAss?.classList.add('hidden');
        });
        formAss?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!this.selectedPolicy) return;
            const assessor = document.getElementById('ass-assessor').value.trim();
            const grade = document.getElementById('ass-grade').value;
            const notes = document.getElementById('ass-notes').value.trim();

            if (!this.selectedPolicy.assessmentHistory) this.selectedPolicy.assessmentHistory = [];
            this.selectedPolicy.assessmentHistory.unshift({
                date: new Date().toISOString().slice(0, 10),
                assessor,
                grade,
                completionPct: 100,
                notes
            });

            this.savePoliciesToStorage();
            formAss.classList.add('hidden');
            document.getElementById('ass-notes').value = '';
            this.renderDetailsTables(this.selectedPolicy);
            this.showToast('Keputusan Risk Assessment Underwriter berhasil disimpan.');
        });
    },

    async openPolicyDetailsView(policy) {
        this.selectedPolicy = policy;
        const riskEval = await AegisApi.evaluateLocationRisk(policy.lat, policy.lon, policy);
        this.selectedRiskEval = riskEval;

        this.switchWorkspaceView('details');

        document.getElementById('details-header-title').textContent = `${policy.insuredName} — ${policy.toc || policy.lineOfBusiness || 'PAR'} (${policy.policyNumber})`;
        document.getElementById('details-total-tsi-badge').textContent = `${policy.currency || 'IDR'} ${this.formatIDR(policy.tsi)}`;

        // 1. 9 Peril Top Badges (PDF Hal 4)
        const badgesEl = document.getElementById('details-peril-badges');
        if (badgesEl) {
            badgesEl.innerHTML = AEGIS_PERILS.map(p => {
                const pObj = (riskEval.perilScores && riskEval.perilScores[p.id]) || { score: null, status: 'NO_DATA' };
                const cls = AegisApi.classifyScore(pObj.score, pObj.status);
                const isNoData = cls.code === 'NO_DATA';
                return `
                    <div class="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-help ${isNoData ? 'badge-nodata' : ''}"
                         style="${isNoData ? '' : `background:${cls.bg};color:${cls.color};border:1px solid ${cls.color}`}"
                         title="${p.name} (${p.nameId}): ${cls.label.toUpperCase()} ${isNoData ? '— Data tidak tersedia (Bukan berarti aman)' : `(${pObj.score}/100)`}">
                        <span>${p.icon} ${p.name}:</span>
                        <span class="uppercase">${cls.label} ${isNoData ? '' : `(${pObj.score})`}</span>
                    </div>
                `;
            }).join('');
        }

        // 2. Mini Satellite Map Preview (with Hybrid Area & Street Labels)
        if (!this.detailsMap) {
            this.detailsMap = L.map('details-satellite-map', {
                center: [policy.lat, policy.lon],
                zoom: 16
            });
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri Satellite'
            }).addTo(this.detailsMap);
            L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                opacity: 0.85
            }).addTo(this.detailsMap);
            L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19
            }).addTo(this.detailsMap);
            this._detailsMarkerGroup = L.layerGroup().addTo(this.detailsMap);
        } else {
            this.detailsMap.setView([policy.lat, policy.lon], 16);
            this._detailsMarkerGroup.clearLayers();
        }

        setTimeout(() => {
            if (this.detailsMap) {
                this.detailsMap.invalidateSize();
                this.detailsMap.setView([policy.lat, policy.lon], 16);
                L.circle([policy.lat, policy.lon], {
                    radius: 60,
                    color: '#38BDF8',
                    weight: 2,
                    fillColor: '#0284C7',
                    fillOpacity: 0.3
                }).addTo(this._detailsMarkerGroup);
                L.marker([policy.lat, policy.lon])
                    .bindPopup(`<strong>${policy.insuredName}</strong><br/>${policy.objectCode}`)
                    .addTo(this._detailsMarkerGroup)
                    .openPopup();
            }
        }, 180);

        // 3. SI Distributions Pie Chart (PDF Hal 4)
        this.renderSIDistributionChart(policy);

        // 4. Metadata Grid
        const gridEl = document.getElementById('details-metadata-grid');
        if (gridEl) {
            const occMeta = typeof getSeojkOccupation === 'function' ? getSeojkOccupation(policy.occupationCode) : null;
            const occLabel = occMeta ? `${policy.occupationCode} — ${occMeta.nameId} (${occMeta.name})` : (policy.occupationName ? `${policy.occupationCode} — ${policy.occupationName}` : (policy.occupationCode || '2971'));
            const tocDisplay = policy.toc || policy.lineOfBusiness || '0103 PAR';

            const fields = [
                ['Policy Number', policy.policyNumber],
                ['Durasi Pertanggungan', policy.coverageDuration || '5 Tahun (17 Oktober 2026 – 17 Oktober 2031)'],
                ['Type of Class', tocDisplay],
                ['Insured Name', policy.insuredName],
                ['Product Type', policy.productType],
                ['Underwrite Year', `${policy.underwriteYear} (${policy.insuredType})`],
                ['Occupation Code', occLabel],
                ['Construction Class', policy.constructionClass],
                ['Longitude, Latitude', `${policy.lon}, ${policy.lat}`],
                ['Elevation (MDPL)', riskEval.elevationMdpl !== null ? `${riskEval.elevationMdpl} mdpl` : 'NO DATA'],
                ['Province / City', `${policy.province} / ${policy.city}`],
                ['District / Village', `${policy.district} / ${policy.village} (${policy.postalCode || '-'})`],
                ['Full Address', policy.address],
                ['Nearest Fire Station', `${policy.nearestFireStation?.name || '-'} (${policy.nearestFireStation?.distanceKm || '-'} km)`],
                ['Nearest River / DAS', `${riskEval.river.riverName} (${riskEval.river.distanceMeters} m)`],
                ['Total Sum Insured', this.formatIDR(policy.tsi)]
            ];
            gridEl.innerHTML = fields.map(([label, val]) => `
                <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <div class="text-[10px] text-slate-400">${label}</div>
                    <div class="font-bold text-slate-100 mt-0.5 break-words">${val || '-'}</div>
                </div>
            `).join('');
        }

        // 5. Claim History & Risk Assessment Tables
        this.renderDetailsTables(policy);
    },

    renderSIDistributionChart(policy) {
        const si = policy.siBreakdown || { building: policy.tsi, machinery: 0, stock: 0, others: 0, bi: 0 };
        const labels = ['SI Building', 'SI Machinery', 'SI Stock', 'SI Others', 'SI Business Interruption'];
        const values = [si.building || 0, si.machinery || 0, si.stock || 0, si.others || 0, si.bi || 0];
        const colors = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6'];

        const ctx = document.getElementById('chart-si-distribution')?.getContext('2d');
        if (ctx && typeof Chart !== 'undefined') {
            if (this.charts.siDistribution) this.charts.siDistribution.destroy();
            this.charts.siDistribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderColor: '#0F172A',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        const legendEl = document.getElementById('details-si-legend');
        if (legendEl) {
            legendEl.innerHTML = labels.map((lb, i) => `
                <div class="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
                    <div class="flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 rounded-sm inline-block" style="background:${colors[i]}"></span>
                        <span class="text-slate-300 text-[11px]">${lb}</span>
                    </div>
                    <span class="font-bold text-white text-[11px]">${ values[i] > 0 ? `Rp ${(values[i] / 1e9).toFixed(1)} M` : 'Rp 0' }</span>
                </div>
            `).join('');
        }
    },

    renderDetailsTables(policy) {
        const claimTbody = document.getElementById('details-claim-tbody');
        if (claimTbody) {
            const claims = policy.claimHistory || [];
            if (claims.length === 0) {
                claimTbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-500">Tidak ada riwayat klaim pada objek ini (Loss Ratio 0%).</td></tr>`;
            } else {
                claimTbody.innerHTML = claims.map(c => `
                    <tr>
                        <td class="py-2 pr-2 font-bold text-amber-400">${c.claimNo}</td>
                        <td class="py-2 px-2 text-slate-300">${c.date}</td>
                        <td class="py-2 px-2 text-white">${c.cause}</td>
                        <td class="py-2 px-2 font-bold text-red-400">${this.formatIDR(c.amount)}</td>
                        <td class="py-2 pl-2"><span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">${c.status}</span></td>
                    </tr>
                `).join('');
            }
        }

        const assTbody = document.getElementById('details-assessment-tbody');
        if (assTbody) {
            const list = policy.assessmentHistory || [];
            if (list.length === 0) {
                assTbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-500">Belum ada catatan Risk Assessment. Klik "+ Add a New Risk Assessment".</td></tr>`;
            } else {
                assTbody.innerHTML = list.map(a => `
                    <tr>
                        <td class="py-2 pr-2 text-slate-300 whitespace-nowrap">${a.date}</td>
                        <td class="py-2 px-2 font-semibold text-white">${a.assessor}</td>
                        <td class="py-2 px-2"><span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[11px]">${a.grade}</span></td>
                        <td class="py-2 px-2 text-slate-300">${a.notes}</td>
                    </tr>
                `).join('');
            }
        }
    },

    // =========================================================================
    // 9. ACCEPTATIONS: EXCEL 9-COLUMN UPLOAD & MANUAL INPUT (PDF Hal 3)
    // =========================================================================
    bindAcceptationsEvents() {
        const tabExcel = document.getElementById('tab-btn-acc-excel');
        const tabManual = document.getElementById('tab-btn-acc-manual');
        const paneExcel = document.getElementById('acc-pane-excel');
        const paneManual = document.getElementById('acc-pane-manual');

        tabExcel?.addEventListener('click', () => {
            paneExcel?.classList.remove('hidden');
            paneManual?.classList.add('hidden');
            tabExcel.className = 'px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs cursor-pointer';
            tabManual.className = 'px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs cursor-pointer';
        });

        tabManual?.addEventListener('click', () => {
            paneManual?.classList.remove('hidden');
            paneExcel?.classList.add('hidden');
            tabManual.className = 'px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs cursor-pointer';
            tabExcel.className = 'px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs cursor-pointer';
        });

        // Inisialisasi Dropdown Occupation Code SEOJK di Form Manual
        const occSelect = document.getElementById('man-occupation');
        if (occSelect && typeof SEOJK_OCCUPATION_CODES !== 'undefined') {
            const categories = {};
            SEOJK_OCCUPATION_CODES.forEach(item => {
                if (!categories[item.category]) categories[item.category] = [];
                categories[item.category].push(item);
            });
            occSelect.innerHTML = Object.entries(categories).map(([cat, list]) => `
                <optgroup label="${cat}">
                    ${list.map(o => `<option value="${o.code}">${o.code} — ${o.nameId} (${o.name})</option>`).join('')}
                </optgroup>
            `).join('');
            occSelect.value = '2971';
        }

        // Download template (Policy Number + 10 Kolom)
        document.getElementById('btn-download-excel-template')?.addEventListener('click', () => {
            AegisApi.downloadAcceptationTemplate();
            this.showToast('Template Excel Input Polis ACS (ASGARD_Input_Polis_ACS_Template.xlsx) berhasil diunduh.');
        });

        // Load sample batch button (for instant 1-click preview)
        document.getElementById('btn-load-sample-batch')?.addEventListener('click', () => {
            const rows = EXCEL_TEMPLATE_SAMPLE_ROWS.map((r, i) => ({
                rowNum: i + 1,
                policyNumber: r['Policy Number'] || `POL-ACS-2026-00010${i + 1}`,
                insuredName: r['Insured Name (Optional)'] || '',
                toc: r['Type of Class (TOC)'] || '0103 PAR',
                typeOfClass: r['Type of Class (TOC)'] || '0103 PAR',
                occupationCode: r['Occupation Code'] || '2971',
                coverageDuration: r['Durasi Pertanggungan'] || '5 Tahun (17 Oktober 2026 – 17 Oktober 2031)',
                riskBlockCode: r['Risk Block Code'] || `RBC-ACS-00${i + 1}`,
                village: r['Village'],
                district: r['Sub District'],
                city: r['City/Regency'],
                province: r['Province'],
                postalCode: r['Postal Code'],
                lon: Number(r['Geo - Longitude']),
                lat: Number(r['Geo - Latitude']),
                tsi: Number(r['Sum Insured']),
                validPolicyNo: true,
                validCoord: true,
                validationNote: 'Policy Number & Koordinat Valid'
            }));
            this.renderExcelPreviewTable(rows);
            this.showToast('Sampel daftar polis existing ACS dimuat ke Step 2: Preview Data.');
        });

        // File Input Change
        const fileInput = document.getElementById('input-acceptation-excel');
        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                const parsed = await AegisApi.parseAcceptationExcel(file);
                this.renderExcelPreviewTable(parsed);
                this.showToast(`Berhasil memproses ${parsed.length} baris polis dari ${file.name}`);
            } catch (err) {
                this.showToast(`Gagal membaca file Excel: ${err.message}`);
            }
        });

        // Commit Excel Preview Rows to Portfolio
        document.getElementById('btn-commit-excel-rows')?.addEventListener('click', async () => {
            const validRows = this.pendingExcelRows.filter(r => r.validCoord && r.validPolicyNo !== false);
            if (validRows.length === 0) {
                this.showToast('Tidak ada baris dengan Policy Number & koordinat valid untuk disimpan.');
                return;
            }

            for (const row of validRows) {
                const newIndex = this.policies.length + 1;
                const evalRes = await AegisApi.evaluateLocationRisk(row.lat, row.lon, null);
                const newPolicy = {
                    id: `POL-UPL-${Date.now()}-${row.rowNum}`,
                    policyNumber: row.policyNumber || `POL-ACS-2026-${String(newIndex).padStart(6, '0')}`,
                    objectCode: `OBJ-ACS-${String(newIndex).padStart(4, '0')}`,
                    riskBlockCode: row.riskBlockCode,
                    toc: row.toc || '0103 PAR',
                    typeOfClass: row.typeOfClass || '0103 PAR — Properti All Risk',
                    coverageDuration: row.coverageDuration || '5 Tahun (17 Oktober 2026 – 17 Oktober 2031)',
                    insuredName: row.insuredName || `Tertanggung ACS — ${row.policyNumber} (${row.village})`,
                    productType: (typeof TOC_FULL_NAMES !== 'undefined' && TOC_FULL_NAMES[row.toc]) ? TOC_FULL_NAMES[row.toc] : `${row.toc || '0103 PAR'} — Properti All Risk`,
                    underwriteYear: 2026,
                    insuredType: 'Existing ACS Portfolio (Excel)',
                    occupationCode: row.occupationCode || '2971',
                    occupationName: (typeof getSeojkOccupation === 'function' ? `${getSeojkOccupation(row.occupationCode).nameId} (${getSeojkOccupation(row.occupationCode).name})` : 'Apartemen / Perkantoran'),
                    constructionClass: 'Kelas 1 (Konstruksi Tahan Api)',
                    currency: 'IDR',
                    tsi: row.tsi,
                    siBreakdown: {
                        building: Math.round(row.tsi * 0.55),
                        machinery: Math.round(row.tsi * 0.20),
                        stock: Math.round(row.tsi * 0.15),
                        others: Math.round(row.tsi * 0.05),
                        bi: Math.round(row.tsi * 0.05)
                    },
                    lat: row.lat,
                    lon: row.lon,
                    province: row.province,
                    city: row.city,
                    district: row.district,
                    village: row.village,
                    postalCode: row.postalCode,
                    address: `Kawasan ${row.village}, Kec. ${row.district}, ${row.city}, ${row.province}`,
                    elevationMdpl: evalRes.elevationMdpl,
                    slopeDeg: 2.4,
                    landCoverType: 'Area Komersial / Industri',
                    soilType: 'SD - Tanah Sedang',
                    perilScores: evalRes.perilScores,
                    nearestFireStation: { name: `Pos Damkar ${row.district}`, distanceKm: 2.8, durationMins: 9, lat: row.lat + 0.01, lon: row.lon + 0.01 },
                    nearbyBuildings20m: 15,
                    nearbyGasStations: [{ name: `SPBU ${row.village}`, distanceMeters: 620 }],
                    claimHistory: [],
                    assessmentHistory: [{
                        date: new Date().toISOString().slice(0, 10),
                        assessor: 'ASGARD Batch ACS Registration',
                        grade: `${evalRes.compositeClass.label} (${evalRes.compositeScore ?? 'N/A'})`,
                        completionPct: 100,
                        notes: 'Didaftarkan melalui unggahan jadwal Excel Input Polis Existing (ACS).'
                    }]
                };
                this.policies.unshift(newPolicy);
            }

            this.filteredPolicies = [...this.policies];
            this.savePoliciesToStorage();
            this.populateFilterDropdowns();
            this.renderLeftPolicyList();
            this.refreshMapMarkers();

            this.switchWorkspaceView('analysis');
            this.focusOnPolicy(this.policies[0], true);
            this.showToast(`${validRows.length} polis existing ACS berhasil disimpan ke portofolio & ditampilkan di peta!`);
        });

        // Unified Coordinate Input (#man-coords-unified) with Auto Comma-to-Dot Conversion & Auto Reverse Geocode
        const coordUnifiedInput = document.getElementById('man-coords-unified');
        const coordHintEl = document.getElementById('man-coord-parsed-hint');
        const coordBadgeEl = document.getElementById('man-coord-geocode-badge');
        const manLatHidden = document.getElementById('man-lat');
        const manLonHidden = document.getElementById('man-lon');

        const handleUnifiedCoordinateChange = (triggerGeocode = true) => {
            if (!coordUnifiedInput) return null;
            const rawVal = coordUnifiedInput.value;
            const parsed = AegisApi.parseUnifiedCoordinateString(rawVal);

            if (!parsed.valid) {
                if (coordHintEl) {
                    coordHintEl.textContent = `⚠️ ${parsed.error}`;
                    coordHintEl.className = 'text-[10px] text-amber-400 font-mono';
                }
                if (coordBadgeEl) {
                    coordBadgeEl.textContent = 'Format Belum Valid';
                    coordBadgeEl.className = 'text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold';
                }
                return null;
            }

            // Update hidden lat/lon fields and normalize input display if user pasted comma decimals
            if (manLatHidden) manLatHidden.value = String(parsed.lat);
            if (manLonHidden) manLonHidden.value = String(parsed.lon);
            if (coordHintEl) {
                coordHintEl.textContent = `✓ Terbaca Presisi — Latitude: ${parsed.lat}, Longitude: ${parsed.lon} (Desimal koma otomatis diubah menjadi titik)`;
                coordHintEl.className = 'text-[10px] text-emerald-400 font-mono';
            }

            if (triggerGeocode) {
                clearTimeout(this._manGeoTimer);
                if (coordBadgeEl) {
                    coordBadgeEl.textContent = '⏳ Mendeteksi Wilayah & Alamat...';
                    coordBadgeEl.className = 'text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold';
                }
                this._manGeoTimer = setTimeout(async () => {
                    const geo = await AegisApi.reverseGeocodeNominatim(parsed.lat, parsed.lon);
                    const addrObj = geo.address || {};

                    let prov = addrObj.state || addrObj.province || addrObj.region || '';
                    let city = addrObj.city || addrObj.county || addrObj.regency || addrObj.town || addrObj.municipality || '';
                    let vill = addrObj.suburb || addrObj.village || addrObj.neighbourhood || addrObj.city_district || addrObj.quarter || '';
                    let fullAddr = geo.displayName || '';

                    // Enrich from local INDONESIA_AREA_COORDS if Nominatim fields are sparse
                    if (typeof INDONESIA_AREA_COORDS !== 'undefined' && (!prov || !city)) {
                        let bestArea = null;
                        let bestDist = 999999;
                        INDONESIA_AREA_COORDS.forEach(item => {
                            const d = Math.hypot(item.lat - parsed.lat, item.lon - parsed.lon);
                            if (d < bestDist) {
                                bestDist = d;
                                bestArea = item;
                            }
                        });
                        if (bestArea && bestDist < 0.35) {
                            const parts = bestArea.label.split(',').map(s => s.trim());
                            if (!vill && parts[0]) vill = parts[0];
                            if (!city && parts[1]) city = parts[1];
                            if (!prov && parts[2]) prov = parts[2];
                        }
                    }

                    const provEl = document.getElementById('man-province');
                    const cityEl = document.getElementById('man-city');
                    const villEl = document.getElementById('man-village');
                    const addrEl = document.getElementById('man-address');

                    if (provEl && prov) provEl.value = prov;
                    if (cityEl && city) cityEl.value = city;
                    if (villEl && vill) villEl.value = vill;
                    if (addrEl && fullAddr) addrEl.value = fullAddr;

                    if (coordBadgeEl) {
                        coordBadgeEl.textContent = `✓ Wilayah Terhubung: ${vill || city || prov || 'Indonesia'}`;
                        coordBadgeEl.className = 'text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold';
                    }
                }, 380);
            }

            return parsed;
        };

        coordUnifiedInput?.addEventListener('input', () => handleUnifiedCoordinateChange(true));
        coordUnifiedInput?.addEventListener('paste', () => {
            setTimeout(() => {
                const p = handleUnifiedCoordinateChange(true);
                if (p && coordUnifiedInput) {
                    coordUnifiedInput.value = p.normalizedText;
                }
            }, 30);
        });
        coordUnifiedInput?.addEventListener('blur', () => {
            const p = handleUnifiedCoordinateChange(false);
            if (p && coordUnifiedInput) {
                coordUnifiedInput.value = p.normalizedText;
            }
        });

        // Preview Building & Street View button inside Manual Acceptation Form
        document.getElementById('btn-man-preview-building')?.addEventListener('click', () => {
            const p = handleUnifiedCoordinateChange(false);
            if (!p) {
                this.showToast('Masukkan koordinat (Latitude, Longitude) yang valid terlebih dahulu.');
                return;
            }
            const insName = document.getElementById('man-insured')?.value || 'Calon Objek Akseptasi';
            const addr = document.getElementById('man-address')?.value || `Koordinat ${p.lat}, ${p.lon}`;
            this.openStreetViewModal(p.lat, p.lon, insName, addr);
        });

        // Manual Single Acceptation Form Submit
        const manForm = document.getElementById('form-manual-acceptation');
        manForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const parsedCoord = handleUnifiedCoordinateChange(false);
            const lat = parsedCoord ? parsedCoord.lat : parseFloat(document.getElementById('man-lat')?.value);
            const lon = parsedCoord ? parsedCoord.lon : parseFloat(document.getElementById('man-lon')?.value);

            if (isNaN(lat) || isNaN(lon)) {
                this.showToast('Format Koordinat (Latitude, Longitude) tidak valid!');
                return;
            }

            const tsi = parseFloat(document.getElementById('man-tsi').value) || 0;
            const insuredName = document.getElementById('man-insured').value.trim();
            const rbc = document.getElementById('man-rbc')?.value.trim() || 'RBC-1099-JKT';
            const toc = document.getElementById('man-toc')?.value.trim() || '0103 PAR';
            const occCode = document.getElementById('man-occupation')?.value.trim() || '2971';
            const occMeta = typeof getSeojkOccupation === 'function' ? getSeojkOccupation(occCode) : { name: 'Apartments, offices <= 6 storeys', nameId: 'Apartemen / perkantoran <= 6 lantai' };
            const duration = document.getElementById('man-duration')?.value.trim() || '5 Tahun (17 Oktober 2026 – 17 Oktober 2031)';
            const province = document.getElementById('man-province').value.trim() || 'DKI Jakarta';
            const city = document.getElementById('man-city').value.trim() || 'Jakarta Pusat';
            const village = document.getElementById('man-village').value.trim() || 'Cempaka Putih';
            const address = document.getElementById('man-address').value.trim();

            const evalRes = await AegisApi.evaluateLocationRisk(lat, lon, null);
            const newIdx = this.policies.length + 1;
            const newPol = {
                id: `POL-MAN-${Date.now()}`,
                policyNumber: document.getElementById('man-policy-no').value.trim() || `POL-ACS-2026-${String(newIdx).padStart(6, '0')}`,
                objectCode: `OBJ-ACS-${String(newIdx).padStart(4, '0')}`,
                riskBlockCode: rbc,
                toc: toc,
                typeOfClass: toc,
                coverageDuration: duration,
                insuredName,
                productType: (typeof TOC_FULL_NAMES !== 'undefined' && TOC_FULL_NAMES[toc]) ? TOC_FULL_NAMES[toc] : `${toc} — Properti All Risk`,
                underwriteYear: 2026,
                insuredType: 'Existing ACS Portfolio (Manual)',
                occupationCode: occCode,
                occupationName: `${occMeta.nameId} (${occMeta.name})`,
                constructionClass: 'Kelas 1 (Tahan Api)',
                currency: 'IDR',
                tsi,
                siBreakdown: {
                    building: Math.round(tsi * 0.6),
                    machinery: Math.round(tsi * 0.2),
                    stock: Math.round(tsi * 0.1),
                    others: Math.round(tsi * 0.05),
                    bi: Math.round(tsi * 0.05)
                },
                lat,
                lon,
                province,
                city,
                district: village,
                village,
                postalCode: '-',
                address,
                elevationMdpl: evalRes.elevationMdpl,
                slopeDeg: 2.0,
                landCoverType: 'Area Komersial Perkotaan',
                soilType: 'SD - Tanah Sedang',
                perilScores: evalRes.perilScores,
                nearestFireStation: { name: `Pos Damkar ${city}`, distanceKm: 2.4, durationMins: 8, lat: lat + 0.01, lon: lon + 0.01 },
                nearbyBuildings20m: 14,
                nearbyGasStations: [{ name: `SPBU ${city}`, distanceMeters: 540 }],
                claimHistory: [],
                assessmentHistory: [{
                    date: new Date().toISOString().slice(0, 10),
                    assessor: 'Pendaftaran Manual Polis ACS',
                    grade: `${evalRes.compositeClass.label} (${evalRes.compositeScore ?? 'N/A'})`,
                    completionPct: 100,
                    notes: 'Didaftarkan melalui modul Input Polis Existing (Sistem ACS).'
                }]
            };

            this.policies.unshift(newPol);
            this.filteredPolicies = [...this.policies];
            this.savePoliciesToStorage();
            this.populateFilterDropdowns();
            this.renderLeftPolicyList();
            this.refreshMapMarkers();
            this.renderMultiPerilHeatmapLayer();

            this.switchWorkspaceView('analysis');
            this.focusOnPolicy(newPol, true);
            this.showToast(`Polis ACS "${newPol.policyNumber}" (${insuredName}) berhasil didaftarkan & ditampilkan di peta!`);
        });
    },

    renderExcelPreviewTable(rows) {
        this.pendingExcelRows = rows;
        const container = document.getElementById('excel-preview-container');
        const tbody = document.getElementById('excel-preview-tbody');
        const summary = document.getElementById('excel-preview-summary');
        const step2Circle = document.getElementById('step-circle-2');

        container?.classList.remove('hidden');
        if (step2Circle) {
            step2Circle.className = 'w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center';
        }

        const validCount = rows.filter(r => r.validCoord && r.validPolicyNo !== false).length;
        if (summary) {
            summary.textContent = `Ditemukan ${rows.length} baris polis (${validCount} baris memiliki Policy Number & koordinat valid di Indonesia).`;
        }

        if (tbody) {
            tbody.innerHTML = rows.map(r => `
                <tr class="hover:bg-slate-900/60">
                    <td class="py-2 px-3 text-slate-400">${r.rowNum}</td>
                    <td class="py-2 px-3 font-extrabold ${r.policyNumber ? 'text-amber-300' : 'text-rose-400'}">${r.policyNumber || '⚠️ KOSONG'}</td>
                    <td class="py-2 px-3 font-bold text-cyan-300">${r.toc || '0103 PAR'}</td>
                    <td class="py-2 px-3 font-mono text-amber-300">${r.occupationCode || '2971'}</td>
                    <td class="py-2 px-3 text-white">${r.village} / ${r.district}</td>
                    <td class="py-2 px-3 text-slate-300">${r.city}, ${r.province}</td>
                    <td class="py-2 px-3 text-slate-400">${r.postalCode}</td>
                    <td class="py-2 px-3 font-mono text-cyan-300">${r.lon}, ${r.lat}</td>
                    <td class="py-2 px-3 font-bold text-emerald-400">${this.formatIDR(r.tsi)}</td>
                    <td class="py-2 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.validCoord ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}">
                            ${r.validationNote}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    },

    // =========================================================================
    // 10. RISK MONITORING: GRADING DASHBOARD & EVENT FEEDS (PDF Hal 10 - 15)
    // =========================================================================
    bindMonitoringEvents() {
        document.querySelectorAll('.monitor-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-monitor');
                if (mode === 'grading' || mode === 'recommendations') {
                    this.switchWorkspaceView('grading');
                    const titleEl = document.getElementById('grading-dashboard-title');
                    if (titleEl) {
                        titleEl.textContent = mode === 'grading'
                            ? 'Grading Monitoring — Portfolio Risk Distribution'
                            : 'Recommendations Monitoring — Risk Engineering Survey Follow-Up';
                    }
                } else {
                    this.openHazardEventMonitoring(mode);
                }
            });
        });

        document.getElementById('btn-grading-back-map')?.addEventListener('click', () => {
            this.switchWorkspaceView('analysis');
        });

        document.getElementById('grading-year-filter')?.addEventListener('change', () => {
            this.renderGradingMonitoringDashboard();
        });

        document.getElementById('grading-table-search')?.addEventListener('input', () => {
            this.renderGradingPolicyTable();
        });

        // Event Monitoring Controls (PDF Hal 11-15)
        document.getElementById('btn-close-event-monitor')?.addEventListener('click', () => {
            this.closeEventMonitoringPanel();
        });

        const radSlider = document.getElementById('event-radius-slider');
        radSlider?.addEventListener('input', () => {
            document.getElementById('event-radius-label').textContent = `${radSlider.value} km`;
            if (this.currentMonitorMode) this.openHazardEventMonitoring(this.currentMonitorMode, false);
        });

        document.getElementById('event-affected-only')?.addEventListener('change', () => {
            if (this.currentMonitorMode) this.openHazardEventMonitoring(this.currentMonitorMode, false);
        });

        document.getElementById('event-time-filter')?.addEventListener('change', () => {
            if (this.currentMonitorMode) this.openHazardEventMonitoring(this.currentMonitorMode, false);
        });
    },

    renderGradingMonitoringDashboard() {
        if (typeof Chart === 'undefined') return;
        const yearVal = document.getElementById('grading-year-filter')?.value || 'ALL';
        const list = yearVal === 'ALL' ? this.policies : this.policies.filter(p => String(p.underwriteYear) === yearVal);

        // Count risk categories
        const catCounts = { None: 0, Low: 0, Medium: 0, High: 0, 'Very High': 0 };
        list.forEach(p => {
            const r = this.getPolicyActiveRisk(p);
            if (catCounts[r.cls.label] !== undefined) catCounts[r.cls.label]++;
        });

        const labels = Object.keys(catCounts);
        const dataVals = Object.values(catCounts);
        const colors = ['#38BDF8', '#10B981', '#F59E0B', '#F97316', '#EF4444'];

        // Chart 1: Bar
        const ctxBar = document.getElementById('chart-mon-category-bar')?.getContext('2d');
        if (ctxBar) {
            if (this.charts.monCategoryBar) this.charts.monCategoryBar.destroy();
            this.charts.monCategoryBar = new Chart(ctxBar, {
                type: 'bar',
                data: { labels, datasets: [{ data: dataVals, backgroundColor: colors, borderRadius: 4 }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94A3B8', font: { size: 9 } }, grid: { display: false } },
                        y: { ticks: { color: '#94A3B8', stepSize: 1 }, grid: { color: 'rgba(51,65,85,0.4)' } }
                    }
                }
            });
        }

        // Chart 2: Pie
        const ctxPie = document.getElementById('chart-mon-category-pie')?.getContext('2d');
        if (ctxPie) {
            if (this.charts.monCategoryPie) this.charts.monCategoryPie.destroy();
            this.charts.monCategoryPie = new Chart(ctxPie, {
                type: 'doughnut',
                data: { labels, datasets: [{ data: dataVals, backgroundColor: colors, borderColor: '#0F172A' }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: '#CBD5E1', boxWidth: 10, font: { size: 9 } } } }
                }
            });
        }

        // Chart 3: Recommendations Trend
        const ctxTrend = document.getElementById('chart-mon-rec-trend')?.getContext('2d');
        if (ctxTrend) {
            if (this.charts.monRecTrend) this.charts.monRecTrend.destroy();
            this.charts.monRecTrend = new Chart(ctxTrend, {
                type: 'line',
                data: {
                    labels: ['Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', 'Q1 26', 'Q2 26'],
                    datasets: [{
                        label: 'Rekomendasi Aktif',
                        data: [14, 19, 17, 24, 28, 32],
                        borderColor: '#06B6D4',
                        backgroundColor: 'rgba(6,182,212,0.18)',
                        fill: true,
                        tension: 0.35
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94A3B8', font: { size: 9 } }, grid: { display: false } },
                        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(51,65,85,0.4)' } }
                    }
                }
            });
        }

        // Chart 4: Completion Status
        const ctxComp = document.getElementById('chart-mon-completion')?.getContext('2d');
        if (ctxComp) {
            if (this.charts.monCompletion) this.charts.monCompletion.destroy();
            this.charts.monCompletion = new Chart(ctxComp, {
                type: 'bar',
                data: {
                    labels: ['Completed', 'In Progress', 'Pending Review'],
                    datasets: [{
                        data: [68, 22, 10],
                        backgroundColor: ['#10B981', '#F59E0B', '#64748B'],
                        borderRadius: 4
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94A3B8', font: { size: 9 } }, grid: { color: 'rgba(51,65,85,0.4)' } },
                        y: { ticks: { color: '#94A3B8', font: { size: 9 } }, grid: { display: false } }
                    }
                }
            });
        }

        this.renderGradingPolicyTable();
    },

    renderGradingPolicyTable() {
        const tbody = document.getElementById('grading-policy-tbody');
        if (!tbody) return;
        const q = (document.getElementById('grading-table-search')?.value || '').trim().toLowerCase();
        const yearVal = document.getElementById('grading-year-filter')?.value || 'ALL';

        const rows = this.policies.filter(p => {
            if (yearVal !== 'ALL' && String(p.underwriteYear) !== yearVal) return false;
            if (q && !p.policyNumber.toLowerCase().includes(q) && !p.insuredName.toLowerCase().includes(q) && !p.objectCode.toLowerCase().includes(q)) return false;
            return true;
        });

        tbody.innerHTML = rows.map(p => {
            const r = this.getPolicyActiveRisk(p);
            const compPct = (p.assessmentHistory && p.assessmentHistory[0]?.completionPct) || 75;
            return `
                <tr class="hover:bg-slate-900/60">
                    <td class="py-2.5 px-3 font-bold text-amber-400">${p.policyNumber}</td>
                    <td class="py-2.5 px-3 text-slate-300">${p.objectCode}</td>
                    <td class="py-2.5 px-3 font-semibold text-white">${p.insuredName}</td>
                    <td class="py-2.5 px-3 text-slate-300">${p.province} / ${p.city}</td>
                    <td class="py-2.5 px-3 font-bold text-emerald-400">${this.formatIDR(p.tsi)}</td>
                    <td class="py-2.5 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold" style="background:${r.cls.bg};color:${r.cls.color}">${r.cls.label.toUpperCase()} (${r.score ?? 'N/A'})</span>
                    </td>
                    <td class="py-2.5 px-3">
                        <div class="flex items-center gap-2">
                            <div class="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div class="h-full bg-emerald-500" style="width:${compPct}%"></div>
                            </div>
                            <span class="text-[11px] font-bold text-slate-300">${compPct}%</span>
                        </div>
                    </td>
                    <td class="py-2.5 px-3">
                        <button data-id="${p.id}" class="grading-view-btn px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-semibold text-[11px] cursor-pointer">
                            View Object
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.grading-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pol = this.policies.find(x => x.id === btn.getAttribute('data-id'));
                if (pol) this.openPolicyDetailsView(pol);
            });
        });
    },

    /**
     * Open Natural Hazard Event Monitoring on Map (PDF Hal 11 - 15) + Expandable Affected Policy Details
     * Modes: flood, sumatera_flood, earthquake, landslide, cyclone, volcano
     */
    openHazardEventMonitoring(mode, flyToRegion = true) {
        this.currentMonitorMode = mode;
        this.switchWorkspaceView('analysis');
        document.getElementById('left-filter-drawer')?.classList.add('hidden');
        const panel = document.getElementById('event-monitoring-panel');
        panel?.classList.remove('hidden');

        this.overlayGroups.monitoringLayer.clearLayers();
        const radiusKm = Number(document.getElementById('event-radius-slider')?.value) || 50;
        const affectedOnly = document.getElementById('event-affected-only')?.checked || false;

        const modeConfig = {
            flood: {
                title: 'Flood Monitoring (INARISK BNPB & DAS)',
                badge: 'INARISK BNPB + River Telemetry',
                center: [-6.1754, 106.8272],
                zoom: 11,
                events: FLOOD_HAZARD_ZONES.map(z => ({
                    name: z.name,
                    subtitle: `Skor Bahaya Banjir INARISK: ${z.riskScore}/100`,
                    note: z.note,
                    lat: z.lat,
                    lon: z.lon,
                    color: '#0EA5E9'
                }))
            },
            sumatera_flood: {
                title: 'Sumatera Flash Flood Monitoring [New]',
                badge: 'INARISK Regional Flash Flood Watch',
                center: [0.5, 99.5],
                zoom: 6,
                events: [
                    { name: 'DAS Krueng Aceh & Aceh Besar', subtitle: 'Siaga Banjir Bandang & Luapan Krueng Aceh', note: 'Curah hujan hulu > 120 mm/hari (INARISK BNPB + WINDY Telemetry).', lat: 5.5483, lon: 95.3238, color: '#10B981' },
                    { name: 'Sub-DAS Deli & Belawan (Medan)', subtitle: 'Waspada Genangan Pasang & Banjir Sungai Deli', note: 'Kenaikan debit hulu Bukit Barisan.', lat: 3.7845, lon: 98.6832, color: '#10B981' },
                    { name: 'Lembah Anai & Padang (Sumatera Barat)', subtitle: 'Siaga Banjir Bandang / Galodo Lereng Singgalang-Marapi', note: 'Pemantauan intensif jalur sungai berhulu gunung api.', lat: -0.9471, lon: 100.3542, color: '#EF4444' }
                ]
            },
            earthquake: {
                title: 'Earthquake Monitoring (BMKG TEWS & MAGMA ESDM)',
                badge: AegisApi.earthquakeSourceLabel || 'BMKG TEWS + MAGMA ESDM Live',
                center: [-2.5, 118.0],
                zoom: 5,
                events: ((AegisApi.earthquakeCache && AegisApi.earthquakeCache.features) || AegisApi.getFallbackEarthquakes().features).slice(0, 10).map(eq => ({
                    name: `M${eq.properties.mag.toFixed(1)} — ${eq.properties.place}`,
                    subtitle: `${eq.properties.provider || 'BMKG TEWS'} • Kedalaman ${eq.geometry.coordinates[2] || 10} km`,
                    note: `Waktu: ${new Date(eq.properties.time).toLocaleString('id-ID')}${eq.properties.potensi ? ` • ${eq.properties.potensi}` : ''}`,
                    lat: eq.geometry.coordinates[1],
                    lon: eq.geometry.coordinates[0],
                    color: '#EF4444'
                }))
            },
            landslide: {
                title: 'Landslide Monitoring (INARISK BNPB)',
                badge: 'INARISK Tanah Longsor',
                center: [-6.9, 107.6],
                zoom: 8,
                events: LANDSLIDE_HAZARD_ZONES.map(z => ({
                    name: z.name,
                    subtitle: `Skor Kerentanan Longsor INARISK: ${z.riskScore}/100`,
                    note: z.note,
                    lat: z.lat,
                    lon: z.lon,
                    color: '#F59E0B'
                }))
            },
            cyclone: {
                title: 'Tropical Cyclone & Extreme Weather (WINDY / BMKG)',
                badge: 'WINDY + BMKG TCWC',
                center: [-9.5, 118.0],
                zoom: 5,
                events: CYCLONE_ARRAY_NORMALIZED.map(tc => ({
                    name: tc.name,
                    subtitle: tc.category,
                    note: tc.advisoryNote,
                    lat: tc.trackPoints[1].lat,
                    lon: tc.trackPoints[1].lon,
                    color: '#EC4899',
                    track: tc.trackPoints
                }))
            },
            volcano: {
                title: 'Volcanic Eruption Monitoring (MAGMA ESDM / PVMBG)',
                badge: 'MAGMA ESDM Live Status',
                center: [-7.5, 110.5],
                zoom: 6,
                events: ACTIVE_VOLCANOES.map(v => ({
                    name: `${v.name} (${v.province})`,
                    subtitle: `Status: ${v.status}`,
                    note: v.pvmbgNote,
                    lat: v.lat,
                    lon: v.lon,
                    color: '#DC2626'
                }))
            }
        };

        const cfg = modeConfig[mode] || modeConfig.earthquake;
        document.getElementById('event-monitor-title').textContent = cfg.title;
        document.getElementById('event-monitor-badge').textContent = cfg.badge;

        if (flyToRegion && this.map) {
            this.forceClusterMode = false;
            this.map.flyTo(cfg.center, cfg.zoom, { duration: 1.1 });
        }

        // Draw monitoring events & calculate affected policies within radiusKm
        const affectedPolicyIds = new Set();
        const feedHtmlList = [];

        cfg.events.forEach((ev, idx) => {
            // Draw radius circle on monitoringLayer
            L.circle([ev.lat, ev.lon], {
                radius: radiusKm * 1000,
                color: ev.color,
                weight: 2,
                dashArray: '5, 5',
                fillColor: ev.color,
                fillOpacity: 0.15
            }).bindTooltip(`<strong>${ev.name}</strong><br/>Radius Dampak: ${radiusKm} km`).addTo(this.overlayGroups.monitoringLayer);

            // If tropical cyclone track exists, draw track line & wind points
            if (ev.track) {
                const latlngs = ev.track.map(pt => [pt.lat, pt.lon]);
                L.polyline(latlngs, { color: '#EC4899', weight: 3, dashArray: '6, 4' }).addTo(this.overlayGroups.monitoringLayer);
                ev.track.forEach(pt => {
                    L.circleMarker([pt.lat, pt.lon], { radius: 6, color: '#EC4899', fillOpacity: 0.8 })
                        .bindTooltip(`🌀 ${ev.name} (${pt.time}) — Wind: ${pt.windKmh} km/h, Pressure: ${pt.pressureHpa} hPa`)
                        .addTo(this.overlayGroups.monitoringLayer);
                });
            }

            // Check policies within radiusKm using Turf.js and store exact distance
            const nearPoliciesWithDist = [];
            this.policies.forEach(p => {
                if (typeof turf === 'undefined') return;
                const d = turf.distance(turf.point([ev.lon, ev.lat]), turf.point([p.lon, p.lat]), { units: 'kilometers' });
                if (d <= radiusKm) {
                    nearPoliciesWithDist.push({ policy: p, distanceKm: Number(d.toFixed(2)) });
                    affectedPolicyIds.add(p.id);
                }
            });

            nearPoliciesWithDist.sort((a, b) => a.distanceKm - b.distanceKm);
            const exposedTsi = nearPoliciesWithDist.reduce((s, item) => s + (Number(item.policy.tsi) || 0), 0);

            const affectedDetailsHtml = nearPoliciesWithDist.length > 0 ? `
                <div class="pt-1.5 mt-1.5 border-t border-slate-800/90">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-amber-400">Akumulasi TSI Terpapar: ${this.formatIDR(exposedTsi)}</span>
                        <button type="button" data-toggle-affected="aff-list-${idx}" class="btn-toggle-affected-list text-[10px] px-2 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 font-bold transition cursor-pointer">
                            Lihat Rincian ${nearPoliciesWithDist.length} Polis ▾
                        </button>
                    </div>
                    <div id="aff-list-${idx}" class="hidden mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        ${nearPoliciesWithDist.map(({ policy, distanceKm }) => {
                            const r = this.getPolicyActiveRisk(policy);
                            return `
                                <div class="p-2 rounded-lg bg-slate-950/95 border border-slate-700/80 text-[10px] space-y-1">
                                    <div class="flex items-center justify-between">
                                        <span class="font-extrabold text-amber-300 font-mono">${policy.policyNumber}</span>
                                        <span class="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-bold">Jarak: ${distanceKm} km</span>
                                    </div>
                                    <div class="font-bold text-white text-[11px]">${policy.insuredName} <span class="text-slate-400 font-normal">(${policy.objectCode})</span></div>
                                    <div class="text-slate-400 truncate">${policy.address}</div>
                                    <div class="flex items-center justify-between pt-1 border-t border-slate-800/80">
                                        <span class="font-bold text-emerald-400">TSI: ${this.formatIDR(policy.tsi)}</span>
                                        <span class="px-1.5 py-0.2 rounded font-bold" style="background:${r.cls.bg};color:${r.cls.color}">${r.cls.label} (${r.score ?? 'N/A'})</span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-1 pt-1">
                                        <button type="button" data-aff-focus="${policy.id}" class="btn-aff-focus py-1 px-1.5 rounded bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white font-semibold text-center cursor-pointer">
                                            📍 Fokus Peta
                                        </button>
                                        <button type="button" data-aff-street="${policy.id}" class="btn-aff-street py-1 px-1.5 rounded bg-slate-800 hover:bg-cyan-600 text-cyan-300 hover:text-white font-semibold text-center cursor-pointer">
                                            🏢 Gedung
                                        </button>
                                        <button type="button" data-aff-detail="${policy.id}" class="btn-aff-detail py-1 px-1.5 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-bold text-center cursor-pointer">
                                            📄 Detail Polis
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : '';

            feedHtmlList.push(`
                <div data-lat="${ev.lat}" data-lon="${ev.lon}" class="monitor-feed-card p-3 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 transition space-y-1">
                    <div class="flex items-center justify-between text-[10px]">
                        <span class="font-bold text-cyan-300">${ev.subtitle}</span>
                        <button type="button" data-toggle-affected="aff-list-${idx}" class="${nearPoliciesWithDist.length > 0 ? 'btn-toggle-affected-list cursor-pointer hover:bg-red-500/40' : ''} px-1.5 py-0.5 rounded font-bold ${nearPoliciesWithDist.length > 0 ? 'bg-red-500/25 text-red-300 border border-red-500/40' : 'bg-slate-800 text-slate-400'}">
                            ${nearPoliciesWithDist.length} Polis Terdampak ${nearPoliciesWithDist.length > 0 ? '▾' : ''}
                        </button>
                    </div>
                    <div class="monitor-card-header cursor-pointer">
                        <div class="text-xs font-extrabold text-white">${ev.name}</div>
                        <div class="text-[11px] text-slate-400">${ev.note}</div>
                    </div>
                    ${affectedDetailsHtml}
                </div>
            `);
        });

        const feedEl = document.getElementById('event-monitor-feed');
        if (feedEl) {
            feedEl.innerHTML = feedHtmlList.join('');

            // Click event header to fly to event center
            feedEl.querySelectorAll('.monitor-feed-card .monitor-card-header').forEach(hdr => {
                hdr.addEventListener('click', () => {
                    const card = hdr.closest('.monitor-feed-card');
                    if (!card) return;
                    const lat = parseFloat(card.getAttribute('data-lat'));
                    const lon = parseFloat(card.getAttribute('data-lon'));
                    this.map.flyTo([lat, lon], 11, { duration: 1.0 });
                });
            });

            // Toggle expandable affected policies list
            feedEl.querySelectorAll('.btn-toggle-affected-list').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetId = btn.getAttribute('data-toggle-affected');
                    const listDiv = document.getElementById(targetId);
                    if (listDiv) {
                        listDiv.classList.toggle('hidden');
                    }
                });
            });

            // Focus on specific affected policy on map
            feedEl.querySelectorAll('.btn-aff-focus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const pid = btn.getAttribute('data-aff-focus');
                    const pol = this.policies.find(p => p.id === pid);
                    if (pol) this.focusOnPolicy(pol, true);
                });
            });

            // Open Building / Street View for specific affected policy
            feedEl.querySelectorAll('.btn-aff-street').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const pid = btn.getAttribute('data-aff-street');
                    const pol = this.policies.find(p => p.id === pid);
                    if (pol) this.openStreetViewModal(pol.lat, pol.lon, `${pol.insuredName} (${pol.objectCode})`, pol.address);
                });
            });

            // Open full Policy Details view for specific affected policy
            feedEl.querySelectorAll('.btn-aff-detail').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const pid = btn.getAttribute('data-aff-detail');
                    const pol = this.policies.find(p => p.id === pid);
                    if (pol) this.openPolicyDetailsView(pol);
                });
            });
        }

        if (affectedOnly) {
            this.filteredPolicies = this.policies.filter(p => affectedPolicyIds.has(p.id));
        } else {
            this.filteredPolicies = [...this.policies];
        }
        this.refreshMapMarkers();
    },

    closeEventMonitoringPanel() {
        this.currentMonitorMode = null;
        document.getElementById('event-monitoring-panel')?.classList.add('hidden');
        this.overlayGroups.monitoringLayer.clearLayers();
        this.filteredPolicies = [...this.policies];
        this.refreshMapMarkers();
    },

    // =========================================================================
    // 11. RISK SIMULATION MODAL, PROFILE MODAL & STREET VIEW INSPECTOR MODAL
    // =========================================================================
    bindStreetViewModalEvents() {
        const modal = document.getElementById('modal-street-view');
        const iframe = document.getElementById('sv-iframe');
        const btnStreet = document.getElementById('btn-sv-mode-street');
        const btnSat = document.getElementById('btn-sv-mode-sat');

        document.getElementById('btn-close-sv-modal')?.addEventListener('click', () => {
            modal?.classList.add('hidden');
            if (iframe) iframe.src = 'about:blank';
        });

        btnStreet?.addEventListener('click', () => {
            if (!this._svCoords || !iframe) return;
            const { lat, lon } = this._svCoords;
            iframe.src = `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lon}&cbp=12,0,0,0,0&output=svembed`;
            btnStreet.className = 'px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer';
            if (btnSat) btnSat.className = 'px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer';
        });

        btnSat?.addEventListener('click', () => {
            if (!this._svCoords || !iframe) return;
            const { lat, lon } = this._svCoords;
            iframe.src = `https://maps.google.com/maps?q=${lat},${lon}&t=k&z=19&output=embed`;
            btnSat.className = 'px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer';
            if (btnStreet) btnStreet.className = 'px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer';
        });
    },

    openStreetViewModal(lat, lon, title = 'Inspeksi Visual Gedung & Street View', address = '') {
        this._svCoords = { lat: Number(lat), lon: Number(lon) };
        const modal = document.getElementById('modal-street-view');
        const titleEl = document.getElementById('sv-modal-title');
        const subEl = document.getElementById('sv-modal-subtitle');
        const addrEl = document.getElementById('sv-modal-address');
        const extLink = document.getElementById('sv-external-gmaps-link');
        const iframe = document.getElementById('sv-iframe');
        const btnStreet = document.getElementById('btn-sv-mode-street');
        const btnSat = document.getElementById('btn-sv-mode-sat');

        if (titleEl) titleEl.textContent = `🏢 ${title}`;
        if (subEl) subEl.textContent = `Koordinat Presisi: ${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)}`;
        if (addrEl) addrEl.textContent = address || `Lokasi Objek (${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)})`;
        if (extLink) {
            extLink.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;
        }

        if (btnStreet) btnStreet.className = 'px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer';
        if (btnSat) btnSat.className = 'px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer';

        if (iframe) {
            iframe.src = `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lon}&cbp=12,0,0,0,0&output=svembed`;
        }

        modal?.classList.remove('hidden');
    },

    bindSimulationAndProfileModals() {
        const simModal = document.getElementById('modal-simulation');
        const simTitle = document.getElementById('sim-modal-title');
        const simSlider = document.getElementById('sim-buffer-slider');

        const updateSimCalculation = () => {
            const km = Number(simSlider?.value) || 5;
            document.getElementById('sim-buffer-km-label').textContent = `${km} km`;
            const refPol = this.selectedPolicy || this.policies[0];
            if (!refPol || typeof turf === 'undefined') return;

            const affected = this.policies.filter(p => {
                const d = turf.distance(turf.point([refPol.lon, refPol.lat]), turf.point([p.lon, p.lat]), { units: 'kilometers' });
                return d <= km;
            });
            const totalExposed = affected.reduce((s, p) => s + p.tsi, 0);
            document.getElementById('sim-affected-count').textContent = `${affected.length} Polis`;
            document.getElementById('sim-affected-tsi').textContent = this.formatIDR(totalExposed);
        };

        document.querySelectorAll('.sim-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const label = btn.getAttribute('data-sim');
                if (simTitle) simTitle.textContent = label;
                updateSimCalculation();
                simModal?.classList.remove('hidden');
            });
        });

        simSlider?.addEventListener('input', updateSimCalculation);

        document.getElementById('btn-sim-draw-on-map')?.addEventListener('click', () => {
            const km = Number(simSlider?.value) || 5;
            const refPol = this.selectedPolicy || this.policies[0];
            simModal?.classList.add('hidden');
            this.switchWorkspaceView('analysis');
            this.overlayGroups.analysisHighlights.clearLayers();

            const circle = L.circle([refPol.lat, refPol.lon], {
                radius: km * 1000,
                color: '#F59E0B',
                weight: 2.5,
                dashArray: '6, 4',
                fillColor: '#D97706',
                fillOpacity: 0.22
            }).bindTooltip(`⚡ Zona Simulasi Eksposur Akumulasi (${km} km) dari ${refPol.objectCode}`, { permanent: true }).addTo(this.overlayGroups.analysisHighlights);

            this.map.fitBounds(circle.getBounds().pad(0.3));
            this.showToast(`Zona simulasi eksposur radius ${km} km ditampilkan pada peta.`);
        });

        document.getElementById('btn-close-sim-modal')?.addEventListener('click', () => simModal?.classList.add('hidden'));
        document.getElementById('btn-close-sim-modal-2')?.addEventListener('click', () => simModal?.classList.add('hidden'));

        // Profile Modal (PDF Hal 5)
        const profModal = document.getElementById('modal-profile');
        document.getElementById('btn-profile')?.addEventListener('click', () => profModal?.classList.remove('hidden'));
        document.getElementById('btn-close-profile-modal')?.addEventListener('click', () => profModal?.classList.add('hidden'));
        document.getElementById('btn-close-profile-modal-2')?.addEventListener('click', () => profModal?.classList.add('hidden'));
    }
};

const AegisApp = AsgardApp;
window.AsgardApp = AsgardApp;
window.AegisApp = AegisApp;

window.addEventListener('DOMContentLoaded', () => {
    AsgardApp.init();
});
