import React, { useState, useEffect, useContext } from 'react';
import styles from './IngredientPage.module.css';
import INGREDIENTS_DATA from '../data/IngredientData';
import { useNavigate } from 'react-router-dom';  // 네비게이트 가져오기
import { AuthContext } from '../contexts/AuthContext';
import { addIngredient } from '../api';

function findCategoryByName(name) {
  
  for (const [category, items] of Object.entries(INGREDIENTS_DATA)) {
    if (items.some(i => i.name === name)) return category;
  }
  return "기타";
}

export default function IngredientPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && !user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
    }
  }, [loading, user, navigate]);

  // 검색어 입력 변경
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 재료 선택/해제
  const toggleItem = (ingredient) => {
    if (selectedItems.find((item) => item.name === ingredient.name)) {
      setSelectedItems((prev) => prev.filter((item) => item.name !== ingredient.name));
    } else {
      const category = findCategoryByName(ingredient.name);
      setSelectedItems((prev) => [...prev, { ...ingredient, category }]);
    }
  };

  // 카테고리별 검색 필터
  const filteredCategories = Object.entries(INGREDIENTS_DATA).map(([category, items]) => {
    const filteredItems = items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { category, items: filteredItems };
  });
 
  // 적용하기 버튼 클릭
  const handleApply = async () => {
    try {
      for (const item of selectedItems) {
        await addIngredient({
          id: item.id,
          name: item.name,
          category: item.category || "기타",
          added_date: new Date().toISOString().split("T")[0], // 오늘 날짜 (YYYY-MM-DD)
        });
      }
      // alert("모든 재료 저장 완료!");
      navigate("/fridge");
    } catch (error) {
      let errorMsg = "알 수 없는 오류가 발생했습니다.";
      if (error.response && error.response.data) {
        errorMsg = error.response.data.detail || JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMsg = error.message;
      }
      console.error("재료 추가 실패:", error);
      alert(`재료 저장 실패: ${errorMsg}`);
    }
  };
  
  return (
    <div className={styles.pageContainer}>
      {/* 상단 바 */}
      

      {/* 검색 인풋 */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="재료 검색"
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
      </div>
       
       {/* 선택된 재료(장바구니) 표시*/}
       {selectedItems.length > 0 && (
        <div className={styles.selectedList}>
            {selectedItems.map((item) => (
          <span
            key={item.name}
            className={styles.selectedTag}
            onClick={() => toggleItem(item)}
          >
            {item.name} ✕
          </span>
        ))}
      </div>
    )}
    
    
      {/* 카테고리 목록 */}
      <div className={styles.categoryWrapper}>
        {filteredCategories.map(({ category, items }) => {
          if (items.length === 0) return null;
          return (
            <div key={category} className={styles.categorySection}>
              <h3 className={styles.categoryTitle}>{category}</h3>
              <div className={styles.ingredientGrid}>
                {items.map((ingredient) => (
                  <button
                    key={ingredient.name}
                    onClick={() => toggleItem(ingredient)}
                    className={
                      selectedItems.find((item) => item.name === ingredient.name)
                         ? styles.ingredientItem + ' ' + styles.active
                        : styles.ingredientItem
                    }
                  >
                    <img
                      src={ingredient.icon}
                      alt={ingredient.name}
                      className={styles.ingredientIcon}
                    />
                    <span className={styles.ingredientName}>{ingredient.name}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 큰 적용하기 버튼 */}
      <button className={styles.applyBtn} onClick={handleApply}>
        적용하기
      </button>
    </div>
  );
}
