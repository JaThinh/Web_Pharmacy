import { useState } from "react";
import "./SearchBar.css";

export default function SearchBar({ onSearch, placeholder = "Tìm kiếm sản phẩm..." }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Tìm kiếm real-time khi gõ
    if (onSearch) onSearch(value);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      
      <input
        type="text"
        className="search-input"
        id="site-search"
        name="q"
        aria-label="Tìm kiếm sản phẩm"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
      />
      
      {searchTerm && (
        <button
          type="button"
          className="clear-btn"
          onClick={() => {
            setSearchTerm("");
            if (onSearch) onSearch("");
          }}
        > {}
          ×
        </button>
      )}
    </form>
  );
}
