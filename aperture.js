// Diafragmaring: draait mee met de aperture-waarde, in dezelfde stijl als de focusring.
// Raakt index.js niet aan: de verborgen #apertureSlider blijft de bron van de waarde.
(function () {
    const W = 720, H = 110, CX = 360, R = 330, DEG = 26;   // DEG = graden per hele stop
    const RAD = Math.PI / 180;
    const FULL = [1, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32, 45, 64];
    const stops = n => 2 * Math.log2(n);
    const angleOfIdx = i => DEG * stops(apertureHalfStops[i]);

    var cv, c, raw = 0, idx = 0, anim = 0;

    function txt(s, x, y, phi, color) {
        const k = Math.cos(phi);
        c.save();
        c.globalAlpha = Math.max(0, Math.min(1, (k - 0.1) * 1.6));
        c.translate(x, y);
        c.scale(k, 1);
        c.fillStyle = color;
        c.fillText(s, 0, 0);
        c.restore();
    }

    function draw() {
        const X = phi => CX + R * Math.sin(phi);
        const VIS = 84 * RAD;
        const Y0 = 40, Y1 = 104;

        c.clearRect(0, 0, W, H);
        c.fillStyle = "#1d1d1d";
        c.fillRect(0, 0, W, H);

        // vaste tubus
        let g = c.createLinearGradient(0, 6, 0, 38);
        g.addColorStop(0, "#5a5a5a"); g.addColorStop(0.35, "#a8a8a8"); g.addColorStop(1, "#3a3a3a");
        c.fillStyle = g;
        c.fillRect(0, 6, W, 32);

        // ring
        c.fillStyle = "#151515";
        c.fillRect(0, Y0, W, Y1 - Y0);

        // ribbels onderaan
        c.strokeStyle = "#3b3b3b";
        for (let k = Math.floor((raw - 90) / 3); k <= Math.ceil((raw + 90) / 3); k++) {
            const phi = (k * 3 - raw) * RAD;
            if (Math.abs(phi) > VIS) continue;
            const x = X(phi);
            c.lineWidth = 2 * Math.cos(phi) + 0.3;
            c.beginPath(); c.moveTo(x, Y1 - 10); c.lineTo(x, Y1 - 1); c.stroke();
        }

        // streepjes en getallen
        c.font = "bold 16px sans-serif";
        c.textAlign = "center";
        apertureHalfStops.forEach((v, i) => {
            const phi = (angleOfIdx(i) - raw) * RAD;
            if (Math.abs(phi) > VIS) return;
            const x = X(phi), k = Math.cos(phi);
            const full = FULL.includes(v);
            c.strokeStyle = "#f2f2f2";
            c.lineWidth = (full ? 2 : 1.2) * k + 0.4;
            c.globalAlpha = Math.max(0, Math.min(1, (k - 0.1) * 1.6));
            c.beginPath(); c.moveTo(x, 46); c.lineTo(x, full ? 62 : 55); c.stroke();
            c.globalAlpha = 1;
            if (full) txt(String(v), x, 84, phi, "#f2f2f2");
        });

        // cilinderschaduw
        g = c.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, "rgba(0,0,0,0.9)");
        g.addColorStop(0.2, "rgba(0,0,0,0.3)");
        g.addColorStop(0.5, "rgba(255,255,255,0.06)");
        g.addColorStop(0.8, "rgba(0,0,0,0.3)");
        g.addColorStop(1, "rgba(0,0,0,0.9)");
        c.fillStyle = g;
        c.fillRect(0, 6, W, Y1 - 6);

        // glans
        g = c.createLinearGradient(0, Y0, 0, Y1);
        g.addColorStop(0, "rgba(255,255,255,0.10)");
        g.addColorStop(0.4, "rgba(255,255,255,0)");
        g.addColorStop(1, "rgba(0,0,0,0.35)");
        c.fillStyle = g;
        c.fillRect(0, Y0, W, Y1 - Y0);

        // index
        c.fillStyle = "#ff3b30";
        c.fillRect(CX - 1.5, 8, 3, 46);
        c.fillStyle = "#fff";
        c.fillRect(CX - 0.5, 8, 1, 46);

        // vaste "f/" labels
        c.font = "bold 13px sans-serif";
        c.textAlign = "center";
        [26, W - 26].forEach(x => {
            c.fillStyle = "#151515";
            c.fillRect(x - 15, 70, 30, 19);
            c.fillStyle = "#6db3ff";
            c.fillText("f/", x, 84);
        });
    }

    function settle() {
        cancelAnimationFrame(anim);
        const target = angleOfIdx(idx);
        (function step() {
            raw += (target - raw) * 0.3;
            if (Math.abs(target - raw) < 0.05) { raw = target; draw(); return; }
            draw();
            anim = requestAnimationFrame(step);
        })();
    }

    function setIdx(i) {
        i = Math.max(0, Math.min(apertureHalfStops.length - 1, i));
        if (i === idx) return;
        idx = i;
        if (navigator.vibrate) navigator.vibrate(8);   // korte klik bij elke stand
        slider.value = i;
        update();
    }

    function nearest(a) {
        let best = 0, bd = Infinity;
        apertureHalfStops.forEach((v, i) => {
            const d = Math.abs(angleOfIdx(i) - a);
            if (d < bd) { bd = d; best = i; }
        });
        return best;
    }

    document.addEventListener("DOMContentLoaded", function () {
        // slider verbergen, canvas eronder plaatsen
        slider.style.display = "none";
        cv = document.createElement("canvas");
        const dpr = window.devicePixelRatio || 1;
        cv.width = W * dpr; cv.height = H * dpr;
        cv.tabIndex = 0;
        cv.setAttribute("aria-label", "Aperture ring");
        Object.assign(cv.style, {
            width: "100%", maxWidth: "720px", height: "auto", cursor: "grab",
            touchAction: "none", outline: "none", borderRadius: "8px"
        });
        document.querySelector(".aperture").after(cv);
        c = cv.getContext("2d");
        c.scale(dpr, dpr);

        // update() uitbreiden zodat de ring altijd meetekent
        const orig = update;
        update = function () { orig(); draw(); };

        idx = Number(slider.value);
        raw = angleOfIdx(idx);

        var dragging = false, lastX = 0;
        cv.addEventListener("pointerdown", e => {
            dragging = true; lastX = e.clientX;
            cancelAnimationFrame(anim);
            cv.setPointerCapture(e.pointerId);
            cv.focus();
        });
        cv.addEventListener("pointermove", e => {
            if (!dragging) return;
            const scale = W / cv.getBoundingClientRect().width;
            raw -= ((e.clientX - lastX) * scale / R) / RAD;
            lastX = e.clientX;
            raw = Math.max(angleOfIdx(0), Math.min(angleOfIdx(apertureHalfStops.length - 1), raw));
            const n = nearest(raw);
            if (n !== idx) setIdx(n); else draw();
        });
        const end = () => { if (dragging) { dragging = false; settle(); } };
        cv.addEventListener("pointerup", end);
        cv.addEventListener("pointercancel", end);
        cv.addEventListener("wheel", e => {
            e.preventDefault();
            setIdx(idx + (e.deltaY + e.deltaX > 0 ? 1 : -1));
            settle();
        }, { passive: false });
        cv.addEventListener("keydown", e => {
            const s = e.shiftKey ? 3 : 1;
            if (e.key === "ArrowLeft") { e.preventDefault(); setIdx(idx + s); settle(); }
            if (e.key === "ArrowRight") { e.preventDefault(); setIdx(idx - s); settle(); }
        });

        draw();
    });
})();