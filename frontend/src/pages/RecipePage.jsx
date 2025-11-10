// src/pages/RecipePage.jsx

import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import styles from "./RecipePage.module.css";
import { AuthContext } from "../contexts/AuthContext";
import { getLikedRecipes, toggleRecipeStar, getRecipeDetail } from "../api";

export default function RecipePage() {
  const navigate = useNavigate();
  const { recipeId } = useParams(); // URL 파라미터
  console.log("🍽 RecipePage 진입, recipeId =", recipeId);
  const location = useLocation();
  console.log("🗂 location.state =", location.state);
  const { user, loading } = useContext(AuthContext);

  // 1) 처음에는 SelectPage에서 넘어온 state 사용
  const [recipe, setRecipe] = useState(location.state || null);
  const [isStarred, setIsStarred] = useState(recipe?.is_starred || false);
  const [starCheckLoading, setStarCheckLoading] = useState(true);

  // ==== TTS 관련 상태 추가 ====
  // ttsUtterance: 현재 재생 중인 SpeechSynthesisUtterance 객체
  // isPaused: 일시정지 상태인지 여부
  const [ttsUtterance, setTtsUtterance] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // 2) 인증 및 state 검사, direct URL 접근 시 getRecipeDetail 호출
  useEffect(() => {
    if (!loading && !user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    if (!recipe && !loading) {
      (async () => {
        try {
          const detail = await getRecipeDetail(recipeId);
          setRecipe(detail);
        } catch (e) {
          console.error("레시피 상세 조회 실패:", e);
          navigate("/select");
        }
      })();
    }
  }, [loading, user, recipe, recipeId, navigate]);

  // 3) 좋아요 상태 확인
  useEffect(() => {
    if (!recipe) return;
    if (recipe.is_starred !== undefined) {
      setIsStarred(!!recipe.is_starred);
      setStarCheckLoading(false);
      return;
    }
    (async () => {
      try {
        const starredList = await getLikedRecipes();
        const found = starredList.some(
          (r) => String(r.id) === String(recipeId)
        );
        setIsStarred(found);
      } catch (e) {
        console.error("북마크 상태 확인 실패:", e);
      } finally {
        setStarCheckLoading(false);
      }
    })();
  }, [recipe, recipeId]);

  if (!recipe) return <div>레시피를 불러오는 중입니다…</div>;

  // 4) YouTube 썸네일
  const {
    title,
    subtitle,
    youtube_url: youtubeLink,
    ingredients,
    seasonings,
    steps,
  } = recipe;
  let videoId = "";
  let thumbnailUrl = "";
  if (youtubeLink) {
    try {
      videoId = new URL(youtubeLink).searchParams.get("v");
      thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } catch {
      thumbnailUrl = "";
    }
  }

  // ==== 기존 handleTTS 함수 주석 처리하고, 새로운 토글형 TTS 함수로 교체 ====
  /*
  // 이전 구현: 클릭 시 무조건 새로 읽어주기만 함
  const handleTTS = () => {
    if (!window.speechSynthesis) {
      alert("TTS를 지원하지 않는 브라우저입니다.");
      return;
    }
    const textToRead = steps.join(". ");
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "ko-KR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };
  */

  // 새로 추가된 handleTTS:
  // - 재생 중이고 pause 상태가 아니라면 일시정지
  // - 일시정지 상태라면 이어 듣기
  // - 비재생 상태라면 새로 읽기 시작
  const handleTTS = () => {
    if (!window.speechSynthesis) {
      alert("TTS를 지원하지 않는 브라우저입니다.");
      return;
    }

    // 1) 이미 utterance가 있고, 읽는 중(speaking)일 때
    if (ttsUtterance && window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        // 현재 일시정지 상태 → 다시 재생
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        // 현재 재생 중 → 일시정지
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    // 2) utterance는 존재하지만, 더 이상 speaking/paused 상태가 아닐 때 (예: 읽기 끝남) → 새로 읽기
    if (
      ttsUtterance &&
      !window.speechSynthesis.speaking &&
      window.speechSynthesis.paused
    ) {
      // (드문 케이스이지만, utterance가 남아 있고 paused만 true인 지경이면 resume 처리)
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // 3) 새로 읽기 시작
    const textToRead = steps.join(". ");
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "ko-KR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // 기존에 남아있는 재생이 있다면 모두 취소
    window.speechSynthesis.cancel();

    // 새 utterance를 등록
    window.speechSynthesis.speak(utterance);
    setTtsUtterance(utterance);
    setIsPaused(false);

    // 끝났을 때 상태 초기화
    utterance.onend = () => {
      setTtsUtterance(null);
      setIsPaused(false);
    };
  };

  const goToStar = async () => {
    try {
      await toggleRecipeStar(recipe.id);
      setIsStarred((prev) => !prev);
    } catch (err) {
      alert("즐겨찾기 처리 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  // 7) 렌더링
  return (
    <div className={styles.pageContainer}>
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt="레시피 썸네일"
          className={styles.thumbnail}
        />
      )}
      <div className={styles.content}>
        <div className={styles.topIcons} style={{ marginTop: "1.5rem" }}>
          <button
            onClick={handleTTS}
            className={styles.iconButton}
            title={ttsUtterance && !isPaused ? "일시정지" : "읽기/이어 듣기"}
            style={{ lineHeight: 0 }}
          >
            {/* 재생 중이고 일시정지 상태가 아니라면 🔈, 
                그 외(일시정지 상태이거나, 재생 전/종료 후)라면 🔊 */}
            {ttsUtterance && !isPaused ? "🔈" : "🔊"}
          </button>
          <span
            onClick={goToStar}
            role="button"
            aria-label="북마크"
            style={{
              cursor: "pointer",
              display: "inline-block",
              fontSize: "22px",
              backgroundColor: "transparent",
              padding: 0,
              margin: 0,
              border: "none",
              outline: "none",
              boxShadow: "none",
              verticalAlign: "middle",
            }}
          >
            {isStarred ? "💚" : "🩶"}
          </span>
        </div>

        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        <h2 className={styles.sectionTitle}>식재료</h2>
        <div className={styles.ingredientList}>
          {ingredients?.map((item, idx) => {
            // item 문자열을 “이름”과 “수량”으로 분리
            const match = item.match(/^(\D+)(\d[\s\S]*)$/);
            const nameText = match ? match[1].trim() : item;
            const qtyText = match ? match[2].trim() : "";

            return (
              <div key={idx} className={styles.ingredientItem}>
                <div>
                  {nameText}
                  {qtyText && (
                    <span className={styles.quantity}>{qtyText}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <h2 className={styles.sectionTitle}>조미료</h2>
        <div className={styles.ingredientList}>
          {seasonings?.map((item, idx) => {
            const match = item.match(/^(\D+)(\d[\s\S]*)$/);
            const nameText = match ? match[1].trim() : item;
            const qtyText = match ? match[2].trim() : "";

            return (
              <div key={idx} className={styles.ingredientItem}>
                <div>
                  {nameText}
                  {qtyText && (
                    <span className={styles.quantity}>{qtyText}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <h2 className={styles.sectionTitle}>레시피</h2>
        <ol className={styles.recipeSteps}>
          {steps?.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>

        {youtubeLink && (
          <div className={styles.youtubeLink}>
            <a href={youtubeLink} target="_blank" rel="noopener noreferrer">
              ▶ 유튜브로 보기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
