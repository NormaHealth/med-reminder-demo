import type { User } from '../types';

interface UserSelectProps {
  users: User[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
  loading: boolean;
}

export function UserSelect({ users, selectedUserId, onSelect, loading }: UserSelectProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-64"></div>
      </div>
    );
  }

  return (
    <select
      value={selectedUserId || ''}
      onChange={(e) => onSelect(e.target.value)}
      className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm
                 text-slate-900 font-medium cursor-pointer
                 hover:border-slate-400 focus:outline-none focus:ring-2
                 focus:ring-teal-500 focus:border-teal-500
                 transition-colors duration-150"
    >
      <option value="" disabled>
        Select a patient...
      </option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );
}
