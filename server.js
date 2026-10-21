const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8085;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// In-memory cache to prevent rate-limiting or slow upstream responses
const apiCache = {
    bmkg: { data: null, ts: 0 },
    magma: { data: null, ts: 0 },
    inarisk: new Map()
};

function sendJson(res, status, payload) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(payload));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            ...options,
            signal: ctrl.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'application/json,text/plain,*/*',
                ...(options.headers || {})
            }
        });
        return res;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * 1. Proxy BMKG TEWS (Gempa Tektonik Terkini, Dirasakan, & Autogempa)
 */
async function handleBmkgEarthquakes(req, res) {
    const now = Date.now();
    if (apiCache.bmkg.data && now - apiCache.bmkg.ts < 180000) {
        return sendJson(res, 200, apiCache.bmkg.data);
    }

    try {
        const [autoRes, terkiniRes, dirasakanRes] = await Promise.allSettled([
            fetchWithTimeout('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', { headers: { Referer: 'https://www.bmkg.go.id/' } }, 4500),
            fetchWithTimeout('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', { headers: { Referer: 'https://www.bmkg.go.id/' } }, 4500),
            fetchWithTimeout('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json', { headers: { Referer: 'https://www.bmkg.go.id/' } }, 4500)
        ]);

        const features = [];
        const seenIds = new Set();

        const pushBmkgList = async (settled, categoryLabel) => {
            if (settled.status !== 'fulfilled' || !settled.value.ok) return;
            const json = await settled.value.json();
            const raw = json?.Infogempa?.gempa;
            const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
            list.forEach((g, idx) => {
                if (!g || !g.Coordinates) return;
                const parts = String(g.Coordinates).split(',');
                const lat = parseFloat(parts[0]);
                const lon = parseFloat(parts[1]);
                if (Number.isNaN(lat) || Number.isNaN(lon)) return;
                const mag = parseFloat(g.Magnitude) || 4.5;
                const depthKm = parseFloat(String(g.Kedalaman || '10').replace(/[^\d.]/g, '')) || 10;
                const key = `${lat.toFixed(2)}_${lon.toFixed(2)}_${mag}`;
                if (seenIds.has(key)) return;
                seenIds.add(key);

                features.push({
                    type: 'Feature',
                    properties: {
                        mag,
                        place: `${g.Wilayah || 'Wilayah Indonesia'} (BMKG TEWS)`,
                        time: g.DateTime ? new Date(g.DateTime).getTime() : (Date.now() - idx * 3600000),
                        tanggal: `${g.Tanggal || ''} ${g.Jam || ''}`.trim(),
                        potensi: g.Potensi || g.Dirasakan || categoryLabel,
                        source: 'BMKG TEWS Live',
                        eqType: 'Tektonik (BMKG)',
                        shakemap: g.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` : null
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [lon, lat, depthKm]
                    }
                });
            });
        };

        await pushBmkgList(autoRes, 'Gempa Terbaru BMKG');
        await pushBmkgList(terkiniRes, 'Gempa M >= 5.0 BMKG');
        await pushBmkgList(dirasakanRes, 'Gempa Dirasakan BMKG');

        if (features.length === 0) throw new Error('Empty BMKG list');

        const payload = {
            type: 'FeatureCollection',
            provider: 'BMKG TEWS (Badan Meteorologi, Klimatologi, dan Geofisika)',
            isLive: true,
            updatedAt: new Date().toISOString(),
            features
        };
        apiCache.bmkg = { data: payload, ts: now };
        return sendJson(res, 200, payload);
    } catch (err) {
        return sendJson(res, 200, {
            type: 'FeatureCollection',
            provider: 'BMKG TEWS Fallback',
            isLive: false,
            error: err.message,
            features: []
        });
    }
}

/**
 * 2. Proxy MAGMA ESDM / PVMBG (Status Gunung Api & Aktivitas Seismik Vulkanik)
 */
async function handleMagmaVolcano(req, res) {
    const now = Date.now();
    if (apiCache.magma.data && now - apiCache.magma.ts < 300000) {
        return sendJson(res, 200, apiCache.magma.data);
    }

    try {
        const r = await fetchWithTimeout('https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas', {}, 5500);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const html = await r.text();

        const cells = [...html.matchAll(/<td[^>]*>(.*?)<\/td>/gs)]
            .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
            .filter(Boolean);

        let currentLevel = 'Level I (Normal)';
        const parsedVolcanoes = [];

        for (const c of cells) {
            if (c.includes('Level IV (Awas)')) { currentLevel = 'Level IV (Awas)'; continue; }
            if (c.includes('Level III (Siaga)')) { currentLevel = 'Level III (Siaga)'; continue; }
            if (c.includes('Level II (Waspada)')) { currentLevel = 'Level II (Waspada)'; continue; }
            if (c.includes('Level I (Normal)')) { currentLevel = 'Level I (Normal)'; continue; }

            if (c.includes(' - ') && c.includes('Lihat laporan')) {
                const clean = c.replace('Lihat laporan', '').trim();
                const [vName, vProv] = clean.split(' - ').map(s => s.trim());
                if (vName) {
                    parsedVolcanoes.push({
                        name: vName,
                        province: vProv || 'Indonesia',
                        status: currentLevel,
                        volcanicQuakeNote: currentLevel.includes('III')
                            ? 'MAGMA PVMBG: Terdeteksi kegempaan vulkanik dalam/dangkal & tremor menerus tinggi'
                            : (currentLevel.includes('II')
                                ? 'MAGMA PVMBG: Peningkatan aktivitas kegempaan vulkanik & hembusan kawah'
                                : 'MAGMA PVMBG: Kegempaan vulkanik tektonik lokal normal')
                    });
                }
            }
        }

        const payload = {
            provider: 'MAGMA Indonesia (PVMBG - Kementerian ESDM)',
            isLive: parsedVolcanoes.length > 0,
            updatedAt: new Date().toISOString(),
            count: parsedVolcanoes.length,
            volcanoes: parsedVolcanoes
        };
        apiCache.magma = { data: payload, ts: now };
        return sendJson(res, 200, payload);
    } catch (err) {
        return sendJson(res, 200, {
            provider: 'MAGMA Indonesia (PVMBG Fallback)',
            isLive: false,
            error: err.message,
            volcanoes: []
        });
    }
}

/**
 * 3. Proxy BNPB inaRISK ArcGIS ImageServer Identify (Indeks Bahaya H, Kerentanan V, Kapasitas C, & Risiko R)
 */
async function handleInariskPoint(req, res, queryParams) {
    const lat = parseFloat(queryParams.get('lat'));
    const lon = parseFloat(queryParams.get('lon'));
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return sendJson(res, 400, { error: 'Invalid lat/lon' });
    }

    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
    if (apiCache.inarisk.has(cacheKey)) {
        return sendJson(res, 200, apiCache.inarisk.get(cacheKey));
    }

    const geom = encodeURIComponent(JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 }
    }));

    const queryLayer = async (serviceName) => {
        try {
            const url = `https://gis.bnpb.go.id/server/rest/services/${serviceName}/ImageServer/identify?geometry=${geom}&geometryType=esriGeometryPoint&returnGeometry=false&f=pjson`;
            const r = await fetchWithTimeout(url, {}, 5200);
            if (!r.ok) return null;
            const j = await r.json();
            if (!j || j.value === 'NoData' || j.value === null || typeof j.value === 'undefined') return 0;
            const num = parseFloat(j.value);
            return Number.isNaN(num) ? null : num;
        } catch (e) {
            return null;
        }
    };

    // Query in two 6-layer waves to prevent ArcGIS Web Adaptor connection throttling
    const [
        floodRisk,
        landslideRisk,
        eqRisk,
        fireRisk,
        weatherRisk,
        multiRisk
    ] = await Promise.all([
        queryLayer('inarisk/layer_risiko_banjir'),
        queryLayer('inarisk/layer_risiko_tanah_longsor'),
        queryLayer('inarisk/layer_risiko_gempabumi'),
        queryLayer('inarisk/INDEKS_BAHAYA_KARHUTLA'),
        queryLayer('inarisk/layer_risiko_cuaca_ekstrim'),
        queryLayer('inarisk/layer_risiko_multi')
    ]);

    const [
        droughtRisk,
        liqRisk,
        tsunamiRisk,
        volcanoRisk,
        popDensity,
        capacityIdx
    ] = await Promise.all([
        queryLayer('inarisk/layer_risiko_kekeringan'),
        queryLayer('inarisk/layer_risiko_likuefaksi'),
        queryLayer('inarisk/layer_risiko_tsunami'),
        queryLayer('inarisk/layer_risiko_letusan_gunungapi'),
        queryLayer('inarisk/INARISKPOP_2020'),
        queryLayer('inarisk/INDEKS_KAPASITAS_2021')
    ]);

    const anyLive = [floodRisk, landslideRisk, eqRisk, fireRisk, weatherRisk, droughtRisk, liqRisk, tsunamiRisk, volcanoRisk, multiRisk, popDensity, capacityIdx].some(v => v !== null);

    const payload = {
        provider: 'BNPB inaRISK ArcGIS Server (gis.bnpb.go.id)',
        isLive: anyLive,
        lat,
        lon,
        raw: {
            floodRisk,
            landslideRisk,
            eqRisk,
            fireRisk,
            weatherRisk,
            droughtRisk,
            liqRisk,
            tsunamiRisk,
            volcanoRisk,
            multiRisk,
            popDensity,
            capacityIdx
        }
    };

    if (anyLive) {
        apiCache.inarisk.set(cacheKey, payload);
    }
    return sendJson(res, 200, payload);
}

/**
 * 4. Proxy BNPB inaRISK Raster Tile / ExportImage (Mendukung Caching & CORS-Free Canvas Blending)
 * IMPORTANT: BNPB ArcGIS ImageServer (WKID 3395) has exact geographic fullExtent:
 *   xmin: 95.08, ymin: -11.00, xmax: 141.02, ymax: 5.82
 * Any bbox outside [95.08, -11.00, 141.02, 5.82] triggers an HTTP 500 in BNPB's ArcGIS Web Adaptor!
 */
const tileCache = new Map();
const INARISK_SERVICE_MAP = {
    flood: 'inarisk/layer_risiko_banjir',
    landslide: 'inarisk/layer_risiko_tanah_longsor',
    earthquake: 'inarisk/layer_risiko_gempabumi',
    fire: 'inarisk/INDEKS_BAHAYA_KARHUTLA',
    wildfire: 'inarisk/INDEKS_BAHAYA_KARHUTLA',
    extreme_weather: 'inarisk/layer_risiko_cuaca_ekstrim',
    extremeWeather: 'inarisk/layer_risiko_cuaca_ekstrim',
    drought: 'inarisk/layer_risiko_kekeringan',
    liquefaction: 'inarisk/layer_risiko_likuefaksi',
    tsunami: 'inarisk/layer_risiko_tsunami',
    volcano: 'inarisk/layer_risiko_letusan_gunungapi',
    composite: 'inarisk/layer_risiko_multi',
    population: 'inarisk/INARISKPOP_2020'
};

// Transparent 1x1 PNG fallback so Leaflet never shows broken image icons
const TRANSPARENT_1X1_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
);

async function handleInariskTile(req, res, queryParams) {
    const peril = queryParams.get('peril') || 'composite';
    const rawBbox = queryParams.get('bbox') || '95.08,-11.00,141.02,5.82';
    const size = queryParams.get('size') || '512,512';
    const service = INARISK_SERVICE_MAP[peril] || INARISK_SERVICE_MAP.composite;

    // Parse and strictly clamp bbox to BNPB's native WKID 3395 fullExtent [95.08, -11.00, 141.02, 5.82]
    const parts = rawBbox.split(',').map(Number);
    const w = Math.max(95.08, Math.min(140.90, Number.isFinite(parts[0]) ? parts[0] : 95.08));
    const s = Math.max(-11.00, Math.min(5.70, Number.isFinite(parts[1]) ? parts[1] : -11.00));
    const e = Math.max(w + 0.05, Math.min(141.02, Number.isFinite(parts[2]) ? parts[2] : 141.02));
    const n = Math.max(s + 0.05, Math.min(5.82, Number.isFinite(parts[3]) ? parts[3] : 5.82));
    const clampedBbox = `${w.toFixed(4)},${s.toFixed(4)},${e.toFixed(4)},${n.toFixed(4)}`;

    const reqFormat = queryParams.get('format') || 'png24';
    const reqTransparent = queryParams.get('transparent') === 'true' ? 'true' : 'false';
    const cacheKey = `${service}_${clampedBbox}_${size}_${reqFormat}_${reqTransparent}`;
    if (tileCache.has(cacheKey)) {
        const cachedBuf = tileCache.get(cacheKey);
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
        });
        return res.end(cachedBuf);
    }

    try {
        const transParam = reqFormat === 'png32' ? `&transparent=${reqTransparent}` : '';
        const url = `https://gis.bnpb.go.id/server/rest/services/${service}/ImageServer/exportImage?bbox=${clampedBbox}&bboxSR=4326&imageSR=3857&size=${size}&format=${reqFormat}${transParam}&f=image`;
        const upstream = await fetchWithTimeout(url, {}, 16000);
        const contentType = upstream.headers.get('content-type') || '';

        if (upstream.ok && contentType.includes('image')) {
            const arrBuf = await upstream.arrayBuffer();
            const buf = Buffer.from(arrBuf);
            if (buf.byteLength > 200) {
                if (tileCache.size > 400) {
                    const firstKey = tileCache.keys().next().value;
                    tileCache.delete(firstKey);
                }
                tileCache.set(cacheKey, buf);
                res.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600'
                });
                return res.end(buf);
            }
        }
    } catch (err) {
        // Fall through to transparent PNG
    }

    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
    });
    return res.end(TRANSPARENT_1X1_PNG);
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = parsedUrl.pathname;

    // API Proxy Routes
    if (pathname === '/api/health') {
        return sendJson(res, 200, {
            status: 'UP',
            service: 'ASGARD Underwriting Intelligence Platform',
            version: '3.2.0',
            port: PORT,
            timestamp: new Date().toISOString()
        });
    }
    if (pathname === '/api/bmkg-earthquakes') {
        return handleBmkgEarthquakes(req, res);
    }
    if (pathname === '/api/magma-volcanoes') {
        return handleMagmaVolcano(req, res);
    }
    if (pathname === '/api/inarisk-point') {
        return handleInariskPoint(req, res, parsedUrl.searchParams);
    }
    if (pathname === '/api/inarisk-tile') {
        return handleInariskTile(req, res, parsedUrl.searchParams);
    }

    // Static Files
    let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);

    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('404 Not Found');
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`============================================================================`);
    console.log(`  ASGARD (Askrindo Geospatial Analytics for Risk Detection)`);
    console.log(`  Server Mandiri + Public Risk API Proxy Berjalan`);
    console.log(`  Akses URL Lokal    : http://localhost:${PORT}`);
    console.log(`  Akses URL Jaringan : http://127.0.0.1:${PORT}`);
    console.log(`  Healthcheck        : http://localhost:${PORT}/api/health`);
    console.log(`============================================================================`);
});
