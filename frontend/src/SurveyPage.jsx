import React, { useState } from "react";

export default function SurveyPage({ questions, surveyName, primaryColor, description, bgImage, onBack, t }) {

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSelect = (questionId, row, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [row]: value },
    }));
  };

  const handleSubmit = () => {
    console.log(answers);
    setSubmitted(true);
  };

  const currentQuestion = questions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

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

      <button onClick={onBack} style={{ background: "none", border: "none", color: primaryColor, cursor: "pointer", marginBottom: 8, fontSize: 14 }}>
        {t.back}
      </button>

      <div className="survey-header" style={{ borderTopColor: primaryColor }}>
        <h1 style={{ color: primaryColor }}>{surveyName || "Survey"}</h1>
        {description && <p style={{ color: "#666", margin: "8px 0 0", fontSize: 14 }}>{description}</p>}
      </div>

      <div className="progress-container">
        <div className="progress-info">
          <span>Question {currentIndex + 1} {t.questionOf} {questions.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: primaryColor }} />
        </div>
      </div>

      <div className="question-card">
        <h2>{currentQuestion.title}</h2>
        <p className="legend">
          {currentQuestion.labels
            ? currentQuestion.labels.map(l => l.text).join(" | ")
            : t.legendDefault}
        </p>
        <table>
          <thead>
            <tr>
              <th></th>
              {(currentQuestion.labels || [1,2,3,4,5].map(n => ({ value: n }))).map(l => (
                <th key={l.value}>{l.value}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentQuestion.rows.map(row => (
              <tr key={row}>
                <td>{row}</td>
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

      <div className="nav-buttons">
        {currentIndex > 0 && (
          <button className="nav-btn-back" onClick={() => setCurrentIndex(currentIndex - 1)}>
            ← {t.questionOf === "von" ? "Zurück" : "Back"}
          </button>
        )}
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
