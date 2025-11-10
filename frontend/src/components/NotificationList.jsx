import React, { useState, useEffect } from 'react';
import { getNotifications, checkExpiringIngredients, deleteNotification } from '../api/notification';
import styles from './NotificationList.module.css';

const NotificationList = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await getNotifications();
            setNotifications(response.notifications || []);
            setError(null);
        } catch (err) {
            setError('알림을 불러오는 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckExpiring = async () => {
        try {
            setLoading(true);
            await checkExpiringIngredients();
            await fetchNotifications();
        } catch (err) {
            setError('유통기한 체크 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await deleteNotification(notificationId);
            // 삭제 후 목록에서 제거
            setNotifications(notifications.filter(n => n.id !== notificationId));
        } catch (err) {
            setError('알림 삭제 중 오류가 발생했습니다.');
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    if (loading) {
        return <div className={styles.loading}>로딩 중...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>알림</h2>
                <button 
                    onClick={handleCheckExpiring}
                    className={styles.checkButton}
                >
                    유통기한 체크
                </button>
            </div>
            {notifications.length === 0 ? (
                <div className={styles.empty}>새로운 알림이 없습니다.</div>
            ) : (
                <ul className={styles.list}>
                    {notifications.map((notification) => (
                        <li 
                            key={notification.id} 
                            className={`${styles.item} ${notification.isRead ? styles.read : ''}`}
                        >
                            <div className={styles.content}>
                                <div className={styles.title}>{notification.title}</div>
                                <div className={styles.body}>{notification.body}</div>
                                <div className={styles.date}>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(notification.id)}
                                className={styles.deleteButton}
                                aria-label="알림 삭제"
                            >
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default NotificationList; 