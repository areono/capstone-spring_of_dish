// import React, { useEffect, useState } from 'react';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import { getToken } from '../api';

// export default function OAuthCallback() {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const [responseData, setResponseData] = useState(null); // ← 응답 데이터 상태 추가

//   useEffect(() => {
//     console.log(searchParams)
//     const code = searchParams.get('code');
//     console.log('인가 코드 수신:', code);

//     if (!code) {
//       alert('인가 코드가 없습니다.');
//       navigate('/login');
//       return;
//     }

//     console.log('백엔드로 fetch 요청 시작');
//     fetch(`http://areono.store:8000/redirect?code=${code}`)
//       .then(res => {
//         console.log('Raw response:', res);
//         return res.json();
//       })
//       .then(data => {
//         console.log('백엔드 응답 :', data);
//         //setResponseData(data); // ← 응답 데이터를 상태에 저장
        
//         localStorage.setItem('token', data.token);
//         // 원래는 navigate('/home') 했지만 지금은 화면 확인을 위해 잠시 주석 처리
//         navigate('/home');
//       })
//       .catch(err => {
//         console.error('로그인 처리 중 오류:', err);
//         navigate('/login');
//       });
//   }, []);

//   return (
//     <div style={{
//       display: 'flex', flexDirection: 'column',
//       alignItems: 'center', justifyContent: 'center',
//       height: '100vh'
//     }}>
//       <p>로그인 처리 중…</p>
//       {responseData && (
//         <div style={{ marginTop: '20px', textAlign: 'center' }}>
//           <h3>응답 내용:</h3>
//           <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '8px' }}>
//             {JSON.stringify(responseData, null, 2)}
//           </pre>
//         </div>
//       )}
//     </div>
//   );
// }


// src/pages/OAuthCallback.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    console.log(code);
    if (!code) {
      alert('인가 코드가 없습니다.');
      navigate('/login');
      return;
    }

    console.log('백엔드로 code 전달 중...');
    fetch(`https://areono.store/redirect?code=${code}`)
      .then(res => {
        if (!res.ok) throw new Error('응답 실패');
        return res.json();
      })
      .then(data => {
        console.log('백엔드 응답:', data);
        localStorage.setItem('token', data.token);
        navigate('/home');
      })
      .catch(err => {
        console.error('로그인 오류:', err);
        alert('로그인에 실패했습니다.');
        navigate('/login');
      });
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh'
    }}>
      <p>로그인 처리 중...</p>
    </div>
  );
}