import React, { useEffect, useState } from "react";
import styles from "./SelectPage.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import { generateRecipe } from "../api";
import { generateRecipeDetails } from "../api";

export default function SelectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedIngredients = location.state?.selectedIngredients || [];
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedIngredients || selectedIngredients.length === 0) {
        alert("재료를 1~3개 선택해주세요.");
        return;
      }
      try {
        const result = await generateRecipe(selectedIngredients); // 영상 목록 가져오기

        if (result?.videos?.length > 0) {
          const detailedRecipes = await Promise.all(
            result.videos.map(async (video) => {
              try {
                const response = await fetch(
                  `https://areono.store/api/generate-recipe-details?video_url=${encodeURIComponent(
                    video.url
                  )}`,
                  {
                    method: "POST",
                    credentials: "include",
                  }
                );
                if (!response.ok) {
                  throw new Error("서버 응답 실패");
                }
                const data = await response.json();
                return {
                  ...video,
                  title: data?.recipe?.title || video.title,
                  subtitle: data?.recipe?.subtitle || "",
                  ingredients: data?.recipe?.ingredients || [],
                  seasonings: data?.recipe?.seasonings || [],
                  steps: data?.recipe?.steps || [],
                };
              } catch (error) {
                console.error("레시피 세부 정보 가져오기 실패:", error);
                return {
                  ...video,
                  title: video.title,
                  thumbnail: video.thumbnail,
                  subtitle: "",
                  ingredients: [],
                  seasonings: [],
                  steps: [],
                };
              }
            })
          );
          setRecipes(detailedRecipes);
        } else {
          setRecipes([]);
        }
      } catch (error) {
        alert("레시피 추천에 실패했습니다.");
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}></h2>
      {loading ? (
        <p>레시피를 불러오는 중입니다...</p>
      ) : recipes.length === 0 ? (
        <p>추천할 수 있는 레시피가 없습니다. 재료를 다시 확인해주세요.</p>
      ) : (
        <div className={styles.recipeList}>
          {recipes.map((recipe, idx) => (
            <div
              key={idx}
              className={styles.recipeCard}
              style={{ cursor: "pointer" }}
              onClick={async () => {
                try {
                  // ① YouTube URL 기반으로 GPT → DB 저장
                  const res = await generateRecipeDetails(recipe.url);
                  // res === { status: "...", message: "...", recipe: { id, title, subtitle, ... } }

                  const saved = res;
                  // saved.id 가 방금 DB에 생성된 숫자 ID

                  // ② 그 숫자 ID를 URL 파라미터와 함께 넘기고, saved(=DB에 들어간 정보)도 state로 전달
                  navigate(`/recipe/${saved.id}`, {
                    state: saved,
                  });
                } catch (err) {
                  console.error("레시피 저장 실패:", err);
                  alert("레시피 저장 중 오류가 발생했습니다.");
                }
              }}
            >
              <img src={recipe.thumbnail} alt={recipe.title} />
              <h3>{recipe.title}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
