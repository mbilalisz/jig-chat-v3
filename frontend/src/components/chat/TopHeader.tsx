import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
  MessageSquare,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import logo from "../../assets/logo.png";
import { Avatar } from "../shared/Avatar";
import { Input } from "../shared/Input";
import { Dropdown } from "../shared/Dropdown";
import apiClient from "../../api/client";
import type { User } from "../../types";

interface ContactResult {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface MessageResult {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string; avatarUrl?: string };
  otherUser: { id: string; name: string; avatarUrl?: string } | null;
}

interface SearchResults {
  contacts: ContactResult[];
  messages: MessageResult[];
}

export const TopHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const {
    setIsSettingsOpen,
    setIsProfileOpen,
    setSelectedUser,
    setHighlightedMessageId,
    fetchMessages,
    ensureUserInList,
  } = useChatStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    contacts: [],
    messages: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const menuItems = [
    {
      label: "Profile",
      icon: <UserIcon size={16} />,
      onClick: () => setIsProfileOpen(true),
    },
    {
      label: "Settings",
      icon: <SettingsIcon size={16} />,
      onClick: () => setIsSettingsOpen(true),
    },
    {
      label: "Logout",
      icon: <LogOut size={16} />,
      onClick: logout,
      variant: "destructive" as const,
    },
  ];

  const runSearch = useCallback(
    async (q: string) => {
      if (!user || q.trim().length < 2) {
        setResults({ contacts: [], messages: [] });
        setIsOpen(false);
        setActiveIndex(-1);
        return;
      }
      setIsSearching(true);
      try {
        const res = await apiClient.get("/messages/search", {
          params: { q, currentUserId: user.id },
        });
        setResults(res.data);
        setActiveIndex(-1);
        setIsOpen(true);
      } catch {
        setResults({ contacts: [], messages: [] });
      } finally {
        setIsSearching(false);
      }
    },
    [user],
  );

  const totalItems = results.contacts.length + results.messages.length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || totalItems === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev < totalItems - 1 ? prev + 1 : 0;
        itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev > 0 ? prev - 1 : totalItems - 1;
        itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      itemRefs.current[activeIndex]?.click();
    } else if (e.key === "Escape") {
      closeSearch();
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
  };

  const handleContactClick = (contact: ContactResult) => {
    const u: User = {
      id: contact.id,
      name: contact.name,
      avatarUrl: contact.avatarUrl,
      isFavorite: false,
    };
    ensureUserInList(contact);
    setSelectedUser(u);
    closeSearch();
  };

  const handleMessageClick = async (msg: MessageResult) => {
    if (!user || !msg.otherUser) return;
    const other = msg.otherUser;
    const u: User = {
      id: other.id,
      name: other.name,
      avatarUrl: other.avatarUrl,
      isFavorite: false,
    };
    ensureUserInList(other);
    setSelectedUser(u);
    // fetch messages so the list is populated before we highlight
    await fetchMessages(user.id, other.id);
    setHighlightedMessageId(msg.id);
    closeSearch();
  };

  const hasResults = results.contacts.length > 0 || results.messages.length > 0;

  return (
    <div className="h-15 md:h-17.5 bg-white flex items-center justify-between px-4 md:px-6 md:jig-shadow z-50 md:rounded-2xl mx-0 md:mx-4 mt-0 md:mt-4 border-b border-slate-100 md:border-none">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 overflow-hidden rounded-xl shadow-sm border border-slate-50">
          <img
            src={logo}
            alt="JigChat Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="font-bold text-xl text-slate-800 tracking-tight">
          JigChat
        </span>
      </div>

      <div
        className="hidden md:flex flex-1 max-w-2xl mx-12 relative"
        ref={wrapperRef}
      >
        <div className="bg-[#F8F8F8] rounded-full flex items-center px-4 py-2 gap-3 w-full border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all shadow-sm">
          <Search
            size={18}
            className={`shrink-0 ${isSearching ? "text-primary animate-pulse" : "text-slate-400"}`}
          />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hasResults && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages or contacts..."
            className="bg-transparent border-none outline-none ring-0 focus-visible:ring-0 shadow-none text-sm w-full text-slate-700 h-auto py-0"
          />
          {query.trim().length ? (
            <X
              size={18}
              className="shrink-0 text-slate-400 hover:text-slate-500 cursor-pointer"
              onClick={closeSearch}
            />
          ) : null}
        </div>

        {isOpen && hasResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden max-h-96 overflow-y-auto">
            {results.contacts.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-4 pt-3 pb-1">
                  Contacts
                </p>
                {results.contacts.map((contact, i) => (
                  <button
                    key={contact.id}
                    ref={(el) => { itemRefs.current[i] = el; }}
                    onClick={() => handleContactClick(contact)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${activeIndex === i ? "bg-slate-100" : "hover:bg-slate-50"}`}
                  >
                    <Avatar
                      src={contact.avatarUrl}
                      alt={contact.name}
                      fallback={contact.name.substring(0, 2).toUpperCase()}
                      className="w-8 h-8 shrink-0"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {contact.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {results.messages.length > 0 && (
              <div
                className={
                  results.contacts.length > 0 ? "border-t border-slate-100" : ""
                }
              >
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-4 pt-3 pb-1">
                  Messages
                </p>
                {results.messages.map((msg, i) => {
                  const idx = results.contacts.length + i;
                  return (
                  <button
                    key={msg.id}
                    ref={(el) => { itemRefs.current[idx] = el; }}
                    onClick={() => handleMessageClick(msg)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${activeIndex === idx ? "bg-slate-100" : "hover:bg-slate-50"}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-primary mb-0.5">
                        {msg.otherUser?.name ?? msg.sender.name}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {msg.content}
                      </p>
                    </div>
                  </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {isOpen && !hasResults && query.trim().length >= 2 && !isSearching && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 px-4 py-6 text-center">
            <p className="text-sm text-slate-400">
              No results for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <Dropdown
          trigger={
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <Avatar
                  src={user?.avatar}
                  alt={user?.name}
                  fallback={user?.name?.substring(0, 2).toUpperCase()}
                  className="w-9 h-9 md:w-10 md:h-10 ring-2 ring-slate-50 group-hover:ring-primary/20 transition-all"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-700 line-clamp-1">
                  {user?.name}
                </p>
                <p className="text-[10px] text-green-500 font-medium">Online</p>
              </div>
            </div>
          }
          label="My Account"
          items={menuItems}
          className="w-56 mt-2 rounded-2xl p-2 border-slate-100 shadow-xl"
        />
      </div>
    </div>
  );
};
