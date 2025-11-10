// src/components/Header/Header.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Header.module.css";

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 1) 메인 페이지 (홈)
  if (pathname === "/" || pathname === "/home") {
    return (
      <header className={styles.header}>
        <h2 className={styles.centerTitle}>홈</h2>
        {/* <button
          className={styles.rightButton}
          onClick={() => navigate("/ingredient")}
        >
          {<img src="/assets/plus.png" alt="plus" />}
        </button> */}
      </header>
    );
  }

  // 2) 재료 추가 페이지
  //05/22 뒤로가기 버튼 날림 민정 수정
  else if (pathname === "/ingredient") {
    return (
      <header className={styles.header}>
        <div className={styles.leftPlaceholder}></div>
        <h2 className={styles.centerTitle}>재료 추가</h2>
        <div className={styles.rightPlaceholder}></div>
      </header>
    );
  }

  // 3) 냉장고 페이지
  else if (pathname === "/fridge") {
    return (
      <header className={styles.header}>
        {/* <button
          className={styles.leftButton}
          onClick={() => navigate("/ingredient")}
        >
          <img
            src="/assets/reply.png"
            alt="뒤로가기"
            className={styles.backIcon}
          />
        </button> */}
        <h2 className={styles.centerTitle}>냉장고 앱</h2>
         <button
          className={styles.rightButton}
          onClick={() => navigate("/ingredient")}
        >
          {<img src="/assets/plus.png" alt="plus" />}
        </button>

        <div className={styles.rightPlaceholder}></div>
      </header>
    );
    // ) 레시피 선택 페이지 0522 지훈 수정정
  } else if (pathname === "/select") {
    return (
      <header className={styles.header}>
        <div className={styles.leftPlaceholder}></div>
        <h2 className={styles.centerTitle}>레시피 선택</h2>
        <div className={styles.rightPlaceholder}></div>
      </header>
    );
  }
  // 4) 레시피 보기 페이지
  else if (pathname === "/recipe") {
    return (
      <header className={styles.header}>
        <button
          className={styles.leftButton}
          onClick={() => navigate("/fridge")}
        >
          <img
            src="/assets/reply.png"
            alt="뒤로가기"
            className={styles.backIcon}
          />
        </button>
        <h2 className={styles.centerTitle}>요리 보기</h2>
        <button
          className={styles.rightButton}
          onClick={() => navigate("/ingredient")}
        >
          <img src="/assets/plus.png" alt="plus" />
        </button>
      </header>
    );
  }

  // 5) 북마크(StarPage) 전용 헤더
  else if (pathname === "/star") {
    return (
      <header className={styles.header}>
        <button className={styles.leftButton} onClick={() => navigate(-1)}>
          <img
            src="/assets/reply.png"
            alt="뒤로가기"
            className={styles.backIcon}
          />
        </button>
        <h2 className={styles.centerTitle}>북마크</h2>
        <div className={styles.rightPlaceholder}></div>
      </header>
    );
  }

  // 6) 그 외 경로 (기본값)
  else {
    return (
      <header className={styles.header}>
        <h2 className={styles.centerTitle}>냉장고 앱</h2>
      </header>
    );
  }
}
