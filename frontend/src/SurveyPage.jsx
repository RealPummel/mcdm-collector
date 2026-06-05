import React, { useState } from "react";

// Main survey component - receives all config and translation object t from App.js
export default function SurveyPage({ questions, surveyName, primaryColor, description, bgImage, onBack, t }) {

  // ── State variables ──
  const [answers, setAnswers] = useState({});        // Stores all user answers: { questionId: { rowName: value } }
  const [submitted, setSubmitted] = useState(false); // Tracks if survey has been submitted
  const [currentIndex, setCurrentIndex] = useState(0); // Which question is currently shown

  // ── Save selected radio button value ──
  // Called when user clicks a radio button
  const handleSelect = (questionId, row, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [row]: value },
    }));
  };

  // ── Submit handler ──
  // Later: replace console.log with Supabase API call
  const handleSubmit = () => {
    console.log(answers);
    setSubmitted(true);
  };

  // Current question being displayed
  const currentQuestion = questions[currentIndex];

  // Progress percentage e.g. question 2 of 4 = 50%
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  // ── Thank you page - shown after submit ──
  if (submitted) {
    return (
      <div className="survey-container">
        <div className="survey-header" style={{ borderTopColor: primaryColor, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 16, color: primaryColor }}>✓</div>
          <h1 style={{ color: primaryColor }}>{t.thankyou}</h1>
          <p style={{ color: "#666", marginTop: 8, fontSize: 15 }}>{t.saved}</p>
        </div>
      </div>
    );
  }

  return (
    // ── If background image set, apply it to the whole container ──
    <div
      className="survey-container"
      style={bgImage ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        padding: "20px",
        maxWidth: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      } : {}}
    >

      {/* ── Back button to return to admin ── */}
      <button onClick={onBack} style={{ background: "none", border: "none", color: primaryColor, cursor: "pointer", marginBottom: 8, fontSize: 14 }}>
        {t.back}
      </button>

      {/* ── Survey header with title and description ── */}
      <div className="survey-header" style={{ borderTopColor: primaryColor }}>
        <h1 style={{ color: primaryColor }}>{surveyName || "Survey"}</h1>
        {description && <p style={{ color: "#666", margin: "8px 0 0", fontSize: 14 }}>{description}</p>}
      </div>

      {/* ── Progress bar showing current question number and percentage ── */}
      <div className="progress-container">
        <div className="progress-info">
          <span>Question {currentIndex + 1} {t.questionOf} {questions.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: primaryColor }} />
        </div>
      </div>

      {/* ── Current question card with matrix table ── */}
      <div className="question-card">

        {/* Question title */}
        <h2>{currentQuestion.title}</h2>

        {/* Legend: shows scale labels e.g. "1 = Very good | 2 = Good ..." */}
        <p className="legend">
          {currentQuestion.labels
            ? currentQuestion.labels.map(l => l.text).join(" | ")
            : t.legendDefault}
        </p>

        {/* Matrix table */}
        <table>
          <thead>
            <tr>
              <th></th>
              {/* Column headers: scale values e.g. 1, 2, 3, 4, 5 */}
              {(currentQuestion.labels || [1,2,3,4,5].map(n => ({ value: n }))).map(l => (
                <th key={l.value}>{l.value}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* One row per item e.g. "KFC", "Peter Pan" */}
            {currentQuestion.rows.map(row => (
              <tr key={row}>
                {/* Row label */}
                <td>{row}</td>
                {/* Radio buttons for each scale value */}
                {(currentQuestion.labels || [1,2,3,4,5].map(n => ({ value: n }))).map(l => (
                  <td key={l.value}>
                    <input
                      type="radio"
                      name={`${currentQuestion.id}-${row}`}
                      value={l.value}
                      checked={answers[currentQuestion.id]?.[row] === l.value}
                      onChange={() => handleSelect(currentQuestion.id, row, l.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Navigation buttons: back and next/submit ── */}
      <div className="nav-buttons">

        {/* Back button - hidden on first question */}
        {currentIndex > 0 && (
          <button className="nav-btn-back" onClick={() => setCurrentIndex(currentIndex - 1)}>
            ← {t.questionOf === "von" ? "Zurück" : "Back"}
          </button>
        )}

        {/* Next button on all questions except last, Submit on last question */}
        {currentIndex < questions.length - 1 ? (
          <button className="submit-btn" style={{ background: primaryColor }} onClick={() => setCurrentIndex(currentIndex + 1)}>
            {t.next}
          </button>
        ) : (
          <button className="submit-btn" style={{ background: primaryColor }} onClick={handleSubmit}>
            {t.submit}
          </button>
        )}

      </div>

    </div>
  );
}
