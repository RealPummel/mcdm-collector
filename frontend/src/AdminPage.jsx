import React, { useState, useEffect } from "react";

// Default answer scale, pre-filled in the admin's current language. Once the
// admin edits a label, their text is kept (it's survey content, not UI chrome).
const defaultLabelsEN = [
  { value: 1, text: "1 - Very good" },
  { value: 2, text: "2 - Good" },
  { value: 3, text: "3 - Ok" },
  { value: 4, text: "4 - Bad" },
  { value: 5, text: "5 - Very bad" },
];

const defaultLabelsDE = [
  { value: 1, text: "1 - Sehr gut" },
  { value: 2, text: "2 - Gut" },
  { value: 3, text: "3 - Okay" },
  { value: 4, text: "4 - Schlecht" },
  { value: 5, text: "5 - Sehr schlecht" },
];

const colorOptions = [
  { label: "OVGU Purple", value: "#7a003f" },
  { label: "Blue", value: "#1a73e8" },
  { label: "Green", value: "#1e7e34" },
  { label: "Purple", value: "#6f42c1" },
  { label: "Orange", value: "#e67e00" },
];

export default function AdminPage({ onSave, t }) {
  // Detect language from an existing key (t.rows is "Zeilen" in German), so the
  // scale and the new labels stay correct even before translations.js is updated.
  const isGerman = t.rows === "Zeilen";
  const defaultLabels = isGerman ? defaultLabelsDE : defaultLabelsEN;

  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState([]);
  const [rowInput, setRowInput] = useState("");
  const [surveyName, setSurveyName] = useState("");
  const [labels, setLabels] = useState(defaultLabels);
  const [showScaleEditor, setShowScaleEditor] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#7a003f");
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [description, setDescription] = useState("");
  const [bgImage, setBgImage] = useState(null);

  const addRow = () => {
    if (!rowInput.trim()) return;
    setRows([...rows, rowInput.trim()]);
    setRowInput("");
  };

  const deleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  // Clear the carried-over rows when the next question needs a different list.
  const clearRows = () => {
    setRows([]);
    setRowInput("");
  };

  const addQuestion = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = t.errorTitle;
    if (rows.length === 0) newErrors.rows = t.errorRows;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    // Store a copy of rows so each question keeps its own list…
    setQuestions([...questions, { id: Date.now(), title, rows: [...rows], labels: [...labels] }]);
    // …and keep `rows` as-is so the next question inherits them. Only the
    // title is cleared. Use "Clear rows" to start a fresh list.
    setTitle("");
    setRowInput("");
  };

  const confirmDelete = (id) => setDeleteConfirm(id);

  const deleteQuestion = () => {
    setQuestions(questions.filter(q => q.id !== deleteConfirm));
    setDeleteConfirm(null);
  };

  const startEdit = (q) => { setEditingId(q.id); setEditTitle(q.title); };

  const saveEdit = (id) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, title: editTitle } : q));
    setEditingId(null);
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...questions];
    const target = index + direction;
    if (target < 0 || target >= newQuestions.length) return;
    [newQuestions[index], newQuestions[target]] = [newQuestions[target], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const updateLabel = (index, newText) => {
    setLabels(labels.map((l, i) => i === index ? { ...l, text: newText } : l));
  };

  const addScaleOption = () => {
    const nextValue = labels.length + 1;
    setLabels([...labels, { value: nextValue, text: `${nextValue} - ` }]);
  };

  const removeScaleOption = (index) => {
    if (labels.length <= 2) return;
    setLabels(labels.filter((_, i) => i !== index).map((l, i) => ({ ...l, value: i + 1 })));
  };

  const resetLabels = () => setLabels(defaultLabels);

  // If the admin switches language while the scale is still untouched (equal to
  // one of the default sets), swap it to the new language's default. A scale the
  // admin has customized is left alone.
  useEffect(() => {
    const matchesDefault = (a, b) =>
      a.length === b.length && a.every((l, i) => l.text === b[i].text);
    setLabels((prev) =>
      matchesDefault(prev, defaultLabelsEN) || matchesDefault(prev, defaultLabelsDE)
        ? defaultLabels
        : prev
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGerman]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const newErrors = {};
    if (!surveyName.trim()) newErrors.surveyName = t.errorName;
    if (questions.length === 0) newErrors.questions = t.errorQuestions;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    // Saves the survey and hands it back to App, which adds it to the
    // dashboard (as a draft) and returns to the overview.
    onSave(questions, surveyName, primaryColor, description, bgImage);
  };

  // Language-correct fallbacks for the few new strings — used only until the
  // matching keys live in translations.js.
  const clearRowsLabel = t.clearRows || (isGerman ? "Zeilen leeren" : "Clear rows");
  const rowsReusedLabel =
    t.rowsReused ||
    (isGerman
      ? "Diese Zeilen werden für die nächste Frage übernommen — du kannst sie anpassen."
      : "These rows carry over to the next question — you can adjust them.");
  const saveLabel = t.saveSurvey || (isGerman ? "Umfrage speichern" : "Save survey");

  return (
    <div className="admin-container">

      <div className="admin-header">
        <h1>{t.adminTitle}</h1>
        <p>{t.adminSubtitle}</p>
      </div>

      <div className="admin-card">
        <h2>{t.surveyName}</h2>
        <input value={surveyName} onChange={e => { setSurveyName(e.target.value); setErrors(p => ({ ...p, surveyName: null })); }} placeholder={t.surveyNamePlaceholder} />
        {errors.surveyName && <p className="error-msg">{errors.surveyName}</p>}
        <label style={{ marginTop: 16 }}>{t.description} <span className="hint">{t.bgImageHint}</span></label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder={t.descriptionPlaceholder} />
      </div>

      <div className="admin-card">
        <h2>{t.surveyColor}</h2>
        <div className="color-options">
          {colorOptions.map(c => (
            <button key={c.value} className={`color-btn ${primaryColor === c.value ? "color-btn-active" : ""}`} style={{ background: c.value }} onClick={() => setPrimaryColor(c.value)} title={c.label} />
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 13, color: "#666", margin: 0 }}>{t.ownColor}</label>
            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 40, height: 36, padding: 2, border: "1px solid #ddd", borderRadius: 4, cursor: "pointer" }} />
          </div>
        </div>
      </div>

      {/* ── Background image upload ── */}
      <div className="admin-card">
        <h2>{t.bgImage} <span className="hint">{t.bgImageHint}</span></h2>

        <label htmlFor="bg-upload" className="upload-btn">
          📁 {t.chooseImage || "Choose Image"}
        </label>
        <input
          id="bg-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />

        {bgImage ? (
          <div style={{ marginTop: 12, position: "relative" }}>
            <img src={bgImage} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 4 }} />
            <button
              onClick={() => setBgImage(null)}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#aaa", marginTop: 8 }}>
            {t.noImage || "No image selected"}
          </p>
        )}
      </div>

      <div className="admin-card">
        <div className="scale-header">
          <h2>{t.scale} <span className="count">{labels.length}</span></h2>
          <button className="toggle-btn" onClick={() => setShowScaleEditor(!showScaleEditor)}>
            {showScaleEditor ? t.scaleClose : t.scaleEdit}
          </button>
        </div>
        {!showScaleEditor && (
          <div className="scale-preview">
            {labels.map(l => <span key={l.value} className="scale-tag">{l.text}</span>)}
          </div>
        )}
        {showScaleEditor && (
          <div>
            {labels.map((l, i) => (
              <div key={i} className="row-input-group" style={{ marginBottom: 8 }}>
                <input value={l.text} onChange={e => updateLabel(i, e.target.value)} />
                <button className="delete-scale-btn" onClick={() => removeScaleOption(i)} disabled={labels.length <= 2}>✕</button>
              </div>
            ))}
            <div className="scale-actions">
              <button className="add-row-btn" onClick={addScaleOption}>{t.addOption}</button>
              <button className="reset-btn" onClick={resetLabels}>{t.scaleReset}</button>
            </div>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2>{t.newQuestion}</h2>
        <label>{t.questionTitle}</label>
        <input value={title} onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: null })); }} placeholder={t.questionTitlePlaceholder} />
        {errors.title && <p className="error-msg">{errors.title}</p>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <label style={{ margin: 0 }}>{t.rows}</label>
          {rows.length > 0 && (
            <button className="toggle-btn" style={{ padding: "4px 10px" }} onClick={clearRows}>
              {clearRowsLabel}
            </button>
          )}
        </div>
        <div className="row-input-group">
          <input value={rowInput} onChange={e => setRowInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addRow()} placeholder={t.rowsPlaceholder} />
          <button className="add-row-btn" onClick={addRow}>+</button>
        </div>
        {errors.rows && <p className="error-msg">{errors.rows}</p>}
        {rows.map((row, i) => (
          <div key={i} className="row-tag">
            <span>{row}</span>
            <button onClick={() => deleteRow(i)}>✕</button>
          </div>
        ))}
        {rows.length > 0 && (
          <p className="hint" style={{ marginTop: 8 }}>
            {rowsReusedLabel}
          </p>
        )}
        <button className="admin-btn" onClick={addQuestion}>{t.addQuestion}</button>
      </div>

      {questions.length > 0 && (
        <div className="admin-card">
          <h2>{t.questionList} <span className="count">{questions.length}</span></h2>
          {errors.questions && <p className="error-msg">{errors.questions}</p>}
          {questions.map((q, i) => (
            <div key={q.id} className="question-item">
              <div className="move-btns">
                <button onClick={() => moveQuestion(i, -1)} disabled={i === 0}>▲</button>
                <button onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1}>▼</button>
              </div>
              <div className="question-item-info">
                {editingId === q.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ padding: "4px 8px", fontSize: 14 }} />
                    <button className="toggle-btn" onClick={() => saveEdit(q.id)}>✓</button>
                  </div>
                ) : (
                  <strong>{i + 1}. {q.title}</strong>
                )}
                <span className="rows-preview">{q.rows.join(" · ")}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="delete-btn" onClick={() => startEdit(q)}>✏️</button>
                <button className="delete-btn" onClick={() => confirmDelete(q.id)}>{t.delete}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>{t.confirmDelete}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="delete-btn" onClick={() => setDeleteConfirm(null)}>{t.cancel}</button>
              <button className="admin-btn" onClick={deleteQuestion}>{t.yesDelete}</button>
            </div>
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="preview-btn" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? t.hidePreview : t.showPreview}
          </button>
          <button className="start-btn" style={{ background: primaryColor }} onClick={handleSave}>
            {saveLabel}
          </button>
        </div>
      )}

      {showPreview && (
        <div className="admin-card" style={{ marginTop: 12 }}>
          <h2>{t.preview}</h2>
          {questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom: 16, borderBottom: "1px solid #f0f0f0", paddingBottom: 16 }}>
              <strong style={{ color: primaryColor }}>{i + 1}. {q.title}</strong>
              <p style={{ fontSize: 12, color: "#888", margin: "4px 0 8px" }}>{q.labels.map(l => l.text).join(" | ")}</p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th></th>
                    {q.labels.map(l => <th key={l.value} style={{ fontSize: 13, color: "#666", padding: 6, textAlign: "center" }}>{l.value}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {q.rows.map(row => (
                    <tr key={row}>
                      <td style={{ fontSize: 13, padding: 6 }}>{row}</td>
                      {q.labels.map(l => (
                        <td key={l.value} style={{ textAlign: "center", padding: 6 }}>
                          <input type="radio" disabled style={{ accentColor: primaryColor }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
