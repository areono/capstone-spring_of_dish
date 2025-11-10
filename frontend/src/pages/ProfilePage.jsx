import React, { useState, useEffect } from "react";
import { getProfile } from "../api";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile().then((data) => setProfile(data));
  }, []);

  if (!profile) return <p>불러오는 중…</p>;
  return (
    <div>
      <h2>내 프로필</h2>
      <img src={profile.profile_image} alt="프로필" width={80} />
      <p>닉네임: {profile.nickname}</p>
      <p>이메일: {profile.email}</p>
    </div>
  );
}