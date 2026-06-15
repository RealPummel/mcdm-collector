import React, { useState } from "react";
import "./style.css";
import "./Dashboard.css";
import AdminPage from "./AdminPage";
import SurveyPage from "./SurveyPage";
import LoginPage from "./LoginPage";
import UsersPage from "./UsersPage";
import Dashboard from "./Dashboard";
import { translations } from "./translations";

// ── Language switcher outside of App to avoid hook issues ──
// DE first now, since German is the primary language.
function LangSwitcher({ lang, setLang }) {
  return (
    <div className="lang-switcher">
      <button
        className={lang === "de" ? "lang-btn lang-btn-active" : "lang-btn"}
        onClick={() => setLang("de")}
      >
        DE
      </button>
      <button
        className={lang === "en" ? "lang-btn lang-btn-active" : "lang-btn"}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

export default function App() {
  // ── All states at the top ──
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState("de"); // ← default is now German
  const [activePage, setActivePage] = useState("admin");

  // All surveys live here now (was: a single survey in `questions`).
  const [surveys, setSurveys] = useState([]);

  // editor: null = closed | { mode: "new" } | { mode: "edit", id }
  const [editor, setEditor] = useState(null);
  // preview: a survey object to show in respondent view, or null
  const [preview, setPreview] = useState(null);

  const t = translations[lang];

  // Called by AdminPage. Same positional signature as before, so the
  // create flow works without changing AdminPage at all.
  const handleSave = (questions, name, color, desc, bg) => {
    setSurveys((prev) => {
      if (editor?.mode === "edit") {
        return prev.map((s) =>
          s.id === editor.id
            ? {
                ...s,
                questions,
                name,
                primaryColor: color,
                description: desc,
                bgImage: bg,
                updatedAt: Date.now(),
              }
            : s
        );
      }
      const now = Date.now();
      return [
        ...prev,
        {
          id: makeId(),
          name,
          description: desc,
          primaryColor: color,
          bgImage: bg,
          questions,
          status: "draft",
          responses: 0,
          createdAt: now,
          updatedAt: now,
        },
      ];
    });
    setEditor(null);
  };

  const handleDelete = (id) =>
    setSurveys((prev) => prev.filter((s) => s.id !== id));

  const handleDuplicate = (id) =>
    setSurveys((prev) => {
      const orig = prev.find((s) => s.id === id);
      if (!orig) return prev;
      const now = Date.now();
      return [
        ...prev,
        {
          ...orig,
          id: makeId(),
          name: `${orig.name} (${t.copySuffix})`,
          status: "draft",
          responses: 0,
          createdAt: now,
          updatedAt: now,
        },
      ];
    });

  const handleSetStatus = (id, status) =>
    setSurveys((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, updatedAt: Date.now() } : s))
    );

  // ── Not logged in → show login page ──
  if (!isLoggedIn) {
    return (
      <>
        <LangSwitcher lang={lang} setLang={setLang} />
        <LoginPage onLogin={() => setIsLoggedIn(true)} t={t} />
      </>
    );
  }

  // ── Preview view (respondent-facing) ──
  if (preview) {
    return (
      <>
        <LangSwitcher lang={lang} setLang={setLang} />
        <SurveyPage
          questions={preview.questions}
          surveyName={preview.name}
          primaryColor={preview.primaryColor}
          description={preview.description}
          bgImage={preview.bgImage}
          onBack={() => setPreview(null)}
          t={t}
        />
      </>
    );
  }

  // ── Create / edit a survey ──
  if (editor) {
    const initialSurvey =
      editor.mode === "edit" ? surveys.find((s) => s.id === editor.id) : null;
    return (
      <>
        <LangSwitcher lang={lang} setLang={setLang} />
        <div className="top-bar">
          <button className="nav-tab" onClick={() => setEditor(null)}>
            ← {t.backToDashboard}
          </button>
        </div>
        {/* initialSurvey lets AdminPage prefill when editing (see note below) */}
        <AdminPage onSave={handleSave} t={t} initialSurvey={initialSurvey} />
      </>
    );
  }

  // ── Logged-in shell: Dashboard + Users ──
  return (
    <>
      <LangSwitcher lang={lang} setLang={setLang} />
      <div className="top-bar">
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={activePage === "admin" ? "nav-tab nav-tab-active" : "nav-tab"}
            onClick={() => setActivePage("admin")}
          >
            {t.surveysTab}
          </button>
          <button
            className={activePage === "users" ? "nav-tab nav-tab-active" : "nav-tab"}
            onClick={() => setActivePage("users")}
          >
            {t.usersTab}
          </button>
        </div>
        <button className="signout-btn" onClick={() => setIsLoggedIn(false)}>
          {t.signOut}
        </button>
      </div>

      {activePage === "admin" && (
        <Dashboard
          surveys={surveys}
          t={t}
          lang={lang}
          onCreate={() => setEditor({ mode: "new" })}
          onEdit={(survey) => setEditor({ mode: "edit", id: survey.id })}
          onPreview={(survey) => setPreview(survey)}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onSetStatus={handleSetStatus}
        />
      )}
      {activePage === "users" && <UsersPage t={t} />}
    </>
  );
}
