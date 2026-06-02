import { useChatStore } from "../../store/useChatStore";
import { X, Send, Paperclip } from "lucide-react";
import { useState } from "react";

const ThreadPanel = ({ message, onClose }) => {
  const { threadMessages, replyInThread } = useChatStore();
  const messages = threadMessages[message._id] || [];
  const [text, setText] = useState("");

  const handleReply = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await replyInThread(message._id, text);
    setText("");
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-850 flex flex-col z-40">
      <div className="h-16 px-4 border-b border-slate-850 flex items-center justify-between">
        <h3 className="font-bold text-slate-200">Thread</h3>
        <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-slate-800 p-3 rounded-lg text-sm text-slate-200">{message.text}</div>
        {messages.map((msg) => (
          <div key={msg._id} className="text-sm text-slate-300">
            <span className="font-bold text-slate-100">{msg.senderId?.fullName}: </span>
            {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleReply} className="p-3 border-t border-slate-850 flex gap-2">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          className="flex-grow bg-slate-800 text-slate-100 rounded-lg p-2 text-sm"
          placeholder="Reply..."
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  );
};

export default ThreadPanel;
