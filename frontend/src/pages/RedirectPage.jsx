// import React, { useEffect } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";

// export default function RedirectPage() {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const token = searchParams.get("token");
//     const nickname = searchParams.get("nickname");
//     const profileImage = searchParams.get("profile_image");

//     if (!token) {
//       console.error("토큰이 없습니다");
//       navigate("/login");
//       return;
//     }

//     // 토큰과 사용자 정보를 localStorage에 저장
//     localStorage.setItem("token", token);
//     if (nickname) localStorage.setItem("nickname", nickname);
//     if (profileImage) localStorage.setItem("profile_image", profileImage);

//     // 홈 페이지로 리다이렉트
//     navigate("/home", { replace: true });
//   }, [searchParams, navigate]);

//   return <p>로그인 중...</p>;
// }
