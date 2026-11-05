// Telefoonvriendelijke brandpuntsafstand: grote -/+ knoppen (ingedrukt houden herhaalt),
// numeriek toetsenbord en snelkeuzeknoppen. Raakt index.js niet aan.
(function () {
    const PRESETS = [16, 24, 35, 50, 85, 135];
    const MIN = 8, MAX = 600;

    const css = `
    .fl { display:flex; flex-direction:column; align-items:center; gap:12px; }
    .fl-row { display:flex; align-items:center; gap:10px; }
    .fl-row input { width:96px; height:52px; font-size:26px; text-align:center; border-radius:10px;
        border:1px solid #555; background:#1d1d1d; color:#fff; -moz-appearance:textfield; appearance:textfield; }
    .fl-row input::-webkit-outer-spin-button, .fl-row input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
    .fl-btn, .fl-chip { border:none; color:#fff; background:#444; font-family:inherit;
        user-select:none; -webkit-user-select:none; touch-action:manipulation; cursor:pointer; }
    .fl-btn { width:52px; height:52px; border-radius:10px; font-size:30px; line-height:1; }
    .fl-btn:active, .fl-chip:active { background:#666; }
    .fl-unit { font-size:18px; color:#aaa; }
    .fl-chips { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; max-width:360px; }
    .fl-chip { min-width:48px; height:40px; padding:0 12px; border-radius:20px; font-size:16px; }
    .fl-chip.on { background:#f0a43c; color:#1d1d1d; font-weight:bold; }`;

    document.addEventListener("DOMContentLoaded", function () {
        const input = document.getElementById("focallength");
        if (!input) return;

        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);

        input.setAttribute("inputmode", "numeric");
        input.setAttribute("min", MIN);
        input.setAttribute("max", MAX);
        input.setAttribute("aria-label", "Focal length in mm");
        input.addEventListener("focus", () => input.select());

        const wrap = document.createElement("div");
        wrap.className = "fl";
        const row = document.createElement("div");
        row.className = "fl-row";
        const chips = document.createElement("div");
        chips.className = "fl-chips";

        const minus = btn("−", -1), plus = btn("+", 1);
        const unit = document.createElement("span");
        unit.className = "fl-unit"; unit.textContent = "mm";

        const old = input.parentElement;
        old.parentElement.insertBefore(wrap, old);
        row.append(minus, input, plus, unit);
        wrap.append(row, chips);
        old.style.display = "none";

        const chipEls = PRESETS.map(v => {
            const b = document.createElement("button");
            b.type = "button"; b.className = "fl-chip"; b.textContent = v;
            b.addEventListener("click", () => set(v));
            chips.appendChild(b);
            return [v, b];
        });

        function highlight() {
            const v = Number(input.value);
            chipEls.forEach(([p, b]) => b.classList.toggle("on", p === v));
        }

        function set(v) {
            v = Math.max(MIN, Math.min(MAX, Math.round(v) || 50));
            input.value = v;
            highlight();
            focalLengthChange();
        }

        function btn(label, dir) {
            const b = document.createElement("button");
            b.type = "button"; b.className = "fl-btn"; b.textContent = label;
            var t1, t2;
            const stop = () => { clearTimeout(t1); clearInterval(t2); };
            b.addEventListener("pointerdown", e => {
                e.preventDefault();
                set(Number(input.value) + dir);
                t1 = setTimeout(() => { t2 = setInterval(() => set(Number(input.value) + dir), 70); }, 400);
            });
            ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, stop));
            b.addEventListener("contextmenu", e => e.preventDefault());
            return b;
        }

        // live meeupdaten tijdens het typen
        input.addEventListener("input", () => {
            const v = Number(input.value);
            if (v >= MIN && v <= MAX) { highlight(); focalLengthChange(); }
        });
        input.addEventListener("change", () => set(Number(input.value)));

        highlight();
    });
})();