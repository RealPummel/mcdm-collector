import React, { useMemo, useState } from "react";

// ────────────────────────────────────────────────────────────
// Analytics / Auswertung fürs Dashboard
//
// WICHTIG für das Team:
// Alle Werte hier sind PLATZHALTER (Beispieldaten). Die echte Berechnung
// passiert im Backend.
//
// Diese Komponente kann auf ZWEI Arten mit Umfragen versorgt werden:
//
// 1) Echte Umfragen aus dem Dashboard: über die Prop `surveys`
//    (gleiche Liste wie im Dashboard). Beispiel:
//        <Analytics surveys={surveys} t={t} />
//    Erwartet pro Umfrage mindestens { id, name }.
//    Die Auswertungswerte pro Umfrage liefert spaeter das Backend –
//    dazu die Funktion `getResultsForSurvey` unten anpassen (z. B. fetch).
//
// 2) Ohne `surveys`: dann werden die Beispiel-Umfragen (SAMPLE_SURVEYS)
//    angezeigt, damit man das Dropdown und die Diagramme testen kann.
//
// Struktur der Auswertungsdaten pro Umfrage:
//   {
//     responses: number,             // Anzahl abgegebener Antworten
//     completionRate: number,        // 0..100
//     ranking: [{ name, score }],    // Ranking der Alternativen (score 0..100)
//     criteriaAvg: [{ name, value }],// O-Bewertung pro Kriterium (0..5)
//     weights: [{ name, value }],    // Gewichtung der Kriterien (Anteil, ~100)
//   }
// ────────────────────────────────────────────────────────────

const MAROON = "#7a003f";
const PIE_COLORS = ["#7a003f", "#a83267", "#c76b94", "#e0a6c0", "#5a002e", "#9c5072"];

// ╔══════════════════════════════════════════════════════════════════╗
// ║  >>> BEISPIELDATEN — START <<<                                      ║
// ║  ALLES bis "BEISPIELDATEN — ENDE" ist NUR ZUM TESTEN.              ║
// ║  Wenn echte Daten angebunden sind, diesen GANZEN Block löschen.   ║
// ║  (SAMPLE_SURVEYS, SAMPLE_RESULTS, EMPTY_RESULT)                     ║
// ╚══════════════════════════════════════════════════════════════════╝

// Beispiel-Umfragen (nur falls keine echten via Prop kommen)
const SAMPLE_SURVEYS = [
  { id: "s1", name: "Restaurant-Bewertung Maerz" },
  { id: "s2", name: "Software-Auswahl Team" },
  { id: "s3", name: "Lieferanten-Vergleich" },
];

// Beispiel-Auswertung je Umfrage (Platzhalter - kommt spaeter aus dem Backend)
const SAMPLE_RESULTS = {
  s1: {
    responses: 42,
    completionRate: 87,
    ranking: [
      { name: "Restaurant A", score: 82 },
      { name: "Restaurant B", score: 74 },
      { name: "Restaurant C", score: 61 },
      { name: "Restaurant D", score: 48 },
    ],
    criteriaAvg: [
      { name: "Essen", value: 4.3 },
      { name: "Service", value: 3.8 },
      { name: "Preis", value: 3.1 },
      { name: "Ambiente", value: 4.0 },
    ],
    weights: [
      { name: "Essen", value: 40 },
      { name: "Service", value: 25 },
      { name: "Preis", value: 20 },
      { name: "Ambiente", value: 15 },
    ],
  },
  s2: {
    responses: 18,
    completionRate: 72,
    ranking: [
      { name: "Tool X", score: 91 },
      { name: "Tool Y", score: 67 },
      { name: "Tool Z", score: 54 },
    ],
    criteriaAvg: [
      { name: "Funktionen", value: 4.6 },
      { name: "Preis", value: 2.9 },
      { name: "Support", value: 3.5 },
    ],
    weights: [
      { name: "Funktionen", value: 50 },
      { name: "Preis", value: 30 },
      { name: "Support", value: 20 },
    ],
  },
  s3: {
    responses: 7,
    completionRate: 58,
    ranking: [
      { name: "Lieferant 1", score: 70 },
      { name: "Lieferant 2", score: 65 },
    ],
    criteriaAvg: [
      { name: "Qualitaet", value: 4.1 },
      { name: "Lieferzeit", value: 3.3 },
    ],
    weights: [
      { name: "Qualitaet", value: 60 },
      { name: "Lieferzeit", value: 40 },
    ],
  },
};

// Leere Auswertung - falls eine echte Umfrage noch keine Backend-Daten hat
const EMPTY_RESULT = {
  responses: 0,
  completionRate: 0,
  ranking: [],
  criteriaAvg: [],
  weights: [],
};

// ╔══════════════════════════════════════════════════════════════════╗
// ║  >>> BEISPIELDATEN — ENDE <<<                                      ║
// ║  Hinweis: EMPTY_RESULT oben wird auch im Echtbetrieb gebraucht     ║
// ║  (als Rückfall, wenn eine Umfrage noch keine Ergebnisse hat).      ║
// ║  Nur SAMPLE_SURVEYS und SAMPLE_RESULTS sind reine Testdaten.       ║
// ╚══════════════════════════════════════════════════════════════════╝

function EmptyHint({ text }) {
  return (
    <p style={{ textAlign: "center", color: "#aaa", fontSize: 14, padding: "24px 0" }}>
      {text || "Keine Daten fuer diese Umfrage."}
    </p>
  );
}

// Selbstgebautes horizontales Balkendiagramm
function BarChart({ data, max, unit = "", color = MAROON, emptyText }) {
  if (!data.length) return <EmptyHint text={emptyText} />;
  const maxVal = max ?? Math.max(...data.map((d) => d.value ?? d.score), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((d) => {
        const val = d.value ?? d.score;
        const pct = Math.round((val / maxVal) * 100);
        return (
          <div key={d.name}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#444", marginBottom: 4 }}>
              <span>{d.name}</span>
              <span style={{ fontWeight: "bold", color }}>{val}{unit}</span>
            </div>
            <div style={{ background: "#f0ecf0", borderRadius: 6, height: 14, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.4s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Selbstgebautes Tortendiagramm (SVG)
function PieChart({ data, emptyText }) {
  if (!data.length) return <EmptyHint text={emptyText} />;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const radius = 80, cx = 100, cy = 100;

  const slices = data.map((d, i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 2 * Math.PI;
    const x1 = cx + radius * Math.sin(startAngle);
    const y1 = cy - radius * Math.cos(startAngle);
    const x2 = cx + radius * Math.sin(endAngle);
    const y2 = cy - radius * Math.cos(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { path, color: PIE_COLORS[i % PIE_COLORS.length], ...d };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        {slices.map((s) => (
          <path key={s.name} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2" />
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {slices.map((s) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: "inline-block" }} />
            <span>{s.name}</span>
            <span style={{ color: "#888" }}>{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tabelle
function DataTable({ data, valueLabel, unit = "", emptyText }) {
  if (!data.length) return <EmptyHint text={emptyText} />;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", fontSize: 13, color: "#666", padding: "8px 6px", borderBottom: "2px solid #eee" }}>Name</th>
          <th style={{ textAlign: "right", fontSize: 13, color: "#666", padding: "8px 6px", borderBottom: "2px solid #eee" }}>{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.name}>
            <td style={{ fontSize: 14, padding: "8px 6px", borderBottom: "1px solid #f3f3f3" }}>{d.name}</td>
            <td style={{ fontSize: 14, padding: "8px 6px", borderBottom: "1px solid #f3f3f3", textAlign: "right", fontWeight: "bold", color: MAROON }}>
              {(d.value ?? d.score)}{unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Analytics({ surveys, t = {} }) {
  // Umfrageliste: echte aus Prop, sonst Beispiel-Umfragen
  // >>> BEISPIELDATEN-VERWENDUNG 1 <<<
  // Beim Löschen der Beispieldaten: "SAMPLE_SURVEYS" hier durch [] ersetzen.
  const surveyList = (surveys && surveys.length > 0) ? surveys : SAMPLE_SURVEYS;

  // Texte mit Fallback (DE)
  const tx = {
    analyticsTitle: t.analyticsTitle || "Auswertung",
    analyticsSubtitle: t.analyticsSubtitle || "Ergebnisse der Umfrage ansehen und filtern.",
    selectSurvey: t.analyticsSelectSurvey || "Umfrage",
    metricRanking: t.metricRanking || "Ranking der Alternativen",
    metricCriteria: t.metricCriteria || "O-Bewertung pro Kriterium",
    metricWeights: t.metricWeights || "Gewichtung der Kriterien",
    chartBar: t.chartBar || "Balken",
    chartPie: t.chartPie || "Torte",
    chartTable: t.chartTable || "Tabelle",
    kpiResponses: t.kpiResponses || "Antworten",
    kpiCompletion: t.kpiCompletion || "Abschlussrate",
    kpiTop: t.kpiTop || "Top-Alternative",
    placeholderNote: t.placeholderNote || "Beispieldaten - werden spaeter durch echte Auswertung ersetzt.",
    noData: t.noDataForSurvey || "Keine Daten fuer diese Umfrage.",
  };

  const [surveyId, setSurveyId] = useState(surveyList[0]?.id);
  const [metric, setMetric] = useState("ranking");
  const [chartType, setChartType] = useState("bar");

  // >>> BEISPIELDATEN-VERWENDUNG 2 <<<
  // TEAM: Hier echte Backend-Werte laden (fetch / Supabase) statt SAMPLE_RESULTS.
  // Beim Löschen der Beispieldaten: "SAMPLE_RESULTS[id] ||" entfernen,
  // sodass nur noch der echte Aufruf bzw. EMPTY_RESULT übrig bleibt.
  const getResultsForSurvey = (id) => SAMPLE_RESULTS[id] || EMPTY_RESULT;
  const data = getResultsForSurvey(surveyId);

  const current = useMemo(() => {
    switch (metric) {
      case "criteria":
        return { rows: data.criteriaAvg, max: 5, unit: "", valueLabel: "O (0-5)" };
      case "weights":
        return { rows: data.weights, max: null, unit: "%", valueLabel: "Gewicht" };
      case "ranking":
      default:
        return { rows: data.ranking, max: 100, unit: "", valueLabel: "Score" };
    }
  }, [metric, data]);

  const topAlternative = data.ranking?.[0]?.name || "-";

  return (
    <div className="dash" style={{ paddingTop: 8 }}>
      <header className="dash-head">
        <div>
          <h1 className="dash-title">{tx.analyticsTitle}</h1>
          <p className="dash-sub">{tx.analyticsSubtitle}</p>
        </div>
      </header>

      {/* Umfrage-Auswahl (Dropdown) */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 4 }}>{tx.selectSurvey}</label>
        <select
          className="dash-status-select"
          style={{ width: "100%", maxWidth: 360, padding: "10px 12px", fontSize: 14 }}
          value={surveyId}
          onChange={(e) => setSurveyId(e.target.value)}
        >
          {surveyList.map((s) => (
            <option key={s.id} value={s.id}>{s.name || "Unbenannte Umfrage"}</option>
          ))}
        </select>
      </div>

      {/* Platzhalter-Hinweis */}
      <p style={{ fontSize: 12, color: "#993556", background: "#fbeef0", border: "0.5px solid #f0d6df", borderRadius: 8, padding: "8px 12px", marginBottom: 16 }}>
        {tx.placeholderNote}
      </p>

      {/* KPI-Zahlen */}
      <div className="dash-stats">
        <div className="dash-stat">
          <span className="dash-stat-num">{data.responses}</span>
          <span className="dash-stat-label">{tx.kpiResponses}</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-num">{data.completionRate}%</span>
          <span className="dash-stat-label">{tx.kpiCompletion}</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-num" style={{ fontSize: 20 }}>{topAlternative}</span>
          <span className="dash-stat-label">{tx.kpiTop}</span>
        </div>
      </div>

      {/* Auswahl: welche Auswertung + welcher Diagrammtyp */}
      <div className="dash-toolbar">
        <div className="dash-filters">
          {[
            { key: "ranking", label: tx.metricRanking },
            { key: "criteria", label: tx.metricCriteria },
            { key: "weights", label: tx.metricWeights },
          ].map((m) => (
            <button
              key={m.key}
              className={metric === m.key ? "dash-chip dash-chip-active" : "dash-chip"}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="dash-filters">
          {[
            { key: "bar", label: tx.chartBar },
            { key: "pie", label: tx.chartPie },
            { key: "table", label: tx.chartTable },
          ].map((c) => (
            <button
              key={c.key}
              className={chartType === c.key ? "dash-chip dash-chip-active" : "dash-chip"}
              onClick={() => setChartType(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Diagramm-Bereich */}
      <div className="admin-card" style={{ padding: 24 }}>
        {chartType === "bar" && (
          <BarChart data={current.rows} max={current.max} unit={current.unit} emptyText={tx.noData} />
        )}
        {chartType === "pie" && (
          <PieChart data={current.rows.map((d) => ({ name: d.name, value: d.value ?? d.score }))} emptyText={tx.noData} />
        )}
        {chartType === "table" && (
          <DataTable data={current.rows} valueLabel={current.valueLabel} unit={current.unit} emptyText={tx.noData} />
        )}
      </div>
    </div>
  );
}
