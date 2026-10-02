// Anonimizza: tutto nel browser
const testoEl = document.getElementById("testo");
const nomiEl = document.getElementById("nomi");
const outEl = document.getElementById("risultato");
const contEl = document.getElementById("contatore");
const statoEl = document.getElementById("stato-file");
const pdfFrame = document.getElementById("anteprima-pdf");
let pdfUrl = null;

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

async function leggiPdf(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let pagine = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const pag = await pdf.getPage(n);
    const tc = await pag.getTextContent();
    const riga = tc.items.map((it) => it.str).join(" ");
    pagine.push(riga);
  }
  return pagine.join("\n\n");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Rilevamento automatico nomi italiani (tutto locale, nessuna rete)
const NOMI_COMUNI = ["alessandro","alessia","alessio","alice","ambra","andrea","angela","angelo","anna","antonio","aurora","aurora","beatrice","bianca","camilla","carlo","carlotta","chiara","christian","claudia","cristian","daniele","davide","diego","domenico","edoardo","elena","elisa","elisa","emma","fabio","federica","federico","filippo","flavio","francesca","francesco","gabriele","gaia","giacomo","giada","gioele","giorgia","giovanni","giulia","giuseppe","greta","ilaria","irene","leonardo","letizia","lorenzo","luca","lucia","luigi","manuele","marco","maria","mario","martina","matteo","mattia","michele","miriam","monica","nicola","nicole","noemi","paola","paolo","pietro","riccardo","roberta","roberto","rosa","salvatore","sara","serena","silvia","simone","sofia","stefano","stefania","tommaso","valentina","valeria","vanessa","veronica","vincenzo","vittoria","alberto","alfonso","alfredo","arianna","benedetta","bruno","cesare","clarissa","corrado","costanza","dario","denise","eleonora","emanuele","enrico","ettore","fabrizio","fausto","ferdinando","flora","franco","ginevra","giorgio","giulio","ilaria","ivo","jasmine","karim","lara","ludovica","maira","marcello","marta","massimo","maurizio","nadia","omar","ornella","raffaele","raffaella","renato","sabrina","samuele","susanna","tiziana","umberto","viviana","walter","zaira"];
const NOMI_SET = new Set(NOMI_COMUNI);
const PAROLE_ESCLUSE = new Set(["scuola","classe","istituto","liceo","media","elementare","professore","professoressa","prof","tema","compito","verifica","interrogazione","capitolo","pagina","esercizio","esercizi","registro","classroom","kit","didattica","metodologia","studente","studentessa","docente","preside","segreteria","ministero","istruzione","google","modulo","lunedi","martedi","mercoledi","giovedi","venerdi","sabato","domenica","gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre","italia","italiano","italiana","europa","natale","pasqua"]);

function normalizza(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function trovaNomiAutomatici(testo) {
  const trovati = [];
  const visti = new Set();
  // Sequenze di 2-3 parole con iniziale maiuscola: "Mario Rossi", "Anna Maria Bianchi"
  const re = /([A-ZÀÈÉÌÒÙ][a-zàèéìòù'’]{2,}(?:\s+[A-ZÀÈÉÌÒÙ][a-zàèéìòù'’]{2,}){1,2})/g;
  // Sequenze TUTTO MAIUSCOLO: "ROSSI MARIO"
  const reCaps = /\b([A-ZÀÈÉÌÒÙ]{3,}(?:\s+[A-ZÀÈÉÌÒÙ]{3,}){1,2})\b/g;
  const candidati = [];
  let m;
  while ((m = re.exec(testo)) !== null) candidati.push(m[1]);
  while ((m = reCaps.exec(testo)) !== null) {
    const titolo = m[1].toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    candidati.push(titolo);
  }
  for (const c of candidati) {
    const parti = c.split(/\s+/);
    const norm = parti.map(normalizza);
    // scarta se contiene parole escluse
    if (norm.some((p) => PAROLE_ESCLUSE.has(p))) continue;
    // tieni se almeno una parola è un nome comune italiano
    const haNome = norm.some((p) => NOMI_SET.has(p));
    if (!haNome) continue;
    const chiave = norm.join(" ");
    if (visti.has(chiave)) continue;
    visti.add(chiave);
    trovati.push(parti.join(" "));
  }
  // Aggiungi anche i nomi singoli che ricorrono da soli (es. solo "Mario" dopo "Mario Rossi")
  const nomiSingoli = new Set();
  trovati.forEach((n) => n.split(/\s+/).forEach((p) => {
    if (NOMI_SET.has(normalizza(p))) nomiSingoli.add(p);
  }));
  const singoli = [...nomiSingoli].filter((s) => !visti.has(normalizza(s)));
  return { completi: trovati, singoli };
}

function anonimizzaTesto(testo, nomi, hideEmail, hidePhone) {
  let out = testo;
  nomi.forEach((n) => {
    const nome = n.trim();
    if (nome.length < 2) return;
    const re = new RegExp(escapeRegExp(nome), "gi");
    out = out.replace(re, "███");
  });
  if (hideEmail) {
    out = out.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email rimossa]");
  }
  if (hidePhone) {
    out = out.replace(/(\+39\s?)?0?\d[\d\s./-]{6,}\d/g, "[telefono rimosso]");
  }
  return out;
}

document.getElementById("file-input").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);

  // Anteprima PDF nel browser
  if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  if (isPdf) {
    pdfUrl = URL.createObjectURL(f);
    pdfFrame.src = pdfUrl;
    pdfFrame.style.display = "block";
  } else {
    pdfFrame.style.display = "none";
    pdfFrame.removeAttribute("src");
  }

  if (!isPdf) {
    const r = new FileReader();
    r.onload = () => { testoEl.value = String(r.result || ""); };
    r.readAsText(f);
    if (statoEl) statoEl.textContent = "File testo caricato: " + f.name;
    return;
  }

  // PDF: estrai il testo con PDF.js
  if (!window.pdfjsLib) {
    if (statoEl) statoEl.textContent = "PDF aperto in anteprima qui sotto, ma senza internet non posso estrarre il testo: copialo a mano nel riquadro.";
    return;
  }
  try {
    if (statoEl) statoEl.textContent = "Lettura PDF in corso...";
    const testo = await leggiPdf(f);
    if (testo.trim()) {
      testoEl.value = testo;
      if (statoEl) statoEl.textContent = "PDF letto: testo inserito nel riquadro (controlla che sia completo).";
    } else {
      if (statoEl) statoEl.textContent = "PDF senza testo selezionabile (probabile scansione/foto): copia il testo a mano nel riquadro.";
    }
  } catch (err) {
    if (statoEl) statoEl.textContent = "Impossibile leggere il PDF: apri l'anteprima qui sotto e copia il testo a mano.";
  }
});

function eseguiAnonimizzazione() {
  const nomi = nomiEl.value.split(",").map((s) => s.trim()).filter(Boolean);
  const res = anonimizzaTesto(
    testoEl.value,
    nomi,
    document.getElementById("opt-email").checked,
    document.getElementById("opt-telefoni").checked
  );
  outEl.textContent = res || "(testo vuoto)";
  const parole = (res.trim().match(/\S+/g) || []).length;
  contEl.textContent = "Parole: " + parole + " · Caratteri: " + res.length;
}

document.getElementById("btn-anonimizza").addEventListener("click", eseguiAnonimizzazione);

const nomiAutoEl = document.getElementById("nomi-auto");

document.getElementById("btn-trova-nomi").addEventListener("click", () => {
  const t = testoEl.value;
  if (!t.trim()) {
    if (nomiAutoEl) nomiAutoEl.textContent = "Prima carica un file o incolla il testo.";
    return;
  }
  const r = trovaNomiAutomatici(t);
  const tutti = [...r.completi, ...r.singoli];
  if (!tutti.length) {
    if (nomiAutoEl) nomiAutoEl.textContent = "Nessun nome trovato in automatico: controlla il testo o aggiungilo a mano.";
    return;
  }
  nomiEl.value = tutti.join(", ");
  if (nomiAutoEl) nomiAutoEl.textContent = "Trovati " + tutti.length + " nomi: " + tutti.join(", ");
});

document.getElementById("btn-auto-anonimizza").addEventListener("click", () => {
  const t = testoEl.value;
  if (!t.trim()) {
    if (nomiAutoEl) nomiAutoEl.textContent = "Prima carica un file o incolla il testo.";
    return;
  }
  const r = trovaNomiAutomatici(t);
  const tutti = [...r.completi, ...r.singoli];
  nomiEl.value = tutti.join(", ");
  if (nomiAutoEl) {
    nomiAutoEl.textContent = tutti.length
      ? "Rilevati e oscurati " + tutti.length + " nomi: " + tutti.join(", ")
      : "Nessun nome rilevato: oscurate comunque email e telefoni, se presenti.";
  }
  eseguiAnonimizzazione();
});

document.getElementById("btn-copia").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(outEl.textContent);
    alert("Testo anonimo copiato.");
  } catch { alert("Copia non riuscita, seleziona il testo manualmente."); }
});

document.getElementById("btn-scarica").addEventListener("click", () => {
  const blob = new Blob([outEl.textContent], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "documento-anonimo.txt";
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById("btn-pulisci").addEventListener("click", () => {
  testoEl.value = ""; nomiEl.value = "";
  document.getElementById("file-input").value = "";
  if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  pdfUrl = null;
  pdfFrame.style.display = "none";
  pdfFrame.removeAttribute("src");
  if (statoEl) statoEl.textContent = "";
  outEl.textContent = "Qui vedrai il testo anonimizzato...";
  contEl.textContent = "";
});
