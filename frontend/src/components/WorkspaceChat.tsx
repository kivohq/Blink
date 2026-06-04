import PinnedMessagesPanel from "./PinnedMessagesPanel";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { 
  Hash, 
  Megaphone, 
  BarChart2, 
  FolderOpen, 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  Plus, 
  Download, 
  Users,
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  PhoneOff,
  Brain,
  X,
  FileText,
  HelpCircle,
  TrendingUp,
  Loader
} from "lucide-react";
import toast from "react-hot-toast";

// Date formatting helper
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

const isSameDay = (d1, d2) => {
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
};

const WorkspaceChat = ({ onBurgerClick }) => {
  const { 
    selectedWorkspace, 
    selectedChannelId, 
    workspaceMessages, 
    workspacePolls, 
    workspaceResources,
    sendChannelMessage,
    addChannelReaction,
    createPoll,
    voteInPoll,
    uploadResource,
    channelTypingUsers
  } = useChatStore();

  const { authUser, socket } = useAuthStore();

  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socket && selectedWorkspace && selectedChannelId) {
        socket.emit("channelStopTyping", { workspaceId: selectedWorkspace._id, channelId: selectedChannelId });
      }
    };
  }, [selectedChannelId, selectedWorkspace, socket]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (socket && selectedWorkspace && selectedChannelId) {
      socket.emit("channelTyping", { workspaceId: selectedWorkspace._id, channelId: selectedChannelId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("channelStopTyping", { workspaceId: selectedWorkspace._id, channelId: selectedChannelId });
      }, 2000);
    }
  };

  // Poll Form State
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // AI Drawer Collapsible
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiConversation, setAiConversation] = useState([
    {
      sender: "ai",
      text: "Hello! I am your Blink Workspace AI. I can summarize this channel, list action items, or answer questions about your team's discussion. What would you like to know?"
    }
  ]);

  // Voice Room State (Mocked with local speaking toggles & joining)
  const [inVoiceRoom, setInVoiceRoom] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState([]);
  const speakerIntervalRef = useRef(null);

  // File drag & drop state
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Find active channel
  const channel = selectedWorkspace?.channels?.find((c) => c._id === selectedChannelId);
  const messages = useMemo(() => workspaceMessages[selectedChannelId] || [], [workspaceMessages, selectedChannelId]);
  const polls = useMemo(() => workspacePolls[selectedChannelId] || [], [workspacePolls, selectedChannelId]);
  const resources = useMemo(() => workspaceResources[selectedChannelId] || [], [workspaceResources, selectedChannelId]);

  // Scroll to bottom on message change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, channelTypingUsers]);

  const getTypingUsersText = () => {
    if (!selectedWorkspace || !selectedWorkspace.members) return "";
    const names = channelTypingUsers
      .map((userId) => {
        const member = selectedWorkspace.members.find(
          (m) => typeof m === "object" && m !== null && m._id === userId
        );
        return member && typeof member === "object" ? member.fullName : "Someone";
      })
      .filter(Boolean);

    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]} are typing...`;
  };

  // Voice Room Speaker simulation
  useEffect(() => {
    if (inVoiceRoom && !isMuted) {
      // Mock other members and current user speaking periodically
      speakerIntervalRef.current = setInterval(() => {
        const potentialSpeakers = [];
        if (selectedWorkspace?.members) {
          selectedWorkspace.members.forEach(member => {
            if (Math.random() > 0.6) {
              potentialSpeakers.push(member._id);
            }
          });
        }
        setActiveSpeakers(potentialSpeakers);
      }, 3000);
    } else {
      clearInterval(speakerIntervalRef.current);
      setActiveSpeakers([]);
    }
    return () => clearInterval(speakerIntervalRef.current);
  }, [inVoiceRoom, isMuted, selectedWorkspace]);

  if (!selectedWorkspace || !channel) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-slate-950 text-slate-400">
        <Loader className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <span>Loading Group...</span>
      </div>
    );
  }

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    toast.success(`Selected file: ${file.name}`);
  };

  // Handle image select
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  // Submit Text/Image Channel Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedImage && !selectedFile) return;

    if (socket && selectedWorkspace && selectedChannelId) {
      socket.emit("channelStopTyping", { workspaceId: selectedWorkspace._id, channelId: selectedChannelId });
    }

    try {
      // For channel messages, we can pass text & file. If image is selected, it's passed as a file/attachment
      const attachment = selectedFile || selectedImage;
      await sendChannelMessage(selectedWorkspace._id, selectedChannelId, text, attachment);
      setText("");
      removeSelectedImage();
      removeSelectedFile();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Poll creation
  const handleLaunchPoll = async (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) {
      toast.error("Poll question is required");
      return;
    }
    const activeOpts = pollOptions.filter(o => o.trim() !== "");
    if (activeOpts.length < 2) {
      toast.error("At least two options are required");
      return;
    }
    await createPoll(selectedWorkspace._id, selectedChannelId, pollQuestion.trim(), activeOpts);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const handleAddPollOptionInput = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const handleRemovePollOptionInput = (index) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  // File Upload drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      await uploadResource(selectedWorkspace._id, selectedChannelId, file);
    }
  };

  // AI Drawer Submit query
  const handleSendAiQuery = (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const userMsg = { sender: "user", text: aiQuery };
    setAiConversation((prev) => [...prev, userMsg]);
    setAiQuery("");

    // Simulate AI response based on keywords
    setTimeout(() => {
      let aiText = "I've analyzed the recent activity in this channel. ";
      const queryLower = userMsg.text.toLowerCase();

      if (queryLower.includes("summary") || queryLower.includes("summarize")) {
        aiText += `Here is a summary of the **#${channel.name}** channel:\n- Users are collaborating on dark mode specs.\n- Active poll shows strong consensus on Neon Glassmorphism.\n- Files uploaded include UI specs. No major blocks detected.`;
      } else if (queryLower.includes("action") || queryLower.includes("todo")) {
        aiText += `Here are the active action items:\n1. Update primary gradient theme details.\n2. Complete voice channel layout tests.`;
      } else if (queryLower.includes("members") || queryLower.includes("who")) {
        aiText += `There are ${selectedWorkspace.members?.length || 0} members active in this workspace server. The channel owners are actively reviewing layouts.`;
      } else {
        aiText += `Based on the workspace contents for **${selectedWorkspace.name}**, this channel (#${channel.name}) has active conversations. Let me know if you need summaries of recent uploads or poll status updates!`;
      }

      setAiConversation((prev) => [...prev, { sender: "ai", text: aiText }]);
    }, 1000);
  };

  const renderChannelContent = () => {
    switch (channel.type) {
      case "chat":
      case "announcements":
        return (
          <div className="flex-1 flex flex-col overflow-hidden">
            <PinnedMessagesPanel channelId={selectedChannelId} />
            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-bg-pattern scrollbar-thin">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                  <div className="p-4 rounded-full bg-slate-900 border border-slate-800 mb-3">
                    {channel.type === "announcements" ? (
                      <Megaphone className="w-8 h-8 text-indigo-400" />
                    ) : (
                      <Hash className="w-8 h-8 text-blue-400" />
                    )}
                  </div>
                  <h4 className="font-bold text-slate-300">Welcome to #{channel.name}!</h4>
                  <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
                    {channel.topic || "This is the start of this channel."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map((msg, index) => {
                    const isOwn = msg.senderId?._id === authUser._id;
                    const showDate = index === 0 || !isSameDay(msg.createdAt, messages[index - 1].createdAt);
                    
                    return (
                      <div key={msg._id} className="space-y-2">
                        {showDate && (
                          <div className="flex items-center justify-center my-6">
                            <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] font-bold text-slate-400 tracking-wider">
                              {formatDateLabel(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        <div className={`flex gap-3 items-start group ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                          <img
                            src={msg.senderId?.profilePic || "/avatar.png"}
                            alt={msg.senderId?.fullName || "User"}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800 shadow-md"
                          />

                          <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                            {/* Author Info */}
                            <div className="flex items-center gap-1.5 px-1 mb-1 text-[11px] text-slate-400 font-semibold">
                              <span className="font-bold text-slate-200">{msg.senderId?.fullName || "Unknown User"}</span>
                              <span>•</span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {/* Message Bubble */}
                            <div 
                              className={`p-3.5 rounded-2xl border text-sm font-medium shadow-sm transition duration-200 leading-relaxed ${
                                isOwn 
                                  ? "bg-blue-600 border-blue-500 text-white rounded-tr-none" 
                                  : "bg-slate-900 border-slate-800 text-slate-100 rounded-tl-none"
                              }`}
                            >
                              {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                              {/* Uploaded File preview inside chat */}
                              {msg.file && (
                                <div className="mt-2.5 flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/80">
                                  <FileText className="w-8 h-8 text-blue-400" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[180px]">
                                      {msg.file.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {(msg.file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  </div>
                                  <a 
                                    href={msg.file.url} 
                                    download 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="ml-auto p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              )}
                              
                              {/* Attached image preview */}
                              {msg.image && (
                                <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-800 max-w-xs">
                                  <img src={msg.image} alt="Attachment" className="w-full h-auto object-cover" />
                                </div>
                              )}
                            </div>

                            {/* Reactions panel */}
                            <div className="flex gap-1.5 flex-wrap mt-1.5">
                              {msg.reactions && Object.entries(msg.reactions).map(([emoji, voters]) => {
                                if (!voters || voters.length === 0) return null;
                                const userReacted = voters.includes(authUser._id);
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => addChannelReaction(selectedChannelId, msg._id, emoji)}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold transition ${
                                      userReacted
                                        ? "bg-blue-600/10 border-blue-500 text-blue-400"
                                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    <span>{voters.length}</span>
                                  </button>
                                );
                              })}
                              
                              {/* Quick reaction helper */}
                              <div className="opacity-0 group-hover:opacity-100 transition duration-150 flex gap-1">
                                {["👍", "❤️", "🔥", "🚀"].map(em => (
                                  <button
                                    key={em}
                                    onClick={() => addChannelReaction(selectedChannelId, msg._id, em)}
                                    className="size-6 rounded-full bg-slate-900 border border-slate-850 hover:bg-slate-800 flex items-center justify-center text-xs transition duration-100"
                                  >
                                    {em}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Typing status bar */}
            {channelTypingUsers.length > 0 && (
              <div className="px-4 py-1.5 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400 font-medium">
                <span className="text-emerald-500 font-bold animate-pulse">
                  {getTypingUsersText()}
                </span>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex flex-col gap-2.5 z-10">
              {/* Previews if any */}
              {imagePreview && (
                <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 w-fit">
                  <div className="relative size-12 rounded-lg overflow-hidden border border-slate-750">
                    <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                    <button 
                      type="button" 
                      onClick={removeSelectedImage} 
                      className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{selectedImage?.name}</span>
                </div>
              )}

              {selectedFile && (
                <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 w-fit">
                  <FileText className="w-8 h-8 text-blue-400" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{selectedFile.name}</span>
                    <span className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={removeSelectedFile} 
                    className="p-1 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="size-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition focus:ring-2 focus:ring-blue-500"
                  title="Attach Image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  className="hidden"
                  onChange={handleImageChange}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="size-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition focus:ring-2 focus:ring-blue-500"
                  title="Attach File"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  maxLength={1024}
                  onChange={handleTextChange}
                  className="flex-1 bg-slate-800 border border-slate-700 hover:border-slate-650 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 transition"
                />

                <button
                  type="submit"
                  disabled={!text.trim() && !selectedImage && !selectedFile}
                  className="size-10 flex items-center justify-center rounded-xl bg-blue-650 hover:bg-blue-700 disabled:bg-slate-800 text-white disabled:text-slate-500 transition shadow-lg focus:ring-2 focus:ring-blue-500"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        );
      
      case "polls":
        return (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
            {/* Poll Dashboard View */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-slate-200 text-[15px]">Active Server Polls</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                  {polls.length} Polls Launched
                </span>
              </div>

              {polls.length === 0 ? (
                <div className="h-[250px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <HelpCircle className="w-8 h-8 text-slate-600 mb-2" />
                  <span className="text-sm font-semibold">No polls launched yet.</span>
                  <span className="text-[11px] text-slate-600 mt-0.5">Use the creator panel to launch the first team poll.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {polls.map((poll) => {
                    // Compute total votes
                    const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);
                    
                    return (
                      <div 
                        key={poll._id} 
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
                      >
                        {/* Creator info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src={poll.creatorId?.profilePic || "/avatar.png"} 
                              alt="creator" 
                              className="size-7 rounded-full object-cover ring-1 ring-slate-800"
                            />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-300 leading-none">{poll.creatorId?.fullName || "Workspace Admin"}</span>
                              <span className="text-[9px] text-slate-500 mt-0.5">{new Date(poll.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-850/80">
                            {totalVotes} {totalVotes === 1 ? "Vote" : "Votes"}
                          </span>
                        </div>

                        {/* Question */}
                        <h4 className="font-bold text-slate-200 text-sm leading-snug">
                          {poll.question}
                        </h4>

                        {/* Options */}
                        <div className="space-y-2.5">
                          {poll.options.map((opt) => {
                            const optVotes = opt.votes?.length || 0;
                            const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                            const hasVoted = opt.votes?.includes(authUser._id);

                            return (
                              <button
                                key={opt._id}
                                onClick={() => voteInPoll(selectedWorkspace._id, selectedChannelId, poll._id, opt._id)}
                                className={`w-full text-left rounded-xl p-3 border relative overflow-hidden transition group focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                  hasVoted 
                                    ? "bg-indigo-600/5 border-indigo-500/80 text-slate-100"
                                    : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700"
                                }`}
                              >
                                {/* Percentage fill layer */}
                                <div 
                                  className={`absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-r-md ${
                                    hasVoted ? "bg-indigo-500/10" : "bg-slate-800/40"
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />

                                {/* Option Text & Metrics */}
                                <div className="relative z-10 flex items-center justify-between text-xs font-semibold">
                                  <div className="flex items-center gap-2 min-w-0 pr-4">
                                    <div className={`size-3.5 rounded-full border flex items-center justify-center transition-colors ${
                                      hasVoted 
                                        ? "border-indigo-400 bg-indigo-500 text-white" 
                                        : "border-slate-700 bg-slate-900 group-hover:border-slate-500"
                                    }`}>
                                      {hasVoted && <div className="size-1.5 bg-white rounded-full" />}
                                    </div>
                                    <span className="truncate">{opt.text}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={hasVoted ? "text-indigo-400" : "text-slate-400"}>{percentage}%</span>
                                    <span className="text-[10px] text-slate-500">({optVotes})</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Poll Creator Sidebar (Desktop right, mobile stacked) */}
            <div className="w-full lg:w-80 bg-slate-900/50 border-t lg:border-t-0 lg:border-l border-slate-850 p-5 space-y-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-200 text-sm">Launch Team Poll</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Create real-time surveys to gather immediate feedback on layouts, code specifications, or meetings.
              </p>

              <form onSubmit={handleLaunchPoll} className="space-y-4">
                {/* Question */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Poll Question</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Which button layout is better?"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 hover:border-slate-650 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-blue-550/20 transition"
                  />
                </div>

                {/* Option Fields */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Poll Options</label>
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[i] = e.target.value;
                          setPollOptions(updated);
                        }}
                        className="flex-grow bg-slate-800 border border-slate-700 hover:border-slate-650 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-blue-550/20 transition"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOptionInput(i)}
                          className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition"
                          title="Remove option"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddPollOptionInput}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition focus:outline-none"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Option</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/10 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Create & Launch Poll
                </button>
              </form>
            </div>
          </div>
        );
      
      case "resources":
        return (
          <div 
            className={`flex-grow flex flex-col p-5 overflow-hidden bg-slate-950 transition-colors ${
              isDragging ? "bg-slate-900 border-2 border-dashed border-indigo-500/80" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag & Drop File Upload Overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
                <div className="p-5 rounded-full bg-indigo-600/10 border border-indigo-500 animate-bounce mb-3">
                  <Paperclip className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Drop your file here</h3>
                <p className="text-xs text-slate-500 mt-1">Upload automatically to the workspace server stream</p>
              </div>
            )}

            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-850 pb-4 mb-5 flex-shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-slate-200 text-[15px]">Shared Resources & Documents</h3>
                </div>
                <p className="text-[11px] text-slate-500">Drag & drop files anywhere in the panel to instantly upload.</p>
              </div>

              {/* Upload trigger button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/10 transition active:scale-[0.98] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    await uploadResource(selectedWorkspace._id, selectedChannelId, file);
                  }
                }}
              />
            </div>

            {/* Main File Stream Gallery Grid */}
            <div className="flex-grow overflow-y-auto scrollbar-thin">
              {resources.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <FolderOpen className="w-8 h-8 text-slate-700 mb-2" />
                  <span className="text-sm font-semibold">No resource documents shared yet.</span>
                  <span className="text-[11px] text-slate-600 mt-0.5">Drag files in or click Upload to publish shared sheets.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
                  {resources.map((res) => {
                    const isPdf = res.type?.includes("pdf");
                    const isImg = res.type?.includes("image");
                    const isZip = res.type?.includes("zip") || res.type?.includes("rar");
                    
                    return (
                      <div 
                        key={res._id} 
                        className="bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm transition hover:-translate-y-0.5 duration-200 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                            isPdf ? "bg-red-500/10 text-red-400" :
                            isImg ? "bg-blue-500/10 text-blue-400" :
                            isZip ? "bg-yellow-500/10 text-yellow-400" : "bg-slate-800 text-slate-400"
                          }`}>
                            <FileText className="w-6 h-6" />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-200 text-xs truncate group-hover:text-blue-400 transition" title={res.name}>
                              {res.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                              {(res.size / 1024 / 1024).toFixed(2)} MB • {res.type ? res.type.split("/")[1]?.toUpperCase() : "DOC"}
                            </span>
                          </div>
                        </div>

                        {/* Uploader Card & Action buttons */}
                        <div className="flex items-center justify-between border-t border-slate-850 mt-4 pt-3 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <img 
                              src={res.uploadedBy?.profilePic || "/avatar.png"} 
                              alt="avatar" 
                              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-850"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold text-slate-350 truncate max-w-[80px]">
                                {res.uploadedBy?.fullName || "Admin"}
                              </span>
                              <span className="text-[8px] text-slate-500">
                                {new Date(res.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <a 
                            href={res.url} 
                            download 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 rounded-xl bg-slate-850 hover:bg-indigo-650 hover:text-white text-slate-400 transition flex items-center justify-center"
                            title="Download document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      
      case "voice":
        return (
          <div className="flex-grow flex flex-col items-center justify-center p-5 bg-slate-950 text-slate-400 relative overflow-hidden">
            {/* Audio wave grid bg animation */}
            <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none">
              <div className="size-[500px] border border-blue-500 rounded-full animate-ping duration-3000" />
            </div>

            <div className="max-w-md w-full bg-slate-900 border border-slate-850 rounded-3xl p-6 text-center space-y-6 shadow-2xl relative z-10">
              <div className="mx-auto size-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Volume2 className="w-8 h-8 animate-pulse" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-bold text-slate-200 text-lg">Voice Room: #{channel.name}</h3>
                <p className="text-xs text-slate-500">Low-latency, encrypted peer communication server.</p>
              </div>

              {/* Members in Voice Room */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  <span>Participants</span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {inVoiceRoom ? (selectedWorkspace.members?.length || 1) : 0} Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {inVoiceRoom ? (
                    <>
                      {/* Current User */}
                      <div className={`p-3 rounded-2xl border flex flex-col items-center gap-2 bg-slate-950/40 transition-all ${
                        !isMuted && Math.random() > 0.4 ? "border-emerald-500/50 shadow-md shadow-emerald-500/5" : "border-slate-850"
                      }`}>
                        <div className="relative">
                          <img 
                            src={authUser.profilePic || "/avatar.png"} 
                            alt="you" 
                            className="size-10 rounded-full object-cover border-2 border-indigo-500"
                          />
                          {!isMuted && Math.random() > 0.4 && (
                            <div className="absolute -inset-0.5 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">You</span>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-wide">
                          {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                          <span>{isMuted ? "Muted" : "Speaking"}</span>
                        </div>
                      </div>

                      {/* Mocked other participants */}
                      {selectedWorkspace.members?.filter(m => m._id !== authUser._id).map((member) => {
                        const isSpeaking = activeSpeakers.includes(member._id);
                        return (
                          <div 
                            key={member._id}
                            className={`p-3 rounded-2xl border flex flex-col items-center gap-2 bg-slate-950/40 transition-all ${
                              isSpeaking ? "border-emerald-500/50 shadow-md shadow-emerald-500/5" : "border-slate-850"
                            }`}
                          >
                            <div className="relative">
                              <img 
                                src={member.profilePic || "/avatar.png"} 
                                alt={member.fullName} 
                                className="size-10 rounded-full object-cover"
                              />
                              {isSpeaking && (
                                <div className="absolute -inset-0.5 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">{member.fullName}</span>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-wide">
                              <Mic className={`w-3 h-3 ${isSpeaking ? "text-emerald-400" : "text-slate-655"}`} />
                              <span>{isSpeaking ? "Speaking" : "Quiet"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="col-span-2 py-8 text-center text-xs text-slate-600 font-semibold italic">
                      Join voice room to connect.
                    </div>
                  )}
                </div>
              </div>

              {/* Action connection controller */}
              <div className="flex justify-center gap-3 pt-2">
                {inVoiceRoom ? (
                  <>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`size-12 rounded-2xl flex items-center justify-center transition border active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/25 ${
                        isMuted 
                          ? "bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20" 
                          : "bg-slate-800 border-slate-750 text-slate-350 hover:bg-slate-700"
                      }`}
                      title={isMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={() => setInVoiceRoom(false)}
                      className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-650/20 border border-red-500 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>Leave Call</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setInVoiceRoom(true);
                      toast.success("Joined low-latency voice room.");
                    }}
                    className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-650/20 border border-indigo-500 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Join Voice Room
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500">
            Channel layout not found.
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-slate-950 select-text">
      {/* Main Channel Layout */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="h-16 px-4 border-b border-slate-850 bg-slate-900 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-2">
            {/* Mobile Burger Menu Button */}
            <button
              onClick={onBurgerClick}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Workspace Menu"
            >
              <Users className="w-5 h-5" />
            </button>
            <div className="flex items-center text-slate-100 font-bold text-sm">
              {channel.type === "announcements" ? (
                <Megaphone className="w-4 h-4 text-indigo-400 mr-1.5" />
              ) : channel.type === "polls" ? (
                <BarChart2 className="w-4 h-4 text-indigo-400 mr-1.5" />
              ) : channel.type === "resources" ? (
                <FolderOpen className="w-4 h-4 text-emerald-400 mr-1.5" />
              ) : channel.type === "voice" ? (
                <Volume2 className="w-4 h-4 text-indigo-400 mr-1.5" />
              ) : (
                <Hash className="w-4 h-4 text-blue-400 mr-1.5" />
              )}
              <span>{channel.name}</span>
            </div>
            
            {channel.topic && (
              <>
                <span className="hidden sm:inline text-slate-600">|</span>
                <span className="hidden sm:inline text-xs text-slate-450 truncate max-w-[280px]">
                  {channel.topic}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* AI Assistant Toggle Button */}
            <button
              onClick={() => setShowAiDrawer(!showAiDrawer)}
              className={`size-9 rounded-xl flex items-center justify-center transition focus:ring-2 focus:ring-blue-500 ${
                showAiDrawer
                  ? "bg-blue-600/10 text-blue-400 border border-blue-550"
                  : "text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent"
              }`}
              title="Toggle Workspace AI Coach"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Box */}
        {renderChannelContent()}
      </div>

      {/* Panel 4: AI Context Sidebar Drawer */}
      {showAiDrawer && (
        <aside className="w-80 h-full bg-slate-900 border-l border-slate-850 flex flex-col z-35 flex-shrink-0 animate-in slide-in-from-right duration-200">
          <div className="h-16 px-4 border-b border-slate-850 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">Workspace AI Copilot</span>
            </div>
            <button 
              onClick={() => setShowAiDrawer(false)} 
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* AI Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {/* Insights panel widget */}
            <div className="p-3.5 rounded-2xl bg-indigo-650/5 border border-indigo-500/10 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Live Channel Insights</span>
              </h4>
              <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed font-semibold">
                <p>• Current discussion focus: **dark mode UI parameters**.</p>
                <p>• Sentiment score: **89% positive** (collaborative feedback).</p>
                <p>• Shared assets: **1 Spec sheet** discovered in files.</p>
              </div>
            </div>

            {/* Conversation Log */}
            <div className="space-y-3 pt-2">
              {aiConversation.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    {msg.sender === "user" ? "You" : "Blink AI"}
                  </span>
                  <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed border ${
                    msg.sender === "user" 
                      ? "bg-slate-850 border-slate-750 text-slate-200 rounded-tr-none" 
                      : "bg-indigo-600/10 border-indigo-500/10 text-slate-300 rounded-tl-none"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ask AI input footer */}
          <form onSubmit={handleSendAiQuery} className="p-3 bg-slate-900 border-t border-slate-850 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask AI about this server..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              className="flex-grow bg-slate-800 border border-slate-700 hover:border-slate-650 focus:border-blue-500 text-xs rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </aside>
      )}
    </div>
  );
};

export default WorkspaceChat;

