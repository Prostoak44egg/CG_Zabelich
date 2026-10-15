import "./style.css";

interface RGB  { r: number; g: number; b: number; }
interface CMYK { c: number; m: number; y: number; k: number; }
interface HSV  { h: number; s: number; v: number; }

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const R = r / 255, G = g / 255, B = b / 255;
  const K = 1 - Math.max(R, G, B);
  if (K >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - R - K) / (1 - K);
  const m = (1 - G - K) / (1 - K);
  const y = (1 - B - K) / (1 - K);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(K * 100),
  };
}

function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const C = c / 100, M = m / 100, Y = y / 100, K = k / 100;
  return {
    r: Math.round(255 * (1 - C) * (1 - K)),
    g: Math.round(255 * (1 - M) * (1 - K)),
    b: Math.round(255 * (1 - Y) * (1 - K)),
  };
}

function rgbToHsv({ r, g, b }: RGB): HSV {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === R)      h = 60 * (((G - B) / d) % 6);
    else if (max === G) h = 60 * ((B - R) / d + 2);
    else                h = 60 * ((R - G) / d + 4);
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

function hsvToRgb({ h, s, v }: HSV): RGB {
  const S = s / 100, V = v / 100;
  const c = V * S;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = V - c;

  let r1 = 0, g1 = 0, b1 = 0;
  if      (h < 60)  { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else              { r1 = c; g1 = 0; b1 = x; }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const h = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const v = m[1];
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

let current: RGB = { r: 0, g: 0, b: 0 };

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} не найден`);
  return el;
}

function input(id: string): HTMLInputElement {
  return $(id) as HTMLInputElement;
}

function setTrackGradient(id: string, cssGradient: string) {
  input(id).style.setProperty("--track-bg", cssGradient);
}

function updateTrackGradients(rgb: RGB) {
  const cmyk = rgbToCmyk(rgb);
  const hsv  = rgbToHsv(rgb);

  setTrackGradient("rgbRRange",
    `linear-gradient(90deg, ${rgbToHex({ r: 0,   g: rgb.g, b: rgb.b })}, ${rgbToHex({ r: 255, g: rgb.g, b: rgb.b })})`);
  setTrackGradient("rgbGRange",
    `linear-gradient(90deg, ${rgbToHex({ r: rgb.r, g: 0,   b: rgb.b })}, ${rgbToHex({ r: rgb.r, g: 255, b: rgb.b })})`);
  setTrackGradient("rgbBRange",
    `linear-gradient(90deg, ${rgbToHex({ r: rgb.r, g: rgb.g, b: 0   })}, ${rgbToHex({ r: rgb.r, g: rgb.g, b: 255 })})`);

  setTrackGradient("cmykCRange",
    `linear-gradient(90deg, ${rgbToHex(cmykToRgb({ ...cmyk, c: 0 }))}, ${rgbToHex(cmykToRgb({ ...cmyk, c: 100 }))})`);
  setTrackGradient("cmykMRange",
    `linear-gradient(90deg, ${rgbToHex(cmykToRgb({ ...cmyk, m: 0 }))}, ${rgbToHex(cmykToRgb({ ...cmyk, m: 100 }))})`);
  setTrackGradient("cmykYRange",
    `linear-gradient(90deg, ${rgbToHex(cmykToRgb({ ...cmyk, y: 0 }))}, ${rgbToHex(cmykToRgb({ ...cmyk, y: 100 }))})`);
  setTrackGradient("cmykKRange",
    `linear-gradient(90deg, ${rgbToHex(cmykToRgb({ ...cmyk, k: 0 }))}, ${rgbToHex(cmykToRgb({ ...cmyk, k: 100 }))})`);

  const hStops = [0, 60, 120, 180, 240, 300, 360]
    .map(h => rgbToHex(hsvToRgb({ h, s: hsv.s, v: hsv.v })))
    .join(", ");
  setTrackGradient("hsvHRange", `linear-gradient(90deg, ${hStops})`);
  setTrackGradient("hsvSRange",
    `linear-gradient(90deg, ${rgbToHex(hsvToRgb({ h: hsv.h, s: 0,   v: hsv.v }))}, ${rgbToHex(hsvToRgb({ h: hsv.h, s: 100, v: hsv.v }))})`);
  setTrackGradient("hsvVRange",
    `linear-gradient(90deg, ${rgbToHex(hsvToRgb({ h: hsv.h, s: hsv.s, v: 0   }))}, ${rgbToHex(hsvToRgb({ h: hsv.h, s: hsv.s, v: 100 }))})`);
}

function setField(prefix: string, value: number) {
  const range  = input(`${prefix}Range`);
  const number = input(`${prefix}Number`);

  if (range.value !== String(value)) range.value = String(value);

  if (document.activeElement !== number && number.value !== String(value)) {
    number.value = String(value);
  }
}

function updateAll(rgb: RGB) {
  const safe: RGB = {
    r: clamp(Math.round(rgb.r), 0, 255),
    g: clamp(Math.round(rgb.g), 0, 255),
    b: clamp(Math.round(rgb.b), 0, 255),
  };
  current = safe;

  const cmyk = rgbToCmyk(safe);
  const hsv  = rgbToHsv(safe);
  const hex  = rgbToHex(safe);

  ($("colorPreview") as HTMLDivElement).style.background = hex;

  const hexField = input("hexInput");
  if (document.activeElement !== hexField) {
    hexField.value = hex.toUpperCase();
  }

  const picker = input("colorPicker");
  if (picker.value.toLowerCase() !== hex.toLowerCase()) {
    picker.value = hex;
  }

  setField("rgbR", safe.r);  setField("rgbG", safe.g);  setField("rgbB", safe.b);
  setField("cmykC", cmyk.c); setField("cmykM", cmyk.m);
  setField("cmykY", cmyk.y); setField("cmykK", cmyk.k);
  setField("hsvH", hsv.h);   setField("hsvS", hsv.s);   setField("hsvV", hsv.v);

  updateTrackGradients(safe);
}

function bindCoord(
  prefix: string,
  min: number,
  max: number,
  apply: (value: number) => RGB
) {
  const range  = input(`${prefix}Range`);
  const number = input(`${prefix}Number`);

  const commit = (raw: string, fromRange: boolean) => {
    let v = parseInt(raw, 10);
    if (isNaN(v)) v = min;
    v = clamp(v, min, max);

    if (fromRange) {
      if (number.value !== String(v)) number.value = String(v);
    } else {
      if (range.value !== String(v)) range.value = String(v);
    }

    updateAll(apply(v));
  };

  range.addEventListener("input", () => commit(range.value, true));

  number.addEventListener("input", () => {
    const v = parseInt(number.value, 10);
    if (!isNaN(v)) commit(number.value, false);
  });

  number.addEventListener("blur", () => {
    const v = parseInt(number.value, 10);
    commit(isNaN(v) ? String(min) : String(v), false);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindCoord("rgbR", 0, 255, v => ({ ...current, r: v }));
  bindCoord("rgbG", 0, 255, v => ({ ...current, g: v }));
  bindCoord("rgbB", 0, 255, v => ({ ...current, b: v }));

  bindCoord("cmykC", 0, 100, v => cmykToRgb({ ...rgbToCmyk(current), c: v }));
  bindCoord("cmykM", 0, 100, v => cmykToRgb({ ...rgbToCmyk(current), m: v }));
  bindCoord("cmykY", 0, 100, v => cmykToRgb({ ...rgbToCmyk(current), y: v }));
  bindCoord("cmykK", 0, 100, v => cmykToRgb({ ...rgbToCmyk(current), k: v }));

  bindCoord("hsvH", 0, 360, v => hsvToRgb({ ...rgbToHsv(current), h: v }));
  bindCoord("hsvS", 0, 100, v => hsvToRgb({ ...rgbToHsv(current), s: v }));
  bindCoord("hsvV", 0, 100, v => hsvToRgb({ ...rgbToHsv(current), v: v }));

  input("colorPicker").addEventListener("input", e => {
    const rgb = hexToRgb((e.target as HTMLInputElement).value);
    if (rgb) updateAll(rgb);
  });

  const hexField = input("hexInput");
  hexField.addEventListener("input", () => {
    const rgb = hexToRgb(hexField.value);
    if (rgb) updateAll(rgb);
  });
  hexField.addEventListener("blur", () => {
    hexField.value = rgbToHex(current).toUpperCase();
  });

  updateAll({ r: 0, g: 0, b: 0 });
});