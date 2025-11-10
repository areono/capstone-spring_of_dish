const BASE = import.meta.env.VITE_BACKEND_URL || ""; // .env로 설정해두셨다면 그대로 사용


// export const checkExpiringIngredients = async () => {
//     try {
     
//         const respose = await fetch(`${BASE}/check-expiring-ingredients`, { credentials: "include" });
//         return response.data;
//     } catch (error) {
//         console.error('유통기한 임박 재료 확인 중 오류 발생:', error);
//         throw error;
//     }
// };

// export const getNotifications = async () => {
//     try {
//         const respose = await fetch(`${BASE}/notifications`, { credentials: "include" });
//         return response.data;
//     } catch (error) {
//         console.error('알림 조회 중 오류 발생:', error);
//         throw error;
//     }
// }; 

/**
 * 유통기한 임박 재료 알림 체크
 */
export async function checkExpiringIngredients() {
  const res = await fetch(`${BASE}/check-expiring-ingredients`, {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail || "유통기한 임박 재료 확인 중 오류 발생");
  }
  return res.json();
}

/**
 * 알림 목록 조회
 */
export async function getNotifications() {
  const res = await fetch(`${BASE}/notifications`, {
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail || "알림 조회 중 오류 발생");
  }
  return res.json();
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(notificationId) {
  const res = await fetch(`${BASE}/notifications/${notificationId}/read`, {
    method: "PUT",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail || "알림 읽음 처리 중 오류 발생");
  }
  return res.json();
}

/**
 * 알림 삭제
 */
export async function deleteNotification(notificationId) {
  const res = await fetch(`${BASE}/notifications/${notificationId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.detail || "알림 삭제 중 오류 발생");
  }
  return res.json();
}
