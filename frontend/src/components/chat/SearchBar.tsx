import React from "react";
import { Search, Filter } from "lucide-react";

export const SearchBar: React.FC = () => {
  return (
    <div className="px-4 py-2 flex items-center gap-3 bg-white">
      <div className="flex-1 bg-slate-100 rounded-xl flex items-center px-4 py-2 gap-3 transition-all focus-within:bg-slate-200/70 focus-within:ring-2 ring-primary/20">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
        />
      </div>
      <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
        <Filter size={18} />
      </button>
    </div>
  );
};
