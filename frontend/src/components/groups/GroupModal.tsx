import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Crown, UserPlus, Users } from 'lucide-react';
import { Dialog } from '../shared/Dialog';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Textarea } from '../shared/Textarea';
import { Avatar } from '../shared/Avatar';
import { useGroupStore } from '../../store/groupStore';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';

export const GroupModal: React.FC = () => {
  const { isModalOpen, editingGroup, setIsModalOpen, createGroup, updateGroup, addMember, removeMember } =
    useGroupStore();
  const { users } = useChatStore();
  const { user: currentUser } = useAuthStore();

  const isEditMode = !!editingGroup;
  const isAdmin =
    !isEditMode ||
    editingGroup?.members.some((m) => m.userId === currentUser?.id && m.role === 'admin');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // IDs selected for new group (create mode only)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [addSearch, setAddSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const addSearchRef = useRef<HTMLInputElement>(null);

  // Seed form from editingGroup
  useEffect(() => {
    if (isEditMode && editingGroup) {
      setName(editingGroup.name);
      setDescription(editingGroup.description ?? '');
    } else {
      setName('');
      setDescription('');
    }
    setSelectedIds([]);
    setMemberSearch('');
    setAddSearch('');
    setNameError('');
  }, [editingGroup, isEditMode, isModalOpen]);

  // --- helpers ---
  const existingMemberIds = new Set(editingGroup?.members.map((m) => m.userId) ?? []);

  // Users not yet in the group (for add-member dropdown)
  const addableCandidates = users.filter(
    (u) => u.id !== currentUser?.id && !existingMemberIds.has(u.id)
  );
  const filteredCandidates = addableCandidates.filter((u) =>
    u.name.toLowerCase().includes(addSearch.toLowerCase())
  );

  // Contacts for create-mode selection (exclude current user)
  const createCandidates = users.filter((u) => u.id !== currentUser?.id);
  const filteredCreate = createCandidates.filter((u) =>
    u.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Current members filtered by search
  const filteredMembers = (editingGroup?.members ?? []).filter((m) =>
    m.user.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // --- actions ---
  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Group name is required');
      return;
    }
    if (!currentUser) return;
    setSaving(true);
    try {
      if (!isEditMode) {
        await createGroup({
          name: name.trim(),
          description: description.trim() || undefined,
          createdBy: currentUser.id,
          memberIds: selectedIds,
        });
      } else {
        await updateGroup(editingGroup.id, currentUser.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (user: User) => {
    if (!currentUser || !editingGroup) return;
    setAddSearch('');
    await addMember(editingGroup.id, currentUser.id, user.id);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentUser || !editingGroup) return;
    await removeMember(editingGroup.id, currentUser.id, userId);
    // If current user removed themselves, close modal
    if (userId === currentUser.id) setIsModalOpen(false);
  };

  const canRemove = (memberId: string) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    return memberId === currentUser.id;
  };

  return (
    <Dialog
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title={isEditMode ? 'Group Info' : 'New Group'}
      className="max-w-[500px] rounded-[32px]"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-2xl">
            Cancel
          </Button>
          {(isAdmin || !isEditMode) && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl px-8 shadow-lg shadow-primary/20"
            >
              {saving ? 'Saving…' : isEditMode ? 'Save' : 'Create Group'}
            </Button>
          )}
        </div>
      }
    >
      <div className="py-2 max-h-[65vh] overflow-y-auto custom-scrollbar px-1 space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Group name</label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError('');
            }}
            placeholder="e.g. Design Team"
            disabled={!isAdmin && isEditMode}
            className="rounded-2xl h-11"
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about? (optional)"
            disabled={!isAdmin && isEditMode}
            className="rounded-2xl resize-none min-h-[72px]"
          />
        </div>

        {/* Members section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-100 text-primary rounded-lg flex items-center justify-center">
              <Users size={14} />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {isEditMode
                ? `Members (${editingGroup?.members.length ?? 0})`
                : 'Add members'}
            </span>
          </div>

          {/* Search inside member list / create selection */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder={isEditMode ? 'Search members…' : 'Search contacts…'}
              className="pl-8 rounded-2xl h-9 text-sm"
            />
          </div>

          {/* CREATE MODE: selectable contact list */}
          {!isEditMode && (
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {filteredCreate.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3">No contacts found</p>
              )}
              {filteredCreate.map((u) => {
                const selected = selectedIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleSelect(u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl transition-colors text-left ${
                      selected
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <Avatar
                      src={u.avatarUrl || u.avatar}
                      alt={u.name}
                      className="w-8 h-8 shrink-0"
                    />
                    <span className="flex-1 text-sm font-medium text-slate-700">{u.name}</span>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <X size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* EDIT MODE: existing members list */}
          {isEditMode && (
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {filteredMembers.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3">No members found</p>
              )}
              {filteredMembers.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-slate-50"
                >
                  <Avatar
                    src={m.user.avatarUrl}
                    alt={m.user.name}
                    className="w-8 h-8 shrink-0"
                  />
                  <span className="flex-1 text-sm font-medium text-slate-700">{m.user.name}</span>
                  {m.role === 'admin' && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Crown size={10} />
                      Admin
                    </span>
                  )}
                  {canRemove(m.userId) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.userId)}
                      className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
                      title={m.userId === currentUser?.id ? 'Leave group' : 'Remove member'}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* EDIT MODE + ADMIN: add new member */}
          {isEditMode && isAdmin && (
            <div className="pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={13} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Add member</span>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  ref={addSearchRef}
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Search to add…"
                  className="pl-8 rounded-2xl h-9 text-sm"
                />
              </div>
              {addSearch && (
                <div className="mt-1 border border-slate-100 rounded-2xl overflow-hidden shadow-sm max-h-[160px] overflow-y-auto">
                  {filteredCandidates.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">No users to add</p>
                  ) : (
                    filteredCandidates.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleAddMember(u)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-primary/5 transition-colors text-left"
                      >
                        <Avatar
                          src={u.avatarUrl || u.avatar}
                          alt={u.name}
                          className="w-7 h-7 shrink-0"
                        />
                        <span className="text-sm font-medium text-slate-700">{u.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
