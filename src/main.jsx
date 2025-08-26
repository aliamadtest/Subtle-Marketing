import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

// 👉 yeh naya add karo: service worker register
if ("serviceWorker" in navigator) {
  const swUrl = `${import.meta.env.BASE_URL}firebase-messaging-sw.js`;
  console.log("SW URL:", swUrl); // <- add this line
  navigator.serviceWorker
    .register(swUrl, { scope: import.meta.env.BASE_URL })
    .then((r) => console.log("SW registered:", r.scope))
    .catch((err) => console.error("SW reg failed", err));
}
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
