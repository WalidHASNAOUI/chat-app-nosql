
import { useState, useEffect } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";

// Mock data - replace with API calls
const mockUsers = [
  { id: "1", username: "Alice", isOnline: true },
  { id: "2", username: "Bob", isOnline: true },
  { id: "3", username: "Charlie", isOnline: false },
];

const mockMessages = [
  {
    id: "1",
    content: "Hey there!",
    senderId: "1",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    content: "Hi! How are you?",
    senderId: "current",
    timestamp: new Date().toISOString(),
  },
];

const ChatDashboard = () => {
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | undefined>();
  const [messages, setMessages] = useState(mockMessages);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      senderId: "current",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    // TODO: Connect to /message endpoint
  };

  return (
    <div className="h-screen flex">
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity md:hidden ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <ChatSidebar
          users={mockUsers}
          onSelectUser={(user) => {
            setSelectedUser(user);
            setIsMobileMenuOpen(false);
          }}
          selectedUserId={selectedUser?.id}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <button
          className="md:hidden p-4 text-gray-500"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          Menu
        </button>
        <ChatWindow
          selectedUser={selectedUser}
          messages={messages}
          currentUserId="current"
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default ChatDashboard;
