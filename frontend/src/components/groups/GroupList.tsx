import React from 'react';
import { Users, Info } from 'lucide-react';
import { useGroupStore } from '../../store/groupStore';
import { useChatStore } from '../../store/chatStore';
import type { Group } from '../../types';

export const GroupList: React.FC = () => {
  const { groups, isLoading, setIsModalOpen } = useGroupStore();
  const { setSelectedGroup, selectedGroup } = useChatStore();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-3">
          <Users size={24} className="text-primary" />
        </div>
        <p className="text-sm font-semibold text-slate-600">No groups yet</p>
        <p className="text-xs text-slate-400 mt-1">Tap + above to create a group</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {groups.map((group: Group) => {
        const isActive = selectedGroup?.id === group.id;
        const memberCount = group.members.length;
        const preview = group.description ||
          group.members.slice(0, 3).map((m) => m.user.name.split(' ')[0]).join(', ');

        return (
          <div
            key={group.id}
            onClick={() => setSelectedGroup(group)}
            className={`flex items-center px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 ${
              isActive ? 'bg-primary/5' : 'hover:bg-slate-50'
            }`}
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isActive ? 'bg-primary/20' : 'bg-primary/10'
            }`}>
              <Users size={18} className="text-primary" />
            </div>

            <div className="flex-1 ml-3 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className={`text-[15px] font-semibold truncate ${isActive ? 'text-primary' : 'text-slate-800'}`}>
                  {group.name}
                </h3>
                <span className="text-xs text-slate-400 ml-2 shrink-0">{memberCount} members</span>
              </div>
              <p className="text-[13px] text-slate-400 truncate">{preview}</p>
            </div>

            {/* Info button — opens group modal without triggering row click */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true, group);
              }}
              className="ml-2 p-1.5 rounded-xl text-slate-300 hover:text-primary hover:bg-primary/5 transition-colors shrink-0"
              title="Group info"
            >
              <Info size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
