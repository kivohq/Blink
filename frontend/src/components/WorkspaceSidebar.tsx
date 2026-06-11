import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Megaphone, BadgeInfo, X, Hash, BarChart2, FolderOpen, Plus, Users, ChevronDown, Volume2 } from "lucide-react";

const WorkspaceSidebar = () => {
  const { 
    selectedWorkspace, 
    selectedChannelId, 
    setSelectedChannelId, 
    createChannel,
    deleteWorkspace,
    promoteToAdmin,
    demoteFromAdmin
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();

  const isOwner = selectedWorkspace?.owner === authUser?._id;
  const isAdmin = isOwner || selectedWorkspace?.admins.includes(authUser?._id || "");

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState("chat");
  const [showMembers, setShowMembers] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  if (!selectedWorkspace) return null;

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    createChannel(selectedWorkspace._id, newChannelName.trim(), newChannelType);
    setNewChannelName("");
    setShowCreateChannelModal(false);
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case "announcements":
        return <Megaphone className="w-4 h-4 mr-2" />;
      case "polls":
        return <BarChart2 className="w-4 h-4 mr-2" />;
      case "resources":
        return <FolderOpen className="w-4 h-4 mr-2" />;
      case "voice":
        return <Volume2 className="w-4 h-4 mr-2" />;
      default:
        return <Hash className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <aside className="w-64 h-full glass border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 flex-shrink-0 select-none transition-colors duration-200">
        {/* Announcement Modal */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAnnouncementModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 p-1 rounded hover:bg-slate-200/40 dark:hover:bg-slate-800/40" onClick={() => setShowAnnouncementModal(false)}>
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">🆕 New Features (v2.3.0)</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                <li>Real‑time typing indicators for all users.</li>
                <li>Optimistic UI for channel messages.</li>
                <li>Enhanced dark‑mode glassmorphic sidebar.</li>
                <li>Announcement modal to showcase new features.</li>
              </ul>
            </div>
          </div>
        )}
      {/* Group Header */}
        <button className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded" onClick={() => setShowAnnouncementModal(true)}>
          <BadgeInfo className="w-4 h-4" />
          <span>What’s New</span>
        </button>
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between hover:bg-slate-200/50 dark:hover:bg-slate-800/40 cursor-pointer transition">
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[180px]">
            {selectedWorkspace.name}
          </span>
          <span className="text-[10px] text-slate-550 dark:text-slate-400 font-medium truncate max-w-[180px]">
            {selectedWorkspace.description || "Group Info"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 scrollbar-thin">
        {/* Only show Channels if there's more than one, otherwise it's just a group chat */}
        {selectedWorkspace.channels.length > 1 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Topics</span>
              <button
                onClick={() => setShowCreateChannelModal(true)}
                className="hover:text-slate-900 dark:hover:text-slate-100 transition p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-850"
                title="Add Topic"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {selectedWorkspace.channels.map((chan) => {
                const isActive = selectedChannelId === chan._id;
                return (
                  <button
                    key={chan._id}
                    onClick={() => setSelectedChannelId(chan._id)}
                    className={`w-full flex items-center px-2 py-2 rounded-lg text-sm font-semibold transition duration-150 ${
                      isActive
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:dark:text-slate-200 hover:bg-slate-200/50 hover:dark:bg-slate-800/50"
                    }`}
                  >
                    {getChannelIcon(chan.type)}
                    <span className="truncate">{chan.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Members Roster Section */}
        <div className="space-y-2">
          <button 
            onClick={() => setShowMembers(!showMembers)}
            className="w-full flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:dark:text-slate-200 transition focus:outline-none"
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              <span>Members ({selectedWorkspace.members?.length || 0})</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showMembers ? "" : "-rotate-90"}`} />
          </button>

          {showMembers && (
            <div className="space-y-1 mt-1">
              {selectedWorkspace.members?.map((member) => {
                const memberUser = typeof member === 'string' ? null : member;
                if (!memberUser) return null;
                const isOnline = onlineUsers.includes(memberUser._id);
                const isMemberAdmin = selectedWorkspace.admins.includes(memberUser._id);
                
                return (
                  <div
                    key={memberUser._id}
                    className="flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-200/40 dark:hover:bg-slate-800/30 transition text-slate-700 dark:text-slate-350 text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <img
                          src={memberUser.profilePic || "/avatar.png"}
                          alt={memberUser.fullName}
                          className="size-6 rounded-full object-cover"
                        />
                        <span
                          className={`absolute bottom-0 right-0 size-2 rounded-full border border-white dark:border-slate-900 ${
                            isOnline ? "bg-emerald-500" : "bg-slate-550"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {memberUser.fullName}
                        </span>
                      </div>
                    </div>

                    {isAdmin && !isOwner && memberUser._id !== authUser?._id && (
                      <div className="flex gap-1">
                        {isMemberAdmin ? (
                          <button onClick={() => demoteFromAdmin(selectedWorkspace._id, memberUser._id)} className="text-[10px] text-rose-500 hover:text-rose-600 font-bold">Demote</button>
                        ) : (
                          <button onClick={() => promoteToAdmin(selectedWorkspace._id, memberUser._id)} className="text-[10px] text-blue-500 hover:text-blue-600 font-bold">Promote</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Group Section */}
      {isOwner && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => {
              if (confirm("Are you sure you want to delete this group?")) {
                deleteWorkspace(selectedWorkspace._id);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition"
          >
            Delete Group
          </button>
        </div>
      )}

      {/* Invite Member Drawer Footer */}
      <div className="p-3 bg-slate-100 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between rounded-xl bg-slate-200/50 dark:bg-slate-850 p-2 border border-slate-200 dark:border-slate-800/50">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Invite Link</span>
            <span className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold truncate select-all cursor-pointer">
              Blink.chat/{selectedWorkspace.name.toLowerCase().replace(/\s+/g, "-")}
            </span>
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Create Topic</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-5">
              Configure a dedicated topic for focused group chats, real-time polls, or resource galleries.
            </p>

            <form onSubmit={handleCreateChannel} className="space-y-4">
              {/* Channel Name input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Topic Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold">#</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. general"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-650 focus:border-blue-500 rounded-xl pl-8 pr-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                    autoFocus
                  />
                </div>
              </div>

              {/* Channel Type */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Topic Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "chat", label: "Text Chat", icon: <Hash className="w-3.5 h-3.5 mr-1" /> },
                    { type: "polls", label: "Polls", icon: <BarChart2 className="w-3.5 h-3.5 mr-1" /> },
                    { type: "resources", label: "Resources", icon: <FolderOpen className="w-3.5 h-3.5 mr-1" /> },
                    { type: "voice", label: "Voice", icon: <Volume2 className="w-3.5 h-3.5 mr-1" /> }
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setNewChannelType(item.type)}
                      className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition ${
                        newChannelType === item.type
                          ? "bg-blue-600/10 border-blue-500 text-blue-500 dark:text-blue-400"
                          : "bg-slate-55 dark:bg-slate-800 border-slate-200 dark:border-slate-755 text-slate-500 dark:text-slate-400 hover:border-slate-350 hover:dark:border-slate-700 hover:text-slate-700 hover:dark:text-slate-350"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateChannelModal(false)}
                  className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default WorkspaceSidebar;
