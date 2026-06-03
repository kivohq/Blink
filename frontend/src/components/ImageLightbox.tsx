import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Image, Play, Pause, Share2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "../lib/utils";
import ForwardModal from "./ForwardModal";

const ImageLightbox = () => {
  const { 
    lightboxImage, 
    setLightboxImage,
    selectedUser,
    messages,
    selectedChannelId,
    workspaceMessages,
    users
  } = useChatStore();

  const { authUser } = useAuthStore();

  const [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Determine active messages based on DM or Channel chat
  const activeMessages = selectedUser 
    ? messages 
    : (selectedChannelId ? (workspaceMessages[selectedChannelId] || []) : []);

  // Filter messages that contain images
  const imageMessages = activeMessages.filter(msg => 
    !msg.isDeleted && (msg.image || (msg.file && msg.file.type.startsWith("image/")))
  );

  // Extract the image URLs
  const chatImageUrls = imageMessages.map(msg => msg.image || msg.file?.url).filter(Boolean) as string[];

  // If the active image is not found in the chat messages list (e.g., viewing an avatar), default to just the single image
  const imageUrls = chatImageUrls.includes(lightboxImage || "") 
    ? chatImageUrls 
    : (lightboxImage ? [lightboxImage] : []);

  const currentIndex = imageUrls.indexOf(lightboxImage || "");
  const activeMessage = currentIndex !== -1 ? imageMessages[currentIndex] : null;

  // Reset zoom when image changes
  useEffect(() => {
    setZoom(1);
  }, [lightboxImage]);

  // Center the active thumbnail in the bottom container
  useEffect(() => {
    if (thumbnailContainerRef.current && currentIndex !== -1) {
      const activeElement = thumbnailContainerRef.current.children[currentIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex]);

  // Slideshow Autoplay Effect
  useEffect(() => {
    if (!isPlaying || imageUrls.length <= 1) return;
    const timer = setInterval(() => {
      if (currentIndex < imageUrls.length - 1) {
        setLightboxImage(imageUrls[currentIndex + 1]);
      } else {
        setLightboxImage(imageUrls[0]); // Wrap around to the start
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isPlaying, currentIndex, imageUrls]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setLightboxImage(imageUrls[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < imageUrls.length - 1) {
      setLightboxImage(imageUrls[currentIndex + 1]);
    }
  };

  // Touch Swipe Handlers for Mobile Browsers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe left (next image)
    if (diff > 60) {
      handleNext();
    }
    // Swipe right (prev image)
    if (diff < -60) {
      handlePrev();
    }
    setTouchStart(null);
  };

  // Keyboard navigation (Hook placed unconditionally at top level)
  useEffect(() => {
    if (!lightboxImage || currentIndex === -1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        setLightboxImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, imageUrls, lightboxImage]);

  const handleDownload = () => {
    if (!lightboxImage) return;
    const a = document.createElement("a");
    a.href = lightboxImage;
    a.download = `blink-image-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Helper to determine the sender info for both DMs and group workspaces
  const getSenderInfo = () => {
    if (!activeMessage) return null;
    const senderId = activeMessage.senderId;
    if (senderId === authUser?._id) {
      return {
        name: "You",
        avatar: authUser?.profilePic || "/avatar.png"
      };
    }
    const sender = users.find(u => u._id === senderId);
    if (sender) {
      return {
        name: sender.fullName,
        avatar: sender.profilePic || "/avatar.png"
      };
    }
    if (selectedUser && selectedUser._id === senderId) {
      return {
        name: selectedUser.fullName,
        avatar: selectedUser.profilePic || "/avatar.png"
      };
    }
    return {
      name: "Anonymous User",
      avatar: "/avatar.png"
    };
  };

  // Safe early return after all Hooks have been executed
  if (!lightboxImage || currentIndex === -1) return null;

  const senderInfo = getSenderInfo();
  const caption = activeMessage?.text;

  return (
    <div className="fixed inset-0 z-[20000] flex flex-col justify-between bg-black/98 backdrop-blur-md animate-in fade-in duration-300 select-none">
      {/* Top Header Panel (Responsive Layout with Autoplay, Sender info, and Forwarding controls) */}
      <div className="p-3 sm:p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-3 sm:gap-4 max-w-[60%]">
          <button 
            onClick={() => setLightboxImage(null)}
            className="size-9 sm:size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95 flex-shrink-0"
            title="Close (Esc)"
          >
            <X size={20} className="sm:w-[22px] sm:h-[22px]" />
          </button>
          
          {/* Sender Details & Relative Timestamp */}
          {senderInfo ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={senderInfo.avatar} 
                alt="" 
                className="size-7 sm:size-8 rounded-full object-cover border border-white/15 shadow-sm"
              />
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-white text-xs sm:text-sm font-semibold truncate">
                  {senderInfo.name}
                </span>
                <span className="text-white/40 text-[9px] sm:text-[11px] font-medium truncate">
                  {formatDistanceToNow(activeMessage!.createdAt)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-white text-xs sm:text-sm font-semibold">Media Viewer</span>
              {imageUrls.length > 1 && (
                <span className="text-white/40 text-[10px] sm:text-xs font-medium">
                  {currentIndex + 1} of {imageUrls.length}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Actions Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Autoplay / Slideshow control */}
          {imageUrls.length > 1 && (
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`size-8 sm:size-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                isPlaying 
                  ? "bg-primary text-white animate-pulse" 
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title={isPlaying ? "Pause Slideshow" : "Start Slideshow"}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>
          )}

          {/* Zoom controls (desktop viewports only) */}
          <div className="hidden sm:flex items-center gap-1">
            <button 
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button 
              onClick={() => setZoom(1)}
              className="px-2.5 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors active:scale-95"
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button 
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
              className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
          </div>

          {/* Quick Forward button */}
          {activeMessage && (
            <button 
              onClick={() => setIsForwardOpen(true)}
              className="size-8 sm:size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
              title="Forward Message"
            >
              <Share2 size={16} />
            </button>
          )}

          <button 
            onClick={handleDownload}
            className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-primary text-white flex items-center gap-1.5 hover:bg-primary/90 transition-colors font-bold text-xs sm:text-sm shadow-xl active:scale-95"
          >
            <Download size={14} className="sm:w-[16px] sm:h-[16px]" />
            Download
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div 
        className="relative flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-16"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Navigation Arrow */}
        {imageUrls.length > 1 && currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="hidden sm:flex absolute left-6 z-10 size-11 rounded-full bg-black/45 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 text-white items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Image Frame with caption overlay */}
        <div 
          className="size-full flex flex-col items-center justify-center overflow-auto p-2 sm:p-4 cursor-zoom-out relative"
          onClick={() => setLightboxImage(null)}
        >
          <img 
            src={lightboxImage} 
            alt="" 
            className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain transition-all duration-200 shadow-2xl rounded-lg"
            style={{ transform: `scale(${zoom})` }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Right Navigation Arrow */}
        {imageUrls.length > 1 && currentIndex < imageUrls.length - 1 && (
          <button
            onClick={handleNext}
            className="hidden sm:flex absolute right-6 z-10 size-11 rounded-full bg-black/45 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 text-white items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Next (Right Arrow)"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom Panel (Caption, Thumbnail Strip & Interaction Tips) */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-3 sm:gap-4 z-10">
        
        {/* Caption Overlay */}
        {caption && (
          <div 
            className="w-full max-w-[600px] px-4 py-3 bg-black/60 border border-white/10 backdrop-blur-md rounded-2xl text-center text-white text-sm leading-relaxed animate-in slide-in-from-bottom-3 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="line-clamp-3 overflow-y-auto max-h-[100px] select-text">
              {caption}
            </p>
          </div>
        )}

        {imageUrls.length > 1 && (
          <div 
            ref={thumbnailContainerRef}
            className="flex items-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto p-1.5 sm:p-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl scrollbar-none"
          >
            {imageUrls.map((url, idx) => (
              <button
                key={url + "-" + idx}
                onClick={() => setLightboxImage(url)}
                className={`relative size-11 sm:size-14 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 transition-all border-2 ${
                  idx === currentIndex 
                    ? "border-primary scale-110 shadow-lg ring-4 ring-primary/20" 
                    : "border-transparent opacity-40 hover:opacity-100 hover:scale-105"
                }`}
              >
                <img src={url} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
        
        <div className="text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 sm:gap-3 text-center px-4">
          <span className="hidden sm:inline">Arrow keys to browse</span>
          <span className="sm:hidden">Swipe left / right to browse</span>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <span>Double-tap or Pinch to zoom</span>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <span>Tap outside to close</span>
        </div>
      </div>

      {/* Render Forward Modal if opened */}
      {isForwardOpen && activeMessage && (
        <ForwardModal 
          messageId={activeMessage._id} 
          onClose={() => setIsForwardOpen(false)}
        />
      )}
    </div>
  );
};

export default ImageLightbox;
