import React, { useEffect, useState, useContext } from 'react';
import styles from './HomePage.module.css';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserIngredients } from '../api';
import NotificationList from '../components/NotificationList';

export default function HomePage() {
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState('');
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

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
        setIngredients(list);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchIngredients();
  }, [loading, user, navigate]);

  return (
    <div className={styles.background}>
      <main className={styles.main}>
        <NotificationList />
        {user && (
          <p className={styles.welcome}>
            {user.nickname || '사용자'}님 환영합니다!
          </p>
        )}
        {/* <p className={styles.subMessage}>
          냉장고에 재료를 추가하고 레시피를 추천받아보세요!
        </p> */}
        <button
          onClick={() => navigate('/ingredient')}
          className={styles.notifyButton}
        >
          ➕ 재료 추가
        </button>
      </main>
    </div>
  );
}
