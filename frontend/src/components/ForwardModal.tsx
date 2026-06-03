import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Search, Loader, Share2, Copy, Send, Mail } from "lucide-react";
import toast from "react-hot-toast";

const ForwardModal = ({ messageId, onClose, customSharedUrl = "" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [activeShareTab, setActiveShareTab] = useState<'internal' | 'external'>('internal');
  
  const { users, forwardMessage, messages } = useChatStore();
  const { authUser } = useAuthStore();

  // Find the message to get its media/file URL if any
  const msgObj = messages.find(m => m._id === messageId);
  const shareUrl = customSharedUrl || msgObj?.image || msgObj?.file?.url || "";

  const filteredUsers = users.filter(
    (user) =>
      user._id !== authUser?._id &&
      (user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleForward = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      setIsForwarding(true);
      for (const userId of selectedUsers) {
        await forwardMessage(messageId, userId);
      }
      toast.success(`Forwarded successfully!`);
      onClose();
    } catch (error) {
      console.error("Failed to forward message:", error);
      toast.error("Failed to forward message");
    } finally {
      setIsForwarding(false);
    }
  };

  // Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Shared via Blink",
          text: "Check out this media:",
          url: shareUrl
        });
        toast.success("Shared successfully!");
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  // Copy URL to Clipboard
  const handleCopyLink = () => {
    if (!shareUrl) {
      toast.error("Nothing to copy");
      return;
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  useEffect(() => {
    const handleClose = () => onClose();
    const handleSubmit = () => handleForward();
    window.addEventListener("close-active-modal", handleClose);
    window.addEventListener("submit-active-modal", handleSubmit);
    return () => {
      window.removeEventListener("close-active-modal", handleClose);
      window.removeEventListener("submit-active-modal", handleSubmit);
    };
  }, [onClose, handleForward]);

  return (
    <div data-context="modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[30000] p-4 transition-all duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 sm:p-6 shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Share Media</h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Choose distribution method</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Share Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl mb-4 gap-1.5 flex-shrink-0">
          <button
            onClick={() => setActiveShareTab('internal')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeShareTab === 'internal'
                ? "bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
            }`}
          >
            Forward in Blink
          </button>
          <button
            onClick={() => setActiveShareTab('external')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeShareTab === 'external'
                ? "bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
            }`}
          >
            External Share
          </button>
        </div>

        {/* Tab contents */}
        {activeShareTab === 'internal' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Input */}
            <div className="mb-4 flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            {/* Users List with Avatars */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1.5 scrollbar-thin mb-4">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <label
                    key={user._id}
                    className={`flex items-center gap-3.5 p-2.5 rounded-xl cursor-pointer transition-all border ${
                      selectedUsers.includes(user._id)
                        ? "bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/25"
                        : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary border-slate-300 dark:border-slate-700 rounded bg-transparent focus:ring-primary focus:ring-1 cursor-pointer"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                    />
                    <img 
                      src={user.profilePic || "/avatar.png"} 
                      alt="" 
                      className="size-8.5 rounded-full object-cover border border-slate-200 dark:border-slate-850"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-tight">
                        {user.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    {user.status === "online" && (
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                    )}
                  </label>
                ))
              ) : (
                <p className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-8">
                  {searchQuery ? "No users found" : "No users available"}
                </p>
              )}
            </div>

            {/* Selected Count & Footer Actions */}
            <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex-shrink-0 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : "Select recipients"}
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl font-bold text-xs transition-all active:scale-[0.98]"
                  disabled={isForwarding}
                >
                  Cancel
                </button>
                <button
                  onClick={handleForward}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98] shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  disabled={selectedUsers.length === 0 || isForwarding}
                >
                  {isForwarding ? (
                    <>
                      <Loader size={13} className="animate-spin" />
                      Forwarding...
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      Forward
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto">
            {/* Quick Link Card */}
            {shareUrl ? (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-850 rounded-2xl flex flex-col gap-2">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Media URL</span>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl">
                  <span className="text-xs text-blue-500 font-semibold truncate flex-1 leading-none">
                    {shareUrl}
                  </span>
                  <button 
                    onClick={handleCopyLink}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-300 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                No link available for this message.
              </div>
            )}

            {/* Platform Sharing Options Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Web Share Button */}
              <button
                onClick={handleNativeShare}
                className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-2xl transition-all group"
              >
                <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Share2 size={16} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">System Share</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Use OS Native share</p>
                </div>
              </button>

              {/* WhatsApp Share */}
              {shareUrl && (
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check this out: " + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-2xl transition-all group"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                    <svg className="size-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.022-.08-.047-.13-.08-.18-.03-.05-.08-.08-.15-.12-.08-.04-.44-.22-.51-.25-.07-.03-.12-.04-.17-.04s-.1.01-.15.08c-.05.07-.2.25-.25.31-.05.06-.09.07-.17.03-.08-.04-.32-.12-.61-.38-.23-.2-.38-.45-.43-.53-.05-.08-.01-.12.03-.16.04-.04.08-.08.12-.13.04-.05.05-.08.08-.14.03-.06.01-.12-.01-.17-.02-.05-.17-.42-.23-.57-.06-.15-.13-.13-.17-.13h-.15c-.05 0-.12.02-.19.09-.07.07-.26.26-.26.63s.27.72.3.77c.03.05.54.82 1.31 1.15.18.08.32.12.43.16.18.06.35.05.48.03.15-.02.44-.18.51-.36.06-.18.06-.34.04-.37zm.082 2.88a7.147 7.147 0 0 1-5.11 2.22 7.152 7.152 0 0 1-3.69-1.02l-.26-.16-2.75.72.74-2.68-.18-.28a7.103 7.103 0 0 1-1.09-3.79c0-3.95 3.22-7.17 7.18-7.17 1.92 0 3.72.75 5.08 2.11a7.124 7.124 0 0 1 2.12 5.06c0 3.95-3.22 7.17-7.17 7.17M12 2C6.477 2 2 6.477 2 12c0 1.886.525 3.65 1.442 5.163L2 22l5.006-1.313C8.423 21.562 10.154 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">WhatsApp</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Share in WhatsApp</p>
                  </div>
                </a>
              )}

              {/* Telegram Share */}
              {shareUrl && (
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Shared via Blink")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-2xl transition-all group"
                >
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 group-hover:bg-sky-500/20 transition-colors">
                    <svg className="size-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-.97.53-1.35.52-.42-.01-1.24-.24-1.84-.44-.74-.24-1.33-.37-1.28-.79.03-.22.33-.45.9-.69 3.52-1.53 5.87-2.54 7.05-3.03 3.35-1.39 4.05-1.63 4.5-.14.05.09.06.19.06.28z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Telegram</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Share in Telegram</p>
                  </div>
                </a>
              )}

              {/* Email Share */}
              {shareUrl && (
                <a
                  href={`mailto:?subject=Shared Media&body=${encodeURIComponent("Check out this shared media link: " + shareUrl)}`}
                  className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-2xl transition-all group"
                >
                  <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-colors">
                    <Mail size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Email</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Send via Mail client</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForwardModal;
