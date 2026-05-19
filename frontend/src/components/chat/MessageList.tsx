import React, { useRef, useEffect, useState, useCallback } from "react";
import { CheckCheck, Trash2 } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "../shared/Avatar";
import type { User } from "../../types";

const getDateLabel = (dateStr: string | undefined): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 6);

  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (startOfDay.getTime() === startOfToday.getTime()) return "Today";
  if (startOfDay.getTime() === startOfYesterday.getTime()) return "Yesterday";
  if (startOfDay >= startOfWeek) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const isSameDay = (a: string | undefined, b: string | undefined): boolean => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const DateSeparator: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 my-2">
    <div className="flex-1 h-px bg-slate-100" />
    <span className="text-[11px] font-semibold text-slate-400 px-2 shrink-0">
      {label}
    </span>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

export const MessageList: React.FC = () => {
  const { messages, groupMessages, selectedGroup, deleteMessage, highlightedMessageId, setHighlightedMessageId, setProfilePanelUser } = useChatStore();
  const { user: currentUser } = useAuthStore();

  const openSenderProfile = useCallback((msg: { senderId: string; sender?: { id: string; name: string; avatarUrl?: string } }) => {
    if (!msg.sender) return;
    setProfilePanelUser({ id: msg.sender.id, name: msg.sender.name, avatarUrl: msg.sender.avatarUrl, isFavorite: false } as User);
  }, [setProfilePanelUser]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const activeMessages = selectedGroup ? groupMessages : messages;

  const setMessageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) messageRefs.current.set(id, el);
    else messageRefs.current.delete(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  useEffect(() => {
    if (!highlightedMessageId) return;

    const el = messageRefs.current.get(highlightedMessageId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashId(highlightedMessageId);
      const timer = setTimeout(() => {
        setFlashId(null);
        setHighlightedMessageId(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId, setHighlightedMessageId, activeMessages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 relative custom-scrollbar bg-white"
    >
      {activeMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
          <p className="text-sm font-medium">No messages yet</p>
        </div>
      ) : (
        <div className="min-h-full flex flex-col justify-end gap-4">
        {activeMessages.map((msg, index) => {
          const isSentByMe = msg.senderId === currentUser?.id;
          const senderName = msg.sender?.name ?? "";
          const senderAvatar = msg.sender?.avatarUrl;
          const msgDate = msg.createdAt || msg.timestamp;
          const prevDate =
            index > 0
              ? activeMessages[index - 1].createdAt ||
                activeMessages[index - 1].timestamp
              : undefined;
          const showDateSeparator = !isSameDay(prevDate, msgDate);
          const isFlashing = flashId === msg.id;

          if (msg.type === "system") {
            return (
              <React.Fragment key={msg.id}>
                {showDateSeparator && (
                  <DateSeparator label={getDateLabel(msgDate)} />
                )}
                <div className="flex items-center justify-center my-1">
                  <span className="bg-slate-100 text-slate-400 text-[11px] font-medium px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={msg.id}>
              {showDateSeparator && (
                <DateSeparator label={getDateLabel(msgDate)} />
              )}

              <div
                ref={(el) => setMessageRef(msg.id, el)}
                className={`flex w-full gap-2 rounded-xl transition-colors duration-200 ${isSentByMe ? "justify-end" : "justify-start"} ${isFlashing ? "bg-yellow-100" : ""}`}
                onMouseEnter={() => setHoveredId(msg.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Avatar for other people in group chat */}
                {selectedGroup && !isSentByMe && (
                  <button
                    onClick={() => openSenderProfile(msg)}
                    className="shrink-0 self-end mb-5 rounded-full focus:outline-none"
                  >
                    <Avatar
                      src={senderAvatar}
                      alt={senderName}
                      className="w-8 h-8"
                    />
                  </button>
                )}

                <div
                  className={`flex max-w-[75%] md:max-w-[65%] flex-col ${isSentByMe ? "items-end" : "items-start"}`}
                >
                  {/* Sender name in group chat */}
                  {selectedGroup && !isSentByMe && senderName && (
                    <button
                      onClick={() => openSenderProfile(msg)}
                      className="text-[11px] font-semibold text-primary mb-1 ml-1 hover:underline focus:outline-none text-left"
                    >
                      {senderName}
                    </button>
                  )}

                  <div className={`flex items-end gap-1.5 ${isSentByMe ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`px-5 py-3 rounded-2xl shadow-sm
                        ${
                          isSentByMe
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-[#F8F8F8] text-slate-700 rounded-tl-none"
                        }`}
                    >
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>

                    {isSentByMe && hoveredId === msg.id && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="p-1 rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="mt-1.5 flex items-center gap-1.5 opacity-40">
                    <span className="text-[10px] font-bold">
                      {new Date(msgDate || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isSentByMe && !selectedGroup && (
                      <CheckCheck size={14} className="text-white" />
                    )}
                  </div>
                </div>

                {/* Spacer to mirror avatar on sent side */}
                {selectedGroup && isSentByMe && (
                  <div className="w-8 shrink-0" />
                )}
              </div>
            </React.Fragment>
          );
        })}
        </div>
      )}
    </div>
  );
};
