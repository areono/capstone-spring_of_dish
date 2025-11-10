import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StarPage.module.css";
import { AuthContext } from "../contexts/AuthContext";
import { getLikedRecipes } from "../api";

export default function StarPage() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);
  const [stars, setStars] = useState([]);       // 레시피 객체 배열을 담을 state
  const [localLoading, setLocalLoading] = useState(true);

  // 썸네일 URL 생성 함수
  const getThumbnailUrl = (youtubeLink) => {
    if (!youtubeLink) return "/assets/default-thumbnail.jpg";
    try {
      const videoId = new URL(youtubeLink).searchParams.get("v");
      return videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : "/assets/default-thumbnail.jpg";
    } catch {
      return "/assets/default-thumbnail.jpg";
    }
  };
  
  useEffect(() => {
    // 로딩 끝났을 때 user가 없으면 로그인 페이지로 리다이렉트
    if (!loading && !user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
      
    }
    if (loading) return;

    const fetchStars = async () => {
      try {
        // getLikedRecipes()가 [{id, title, youtube_link, created_at, ...}]의 레시피 전체 정보 배열을 반환
        const data = await getLikedRecipes();
        setStars(data);
      } catch (err) {
        console.error("북마크 로딩 실패:", err.message);
      } finally {
        setLocalLoading(false);
      }
    };
    fetchStars();
  }, [loading, user, navigate]);

  return (
    <div className={styles.pageContainer}>
      <main className={styles.main}>
        {localLoading ? (
          <p className={styles.placeholder}>로딩 중…</p>
        ) : stars.length === 0 ? (
          <>
            {/* <div className={styles.imageWrapper}>
              <img
                src="/assets/placeholder_star.png"
                alt="북마크 없음"
                className={styles.mainImage}
              />
            </div> */}
            <h2 className={styles.title}>북마크한 레시피가 없습니다</h2>
            <p className={styles.description}>
              좋아하는 레시피를 발견하면 북마크해 보세요!
            </p>
          </>
        ) : (
          <div className={styles.listContainer}>
            {stars.map((star) => (
              <button
                key={star.id}
                type="button"
                className={styles.card}
                onClick={() => {
                  console.log("레시피 상세로 이동:", star.id);
                  navigate(`/recipe/${star.id}`, {
                    state: {
                      ...star,
                      youtube_url: star.youtube_link,  // RecipePage에서 기대하는 필드명
                    },
                  });
                }}
              >
                <img
                  src={getThumbnailUrl(star.youtube_link)}
                  alt={star.title}
                  className={styles.thumbnail}
                />
                <div className={styles.info}>
                  <h3 className={styles.cardTitle}>{star.title}</h3>
                  <p className={styles.cardSubtitle}>
                    {star.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}