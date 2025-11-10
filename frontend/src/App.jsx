import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import styles from "./App.module.css";

import Header from "./components/Header/Header";
import { useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav/BottomNav";

import LoginPage from "./pages/LoginPage";
import OAuthCallback from "./pages/OAuthCallback";
//import RedirectPage from "./pages/RedirectPage";

import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import MessagePage from "./pages/MessagePage";
import IngredientPage from "./pages/IngredientPage";
import FridgePage from "./pages/FridgePage";
import RecipePage from "./pages/RecipePage";
import LogoutPage from "./pages/LogoutPage";
import StarPage from "./pages/StarPage";
import SelectPage from "./pages/SelectPage";

export default function App() {

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  return (
    <div className={styles.appContainer}>
      {/* 상단 헤더: 로그인 페이지에서는 숨김 */}
      {location.pathname !== "/login" && <Header />}

      <Routes>
        {/* 1) Root → Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 2) Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/redirect" element={<OAuthCallback />} />
        

        {/* 3) Post-login */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/message" element={<MessagePage />} />
        <Route path="/ingredient" element={<IngredientPage />} />
        <Route path="/fridge" element={<FridgePage />} />
        <Route path="/select" element={<SelectPage />} />
        <Route path="/recipe/:recipeId" element={<RecipePage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/star" element={<StarPage />} />
        {/* 4) Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <BottomNav />
    </div>
  );
}