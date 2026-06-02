import { useChatStore } from "../../store/useChatStore";
import { Pin } from "lucide-react";

const PinnedMessagesPanel = ({ channelId }) => {
  const { workspaceMessages, togglePinWorkspaceMessage } = useChatStore();
  const messages = workspaceMessages[channelId] || [];
  const pinnedMessages = messages.filter((msg) => msg.isPinned);

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
        <Pin className="w-3.5 h-3.5" />
        Pinned Messages ({pinnedMessages.length})
      </h3>
      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
        {pinnedMessages.map((msg) => (
          <div key={msg._id} className="bg-slate-800/50 p-2 rounded-lg flex items-start justify-between gap-2">
            <p className="text-xs text-slate-300 truncate">{msg.text || "📎 Attachment"}</p>
            <button
              onClick={() => togglePinWorkspaceMessage(msg._id)}
              className="text-slate-500 hover:text-red-400"
              title="Unpin message"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinnedMessagesPanel;
