import { X, Search, MoreVertical, Phone, Video, Menu, ArrowLeft, MoreHorizontal } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { IconButton } from "./ui";
import { getUserHandle } from "../lib/utils";

const ChatHeader = ({ onSearchClick, onPinnedClick, onBurgerClick, onAvatarClick, onMoreClick }) => {
   const { selectedUser, setSelectedUser, userStatus } = useChatStore();
   const { onlineUsers: authOnlineUsers } = useAuthStore();

  const status = userStatus[selectedUser?._id];
  const isOnline = authOnlineUsers.includes(selectedUser?._id);

  if (!selectedUser) return <div className="h-16 flex-shrink-0" />;

  return (
    <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 glass flex-shrink-0 z-20 select-none transition-all duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back button — mobile only */}
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors md:hidden"
            aria-label="Back"
          >
            <ArrowLeft size={22} className="text-slate-900 dark:text-slate-100" />
          </button>
          
          {/* Avatar with Ring */}
          <div className="relative flex-shrink-0 cursor-pointer group" onClick={onAvatarClick}>
            <div className="size-10 rounded-full relative overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} className="object-cover w-full h-full" />
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 size-3 bg-[#00FF88] rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={onAvatarClick}>
            <h3 className="font-bold text-[17px] text-slate-900 dark:text-slate-100 leading-tight truncate flex items-center gap-1.5">
              {selectedUser.fullName}
              <Link
                to={`/u/${getUserHandle(selectedUser).replace("@", "")}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[12px] text-primary hover:underline font-bold opacity-85"
              >
                {getUserHandle(selectedUser)}
              </Link>
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[12px] font-medium ${isOnline ? "text-[#00FF88]" : "text-slate-400"}`}>
                {isOnline ? "Active now" : "Offline"}
              </span>
              {status?.statusMessage && (
                <span className="text-[12px] text-slate-400 truncate hidden sm:inline">• "{status.statusMessage}"</span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-primary hover:scale-105">
            <Phone size={20} />
          </button>
          <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-primary hover:scale-105">
            <Video size={20} />
          </button>
          
          <div className="w-[1px] h-6 bg-slate-100 dark:bg-slate-800 mx-1 hidden sm:block" />

          <button
            onClick={onSearchClick}
            className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <Search size={20} />
          </button>

          <button
            onClick={onMoreClick}
            className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <MoreHorizontal size={20} />
          </button>

          <button 
            onClick={() => setSelectedUser(null)} 
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-all hidden lg:inline-flex"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
