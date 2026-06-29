import React, { useState, useEffect } from "react";
import "./style.css";
import "./Dashboard.css";
import AdminPage from "./AdminPage";
import SurveyPage from "./SurveyPage";
import LoginPage from "./LoginPage";
import UsersPage from "./UsersPage";
import Dashboard from "./Dashboard";
import RespondentPage from "./RespondentPage";
import Analytics from "./Analytics";
import { translations } from "./translations";
import { supabase } from "./supabaseClient";

// ── Language switcher outside of App to avoid hook issues ──
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

// Check URL for respondent token — must be outside App to avoid re-renders
const urlToken = new URLSearchParams(window.location.search).get("token");

export default function App() {
  // ── ALLE Hooks zuerst, ohne return dazwischen ──
  const [lang, setLang] = useState("de");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState("admin");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const [surveys, setSurveys] = useState([]);
  const [editor, setEditor] = useState(null);
  const [preview, setPreview] = useState(null);

  const t = translations[lang];

  const loadSurveys = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: projects }, { data: submitted }] = await Promise.all([
      supabase
        .from("projects")
        .select("*, criteria(count)")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("decision_makers")
        .select("project_id")
        .eq("is_submitted", true),
    ]);

    if (!projects) return;

    const submittedCount = (id) =>
      (submitted || []).filter((d) => d.project_id === id).length;

    setSurveys(
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        primaryColor: "#7a003f",
        bgImage: null,
        questions: Array(p.criteria[0]?.count ?? 0).fill(null),
        status: "draft",
        responses: submittedCount(p.id),
        createdAt: new Date(p.created_at).getTime(),
        updatedAt: new Date(p.created_at).getTime(),
      }))
    );
  };

  useEffect(() => {
    if (isLoggedIn) loadSurveys();
  }, [isLoggedIn]);

  const handleSave = (questions, name, color, desc, bg) => {
    setEditor(null);
    loadSurveys();
  };

  const handleDelete = async (id) => {
    await supabase.from("projects").delete().eq("id", id);
    setSurveys((prev) => prev.filter((s) => s.id !== id));
  };

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

  // ── Respondent mode: show survey via token link (nach den Hooks!) ──
  if (urlToken) {
    return (
      <>
        <LangSwitcher lang={lang} setLang={setLang} />
        <RespondentPage token={urlToken} t={translations[lang]} />
      </>
    );
  }

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
        <AdminPage onSave={handleSave} t={t} initialSurvey={initialSurvey} />
      </>
    );
  }

  // ── Logged-in shell: Dashboard + Users + Analytics ──
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
            className={activePage === "analytics" ? "nav-tab nav-tab-active" : "nav-tab"}
            onClick={() => setActivePage("analytics")}
          >
            {t.analyticsTab || "Auswertung"}
          </button>
          <button
            className={activePage === "users" ? "nav-tab nav-tab-active" : "nav-tab"}
            onClick={() => setActivePage("users")}
          >
            {t.usersTab}
          </button>
          <button className="signout-btn" onClick={() => setShowSignOutConfirm(true)}>
            {t.signOut}
          </button>
        </div>
      </div>

      {showSignOutConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>{t.confirmSignOut}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                className="admin-btn"
                style={{ margin: 0 }}
                onClick={async () => {
                  await supabase.auth.signOut();
                  setShowSignOutConfirm(false);
                  setIsLoggedIn(false);
                }}
              >
                {t.yes}
              </button>
              <button
                className="admin-btn"
                style={{ margin: 0, background: "#888" }}
                onClick={() => setShowSignOutConfirm(false)}
              >
                {t.no}
              </button>
            </div>
          </div>
        </div>
      )}

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
      {activePage === "analytics" && <Analytics surveys={surveys} t={t} />}
      {activePage === "users" && <UsersPage t={t} />}
    </>
  );
}
