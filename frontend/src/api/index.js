const BASE = import.meta.env.VITE_BACKEND_URL || ""; // .env로 설정해두셨다면 그대로 사용

export async function authorize() {
  window.location.href = `${BASE}/authorize`;
}

export async function getProfile() {
  const res = await fetch(`${BASE}/profile`, { credentials: "include" });
  if (!res.ok) throw new Error();
  return res.json();
}

export async function getMessage() {
  const res = await fetch(`${BASE}/message`, { credentials: "include" });
  if (!res.ok) throw new Error();
  return res.json();
}

export async function logout() {
  const res = await fetch(`${BASE}/logout`, { credentials: "include" });
  if (!res.ok) throw new Error();
  return res.json();
}

export async function unlink() {
  const res = await fetch(`${BASE}/unlink`, { credentials: "include" });
  if (!res.ok) throw new Error();
  return res.json();
}
export async function getUserIngredients() {
  const res = await fetch(`${BASE}/user-ingredients`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("재료 목록을 불러오지 못했습니다.");
  }

  const data = await res.json();
  return data.ingredients; // 리스트만 반환
}

export async function addIngredient(ingredient) {
  const res = await fetch(`${BASE}/ingredients`, {
    method: "POST",
    credentials: "include", // 쿠키 사용 시 필요
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ingredient),
  });

  if (!res.ok) {
       throw new Error(errorData?.detail || "재료 추가 실패");

  }

  return res.json();
}

export async function generateRecipe(ingredientNames) {
  try {
    console.log('레시피 생성 요청 시작');
    const res = await fetch(`${BASE}/generate-recipe`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: ingredientNames }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.error('레시피 생성 실패:', errorData);
      throw new Error(errorData.detail || '레시피 생성에 실패했습니다');
    }
    const data = await res.json();
    console.log('레시피 생성 성공:', data);
    return data;
  } catch (error) {
    console.error('레시피 생성 중 오류 발생:', error);
    throw error;
  }
}

export async function saveRecipe(recipeId) {
  const res = await fetch(`${BASE}/save-recipe`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipe_id: recipeId }),
  });
  if (!res.ok) throw new Error();
  return res.json();
}


export async function getLikedRecipes() {
  const res = await fetch(`${BASE}/recipes`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("북마크한 레시피 목록을 불러오지 못했습니다.");
  }

  // 백엔드가 StarResponse[] (recipe_id, kakao_id, created_at) 형태로 내려줌
  const data = await res.json();
  return data; // [{ recipe_id, kakao_id, created_at }, …]
}

// 특정 레시피 상세 조회
export async function getRecipeDetail(recipeId) {
  const res = await fetch(`${BASE}/recipes/${recipeId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("레시피 상세 정보를 불러오지 못했습니다.");
  return res.json();
}

// 레시피 좋아요/취소 토글
export async function toggleRecipeStar(recipeId) {
  const res = await fetch(`${BASE}/recipes/${recipeId}/star`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("좋아요 처리에 실패했습니다.");
  return res.json();
}
// 재료 수정
export async function updateIngredient(ingredientId, ingredient) {
  if (!ingredient.expire_date) {
    throw new Error("유효한 유통기한을 입력해주세요.");
  }

  // 서버가 기대하는 필드명은 'limit_date'이므로 변경
  const payload = {
    ...ingredient,
    limit_date: new Date(ingredient.expire_date).toISOString().split("T")[0]
  };
  delete payload.expire_date;  // 서버에 불필요한 필드 제거

  console.log("📦 최종 수정 요청 payload:", JSON.stringify(payload));

  const res = await fetch(`${BASE}/ingredients/${ingredientId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail || "재료 수정 실패");
  }

  return res.json();
}

// 재료 삭제
export async function deleteIngredient(ingredientId) {
  const res = await fetch(`${BASE}/ingredients/${ingredientId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail || "재료 삭제 실패");
  }
  return res.json();
}


export async function generateRecipeDetails(videoUrl) {
  try {
    console.log("레시피 상세 생성 요청 시작:", videoUrl);

    const res = await fetch(`${BASE}/generate-recipe-details?video_url=${encodeURIComponent(videoUrl)}`, {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("레시피 상세 생성 실패:", errorData);
      throw new Error(errorData.detail || "레시피 상세 생성에 실패했습니다");
    }

    const data = await res.json();
    console.log("레시피 상세 생성 성공:", data);
    return data.recipe;
  } catch (error) {
    console.error("레시피 상세 생성 중 오류 발생:", error);
    throw error;
  }
}

