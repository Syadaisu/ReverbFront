// src/components/SearchBar.jsx

import React, { useState, useRef, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { MdCancel } from "react-icons/md";

interface SearchBarProps {
    searchValue: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchValue, onSearch, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Automatically focus the input when expanded
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  // Collapse the search bar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".search-bar-container")
      ) {
        if (searchValue === "") {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchValue]);

  return (
    <div className="search-bar-container relative">
      {/* Wrapper for smooth width transition */}
      <div
        className={`flex items-center rounded-full transition-all duration-500 ease-in-out ${
          isExpanded ? "bg-gray-600 w-64 px-3" : "w-10 px-2"
        }`}
      >
        {/* Search Icon */}
        <FaSearch
          className={`text-white text-lg cursor-pointer transition-transform duration-500 ${
            isExpanded ? "mr-2" : ""
          }`}
          onClick={() => setIsExpanded(true)}
        />

        {/* Input Field */}
        {isExpanded && (
          <>
            <input
              ref={inputRef}
              type="text"
              className="flex-grow bg-transparent outline-none text-white placeholder-gray-300"
              placeholder="Search messages..."
              value={searchValue}
              onChange={onSearch}
            />
            {searchValue && (
              <MdCancel
                className="text-white text-lg cursor-pointer"
                onClick={onClear}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
