import { useChatStore } from "../store/useChatStore";
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Image } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const ImageLightbox = () => {
  const { 
    lightboxImage, 
    setLightboxImage,
    selectedUser,
    messages,
    selectedChannelId,
    workspaceMessages
  } = useChatStore();

  const [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
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

  if (!lightboxImage || currentIndex === -1) return null;

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

  // Keyboard navigation
  useEffect(() => {
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
  }, [currentIndex, imageUrls]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = lightboxImage;
    a.download = `blink-image-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[20000] flex flex-col justify-between bg-black/98 backdrop-blur-md animate-in fade-in duration-300 select-none">
      {/* Top Header Panel (Responsive Layout) */}
      <div className="p-3 sm:p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => setLightboxImage(null)}
            className="size-9 sm:size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
            title="Close (Esc)"
          >
            <X size={20} className="sm:w-[22px] sm:h-[22px]" />
          </button>
          <div className="flex flex-col">
            <span className="text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <Image size={14} className="text-primary hidden xs:inline" />
              Media Viewer
            </span>
            {imageUrls.length > 1 && (
              <span className="text-white/40 text-[10px] sm:text-xs font-medium">
                {currentIndex + 1} of {imageUrls.length}
              </span>
            )}
          </div>
        </div>
        
        {/* Actions Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls hidden on small mobile screens to save space (since touch pinch-zoom is standard) */}
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
            <div className="w-px h-5 bg-white/10 mx-1.5" />
          </div>

          <button 
            onClick={handleDownload}
            className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-primary text-white flex items-center gap-1.5 hover:bg-primary/90 transition-colors font-bold text-xs sm:text-sm shadow-xl active:scale-95"
          >
            <Download size={14} className="sm:w-[16px] sm:h-[16px]" />
            Download
          </button>
        </div>
      </div>

      {/* Main Image View & Side Navigation (Arrows hidden on touch/mobile viewports) */}
      <div 
        className="relative flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-16"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Navigation Arrow (Desktop Only) */}
        {imageUrls.length > 1 && currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="hidden sm:flex absolute left-6 z-10 size-11 rounded-full bg-black/45 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 text-white items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Image Frame */}
        <div 
          className="size-full flex items-center justify-center overflow-auto p-2 sm:p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <img 
            src={lightboxImage} 
            alt="" 
            className="max-w-full max-h-[65vh] sm:max-h-[75vh] object-contain transition-all duration-200 shadow-2xl rounded-lg"
            style={{ transform: `scale(${zoom})` }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Right Navigation Arrow (Desktop Only) */}
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

      {/* Bottom Panel (Responsive Thumbnail Strip & Interaction Tips) */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-3 sm:gap-4">
        {imageUrls.length > 1 && (
          <div 
            ref={thumbnailContainerRef}
            className="flex items-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto p-1.5 sm:p-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl scrollbar-none"
          >
            {imageUrls.map((url, index) => (
              <button
                key={url + "-" + index}
                onClick={() => setLightboxImage(url)}
                className={`relative size-11 sm:size-14 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 transition-all border-2 ${
                  index === currentIndex 
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
    </div>
  );
};

export default ImageLightbox;
