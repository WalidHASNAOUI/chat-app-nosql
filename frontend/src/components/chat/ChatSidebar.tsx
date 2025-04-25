
import { User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OnlineUser {
  id: string;
  username: string;
  isOnline: boolean;
}

interface ChatSidebarProps {
  users: OnlineUser[];
  onSelectUser: (user: OnlineUser) => void;
  selectedUserId?: string;
}

const ChatSidebar = ({ users, onSelectUser, selectedUserId }: ChatSidebarProps) => {
  return (
    <div className="w-full md:w-80 h-full border-r border-gray-200 bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Online Users</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="p-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                selectedUserId === user.id
                  ? "bg-indigo-50 text-indigo-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="relative">
                <User className="h-10 w-10 text-gray-500" />
                {user.isOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
