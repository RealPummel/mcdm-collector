import React, { useState } from "react";
import "./style.css";
import AdminPage from "./AdminPage";
import SurveyPage from "./SurveyPage";
import LoginPage from "./LoginPage";
import UsersPage from "./UsersPage";
import { translations } from "./translations";

// ── Language switcher outside of App to avoid hook issues ──
function LangSwitcher({ lang, setLang }) {
  return (
    <div className="lang-switcher">
      <button className={lang === "en" ? "lang-btn lang-btn-active" : "lang-btn"} onClick={() => setLang("en")}>EN</button>
      <button className={lang === "de" ? "lang-btn lang-btn-active" : "lang-btn"} onClick={() => setLang("de")}>DE</button>
    </div>
  );
}

export default function App() {
  // ── All states at the top ──
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [surveyName, setSurveyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7a003f");
  const [description, setDescription] = useState("");
  const [bgImage, setBgImage] = useState(null);
  const [lang, setLang] = useState("en");
  const [activePage, setActivePage] = useState("admin");

  const t = translations[lang];

  const handleSave = (q, name, color, desc, bg) => {
    setQuestions(q);
    setSurveyName(name);
    setPrimaryColor(color);
    setDescription(desc);
    setBgImage(bg);
  };

  // ── Not logged in → show login page ──
  if (!isLoggedIn) {
    return (
      <>
        <LangSwitcher lang={lang} setLang={setLang} />
        <LoginPage onLogin={() => setIsLoggedIn(true)} t={t} />
      </>
    );
  }

  // ── Survey view ──
  if (questions) {
    return (
      <>
        <LangSwitcher lang={lang} setLang={setLang} />
        <SurveyPage
          questions={questions}
          surveyName={surveyName}
          primaryColor={primaryColor}
          description={description}
          bgImage={bgImage}
          onBack={() => setQuestions(null)}
          t={t}
        />
      </>
    );
  }

// ── Admin view ──
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

    {activePage === "admin" && <AdminPage onSave={handleSave} t={t} />}
    {activePage === "users" && <UsersPage t={t} />}
  </>
);
}
