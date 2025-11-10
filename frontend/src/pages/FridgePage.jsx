import React, { useState, useMemo, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FridgePage.module.css";
import { AuthContext } from '../contexts/AuthContext';
import INGREDIENTS_DATA from "../data/IngredientData";
import { getUserIngredients, updateIngredient, deleteIngredient, addIngredient } from '../api';

export default function FridgePage() {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);
  const [ingredients, setIngredients] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [storedDate, setStoredDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);

  // 선택된 재료(레시피 추천용)
  const [selectedForRecipe, setSelectedForRecipe] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    if (loading) return;

    const fetchIngredients = async () => {
      try {
        const list = await getUserIngredients();
        const formattedList = list.map(item => ({
          ...item,
          expire_date: item.limit_date,
          icon: item.image_url
            ? `${import.meta.env.VITE_BACKEND_URL}${item.image_url}`
            : '/default-icon.svg',
          is_frozen: item.is_frozen,
        }));
        setIngredients(formattedList);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchIngredients();
  }, [loading, user, navigate]);

  // 4. 추천 소비기한 일수 맵
  const RECOMMEND_DAYS = {
    // (기존 RECOMMEND_DAYS 그대로 복사)
    계란: 35,
    메추리알: 35, 
    감자: 4,
    고구마: 4,
    누룽지: 45,
    밀가루: 45,
    빵가루: 45,
    쌀: 45,
    옥수수콘: 45,
    오트밀: 45,
    찹쌀가루: 45,
    감: 7,
    건포도: 180,
    귤: 10,
    딸기: 5,
    라임: 14,
    레몬: 14,
    망고: 10,
    멜론: 7,
    바나나: 5,
    배: 14,
    복숭아: 5,
    블루베리: 7,
    사과: 30,
    수박: 7,
    아보카도: 7,
    오렌지: 14,
    자두: 5,
    자몽: 14,
    체리: 5,
    키위: 14,
    파인애플: 7,
    포도: 7,
    가지: 7,
    고추: 7,
    깻잎: 7,
    당근: 14,
    대파: 10,
    마늘: 30,
    무: 14,
    열무: 5,
    바질: 3,
    배추: 14,
    브로콜리: 7,
    비트: 14,
    시금치: 5,
    아스파라거스: 5,
    상추: 5,
    샐러리: 7,
    애호박: 7,
    양배추: 14,
    양송이버섯: 7,
    팽이버섯: 7,
    표고버섯: 7,
    양파: 30,
    오이: 7,
    콩나물: 5,
    토마토: 5,
    파프리카: 7,
    호박: 7,
    가래떡: 7,
    떡국떡: 7,
    바게트: 3,
    베이글: 5,
    식빵: 5,
    버터: 30,
    생크림: 7,
    요거트: 14,
    우유: 7,
    치즈: 14,
    닭고기: 3,
    돼지고기: 3,
    소고기: 3,
    양고기: 3,
    오리고기: 3,
    검은콩: 180,
    땅콩: 180,
    병아리: 180,
    아몬드: 180,
    완두: 180,
    팥: 180,
    피스타치오: 180,
    호두: 180,
    낙지젓: 30,
    명란젓: 30,
    새우젓: 30,
    오징어젓: 30,
    김치: 14,
    두부: 7,
    베이컨: 7,
    소세지: 7,
    어묵: 7,
    유부: 7,
    진미채: 30,
    참치캔: 365,
    스팸: 365,
    갈치: 3,
    고등어: 3,
    꽁치: 3,
    건새우: 180,
    게맛살: 7,
    굴: 3,
    골뱅이: 7,
    꽃게: 3,
    꼬막: 3,
    낙지: 3,
    동태: 3,
    대합: 3,
    다시마: 365,
    도다리: 3,
    명태: 3,
    멸치: 180,
    미역: 365,
    문어: 3,
    바지락: 3,
    새우: 3,
    소라: 7,
    아귀: 3,
    연어: 3,
    오징어: 3,
    조기: 3,
    전어: 3,
    조개: 3,
    쭈꾸미: 3,
    전복: 7,
    홍합: 7,
  };

  // 5. 선택된 재료 카테고리 조회
  const selectedCategory = useMemo(() => {
    if (!selectedIngredient) return "";
    for (const [cat, items] of Object.entries(INGREDIENTS_DATA)) {
      if (items.some((i) => i.name === selectedIngredient.name)) {
        return cat;
      }
    }
    return "";
  }, [selectedIngredient]);

  // 6. 재료 그룹핑
  const grouped = useMemo(() => {
    if (!Array.isArray(ingredients)) return {};
    return ingredients.reduce((acc, ing) => {
      // 기존 로직 유지
      const found = Object.entries(INGREDIENTS_DATA).find(([cat, items]) =>
        items.some((item) => item.name === ing.name)
      );
      const category = found ? found[0] : "기타";
      if (!acc[category]) acc[category] = [];
      acc[category].push(ing);
      return acc;
    }, {});
  }, [ingredients]);

  // -- 핸들러: 재료 클릭
  const handleIngredientClick = (ingredient) => {
      setSelectedIngredient(ingredient);
      setIsFrozen(ingredient.is_frozen);

      const fmt = (n) => String(n).padStart(2, "0");
      const getDateString = (dt) => {
        const date = new Date(dt);
        return `${date.getFullYear()}-${fmt(date.getMonth() + 1)}-${fmt(date.getDate())}`;
      };

      if (ingredient.added_date) {
        setStoredDate(getDateString(ingredient.added_date));
      } else {
        const today = new Date();
        setStoredDate(getDateString(today));
      }

      if (ingredient.expire_date) {
        setExpireDate(getDateString(ingredient.expire_date));
      } else {
        const base = ingredient.added_date ? new Date(ingredient.added_date) : new Date();
        const daysToAdd = RECOMMEND_DAYS[ingredient.name] ?? 30;
        base.setDate(base.getDate() + daysToAdd);
        setExpireDate(getDateString(base));
      }

      setIsModalOpen(true);
  }; 

  // -- 핸들러: 저장된 날짜 변경
  const handleStoredDateChange = (e) => {
    const raw = e.target.value;
    const parts = raw.match(/\d+/g);
    if (!parts || parts.length < 3) return;
    const [y, m, d] = parts.map((v) => parseInt(v, 10));
    const newStored = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
      2,
      "0"
    )}`;
    setStoredDate(newStored);

    const daysToAdd = RECOMMEND_DAYS[selectedIngredient.name] ?? 30;
    const base = new Date(y, m - 1, d);
    base.setDate(base.getDate() + daysToAdd);
    const fmt = (n) => String(n).padStart(2, "0");
    const newExpire = `${base.getFullYear()}-${fmt(base.getMonth() + 1)}-${fmt(
      base.getDate()
    )}`;
    setExpireDate(newExpire);
  };

  // -- 핸들러: 소비기한 변경
  const handleExpireDateChange = (e) => {
    setExpireDate(e.target.value);
  };

  // -- 핸들러: 냉동 토글
  const handleFreezeToggle = () => {
    const nextFrozen = !isFrozen;
    setIsFrozen(nextFrozen);
    setSelectedIngredient(prev => prev ? { ...prev, is_frozen: nextFrozen } : null);

    if (nextFrozen) {
      const [y, m, d] = storedDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setMonth(dt.getMonth() + 3);
      const fmt = (n) => String(n).padStart(2, "0");
      setExpireDate(
        `${dt.getFullYear()}-${fmt(dt.getMonth() + 1)}-${fmt(dt.getDate())}`
      );
    } else {
      if (selectedIngredient) {
        const daysToAdd = RECOMMEND_DAYS[selectedIngredient.name] ?? 30;
        const [y, m, d] = storedDate.split("-").map(Number);
        const dt2 = new Date(y, m - 1, d);
        dt2.setDate(dt2.getDate() + daysToAdd);
        const fmt2 = (n) => String(n).padStart(2, "0");
        setExpireDate(
          `${dt2.getFullYear()}-${fmt2(dt2.getMonth() + 1)}-${fmt2(
            dt2.getDate()
          )}`
        );
      }
    }
  };

  // -- 핸들러: 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIngredient(null);
  };

  // -- 핸들러: 날짜 저장
  const handleSaveDate = async () => {
    if (!selectedIngredient) return;
    const payload = {
      name: selectedIngredient.name,
      expire_date: expireDate,
      is_frozen: isFrozen,
      category: selectedCategory
    };
    try {
      let updated;
      if (selectedIngredient.id) {
        await updateIngredient(selectedIngredient.id, payload);
      } else {
        await addIngredient(payload);
      }
      // 저장 후 재조회
      const list = await getUserIngredients();
      const formattedList = list.map(item => ({
        ...item,
        expire_date: item.limit_date,
        icon: item.image_url
          ? `${import.meta.env.VITE_BACKEND_URL}${item.image_url}`
          : '/default-icon.svg',
        is_frozen: item.is_frozen,
      }));
      setIngredients(formattedList);
      const updatedItem = formattedList.find(item => item.name === selectedIngredient.name);
      if (updatedItem) {
        setSelectedIngredient(updatedItem);
        setExpireDate(updatedItem.expireDate); 
      } 
      closeModal(); 
    } catch (err) {
      alert('재료 저장 실패: ' + err.message);
    }
  };

  // -- 핸들러: 삭제
  const handleDeleteItem = async () => {
    if (!selectedIngredient) return;
    try {
      await deleteIngredient(selectedIngredient.id);
      setIngredients(ingredients.filter(item => item.id !== selectedIngredient.id));
      closeModal();
    } catch (err) {
      alert('재료 삭제 실패: ' + err.message);
    }
  };

  // 날짜 표시 헬퍼
  const formatDisplayDate = (dateStr) => {
    const dateOnly = dateStr.split("T")[0]; // 5/22 민정 수정 이거 그 뒤에 시간 안 나오게 할라고
    const [year, month, day] = dateOnly.split("-");
    return `${year.slice(2)}/${month}/${day}`;
  };

  // 재료 선택/해제 핸들러 (최대 3개, id 배열 기준)
  const toggleSelectForRecipe = (ingredient) => {
    setSelectedForRecipe((prev) => {
      if (prev.includes(ingredient.id)) {
        return prev.filter((id) => id !== ingredient.id);
      } else {
        if (prev.length >= 3) {
          alert("최대 3개까지 선택할 수 있습니다.");
          return prev;
        }
        return [...prev, ingredient.id];
      }
    });
  };

  return (
    <div className={styles.pageContainer}>

      <h2 className={styles.pageTitle}> {user && (
          <p className={styles.profileInfo}>
            {user.nickname || '사용자'}네 냉장고
          </p>
        )}</h2>
      {/* DEBUG: raw ingredient list */}
      {console.log("Debug ingredients:", ingredients, "grouped:", grouped)}
     
      

      {/*  스크롤 영역 래퍼  */}

      <div className={styles.categoryWrapper}>
        {/* 재료 목록 */}
        {grouped && Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h3 className={styles.categoryTitle}>{category}</h3>
            <div className={styles.ingredientsList}>
              {items.map((ingredient) => {
                return (
                  /*선택 날림 05/22 민정 수정*/
                  <div
                    key={ingredient.id}
                    onClick={(e) => {
                      e.stopPropagation(); // 모달 오픈 방지
                      toggleSelectForRecipe(ingredient);
                    }}
                    onDoubleClick={() => handleIngredientClick(ingredient)}
                    className={
                      styles.ingredientItem +
                      (selectedForRecipe.includes(ingredient.id)
                        ? ' ' + styles.selectedItem
                        : (ingredient.is_frozen ? ' ' + styles.frozenItem : ''))
                    }
                  >
                    {ingredient.is_frozen && (
                      <span className={styles.frozenLabel}>냉동 보관</span>
                    )}
                    <img
                      src={ingredient.icon}
                      alt={ingredient.name}
                      className={styles.ingredientIcon}
                    />
                    <p className={styles.ingredientName}>
                      {ingredient.name}
                      <br /> 
                      {ingredient.added_date && ( // 5/22 민정 저장, 소비기한 보이게 만드려고 만듬 
                        <span className={styles.expireDate}>
                          저장: {formatDisplayDate(ingredient.added_date)}
                        </span>
                      )}
                      {ingredient.expire_date && (
                        <>
                          <br />
                          <span className={styles.expireDate}>
                            소비: {formatDisplayDate(ingredient.expire_date)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* 모달 */}
      {isModalOpen && selectedIngredient && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <img
              src={selectedIngredient.icon}
              alt={selectedIngredient.name}
              className={styles.modalImage}
            />
            <h2 className={styles.modalTitle}>{selectedIngredient.name}</h2>
            <p className={styles.modalSubtitle}>
              {selectedCategory}{" "}
              {isFrozen && <span style={{ color: "skyblue" }}>냉동 보관</span>}
            </p>

            <div className={styles.dateSection}>
              <div className={styles.dateItem}>
                <span>추가된 날짜</span>
                <input
                  type="date"
                  value={storedDate}
                  onChange={handleStoredDateChange}
                />
              </div>
              <div className={styles.dateItem}>
                <span>소비기한 마감</span>
                <input
                  type="date"
                  value={expireDate}
                  onChange={handleExpireDateChange}
                />
              </div>
            </div>

            <div className={styles.buttonSection}>
              <button
                className={styles.freezeButton}
                onClick={handleFreezeToggle}
              >
                ❄️ 냉동
              </button>
              <button
                className={styles.deleteButton}
                onClick={handleDeleteItem}
              >
                🗑️ 삭제
              </button>
            </div>

            <div className={styles.modalButtons}>
              <button onClick={handleSaveDate}>저장</button>
              <button onClick={closeModal}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 요리시작 버튼 */}
      <button
        className={styles.startButton}
        onClick={() => {
          if (selectedForRecipe.length < 1) {
            alert("재료를 1~3개 선택해 주세요.");
            return;
          }
          if (selectedForRecipe.length > 3) {
            alert("최대 3개까지 선택할 수 있습니다.");
            return;
          }
          navigate("/select", {
            state: {
              selectedIngredients: ingredients
                .filter(item => selectedForRecipe.includes(item.id))
                .map(item => item.name)
            }
          });
        }}
      >
        요리시작
      </button>
    </div>
  );
}