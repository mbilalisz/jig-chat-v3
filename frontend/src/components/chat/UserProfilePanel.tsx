import React, { useEffect, useState } from "react";
import { X, Mail, Phone, Info } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { Avatar } from "../shared/Avatar";
import { AvatarViewer } from "../shared/AvatarViewer";
import { Button } from "../shared/Button";
import apiClient from "../../api/client";

interface PublicProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  lastSeen?: string;
  isOnline: boolean;
  email?: string;
  phone?: string;
}

function formatLastSeen(lastSeen?: string): string {
  if (!lastSeen) return "Last seen recently";
  const date = new Date(lastSeen);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const seenDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (seenDay.getTime() === today.getTime())
    return `Last seen today at ${timeStr}`;
  if (seenDay.getTime() === yesterday.getTime())
    return `Last seen yesterday at ${timeStr}`;
  return `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`;
}

export const UserProfilePanel: React.FC = () => {
  const { profilePanelUser, setProfilePanelUser } = useChatStore();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!profilePanelUser) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    apiClient
      .get<PublicProfile>(`/users/${profilePanelUser.id}`)
      .then((res) => setProfile(res.data))
      .catch(() =>
        setProfile({
          id: profilePanelUser.id,
          name: profilePanelUser.name,
          avatarUrl: profilePanelUser.avatarUrl,
          isOnline: profilePanelUser.isOnline ?? false,
          lastSeen: profilePanelUser.lastSeen,
        }),
      )
      .finally(() => setIsLoading(false));
  }, [profilePanelUser?.id]);

  if (!profilePanelUser) return null;

  const handleCloseViewer = () => setViewerOpen(false);

  const displayName = profile?.name ?? profilePanelUser.name;
  const displayAvatar = profile?.avatarUrl ?? profilePanelUser.avatarUrl;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <>
      <div className="w-70 shrink-0 border-l border-slate-100 bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
          <span className="text-[13px] font-bold text-slate-600">Profile</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setProfilePanelUser(null)}
            className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={15} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Avatar + name section */}
              <div className="flex flex-col items-center px-4 pt-8 pb-6 bg-gradient-to-b from-orange-50/60 to-white">
                <div className="relative mb-3">
                  <button
                    onClick={() => setViewerOpen(true)}
                    className="rounded-full focus:outline-none cursor-zoom-in"
                    title="View full photo"
                  >
                    <Avatar
                      src={displayAvatar}
                      alt={displayName}
                      fallback={initials}
                      className="w-20 h-20 ring-4 ring-white shadow-md"
                    />
                  </button>
                  <div
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                      profile?.isOnline ? "bg-green-500" : "bg-slate-300"
                    }`}
                  />
                </div>

                <h3 className="text-[17px] font-bold text-slate-800 text-center leading-tight">
                  {displayName}
                </h3>

                <span
                  className={`text-[12px] font-semibold mt-1 ${
                    profile?.isOnline ? "text-green-500" : "text-slate-400"
                  }`}
                >
                  {profile?.isOnline
                    ? "Online"
                    : formatLastSeen(profile?.lastSeen)}
                </span>
              </div>

              {/* Bio */}
              <div className="mx-4 mb-3 p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <p
                    className={`text-[13px] leading-relaxed ${profile?.bio ? "text-slate-600" : "text-slate-400 italic"}`}
                  >
                    {profile?.bio || "No bio yet"}
                  </p>
                </div>
              </div>

              {/* Contact info */}
              {(profile?.email || profile?.phone) && (
                <div className="mx-4 mb-4 space-y-2">
                  {profile.email && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                      <Mail size={14} className="text-primary shrink-0" />
                      <span className="text-[13px] text-slate-600 truncate">
                        {profile.email}
                      </span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                      <Phone size={14} className="text-primary shrink-0" />
                      <span className="text-[13px] text-slate-600">
                        {profile.phone}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {viewerOpen && (
        <AvatarViewer
          src={displayAvatar}
          alt={displayName}
          fallback={initials}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
};
