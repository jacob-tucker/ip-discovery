"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-3 h-5 w-5 text-textMuted" />
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search IP Assets..."
        className="w-full rounded-full bg-background py-2 pl-10 pr-4 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-accentOrange"
      />
    </div>
  );
}
