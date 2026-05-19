import apiClient from "./client";
import type { UserSettings } from "../types";

export const fetchUserSettings = async (userId: string) => {
  const response = await apiClient.get<UserSettings>(`/settings/${userId}`);
  return response.data;
};

export const updateUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>,
) => {
  const response = await apiClient.patch<UserSettings>(
    `/settings/${userId}`,
    settings,
  );
  return response.data;
};
