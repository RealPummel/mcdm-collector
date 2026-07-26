import React, { useMemo, useState, useEffect } from "react";

// ────────────────────────────────────────────────────────────
// Analytics / Auswertung fürs Dashboard
//
// ECHTE DATEN vom FastAPI Backend!
// Endpoints:
//   - GET /projects/{project_id}/ → responses
//   - GET /projects/{project_id}/weighted_sum → ranking scores
//   - GET /projects/{project_id}/alternatives/score/avg → Alternative Score Average
//   - GET /projects/{project_id}/weights/avg → weights
//   - GET /projects/{project_id}/score_range → score ranges
// ────────────────────────────────────────────────────────────

const MAROON = "#7a003f";
const PIE_COLORS = [
  "#7a003f",
  "#a83267",
  "#c76b94",
  "#e0a6c0",
  "#5a002e",
  "#9c5072",
];
const API_BASE_URL = "http://localhost:8000";

// Leere Auswertung - Fallback wenn noch keine Daten vorhanden
const EMPTY_RESULT = {
  responses: 0,
  completionRate: 0,
  ranking: [],
  criteriaAvg: [],
  weights: [],
};

function EmptyHint({ text }) {
  return (
    <p
      style={{
        textAlign: "center",
        color: "#aaa",
        fontSize: 14,
        padding: "24px 0",
      }}
    >
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#444",
                marginBottom: 4,
              }}
            >
              <span>{d.name}</span>
              <span style={{ fontWeight: "bold", color }}>
                {val}
                {unit}
              </span>
            </div>
            <div
              style={{
                background: "#f0ecf0",
                borderRadius: 6,
                height: 14,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: color,
                  borderRadius: 6,
                  transition: "width 0.4s ease",
                }}
              />
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
  const radius = 80,
    cx = 100,
    cy = 100;

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <svg width="200" height="200" viewBox="0 0 200 200">
        {slices.map((s) => (
          <path
            key={s.name}
            d={s.path}
            fill={s.color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {slices.map((s) => (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: s.color,
                display: "inline-block",
              }}
            />
            <span>{s.name}</span>
            <span style={{ color: "#888" }}>
              {Math.round((s.value / total) * 100)}%
            </span>
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
          <th
            style={{
              textAlign: "left",
              fontSize: 13,
              color: "#666",
              padding: "8px 6px",
              borderBottom: "2px solid #eee",
            }}
          >
            Name
          </th>
          <th
            style={{
              textAlign: "right",
              fontSize: 13,
              color: "#666",
              padding: "8px 6px",
              borderBottom: "2px solid #eee",
            }}
          >
            {valueLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.name}>
            <td
              style={{
                fontSize: 14,
                padding: "8px 6px",
                borderBottom: "1px solid #f3f3f3",
              }}
            >
              {d.name}
            </td>
            <td
              style={{
                fontSize: 14,
                padding: "8px 6px",
                borderBottom: "1px solid #f3f3f3",
                textAlign: "right",
                fontWeight: "bold",
                color: MAROON,
              }}
            >
              {d.value ?? d.score}
              {unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Loading-Spinner
function LoadingSpinner() {
  return (
    <div style={{ textAlign: "center", padding: "24px", color: "#999" }}>
      <p>Daten werden geladen...</p>
    </div>
  );
}

// Error-Meldung
function ErrorMessage({ message }) {
  return (
    <div
      style={{
        background: "#fee",
        border: "1px solid #fcc",
        borderRadius: 8,
        padding: "12px 16px",
        color: "#c33",
        fontSize: 13,
      }}
    >
      ❌ Fehler beim Laden der Daten: {message}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  Funktion um Daten vom Backend zu laden                          ║
// ╚══════════════════════════════════════════════════════════════════╝

async function fetchProjectResults(projectId) {
  try {
    // Parallel alle 5 API-Calls machen
    const [
      responsesData,
      weightedSumData,
      scoresAvgData,
      weightsAvgData,
      scoreRangeData,
      alternativeNames,
      criterionNames,
    ] = await Promise.all([
      fetch(`${API_BASE_URL}/projects/${projectId}`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/projects/${projectId}/weighted_sum`).then((r) =>
        r.json(),
      ),
      fetch(
        `${API_BASE_URL}/projects/${projectId}/alternatives/score/avg`,
      ).then((r) => r.json()),
      fetch(`${API_BASE_URL}/projects/${projectId}/weights/avg`).then((r) =>
        r.json(),
      ),
      fetch(`${API_BASE_URL}/projects/${projectId}/score_range`).then((r) =>
        r.json(),
      ),
      fetch(`${API_BASE_URL}/projects/${projectId}/alternatives`).then((r) =>
        r.json(),
      ),
      fetch(`${API_BASE_URL}/projects/${projectId}/criteria`).then((r) =>
        r.json(),
      ),
    ]);

    // Responses zählen
    const responses = responsesData?.user_scores?.length || 0;

    // Berechne Abschlussrate (Beispiel: basierend auf Responses)
    const completionRate =
      responses > 0
        ? Math.round((responses / Math.max(responses, 1)) * 100)
        : 0;

    const scoresByAlternative = {};

    Object.entries(weightedSumData?.weighted_sums || {}).forEach(
      ([dmId, alternatives]) => {
        Object.entries(alternatives).forEach(([altId, score]) => {
          if (!scoresByAlternative[altId]) {
            scoresByAlternative[altId] = [];
          }
          scoresByAlternative[altId].push(score);
        });
      },
    );

    // Ranking aus weighted_sum transformieren
    const ranking = Object.entries(scoresByAlternative)
      .map(([altId, scores]) => ({
        alternative_id: altId,
        name: alternativeNames?.[altId] || `Alternative ${altId}`,
        score: Math.round(
          scores.reduce((sum, s) => sum + s, 0) / scores.length,
        ),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Criteria Average aus scores_avg transformieren
    const criteriaAvg = Object.entries(
      scoresAvgData?.alternative_score_avg || {},
    )
      .map(([altId, value]) => ({
        name: alternativeNames?.[altId] || `Alternative ${altId}`,
        value: Math.round(value * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value);

    // Weights aus weights_avg transformieren
    const weightsTotal =
      Object.values(weightsAvgData?.weight_avg || {}).reduce(
        (sum, val) => sum + val,
        0,
      ) || 1;

    const weights = Object.entries(weightsAvgData?.weight_avg || {})
      .map(([critId, value]) => ({
        name: criterionNames?.[critId] || `Kriterium ${critId}`,
        value: Math.round((value / weightsTotal) * 100),
      }))
      .sort((a, b) => b.value - a.value);

    return {
      responses,
      completionRate,
      ranking,
      criteriaAvg,
      weights,
      scoreRange: scoreRangeData, // Falls du das auch brauchst
    };
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  Hauptkomponente                                                  ║
// ╚══════════════════════════════════════════════════════════════════╝

export default function Analytics({ surveys, t = {} }) {
  const surveyList = surveys && surveys.length > 0 ? surveys : [];

  // Texte mit Fallback (DE)
  const tx = {
    analyticsTitle: t.analyticsTitle || "Auswertung",
    analyticsSubtitle:
      t.analyticsSubtitle || "Ergebnisse der Umfrage ansehen und filtern.",
    selectSurvey: t.analyticsSelectSurvey || "Umfrage",
    metricRanking: t.metricRanking || "Ranking der Alternativen",
    metricCriteria: t.metricCriteria || "Ø-Bewertung Alternativen",
    metricWeights: t.metricWeights || "Gewichtung der Kriterien",
    chartBar: t.chartBar || "Balken",
    chartPie: t.chartPie || "Torte",
    chartTable: t.chartTable || "Tabelle",
    kpiResponses: t.kpiResponses || "Antworten",
    kpiCompletion: t.kpiCompletion || "Abschlussrate",
    kpiTop: t.kpiTop || "Top-Alternative",
    noData: t.noDataForSurvey || "Keine Daten fuer diese Umfrage.",
  };

  const [surveyId, setSurveyId] = useState(surveyList[0]?.id);
  const [metric, setMetric] = useState("ranking");
  const [chartType, setChartType] = useState("bar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(EMPTY_RESULT);

  // Lade Daten wenn surveyId sich ändert
  useEffect(() => {
    if (!surveyId) return;

    setLoading(true);
    setError(null);

    fetchProjectResults(surveyId)
      .then((results) => {
        setData(results);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Fehler beim Laden der Daten");
        setData(EMPTY_RESULT);
        setLoading(false);
      });
  }, [surveyId]);

  const current = useMemo(() => {
    switch (metric) {
      case "criteria":
        return {
          rows: data.criteriaAvg,
          max: 5,
          unit: "",
          valueLabel: "Ø (0-5)",
        };
      case "weights":
        return {
          rows: data.weights,
          max: null,
          unit: "%",
          valueLabel: "Gewicht",
        };
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
      {surveyList.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              color: "#666",
              marginBottom: 4,
            }}
          >
            {tx.selectSurvey}
          </label>
          <select
            className="dash-status-select"
            style={{
              width: "100%",
              maxWidth: 360,
              padding: "10px 12px",
              fontSize: 14,
            }}
            value={surveyId || ""}
            onChange={(e) => setSurveyId(e.target.value)}
          >
            {surveyList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || "Unbenannte Umfrage"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error-Meldung */}
      {error && (
        <div style={{ marginBottom: 16 }}>
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Loading-State */}
      {loading && <LoadingSpinner />}

      {/* Nur anzeigen wenn keine Loading */}
      {!loading && (
        <>
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
              <span className="dash-stat-num" style={{ fontSize: 20 }}>
                {topAlternative}
              </span>
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
                  className={
                    metric === m.key
                      ? "dash-chip dash-chip-active"
                      : "dash-chip"
                  }
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
                  className={
                    chartType === c.key
                      ? "dash-chip dash-chip-active"
                      : "dash-chip"
                  }
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
              <BarChart
                data={current.rows}
                max={current.max}
                unit={current.unit}
                emptyText={tx.noData}
              />
            )}
            {chartType === "pie" && (
              <PieChart
                data={current.rows.map((d) => ({
                  name: d.name,
                  value: d.value ?? d.score,
                }))}
                emptyText={tx.noData}
              />
            )}
            {chartType === "table" && (
              <DataTable
                data={current.rows}
                valueLabel={current.valueLabel}
                unit={current.unit}
                emptyText={tx.noData}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
