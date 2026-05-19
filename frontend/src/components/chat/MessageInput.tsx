import React, { useState, useRef, useEffect, useCallback } from "react";
import { Smile, Send, Paperclip, Image as ImageIcon, Mic } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useSocket } from "../../hooks/useSocket";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../shared/Button";
import { Textarea } from "../shared/Textarea";

export const MessageInput: React.FC = () => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const { sendMessage, sendGroupMessage, emitTyping, emitStopTyping } = useSocket();
  const { selectedUser, selectedGroup } = useChatStore();
  const { user: currentUser } = useAuthStore();

  const isRemovedFromGroup =
    !!selectedGroup &&
    !selectedGroup.members.some((m) => m.userId === currentUser?.id);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 128);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        !emojiButtonRef.current?.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleEmojiSelect = useCallback((emoji: { native: string }) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage((prev) => prev + emoji.native);
      return;
    }
    const start = textarea.selectionStart ?? message.length;
    const end = textarea.selectionEnd ?? message.length;
    const next = message.slice(0, start) + emoji.native + message.slice(end);
    setMessage(next);
    // Restore cursor position after the inserted emoji
    requestAnimationFrame(() => {
      const pos = start + emoji.native.length;
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    });
  }, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    if (selectedGroup) {
      sendGroupMessage(selectedGroup.id, trimmed);
    } else if (selectedUser) {
      sendMessage(selectedUser.id, trimmed);
      emitStopTyping(selectedUser.id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
    setMessage("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (selectedUser) {
      emitTyping(selectedUser.id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(selectedUser.id);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isRemovedFromGroup) return null;

  return (
    <div className="bg-white px-6 py-4 flex items-end gap-2 z-30 border-t border-slate-50">
      <div className="flex items-center gap-1 text-slate-400 mb-1">
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-50">
          <Paperclip size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-50">
          <ImageIcon size={20} />
        </Button>
      </div>

      <div className="flex-1 bg-[#F8F8F8] rounded-2xl px-4 py-2 flex items-center transition-all focus-within:ring-2 ring-primary/20 border border-transparent focus-within:bg-white focus-within:border-primary/10">
        <Textarea
          ref={textareaRef}
          placeholder="Type your message..."
          rows={1}
          value={message}
          onKeyDown={handleKeyPress}
          onChange={handleInputChange}
          className="w-full bg-transparent border-none outline-none ring-0 focus-visible:ring-0 shadow-none text-[15px] text-slate-700 resize-none max-h-32 placeholder:text-slate-400 leading-[24px] min-h-0 py-1"
        />

        {/* Emoji button + popover */}
        <div className="relative shrink-0">
          <Button
            ref={emojiButtonRef}
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className={`h-8 w-8 transition-colors ${showEmojiPicker ? "text-primary" : "text-slate-400 hover:text-primary"}`}
          >
            <Smile size={20} />
          </Button>

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-10 right-0 z-50 shadow-xl rounded-2xl overflow-hidden"
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mb-1">
        {message.trim() ? (
          <Button
            onClick={handleSend}
            size="icon"
            className="w-12 h-12 bg-primary hover:bg-primary-hover rounded-2xl transition-all text-white shadow-lg shadow-primary/20 flex items-center justify-center transform active:scale-95"
          >
            <Send size={20} fill="white" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-primary rounded-2xl transition-all">
            <Mic size={22} />
          </Button>
        )}
      </div>
    </div>
  );
};
