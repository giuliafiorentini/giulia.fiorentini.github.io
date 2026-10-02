// Suggerimenti anonimi: solo memoria locale di questo PC
const KEY = "kit-classe-suggerimenti";
const txtEl = document.getElementById("suggerimento");
const catEl = document.getElementById("categoria");
const listaEl = document.getElementById("lista");

function leggi() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
function mostra() {
  const arr = leggi();
  if (!arr.length) { listaEl.textContent = "Nessun suggerimento salvato."; return; }
  listaEl.textContent = arr.map((o, i) =>
    (i + 1) + ". [" + o.cat + " · " + o.data + "]\n" + o.testo
  ).join("\n\n");
}

document.getElementById("btn-salva").addEventListener("click", () => {
  const t = txtEl.value.trim();
  if (t.length < 3) { alert("Scrivi almeno qualche parola."); return; }
  const arr = leggi();
  arr.push({ cat: catEl.value, testo: t, data: new Date().toLocaleString("it-IT") });
  localStorage.setItem(KEY, JSON.stringify(arr));
  txtEl.value = "";
  mostra();
  alert("Suggerimento salvato in forma anonima su questo dispositivo.");
});

document.getElementById("btn-copia-sugg").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(txtEl.value); alert("Testo copiato."); }
  catch { alert("Copia non riuscita."); }
});

document.getElementById("btn-cancella").addEventListener("click", () => {
  if (confirm("Cancellare tutti i suggerimenti salvati su questo PC?")) {
    localStorage.removeItem(KEY);
    mostra();
  }
});

mostra();
