import React, { useState, useEffect } from "react";
import { getMessage } from "../api";

export default function MessagePage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMessage().then((data) => setMessage(data.message || ""));
  }, []);

  if (!message) return <p>메시지가 없습니다.</p>;
  return (
    <div>
      <h2>내 메시지</h2> 
      <p>{message}</p>
    </div>
  );
}