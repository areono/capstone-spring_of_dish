// src/pages/LoginPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const REST_API_KEY = import.meta.env.VITE_REST_CLIENT_ID; 
  const REDIRECT_URI = encodeURIComponent(import.meta.env.VITE_API_URL);

  const link = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  const loginHandler = () => {
    console.log('카카오 로그인 URL:', link);
    window.location.href = link;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Spring Of Dish</h1>
      <p className={styles.subtitle}>
        간편하게 로그인하고<br />
        다양한 서비스를 이용해보세요.
      </p>
      <button type="button" onClick={loginHandler} className={styles.kakaoButton}>
        <span className={styles.buttonText}>
          <img src="/assets/kakao_icon.png" alt="" className={styles.icon} />
          카카오로 시작하기</span>
      </button>
    </div>
  );
}