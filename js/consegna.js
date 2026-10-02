// Consegna anonima: codice + file scaricabile (solo locale)
let codice = "";
const titoloEl = document.getElementById("titolo");
const testoEl = document.getElementById("testo-lavoro");
const codEl = document.getElementById("codice");
const antEl = document.getElementById("anteprima");

function nuovoCodice() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "STUD-" + s;
}

function aggiornaAnteprima() {
  const t = testoEl.value.trim();
  const titolo = titoloEl.value.trim();
  antEl.textContent = "Codice: " + (codice || "(premi Genera)") +
    "\nTitolo: " + (titolo || "(senza titolo)") +
    "\n---\n" + (t || "(testo vuoto)");
}

document.getElementById("file-lavoro").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { testoEl.value = String(r.result || ""); aggiornaAnteprima(); };
  r.readAsText(f);
});

document.getElementById("btn-generacodice").addEventListener("click", () => {
  codice = nuovoCodice();
  codEl.textContent = codice;
  aggiornaAnteprima();
});

testoEl.addEventListener("input", aggiornaAnteprima);
titoloEl.addEventListener("input", aggiornaAnteprima);

document.getElementById("btn-scarica-lavoro").addEventListener("click", () => {
  if (!codice) codice = nuovoCodice();
  codEl.textContent = codice;
  aggiornaAnteprima();
  const contenuto = "CODICE ANONIMO: " + codice + "\nTITOLO: " + (titoloEl.value.trim() || "senza titolo") +
    "\nDATA: " + new Date().toLocaleString("it-IT") + "\n\n" + testoEl.value;
  const blob = new Blob([contenuto], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = codice + "-lavoro-anonimo.txt";
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById("btn-copia-lavoro").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(antEl.textContent);
    alert("Testo copiato.");
  } catch { alert("Copia non riuscita."); }
});

aggiornaAnteprima();
