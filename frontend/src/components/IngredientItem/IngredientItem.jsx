import React from "react";
import styles from "./IngredientItem.module.css";

function IngredientItem({ name, icon, selected, onClick }) {
  return (
    <div
      className={`${styles.ingredientItem} ${selected ? styles.active : ""}`}
      onClick={onClick}
    >
      {/* 이미지를 표시 */}
      <img src={icon} alt={name} className={styles.ingredientIcon} />
      {/* 이미지 아래 텍스트 */}
      <span className={styles.ingredientName}>{name}</span>
    </div>
  );
}

export default IngredientItem;
