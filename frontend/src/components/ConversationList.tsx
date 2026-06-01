import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Link } from "react-router-dom";
import FrequentContacts from "./FrequentContacts";
import { Avatar } from "./ui/BlinkComponents";
import { Button } from "./ui";
import Input from "./ui/Input";
import { Search, Edit3, Zap, MoreHorizontal, CheckCircle2, MessageSquare, Plus, Users } from "lucide-react";
import { formatMessageTime, getUserHandle } from "../lib/utils";

  const ConversationList = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    searchUsers,
    searchResults,
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
  } = useChatStore();

  const { friends, requests, sentRequests, fetchFriends, fetchRequests } = useFriendStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [searchInput, setSearchInput] = useState("");
  const searchRef = useRef(null);
  
  useEffect(() => {
    getUsers();
    fetchFriends();
    fetchRequests();
  }, [getUsers, fetchFriends, fetchRequests]);

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchUsers]);

  // Combined list of users and workspaces
  const combinedList = [
    ...users.map(u => ({ ...u, type: 'user' })),
    ...workspaces.map(w => ({ ...w, type: 'workspace' }))
  ];

  const displayList = searchInput 
    ? searchResults.map(u => ({ ...u, type: 'user' })) 
    : combinedList;

  const baseList = displayList
    .filter((item) => {
      if (item.type === 'workspace') return true;
      return searchInput || item.lastMessage || isRelated(item._id);
    })
    .sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const pinnedItems = baseList.filter((item) => {
    if (item.type === 'workspace') return false; // Workspaces not pinnable yet in this logic
    return authUser?.pinnedChats?.includes(item._id);
  });
  
  const unpinnedItems = baseList.filter((item) => {
    if (item.type === 'workspace') return true;
    return !authUser?.pinnedChats?.includes(item._id);
  });

  const renderItem = (item) => {
    if (item.type === 'workspace') return renderWorkspaceItem(item);
    return renderUserItem(item);
  };

  const renderWorkspaceItem = (workspace) => {
    const isSelected = selectedWorkspace?._id === workspace._id;
    const initials = workspace.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    return (
      <button
        key={workspace._id}
        onClick={() => {
          setSelectedUser(null);
          setSelectedWorkspace(workspace);
        }}
        className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-200 border-b border-slate-50 dark:border-slate-800/50 relative overflow-hidden group ${
          isSelected 
            ? "bg-slate-50 dark:bg-slate-800/50" 
            : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
        }`}
      >
        <div className="relative flex-shrink-0">
          <div 
            style={{ background: workspace.icon || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
            className="size-12 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-md"
          >
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] text-white">
            <Users size={10} />
          </div>
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-[16px]">
              {workspace.name}
            </h3>
            <span className="text-[12px] text-slate-400 font-medium">Group</span>
          </div>
          <p className="text-[14px] text-slate-500 truncate">
            {workspace.description || "WhatsApp-style group chat"}
          </p>
        </div>

        {isSelected && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-full" />
        )}
      </button>
    );
  };

  const renderUserItem = (user) => {
    const isOnline = onlineUsers.includes(user._id);
    const lastMessage = user.lastMessage;
    const isSelected = selectedUser?._id === user._id;
    const lastTime = lastMessage?.createdAt ? formatMessageTime(lastMessage.createdAt) : "";

    return (
      <button
        key={user._id}
        data-context="conversation"
        data-user-id={user._id}
        onClick={() => setSelectedUser(user)}
        className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-200 border-b border-slate-50 dark:border-slate-800/50 relative overflow-hidden group ${
          isSelected 
            ? "bg-slate-50 dark:bg-slate-800/50" 
            : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
        }`}
      >
        <div className="relative flex-shrink-0">
          <Avatar src={user.profilePic} size="lg" className="ring-2 ring-transparent group-hover:ring-primary/20" />
          {isOnline && (
            <div className="absolute bottom-0 right-0 size-3.5 bg-[#00FF88] rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-[16px] flex items-center gap-1.5">
              {user.fullName}
              <Link
                to={`/u/${getUserHandle(user).replace("@", "")}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-primary hover:underline font-bold opacity-85"
              >
                {getUserHandle(user)}
              </Link>
            </h3>
            <span className="text-[12px] text-slate-400 font-medium">{lastTime}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <p className={`text-[14px] truncate ${user.unreadCount > 0 ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-500"}`}>
              {lastMessage?.senderId === authUser._id && <span className="text-primary mr-1 font-bold">You:</span>}
              {lastMessage?.text || "No messages yet"}
            </p>
            
            {user.unreadCount > 0 ? (
              <div className="ml-2 px-2 py-0.5 min-w-[20px] h-5 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#0080FF] flex items-center justify-center text-white text-[11px] font-bold shadow-lg shadow-primary/20">
                {user.unreadCount}
              </div>
            ) : (
              lastMessage?.senderId === authUser._id && (
                <CheckCircle2 size={14} className="text-primary/40 ml-2" />
              )
            )}
          </div>
        </div>

        {isSelected && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-full" />
        )}
      </button>
    );
  };

  return (
    <aside className="h-full w-full bg-white dark:bg-surface-dark flex flex-col relative overflow-hidden">
      {/* Premium Header */}
      <div className="px-5 py-5 border-b border-slate-50 dark:border-slate-800/50 backdrop-blur-xl bg-white/80 dark:bg-surface-dark/80 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#0080FF] flex items-center justify-center shadow-lg shadow-primary/30">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-slate-100">Blink</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("sidebar-create-server"))}
              className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Create Group"
            >
              <Plus size={22} />
            </button>
            <button
              onClick={() => searchRef.current?.focus()}
              className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <Search size={22} />
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search messages or people"
            value={searchInput}
            onChange={handleSearch}
            ref={searchRef}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {!searchInput && frequentUsers.length > 0 && (
          <div className="py-2">
            <FrequentContacts users={frequentUsers} onSelectUser={setSelectedUser} />
          </div>
        )}

        <div className="pb-20">
          {pinnedItems.length === 0 && unpinnedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
              <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                <MessageSquare className="size-8 text-slate-300" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">No chats yet</h3>
              <p className="text-slate-400 text-sm">Start a conversation with your friends or groups!</p>
            </div>
          ) : (
            <>
              {pinnedItems.map(renderItem)}
              {unpinnedItems.map(renderItem)}
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ConversationList;
