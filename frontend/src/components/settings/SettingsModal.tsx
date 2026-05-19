import React, { useEffect, useState } from "react";
import { Moon, Sun, Monitor, Shield, Bell, Check } from "lucide-react";
import { useSettingsStore } from "../../store/settingsStore";
import { useAuthStore } from "../../store/authStore";
import type { UserSettings } from "../../types";
import { Dialog } from "../shared/Dialog";
import { Button } from "../shared/Button";
import { Switch } from "../shared/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuthStore();
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState<Partial<UserSettings>>({});

  useEffect(() => {
    if (isOpen && user) {
      fetchSettings(user.id);
    }
  }, [isOpen, user, fetchSettings]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleUpdate = async (key: keyof UserSettings, value: any) => {
    if (!user) return;
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    await updateSettings(user.id, { [key]: value });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      description="Manage your account preferences and chat experience."
      className="max-w-[500px] rounded-[32px]"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-2xl">
            Close
          </Button>
          <Button onClick={onClose} className="rounded-2xl px-8 shadow-lg shadow-primary/20">
            <Check size={18} className="mr-2" />
            Done
          </Button>
        </div>
      }
    >
      <div className="py-4 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
        {/* Appearance */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-100 text-primary rounded-lg flex items-center justify-center">
              <Sun size={18} />
            </div>
            <h3 className="font-bold text-slate-700">Appearance</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", icon: Sun, label: "Light" },
              { id: "dark", icon: Moon, label: "Dark" },
              { id: "system", icon: Monitor, label: "System" },
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleUpdate("theme", theme.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  localSettings.theme === theme.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-50 hover:border-slate-100 text-slate-500"
                }`}
              >
                <theme.icon size={20} />
                <span className="text-xs font-medium">{theme.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={18} />
            </div>
            <h3 className="font-bold text-slate-700">Privacy</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
              <div>
                <p className="text-sm font-bold text-slate-700">Last Seen</p>
                <p className="text-[12px] text-slate-400">
                  Who can see your last seen
                </p>
              </div>
              <Select
                value={localSettings.lastSeenVisibility}
                onValueChange={(value) => handleUpdate("lastSeenVisibility", value)}
              >
                <SelectTrigger className="w-[120px] bg-white border-none shadow-sm rounded-xl h-9">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">Contacts</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Read Receipts
                </p>
                <p className="text-[12px] text-slate-400">
                  Show when you've read messages
                </p>
              </div>
              <Switch
                checked={localSettings.readReceiptsEnabled}
                onCheckedChange={(checked) =>
                  handleUpdate("readReceiptsEnabled", checked)
                }
              />
            </div>
          </div>
        </section>

        {/* Chat Settings */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <Bell size={18} />
            </div>
            <h3 className="font-bold text-slate-700">Chat Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Typing Indicators
                </p>
                <p className="text-[12px] text-slate-400">
                  Show when you are typing
                </p>
              </div>
              <Switch
                checked={localSettings.typingIndicatorsEnabled}
                onCheckedChange={(checked) =>
                  handleUpdate("typingIndicatorsEnabled", checked)
                }
              />
            </div>
          </div>
        </section>
      </div>
    </Dialog>
  );
};
