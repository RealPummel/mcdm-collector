import React, { useState } from "react";

// ── Default scale labels (English) ──
const defaultLabels = [
  { value: 1, text: "1 - Very good" },
  { value: 2, text: "2 - Good" },
  { value: 3, text: "3 - Ok" },
  { value: 4, text: "4 - Bad" },
  { value: 5, text: "5 - Very bad" },
];

// ── Preset color options for the survey ──
const colorOptions = [
  { label: "OVGU Purple", value: "#7a003f" },
  { label: "Blue", value: "#1a73e8" },
  { label: "Green", value: "#1e7e34" },
  { label: "Purple", value: "#6f42c1" },
  { label: "Orange", value: "#e67e00" },
];

// Main admin component - receives onSave and translation object t from App.js
export default function AdminPage({ onSave, t }) {

  // ── State variables ──
  const [questions, setQuestions] = useState([]);       // All created questions
  const [title, setTitle] = useState("");               // Current question title input
  const [rows, setRows] = useState([]);                 // Current list of rows
  const [rowInput, setRowInput] = useState("");         // Current row text input
  const [surveyName, setSurveyName] = useState("");     // Survey name
  const [labels, setLabels] = useState(defaultLabels); // Scale options
  const [showScaleEditor, setShowScaleEditor] = useState(false); // Toggle scale editor
  const [primaryColor, setPrimaryColor] = useState("#7a003f");   // Selected survey color
  const [errors, setErrors] = useState({});            // Validation error messages
  const [deleteConfirm, setDeleteConfirm] = useState(null);      // ID of question to delete
  const [editingId, setEditingId] = useState(null);    // ID of question being edited
  const [editTitle, setEditTitle] = useState("");       // Edited question title
  const [showPreview, setShowPreview] = useState(false); // Toggle preview section
  const [description, setDescription] = useState("");  // Survey description
  const [bgImage, setBgImage] = useState(null);        // Background image as base64

  // ── Row functions ──

  // Add a new row to the list
  const addRow = () => {
    if (!rowInput.trim()) return;
    setRows([...rows, rowInput.trim()]);
    setRowInput("");
  };

  // Remove a row by index
  const deleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  // ── Question functions ──

  // Validate and save a new question
  const addQuestion = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = t.errorTitle;
    if (rows.length === 0) newErrors.rows = t.errorRows;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setQuestions([...questions, { id: Date.now(), title, rows, labels: [...labels] }]);
    setTitle(""); setRows([]); setRowInput("");
  };

  // Show delete confirmation dialog
  const confirmDelete = (id) => setDeleteConfirm(id);

  // Delete confirmed question
  const deleteQuestion = () => {
    setQuestions(questions.filter(q => q.id !== deleteConfirm));
    setDeleteConfirm(null);
  };

  // Enter edit mode for a question
  const startEdit = (q) => { setEditingId(q.id); setEditTitle(q.title); };

  // Save edited question title
  const saveEdit = (id) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, title: editTitle } : q));
    setEditingId(null);
  };

  // Move a question up or down in the list
  const moveQuestion = (index, direction) => {
    const newQuestions = [...questions];
    const target = index + direction;
    if (target < 0 || target >= newQuestions.length) return;
    [newQuestions[index], newQuestions[target]] = [newQuestions[target], newQuestions[index]];
    setQuestions(newQuestions);
  };

  // ── Scale functions ──

  // Update text of a scale option
  const updateLabel = (index, newText) => {
    setLabels(labels.map((l, i) => i === index ? { ...l, text: newText } : l));
  };

  // Add a new scale option at the end
  const addScaleOption = () => {
    const nextValue = labels.length + 1;
    setLabels([...labels, { value: nextValue, text: `${nextValue} - ` }]);
  };

  // Remove a scale option (minimum 2 required)
  const removeScaleOption = (index) => {
    if (labels.length <= 2) return;
    setLabels(labels.filter((_, i) => i !== index).map((l, i) => ({ ...l, value: i + 1 })));
  };

  // Reset scale to default
  const resetLabels = () => setLabels(defaultLabels);

  // ── Image upload handler ──
  // Converts uploaded image to base64 and stores it in state
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Start survey validation ──
  // Validates required fields then sends data to App.js via onSave
  const handleStart = () => {
    const newErrors = {};
    if (!surveyName.trim()) newErrors.surveyName = t.errorName;
    if (questions.length === 0) newErrors.questions = t.errorQuestions;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onSave(questions, surveyName, primaryColor, description, bgImage);
  };

  return (
    <div className="admin-container">

      {/* ── Page title and subtitle ── */}
      <div className="admin-header">
        <h1>{t.adminTitle}</h1>
        <p>{t.adminSubtitle}</p>
      </div>

      {/* ── Survey name and description inputs ── */}
      <div className="admin-card">
        <h2>{t.surveyName}</h2>
        <input value={surveyName} onChange={e => { setSurveyName(e.target.value); setErrors(p => ({ ...p, surveyName: null })); }} placeholder={t.surveyNamePlaceholder} />
        {errors.surveyName && <p className="error-msg">{errors.surveyName}</p>}
        <label style={{ marginTop: 16 }}>{t.description} <span className="hint">{t.bgImageHint}</span></label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder={t.descriptionPlaceholder} />
      </div>

      {/* ── Color picker: preset colors + custom color input ── */}
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

        {/* Hidden file input triggered by custom button */}
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

        {/* Show preview if image selected, otherwise show placeholder text */}
        {bgImage ? (
          <div style={{ marginTop: 12, position: "relative" }}>
            <img src={bgImage} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 4 }} />
            <button onClick={() => setBgImage(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#aaa", marginTop: 8 }}>{t.noImage || "No image selected"}</p>
        )}
      </div>

      {/* ── Scale editor: view or edit scale options ── */}
      <div className="admin-card">
        <div className="scale-header">
          <h2>{t.scale} <span className="count">{labels.length}</span></h2>
          {/* Toggle between preview and edit mode */}
          <button className="toggle-btn" onClick={() => setShowScaleEditor(!showScaleEditor)}>
            {showScaleEditor ? t.scaleClose : t.scaleEdit}
          </button>
        </div>

        {/* Preview mode: show scale as pills */}
        {!showScaleEditor && (
          <div className="scale-preview">
            {labels.map(l => <span key={l.value} className="scale-tag">{l.text}</span>)}
          </div>
        )}

        {/* Edit mode: inputs to change each option */}
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

      {/* ── New question form ── */}
      <div className="admin-card">
        <h2>{t.newQuestion}</h2>

        {/* Question title input */}
        <label>{t.questionTitle}</label>
        <input value={title} onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: null })); }} placeholder={t.questionTitlePlaceholder} />
        {errors.title && <p className="error-msg">{errors.title}</p>}

        {/* Row input: press Enter or + to add */}
        <label>{t.rows}</label>
        <div className="row-input-group">
          <input value={rowInput} onChange={e => setRowInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addRow()} placeholder={t.rowsPlaceholder} />
          <button className="add-row-btn" onClick={addRow}>+</button>
        </div>
        {errors.rows && <p className="error-msg">{errors.rows}</p>}

        {/* List of added rows with delete button */}
        {rows.map((row, i) => (
          <div key={i} className="row-tag">
            <span>{row}</span>
            <button onClick={() => deleteRow(i)}>✕</button>
          </div>
        ))}

        {/* Save question button */}
        <button className="admin-btn" onClick={addQuestion}>{t.addQuestion}</button>
      </div>

      {/* ── List of all created questions ── */}
      {questions.length > 0 && (
        <div className="admin-card">
          <h2>{t.questionList} <span className="count">{questions.length}</span></h2>
          {errors.questions && <p className="error-msg">{errors.questions}</p>}
          {questions.map((q, i) => (
            <div key={q.id} className="question-item">

              {/* Move up/down arrows */}
              <div className="move-btns">
                <button onClick={() => moveQuestion(i, -1)} disabled={i === 0}>▲</button>
                <button onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1}>▼</button>
              </div>

              <div className="question-item-info">
                {/* Edit mode: show input, otherwise show title */}
                {editingId === q.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ padding: "4px 8px", fontSize: 14 }} />
                    <button className="toggle-btn" onClick={() => saveEdit(q.id)}>✓</button>
                  </div>
                ) : (
                  <strong>{i + 1}. {q.title}</strong>
                )}
                {/* Row preview e.g. "KFC · Peter Pan · Sakura" */}
                <span className="rows-preview">{q.rows.join(" · ")}</span>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                {/* Edit and delete buttons */}
                <button className="delete-btn" onClick={() => startEdit(q)}>✏️</button>
                <button className="delete-btn" onClick={() => confirmDelete(q.id)}>{t.delete}</button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ── Delete confirmation dialog ── */}
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

      {/* ── Preview and Start buttons ── */}
      {questions.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {/* Toggle preview section */}
          <button className="preview-btn" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? t.hidePreview : t.showPreview}
          </button>
          {/* Start survey - sends all data to App.js */}
          <button className="start-btn" style={{ background: primaryColor }} onClick={handleStart}>
            {t.startSurvey}
          </button>
        </div>
      )}

      {/* ── Preview section: read-only matrix view ── */}
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
                          {/* Disabled radio buttons for preview only */}
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
