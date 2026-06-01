import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { 
  Settings, 
  LogOut, 
  Plus,
  Users,
  Bell,
  MessageSquare
} from "lucide-react";

const SidebarRail = ({ activeTab = "chats", setActiveTab = () => {}, forceShow = false }) => {
  const { logout, authUser } = useAuthStore();
  const { 
    workspaces, 
    selectedWorkspace, 
    setSelectedWorkspace, 
    createWorkspace 
  } = useChatStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [selectedGradient, setSelectedGradient] = useState("linear-gradient(135deg, #a855f7 0%, #ec4899 100%)");

  const gradients = [
    { label: "Indigo Mist", value: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" },
    { label: "Sunset Glow", value: "linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)" },
    { label: "Ocean Breeze", value: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" },
    { label: "Emerald Spark", value: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)" },
    { label: "Purple Nebula", value: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" }
  ];

  const handleCreateServer = (e) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    createWorkspace(newServerName.trim(), selectedGradient);
    setNewServerName("");
    setShowCreateModal(false);
  };

  const getWorkspaceInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    const showChats = () => { setSelectedWorkspace(null); setActiveTab("chats"); };
    const showUsers = () => { setSelectedWorkspace(null); setActiveTab("users"); };
    const showNotifs = () => { setSelectedWorkspace(null); setActiveTab("notifications"); };
    const createWS = () => setShowCreateModal(true);

    window.addEventListener("sidebar-tab-chats", showChats);
    window.addEventListener("sidebar-tab-users", showUsers);
    window.addEventListener("sidebar-tab-notifications", showNotifs);
    window.addEventListener("sidebar-create-server", createWS);

    return () => {
      window.removeEventListener("sidebar-tab-chats", showChats);
      window.removeEventListener("sidebar-tab-users", showUsers);
      window.removeEventListener("sidebar-tab-notifications", showNotifs);
      window.removeEventListener("sidebar-create-server", createWS);
    };
  }, [setActiveTab, setSelectedWorkspace]);

  return (
    <>
      <aside data-context="sidebar" className={`${forceShow ? "flex" : "hidden lg:flex"} flex-col items-center py-5 w-16 h-full bg-slate-900 border-r border-slate-800 justify-between flex-shrink-0 z-30 select-none transition-colors duration-200`}>
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Chats / Home */}
<button
             onClick={() => {
               setSelectedWorkspace(null);
               setActiveTab("chats");
             }}
             className="relative group flex items-center justify-center w-full focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl"
             aria-label="Direct Messages"
             aria-current={activeTab === "chats" && selectedWorkspace === null}
           >
             <span
               className={`absolute left-0 w-1 bg-white rounded-r-md transition-all duration-300 ${
                 activeTab === "chats" && selectedWorkspace === null
                   ? "h-8"
                   : "h-0 group-hover:h-3"
               }`}
             />
             <div
               className={`size-12 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${
                 activeTab === "chats" && selectedWorkspace === null
                   ? "rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#0080FF] text-white shadow-lg shadow-primary/20"
                   : "rounded-2xl bg-slate-800 text-slate-400 hover:rounded-xl hover:bg-slate-700 hover:text-white"
               }`}
             >
               <MessageSquare size={22} fill={activeTab === "chats" ? "currentColor" : "none"} aria-hidden="true" />
             </div>
             <span className="sr-only">Direct Messages</span>
           </button>

          {/* Friends Tab */}
<button
             onClick={() => {
               setSelectedWorkspace(null);
               setActiveTab("users");
             }}
             className="relative group flex items-center justify-center w-full focus:outline-none rounded-xl"
             aria-label="Friends"
             aria-current={activeTab === "users"}
           >
             <span
               className={`absolute left-0 w-1 bg-white rounded-r-md transition-all duration-300 ${
                 activeTab === "users"
                   ? "h-8"
                   : "h-0 group-hover:h-3"
               }`}
             />
             <div
               className={`size-12 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${
                 activeTab === "users"
                   ? "rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#0080FF] text-white shadow-lg shadow-primary/20"
                   : "rounded-2xl bg-slate-800 text-slate-400 hover:rounded-xl hover:bg-slate-700 hover:text-white"
               }`}
             >
               <Users size={22} fill={activeTab === "users" ? "currentColor" : "none"} aria-hidden="true" />
             </div>
             <span className="sr-only">Friends</span>
           </button>

          {/* Notifications Tab */}
<button
             onClick={() => {
               setSelectedWorkspace(null);
               setActiveTab("notifications");
             }}
             className="relative group flex items-center justify-center w-full focus:outline-none rounded-xl"
             aria-label="Notifications"
             aria-current={activeTab === "notifications"}
           >
             <span
               className={`absolute left-0 w-1 bg-white rounded-r-md transition-all duration-300 ${
                 activeTab === "notifications"
                   ? "h-8"
                   : "h-0 group-hover:h-3"
               }`}
             />
             <div
               className={`size-12 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${
                 activeTab === "notifications"
                   ? "rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#0080FF] text-white shadow-lg shadow-primary/20"
                   : "rounded-2xl bg-slate-800 text-slate-400 hover:rounded-xl hover:bg-slate-700 hover:text-white"
               }`}
             >
               <Bell size={22} fill={activeTab === "notifications" ? "currentColor" : "none"} aria-hidden="true" />
             </div>
             <span className="sr-only">Notifications</span>
           </button>

          <div className="w-8 h-[2px] bg-slate-800 rounded-full" />

          <div className="flex flex-col gap-3 w-full items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="relative group flex items-center justify-center w-full focus:outline-none"
            >
              <div className="size-12 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl hover:rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-emerald-600 transition-all duration-300 cursor-pointer">
                <Plus className="w-5 h-5" />
              </div>
              <span className="absolute left-[70px] px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800 opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap z-50">
                Create a Group
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 w-full px-2 mt-auto">
          {authUser && (
            <Link 
              to="/profile" 
              className="relative rounded-full ring-2 ring-slate-800 hover:ring-primary transition-all duration-200 overflow-hidden size-10 flex-shrink-0"
              title="View Profile"
            >
              <img 
                src={authUser.profilePic || "/avatar.png"} 
                alt="profile" 
                className="w-full h-full object-cover"
              />
            </Link>
          )}

          <Link 
            to="/settings" 
            className="relative size-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 group" 
            title="Settings"
          >
            <Settings className="w-5 h-5" />
            <span className="absolute left-[70px] bg-slate-950 text-white text-xs rounded py-1 px-2 opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap z-50">Settings</span>
          </Link>

          <button 
            onClick={logout}
            className="relative size-10 flex items-center justify-center rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-950/20 transition-all duration-200 group" 
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-[70px] bg-slate-950 text-white text-xs rounded py-1 px-2 opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 whitespace-nowrap z-50">Logout</span>
          </button>
        </div>
      </aside>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-surface-dark border border-border-dark rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-xl font-bold text-slate-100 mb-2">Create Your Group</h2>
            <p className="text-slate-400 text-sm mb-6">
              Your group is where you and your team communicate. Customize it with a name and a vibrant theme.
            </p>

            <form onSubmit={handleCreateServer} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Pioneers"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-primary rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Group Theme Gradient
                </label>
                <div className="flex gap-3 flex-wrap">
                  {gradients.map((grad) => (
                    <button
                      key={grad.label}
                      type="button"
                      onClick={() => setSelectedGradient(grad.value)}
                      className={`size-10 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedGradient === grad.value
                          ? "border-white scale-110 shadow-lg shadow-white/10"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ background: grad.value }}
                      title={grad.label}
                    >
                      {selectedGradient === grad.value && (
                        <div className="size-2 bg-white rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-dark active:opacity-90 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 transition"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarRail;

