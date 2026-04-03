import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext/AuthContext.jsx";
import { ChatProvider } from "./context/ChatContext/ChatContext.jsx";
import App from "./App.jsx";
import "./index.css";

console.log("🚀 Main.jsx loaded!");
console.log("Root element:", document.getElementById("root"));

try {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  console.log("✅ Root created successfully");
  
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
  console.log("✅ App rendered successfully");
} catch (error) {
  console.error("❌ Error rendering app:", error);
  document.body.innerHTML = `<h1 style="color: red;">Error: ${error.message}</h1>`;
}
