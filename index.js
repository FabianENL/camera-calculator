var slider;
var apertureText;
var aperture = 8;

var focusText;
var focusVal = 10;          // focusafstand in meters (Infinity toegestaan)

var focalLengthElement;
var focalLength = 50;
var hyperFocus;

const apertureHalfStops = [0.95, 1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 25, 29, 32, 36, 40, 45, 51, 57, 64];

const mtoft = 3.28084;

var cocBox;
const cocs = [0.065, 0.055, 0.05, 0.045, 0.03, 0.021, 0.02, 0.015, 0.011];
var coc = 0.03;

var resultBox;
var resultBoxFT;

// ---------- Lens / focusring model ----------
// Helicoïde: de lens schuift uit met f²/(d-f). De ring draait evenredig met
// die uitschuiving. De minimale focusafstand (0.2m) staat altijd op de volle
// draaihoek THETA, dus de afstandsmarkeringen schuiven mee met de brandpuntsafstand.
const THETA = 400;                 // totale draaihoek in graden (oneindig -> dichtbij)
const MIN_FOCUS = 0.2;             // meters
const RAD = Math.PI / 180;

// bij lange brandpunten kan 0.2m niet (d moet > f zijn): dan 2 x f
function minFocus() { return Math.max(MIN_FOCUS, focalLength * 2 / 1000); }

function angleOf(dm) {
    if (!Number.isFinite(dm)) return 0;
    const f = focalLength / 1000;
    return THETA * (minFocus() - f) / (dm - f);
}

function distOf(a) {
    if (a < 0.2) return Infinity;
    const f = focalLength / 1000;
    return f + THETA * (minFocus() - f) / a;
}

// ---------- Tekenen ----------
var canvas, ctx;
const W = 720, H = 160, CX = 360, R = 330;
const Y0 = 62, Y1 = 142;

function fmtNum(n) {
    return String(parseFloat(n.toPrecision(3)));
}

function dofLimits(focusM) {
    const hyperfocal = (focalLength * focalLength) / (aperture * coc) + focalLength;
    if (!Number.isFinite(focusM)) return { near: hyperfocal / 1000, far: Infinity };
    const fm = focusM * 1000;
    const near = (hyperfocal * fm) / (hyperfocal + (fm - focalLength));
    const far = (fm >= hyperfocal) ? Infinity : (hyperfocal * fm) / (hyperfocal - (fm - focalLength));
    return { near: near / 1000, far: far / 1000 };
}

function txt(c, s, x, y, phi, color) {
    const k = Math.cos(phi);
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, (k - 0.1) * 1.6));
    c.translate(x, y);
    c.scale(k, 1);
    c.fillStyle = color;
    c.fillText(s, 0, 0);
    c.restore();
}

function drawLens() {
    const c = ctx;
    const af = angleOf(focusVal);
    const X = phi => CX + R * Math.sin(phi);
    const VIS = 84 * RAD;

    c.clearRect(0, 0, W, H);
    c.fillStyle = "#1d1d1d";
    c.fillRect(0, 0, W, H);

    // vaste lenstubus (boven)
    let g = c.createLinearGradient(0, 8, 0, 58);
    g.addColorStop(0, "#5a5a5a"); g.addColorStop(0.35, "#a8a8a8"); g.addColorStop(1, "#3a3a3a");
    c.fillStyle = g;
    c.fillRect(0, 8, W, 50);

    // draaiende ring
    c.fillStyle = "#151515";
    c.fillRect(0, Y0, W, Y1 - Y0);

    // ribbels (draaien mee)
    c.strokeStyle = "#3b3b3b";
    const step = 3;
    for (let k = Math.floor((af - 90) / step); k <= Math.ceil((af + 90) / step); k++) {
        const phi = (k * step - af) * RAD;
        if (Math.abs(phi) > VIS) continue;
        const x = X(phi);
        c.lineWidth = 2 * Math.cos(phi) + 0.3;
        c.beginPath(); c.moveTo(x, Y0 + 1); c.lineTo(x, Y0 + 9);
        c.moveTo(x, Y1 - 9); c.lineTo(x, Y1 - 1); c.stroke();
    }

    c.font = "bold 15px sans-serif";
    c.textAlign = "center";

    // Tekent een rij markeringen; belangrijke eerst, te dichtbij liggende vallen af
    function drawRow(cands, row, color) {
        const placed = [];
        cands.forEach(([dm, label]) => {
            if (Number.isFinite(dm) && dm < minFocus() * 0.999) return;
            const phi = (angleOf(dm) - af) * RAD;
            if (Math.abs(phi) > VIS) return;
            const x = X(phi);
            const gap = 14 + 16 * Math.cos(phi) + 4 * label.length;
            if (placed.some(p => Math.abs(p - x) < gap)) return;
            placed.push(x);
            c.strokeStyle = color; c.lineWidth = 2 * Math.cos(phi) + 0.5;
            c.globalAlpha = Math.max(0, Math.min(1, (Math.cos(phi) - 0.1) * 1.6));
            c.beginPath();
            if (row === 0) { c.moveTo(x, 72); c.lineTo(x, 81); }
            else { c.moveTo(x, 122); c.lineTo(x, 131); }
            c.stroke();
            c.globalAlpha = 1;
            txt(c, label, x, row === 0 ? 98 : 120, phi, color);
        });
    }

    drawRow([[Infinity, "∞"], [10, "10"], [5, "5"], [3, "3"], [2, "2"], [1, "1"],
             [20, "20"], [1.5, "1.5"], [0.5, "0.5"], [50, "50"], [0.7, "0.7"],
             [100, "100"], [0.4, "0.4"], [0.3, "0.3"], [0.25, "0.25"]], 0, "#f2f2f2");
    drawRow([[Infinity, "∞"]].concat(
        [10, 5, 3, 2, 1, 20, 15, 7, 30, 1.5, 50, 100].map(ft => [ft / mtoft, String(ft)])),
        1, "#f0a43c");

    // cilinderschaduw over ring en tubus
    g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "rgba(0,0,0,0.9)");
    g.addColorStop(0.2, "rgba(0,0,0,0.3)");
    g.addColorStop(0.5, "rgba(255,255,255,0.06)");
    g.addColorStop(0.8, "rgba(0,0,0,0.3)");
    g.addColorStop(1, "rgba(0,0,0,0.9)");
    c.fillStyle = g;
    c.fillRect(0, 8, W, Y1 - 8);

    // glans over ring
    g = c.createLinearGradient(0, Y0, 0, Y1);
    g.addColorStop(0, "rgba(255,255,255,0.10)");
    g.addColorStop(0.4, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    c.fillStyle = g;
    c.fillRect(0, Y0, W, Y1 - Y0);

    // scherptediepte-markeringen op de vaste tubus
    const lim = dofLimits(focusVal);
    [[lim.near, "#5ec8ff"], [lim.far, "#8cff7a"]].forEach(([d, col]) => {
        const phi = (angleOf(d) - af) * RAD;
        if (Math.abs(phi) > VIS) return;
        const x = X(phi);
        c.fillStyle = col;
        c.beginPath(); c.moveTo(x - 6, 30); c.lineTo(x + 6, 30); c.lineTo(x, 60); c.closePath(); c.fill();
    });

    // index
    c.fillStyle = "#ff3b30";
    c.fillRect(CX - 1.5, 10, 3, 52);
    c.fillStyle = "#ffffff";
    c.fillRect(CX - 0.5, 10, 1, 52);

    // eenheidslabels (vast)
    c.font = "bold 13px sans-serif";
    c.textAlign = "center";
    [[26, "#f2f2f2", "m", 98], [26, "#f0a43c", "ft", 120],
     [W - 26, "#f2f2f2", "m", 98], [W - 26, "#f0a43c", "ft", 120]].forEach(([x, col, t, y]) => {
        c.fillStyle = "#151515";
        c.fillRect(x - 15, y - 14, 30, 19);
        c.fillStyle = col;
        c.fillText(t, x, y);
    });
}

// ---------- Berekening ----------
function update() {
    focalLength = Number(focalLengthElement.value) || 50;
    aperture = apertureHalfStops[slider.value];
    coc = cocs[cocBox.value];

    apertureText.innerHTML = aperture;

    // focus vastzetten op minimale focusafstand van deze brandpuntsafstand
    if (focusVal < minFocus()) focusVal = minFocus();

    // Hyperfocale afstand in mm
    var hyperfocal = (focalLength * focalLength) / (aperture * coc) + focalLength;
    hyperFocus = hyperfocal / 1000;

    if (!Number.isFinite(focusVal)) {
        focusText.innerHTML = "∞";
    } else {
        focusText.innerHTML = `${focusVal.toFixed(2)}m (= ${Math.round(focusVal * mtoft)}ft)`;
    }

    // DOF berekenen
    var min;
    var max;

    if (!Number.isFinite(focusVal)) {
        min = hyperfocal;
        max = Infinity;
    } else {
        var focusMM = focusVal * 1000;

        min = (hyperfocal * focusMM) /
            (hyperfocal + (focusMM - focalLength));

        max = (focusMM >= hyperfocal) ? Infinity :
            (hyperfocal * focusMM) /
            (hyperfocal - (focusMM - focalLength));
    }

    var mintext = (min / 1000).toFixed(1);
    var mintextft = (mtoft * (min / 1000)).toFixed(1);

    var maxtext = Number.isFinite(max) ? (max / 1000).toFixed(1) : "∞";
    var maxtextft = Number.isFinite(max) ? (mtoft * (max / 1000)).toFixed(1) : "∞";

    resultBox.innerHTML = `${mintext}m | ${maxtext}m : hyper: ${hyperFocus.toFixed(1)}m`;
    resultBoxFT.innerHTML = `${mintextft}ft | ${maxtextft}ft : hyper: ${(mtoft * hyperFocus).toFixed(1)}ft`;

    drawLens();
}

function setFormat() { update(); }
function sliderUpdate() { update(); }
function focalLengthChange() { update(); }

function turnRing(deltaDeg) {
    const a = Math.min(THETA, Math.max(0, angleOf(focusVal) + deltaDeg));
    focusVal = distOf(a);
    update();
}

document.addEventListener("DOMContentLoaded", function () {
    slider = document.getElementById("apertureSlider");
    apertureText = document.getElementById("aperture");
    focalLengthElement = document.getElementById("focallength");
    focusText = document.getElementById("focus");
    cocBox = document.getElementById("format");
    resultBox = document.getElementById("result");
    resultBoxFT = document.getElementById("resultft");
    canvas = document.getElementById("lens");

    // scherp tekenen op hoge-dpi schermen
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // slepen: het ringoppervlak volgt de vinger
    var dragging = false, lastX = 0;
    canvas.addEventListener("pointerdown", e => {
        dragging = true; lastX = e.clientX;
        canvas.setPointerCapture(e.pointerId);
        canvas.focus();
    });
    canvas.addEventListener("pointermove", e => {
        if (!dragging) return;
        const scale = W / canvas.getBoundingClientRect().width;
        const dx = (e.clientX - lastX) * scale;
        lastX = e.clientX;
        turnRing(-(dx / R) / RAD);
    });
    canvas.addEventListener("pointerup", () => dragging = false);
    canvas.addEventListener("pointercancel", () => dragging = false);
    canvas.addEventListener("wheel", e => {
        e.preventDefault();
        turnRing((e.deltaY + e.deltaX) * 0.08);
    }, { passive: false });
    canvas.addEventListener("keydown", e => {
        const s = e.shiftKey ? 8 : 2;
        if (e.key === "ArrowLeft") { e.preventDefault(); turnRing(s); }
        if (e.key === "ArrowRight") { e.preventDefault(); turnRing(-s); }
    });

    coc = cocs[cocBox.value];
    focusVal = 10;
    update();
});