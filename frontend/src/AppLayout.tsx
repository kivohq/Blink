import { useState, useEffect } from "react";
import SidebarRail from "./components/SidebarRail";
import WorkspaceSidebar from "./components/WorkspaceSidebar";
import ConversationList from "./components/ConversationList";
import ChatContainer from "./components/ChatContainer";
import WorkspaceChat from "./components/WorkspaceChat";
import NoChatSelected from "./components/NoChatSelected";
import MobileBottomNav from "./components/MobileBottomNav";
import UsersPanel from "./components/UsersPanel";
import NotificationPanel from "./components/NotificationPanel";
import SettingsPage from "./pages/SettingsPage";
import { useChatStore } from "./store/useChatStore";
import { useErrorStore } from "./store/useErrorStore";
import { useParams, useNavigate } from "react-router-dom";
import UserProfileModal from "./components/UserProfileModal";
import { getUserHandle } from "./lib/utils";

const AppLayout = () => {
  const { selectedUser, setSelectedUser, selectedWorkspace, setSelectedWorkspace, users, isUsersLoading } = useChatStore();
  const { handleError } = useErrorStore();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("lastActiveTab") || "chats";
  });
  const [viewProfileUser, setViewProfileUser] = useState<any | null>(null);

  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("lastActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (username && !isUsersLoading && users.length > 0) {
      const foundUser = users.find((u) => {
        const handle = getUserHandle(u).replace("@", "");
        return handle.toLowerCase() === username.toLowerCase();
      });
      if (foundUser) {
        setSelectedUser(foundUser);
        setViewProfileUser(foundUser);
      } else {
        handleError("User not found", `No user found with handle @${username}`);
        navigate("/", { replace: true });
      }
    }
  }, [username, users, isUsersLoading, setSelectedUser, handleError, navigate]);

  const renderSideContent = () => {
    if (selectedWorkspace) return <WorkspaceSidebar />;
    switch (activeTab) {
      case "users": return <UsersPanel />;
      case "notifications": return <NotificationPanel />;
      case "settings": return <div className="h-full overflow-y-auto"><SettingsPage isEmbedded /></div>;
      default: return <ConversationList />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 relative">
      {/* 1. Sidebar Rail (Desktop Only) - Slim vertical nav */}
      <div className="hidden md:block">
        <SidebarRail activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      {/* 2. Side Column (Conversations, Users, Groups, etc.) */}
      <div className={`
        w-full md:w-[380px] flex-shrink-0 border-r border-border dark:border-border-dark flex flex-col h-full 
        bg-white dark:bg-surface-dark transition-all duration-300 ease-in-out
        ${(selectedUser || selectedWorkspace) ? "hidden md:flex" : "flex"} 
        ${activeTab !== 'chats' ? 'pb-16 md:pb-0' : 'pb-16 md:pb-0'}
      `}>
        {renderSideContent()}
      </div>
      
      {/* 3. Main Content Area */}
      <main className={`
        flex-1 flex flex-col h-full relative overflow-hidden 
        bg-slate-50 dark:bg-background-dark transition-all duration-300
        ${(selectedUser || selectedWorkspace) ? "flex" : "hidden md:flex"}
      `}>
        {selectedWorkspace ? (
          <WorkspaceChat onBurgerClick={() => setSelectedWorkspace(null)} />
        ) : selectedUser ? (
          <ChatContainer />
        ) : (
          <NoChatSelected />
        )}
      </main>

      {/* 4. Mobile Bottom Navigation */}
      <div className="md:hidden">
        {!selectedUser && <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>

      {viewProfileUser && (
        <UserProfileModal
          open={!!viewProfileUser}
          onClose={() => {
            setViewProfileUser(null);
            navigate("/");
          }}
          user={viewProfileUser}
        />
      )}
    </div>
  );
};

export default AppLayout;
