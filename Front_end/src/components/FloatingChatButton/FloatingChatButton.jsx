import { useState } from "react";
import SupportChat from "../../pages/user/SupportChat/SupportChat.jsx";
import "./FloatingChatButton.css";

export default function FloatingChatButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button 
        className={`floating-chat-btn ${isChatOpen ? "active" : ""}`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label="Chat hỗ trợ"
      >
        {isChatOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2"/>
            <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
        
        {/* Unread badge */}
        {!isChatOpen && (
          <span className="chat-badge">2</span>
        )}
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="floating-chat-window">
          <SupportChat onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </>
  );
}
