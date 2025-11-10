import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 로그인 및 OAuth 콜백 경로에서는 바텀 내비 숨기기
  if (['/login', '/redirect', '/auth/callback'].includes(pathname)) {
    return null;
  }

  return (
    <nav className={styles.bottomNav}>
      <div
        className={styles.navItem}
        onClick={() => {
          navigate('/home');
        }}
      >
        <img src="/assets/home.png" alt="홈" className={styles.navIcon} />
        <span>홈</span>
      </div>

      {/* <div
        className={styles.navItem}
        onClick={() => {
          navigate('/recipe/:recipeId');
        }}
      >
        <span>레시피</span>
      </div> */}

      <div
        className={styles.navItem}
        onClick={() => {
          navigate('/fridge');
        }}
      >
        <img src="/assets/fridge.png" alt="냉장고" className={styles.navIcon} />
        <span>냉장고</span>
      </div>

      <div
        className={styles.navItem}
        onClick={() => {
          navigate('/star');
        }}
      >
        <img src="/assets/bookmark.png" alt="북마크" className={styles.navIcon} />
        <span>북마크</span>
      </div>
    </nav>
  );
}
