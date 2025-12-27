// app.js
// Supabase (Browser ohne Build Tool) + globaler Counter + BAPM_avg + Bildstufen (10er)
// Voraussetzungen in Supabase:
// - Tabelle public.counters(id text PK, value bigint, started_at timestamptz)
// - RPC public.press(counter_id text) returns table(value bigint, bapm numeric)
// - RPC public.get_status(counter_id text) returns table(value bigint, bapm numeric)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1) HIER eintragen:
const SUPABASE_URL = "https://yxahnuvvgocamfogylih.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1JTeGkHIgUfLdyHaeHyV5Q_foASpaWE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// 2) Config
const COUNTER_ID = "global";
const STEP_SIZE = 10; // Bildstufen: 0–9 => stage0, 10–19 => stage1, ...

// 3) DOM ?
const counterEl = document.getElementById("counterValue");
const bapmEl = document.getElementById("bapmValue");
const statusEl = document.getElementById("statusText");
const imgEl = document.getElementById("stageImage");
const plusBtn = document.getElementById("plusBtn");

// ---- Helpers ----
function stageIndexFromValue(value) {
  const v = Number(value);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.floor(v / STEP_SIZE);
}

function stageSrcForIndex(i) {
  return `./img/bierarsch.png`;
}

function formatBapm(bapm) {
  const n = Number(bapm);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function render(value, bapm) {
  counterEl.textContent = String(value ?? 0);
  bapmEl.textContent = formatBapm(bapm);

  const idx = stageIndexFromValue(value ?? 0);
  const src = stageSrcForIndex(idx);

  // Nur wechseln, wenn es wirklich ein anderes Bild ist (verhindert Flackern)
  if (imgEl.getAttribute("src") !== src) {
    imgEl.setAttribute("src", src);
  }
}

// ---- Supabase calls ----
async function loadStatus() {
  statusEl.textContent = "Lade…";

  const { data, error } = await supabase.rpc("get_status", { counter_id: COUNTER_ID });

  if (error) {
    statusEl.textContent = "Fehler: " + error.message;
    console.error(error);
    return;
  }

  // Bei TABLE-return kommt meist ein Array mit 1 Objekt zurück
  const row = Array.isArray(data) ? data[0] : data;
  render(row?.value ?? 0, row?.bapm ?? 0);

  statusEl.textContent = "";
}

async function press() {
  plusBtn.disabled = true;
  statusEl.textContent = "";

  const { data, error } = await supabase.rpc("press", { counter_id: COUNTER_ID });

  plusBtn.disabled = false;

  if (error) {
    statusEl.textContent = "Fehler: " + error.message;
    console.error(error);
    return;
  }

  const row = Array.isArray(data) ? data[0] : data;
  render(row?.value ?? 0, row?.bapm ?? 0);
}

// 4) Event
plusBtn.addEventListener("click", press);

// 5) Dein Wunsch: nur bei Reload / eigenem Klick updaten
loadStatus();
