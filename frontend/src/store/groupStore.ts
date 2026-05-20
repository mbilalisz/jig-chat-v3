import { create } from 'zustand';
import type { Group } from '../types';
import apiClient from '../api/client';
import { joinGroupRoom } from '../hooks/useSocket';
import { useChatStore } from './chatStore';

interface GroupState {
  groups: Group[];
  isLoading: boolean;
  isModalOpen: boolean;
  editingGroup: Group | null;

  setIsModalOpen: (open: boolean, group?: Group | null) => void;
  fetchGroups: (userId: string) => Promise<void>;
  createGroup: (payload: { name: string; description?: string; createdBy: string; memberIds: string[] }) => Promise<Group>;
  updateGroup: (groupId: string, requesterId: string, data: { name?: string; description?: string }) => Promise<void>;
  addMember: (groupId: string, requesterId: string, userId: string) => Promise<void>;
  removeMember: (groupId: string, requesterId: string, userId: string) => Promise<void>;
  removeGroupLocally: (groupId: string) => void;
  addGroupLocally: (group: Group) => void;
  removeMemberLocally: (groupId: string, userId: string) => void;
  toggleGroupFavorite: (userId: string, groupId: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  isLoading: false,
  isModalOpen: false,
  editingGroup: null,

  setIsModalOpen: (open, group = null) =>
    set({ isModalOpen: open, editingGroup: open ? group ?? null : null }),

  fetchGroups: async (userId) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get('/groups', { params: { userId } });
      const groups: Group[] = res.data;
      set({ groups, isLoading: false });
      useChatStore.getState().initGroupLastMessages(groups);
      groups.forEach((g) => joinGroupRoom(g.id));
    } catch {
      set({ isLoading: false });
    }
  },

  createGroup: async (payload) => {
    const res = await apiClient.post('/groups', payload);
    const group: Group = res.data;
    set((state) => ({ groups: [group, ...state.groups] }));
    joinGroupRoom(group.id);
    return group;
  },

  updateGroup: async (groupId, requesterId, data) => {
    const res = await apiClient.put(`/groups/${groupId}`, { requesterId, ...data });
    const updated: Group = res.data;
    set((state) => ({
      groups: state.groups.map((g) => (g.id === groupId ? updated : g)),
      editingGroup: state.editingGroup?.id === groupId ? updated : state.editingGroup,
    }));
  },

  addMember: async (groupId, requesterId, userId) => {
    await apiClient.post(`/groups/${groupId}/members`, { requesterId, userId });
    // Re-fetch the group to get the updated members list
    const res = await apiClient.get(`/groups/${groupId}`);
    const updated: Group = res.data;
    set((state) => ({
      groups: state.groups.map((g) => (g.id === groupId ? updated : g)),
      editingGroup: state.editingGroup?.id === groupId ? updated : state.editingGroup,
    }));
  },

  removeGroupLocally: (groupId) => set((state) => ({
    groups: state.groups.filter((g) => g.id !== groupId),
    editingGroup: state.editingGroup?.id === groupId ? null : state.editingGroup,
  })),

  addGroupLocally: (group) => set((state) => ({
    groups: state.groups.some((g) => g.id === group.id)
      ? state.groups
      : [group, ...state.groups],
  })),

  toggleGroupFavorite: async (userId, groupId) => {
    // Optimistic update
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, isFavorite: !g.isFavorite } : g,
      ),
    }));
    try {
      const res = await apiClient.post('/groups/favorite', { userId, groupId });
      const { isFavorite } = res.data;
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, isFavorite } : g,
        ),
      }));
    } catch (error) {
      // Revert on failure
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, isFavorite: !g.isFavorite } : g,
        ),
      }));
      console.error('Toggle group favorite error:', error);
    }
  },

  removeMemberLocally: (groupId, userId) => set((state) => {
    const updateMembers = (g: Group) =>
      g.id === groupId
        ? { ...g, members: g.members.filter((m) => m.userId !== userId) }
        : g;
    return {
      groups: state.groups.map(updateMembers),
      editingGroup: state.editingGroup ? updateMembers(state.editingGroup) : null,
    };
  }),

  removeMember: async (groupId, requesterId, userId) => {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`, {
      params: { requesterId },
    });
    set((state) => {
      const updateMembers = (g: Group) =>
        g.id === groupId
          ? { ...g, members: g.members.filter((m) => m.userId !== userId) }
          : g;
      return {
        groups: state.groups.map(updateMembers),
        editingGroup: state.editingGroup ? updateMembers(state.editingGroup) : null,
      };
    });
  },
}));
