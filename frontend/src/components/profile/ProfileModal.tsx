import React, { useEffect, useState } from "react";
import { User as UserIcon, Lock, Camera, Check, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Dialog } from "../shared/Dialog";
import { Button } from "../shared/Button";
import { Input } from "../shared/Input";
import { Avatar } from "../shared/Avatar";
import { Textarea } from "../shared/Textarea";
import apiClient from "../../api/client";
import type { User } from "../../types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSaveError("");
    setSaveSuccess(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwError("");
    setPwSuccess(false);

    // Seed from cached auth user immediately, then refresh from server
    if (user) {
      setName(user.name ?? "");
      setBio(user.bio ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
    }

    apiClient.get<User>("/profile").then((res) => {
      setName(res.data.name ?? "");
      setBio(res.data.bio ?? "");
      setAvatarUrl(res.data.avatarUrl ?? "");
      updateUser({
        email: res.data.email,
        phone: res.data.phone,
        bio: res.data.bio,
        avatarUrl: res.data.avatarUrl,
        avatar: res.data.avatarUrl ?? undefined,
      });
    }).catch(() => {
      // fallback: keep cached user values already set above
    });
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setSaveError("Name is required");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const res = await apiClient.put("/profile", { name, bio, avatarUrl });
      updateUser({ name: res.data.name, bio: res.data.bio, avatarUrl: res.data.avatarUrl, avatar: res.data.avatarUrl });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.response?.data?.message ?? "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }
    setIsChangingPw(true);
    setPwError("");
    setPwSuccess(false);
    try {
      await apiClient.put("/profile/password", { currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(err.response?.data?.message ?? "Failed to change password");
    } finally {
      setIsChangingPw(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Profile"
      description="Manage your personal information and account security."
      className="max-w-[500px] rounded-[32px]"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-2xl">
            Close
          </Button>
        </div>
      }
    >
      <div className="py-4 max-h-[60vh] overflow-y-auto custom-scrollbar px-1 space-y-8">

        {/* Personal Info */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-100 text-primary rounded-lg flex items-center justify-center">
              <UserIcon size={18} />
            </div>
            <h3 className="font-bold text-slate-700">Personal Info</h3>
          </div>

          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Avatar
                src={avatarUrl || user?.avatarUrl}
                alt={name || user?.name}
                fallback={(name || user?.name || "U").substring(0, 2).toUpperCase()}
                className="w-16 h-16"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                <Camera size={10} className="text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 mb-1">Avatar URL</p>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="h-9 text-sm rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Display Name</p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="rounded-xl"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Bio</p>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people a little about yourself…"
                className="rounded-xl resize-none text-sm"
                rows={3}
              />
            </div>

            {/* Account identifiers (read-only) */}
            {(user?.email || user?.phone) && (
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
                {user.email && (
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-slate-500">Email</p>
                    <p className="text-sm text-slate-700">{user.email}</p>
                  </div>
                )}
                {user.phone && (
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-slate-500">Phone</p>
                    <p className="text-sm text-slate-700">{user.phone}</p>
                  </div>
                )}
              </div>
            )}

            {saveError && (
              <p className="text-xs text-red-500 font-medium">{saveError}</p>
            )}

            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full rounded-2xl shadow-lg shadow-primary/20"
            >
              {isSaving ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : saveSuccess ? (
                <Check size={16} className="mr-2" />
              ) : null}
              {saveSuccess ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </section>

        {/* Change Password */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Lock size={18} />
            </div>
            <h3 className="font-bold text-slate-700">Change Password</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Current Password</p>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="rounded-xl"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">New Password</p>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="rounded-xl"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Confirm New Password</p>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="rounded-xl"
              />
            </div>

            {pwError && (
              <p className="text-xs text-red-500 font-medium">{pwError}</p>
            )}

            <Button
              onClick={handleChangePassword}
              disabled={isChangingPw}
              variant="outline"
              className="w-full rounded-2xl"
            >
              {isChangingPw ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : pwSuccess ? (
                <Check size={16} className="mr-2" />
              ) : null}
              {pwSuccess ? "Password Changed!" : "Change Password"}
            </Button>
          </div>
        </section>

      </div>
    </Dialog>
  );
};
