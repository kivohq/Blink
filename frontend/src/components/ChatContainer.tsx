import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState, useCallback } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageItem from "./MessageItem";
import MessageVirtualizer from "./MessageVirtualizer";
import UserProfilePanel from "./UserProfilePanel";
import MessageActions from "./MessageActions";
import ChatActionDrawer from "./ChatActionDrawer";

const isSameDay = (d1, d2) => {
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
};

const formatDateLabel = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    isLoadingMoreMessages,
    selectedUser,
    typingUsers,
    addReaction,
    removeReaction,
    markViewOnceOpened,
    isMoreMessagesAvailable,
    chatSettings,
    lockedChats,
    setChatExpiry,
    lockChat,
    unlockChat,
    setPendingAttachment,
  } = useChatStore();
  const [showProfile, setShowProfile] = useState(false);
  const [showActionDrawer, setShowActionDrawer] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setPendingAttachment(file);
    }
  };

  const openMessageMenu = useCallback((messageId, position) => {
    const menuHeight = 270;
    const menuWidth = 220;
    const offset = 8;
    
    let top, left;

    if (position.top !== undefined && position.left !== undefined && position.width === undefined) {
      // Point-based positioning (from right click)
      top = position.top;
      left = position.left;
    } else {
      // Rect-based positioning (from chevron button)
      top = position.top;
      left = position.left > window.innerWidth / 2 ? position.left - menuWidth - offset : position.left + position.width + offset;
    }

    // Viewport containment
    if (top + menuHeight > window.innerHeight) top = Math.max(offset, window.innerHeight - menuHeight - offset);
    if (left < offset) left = offset;
    if (left + menuWidth > window.innerWidth - offset) left = window.innerWidth - menuWidth - offset;
    
    setMenuPosition({ top, left });
    setActiveMessageMenu(messageId);
  }, []);

  const closeMessageMenu = () => setActiveMessageMenu(null);

  const renderItem = useCallback((message, index) => {
    if (message.isTyping) {
      return (
        <div className="max-w-[800px] w-full mx-auto px-4 py-2">
          <div className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0 shadow-sm" aria-label="Typing...">
              <img
                src={selectedUser?.profilePic || "/avatar.png"}
                alt={selectedUser?.fullName || "User"}
                className="w-full h-full rounded-full object-cover border border-slate-250 dark:border-slate-700"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-semibold mb-0.5 ml-1 select-none">
                {selectedUser?.fullName || "Someone"} is typing
              </span>
              <div className="px-4 py-2 rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark shadow-soft w-fit">
                 <div className="flex gap-1.5 items-center">
                   <span className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                   <span className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                   <span className="size-1.5 rounded-full bg-slate-400 animate-bounce" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const showDateSeparator = index === 0 || !isSameDay(message.createdAt, messages[index - 1]?.createdAt);

    return (
      <div className="max-w-[800px] w-full mx-auto px-4 py-0.5">
        {showDateSeparator && (
          <div className="flex justify-center my-6">
            <span className="px-3 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest backdrop-blur-sm">
              {formatDateLabel(message.createdAt)}
            </span>
          </div>
        )}
        <MessageItem
          message={message}
          index={index}
          messagesLength={messages.length}
          messages={messages}
          selectedUser={selectedUser}
          activeMessageMenu={activeMessageMenu}
          openMessageMenu={openMessageMenu}
          closeMessageMenu={closeMessageMenu}
          addReaction={addReaction}
          removeReaction={removeReaction}
          markViewOnceOpened={markViewOnceOpened}
        />
      </div>
    );
  }, [messages, selectedUser, activeMessageMenu, openMessageMenu, addReaction, removeReaction, markViewOnceOpened]);

  const loadMoreMessages = () => {
    if (selectedUser?._id && isMoreMessagesAvailable && !isLoadingMoreMessages) {
      getMessages(selectedUser._id, true);
    }
  };

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser?._id, getMessages]);


  if (isMessagesLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background dark:bg-background-dark">
        <ChatHeader 
          onAvatarClick={() => setShowProfile(true)} 
          onMoreClick={() => setShowActionDrawer(true)}
        />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const virtualItems = [
    ...messages,
    ...(typingUsers.length > 0 ? [{ _id: "typing-indicator", isTyping: true }] : [])
  ];

  return (
    <div 
      className="flex-1 flex flex-col h-full bg-background dark:bg-background-dark overflow-hidden relative transition-colors duration-200"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ChatHeader 
        onAvatarClick={() => setShowProfile(true)} 
        onMoreClick={() => setShowActionDrawer(true)}
      />

      <div className="flex-1 overflow-hidden chat-bg-pattern relative">
        <MessageVirtualizer
          items={virtualItems}
          renderItem={renderItem}
          onScrollToTop={loadMoreMessages}
          isMoreAvailable={isMoreMessagesAvailable}
          isLoadingMore={isLoadingMoreMessages}
        />
        
        {isDragging && (
          <div className="absolute inset-0 z-[100] bg-primary/10 backdrop-blur-[2px] border-4 border-dashed border-primary m-4 rounded-3xl flex flex-col items-center justify-center animate-in fade-in duration-200 pointer-events-none">
            <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <div className="size-12 rounded-full bg-primary flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-primary">Drop to upload</h3>
            <p className="text-primary/60 font-medium">Files, images, and more</p>
          </div>
        )}
      </div>

      <MessageInput />

      <UserProfilePanel 
        user={selectedUser} 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />

      <ChatActionDrawer 
        open={showActionDrawer}
        onClose={() => setShowActionDrawer(false)}
        selectedUser={selectedUser}
        chatSettings={chatSettings}
        lockedChats={lockedChats}
        setChatExpiry={setChatExpiry}
        lockChat={lockChat}
        unlockChat={unlockChat}
      />

      {activeMessageMenu && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/5 backdrop-blur-[1px]" onClick={closeMessageMenu} />
          <div 
            className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              top: menuPosition.top, 
              left: menuPosition.left,
            }}
          >
            <MessageActions 
              message={messages.find(m => m._id === activeMessageMenu)} 
              onClose={closeMessageMenu} 
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatContainer;
