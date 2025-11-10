import React, { useEffect } from "react";
import { logout } from "../api";
import { useNavigate } from "react-router-dom";

export default function LogoutPage() {
  const navigate = useNavigate();
  useEffect(() => {
    logout().finally(() => navigate("/"));
  }, []);  
  return <p>로그아웃 중</p>;
}