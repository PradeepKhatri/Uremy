const VideoModal = ({ open, Close, playingVideo, setPlayingVideo }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/85 backdrop-blur-md transition-opacity duration-200"
      onClick={(e) => {
        // Close when clicking outside modal content
        if (e.target === e.currentTarget) setPlayingVideo(null);
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">
              Now Playing
            </span>
            <h3 className="text-base font-semibold text-white truncate">
              {playingVideo.title}
            </h3>
          </div>
          <button
            onClick={() => setPlayingVideo(null)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-semibold px-3 py-1.5 transition-colors shrink-0"
          >
            ✕ Close
          </button>
        </div>

        {/* Video Container (Expanded & Centered) */}
        <div className="p-4 sm:p-6 bg-slate-950 flex-1 flex flex-col items-center justify-center overflow-hidden">
          <div className="w-full aspect-video bg-black rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-lg">
            {videoUrl ? (
              <video
                controls
                autoPlay
                playsInline
                preload="metadata"
                src={videoUrl}
                className="w-full h-full object-contain"
                onError={() => {
                  setUrlError(
                    "Video load failed. Check if your Cloudflare R2 bucket CORS settings allow your domain origin, or if the presigned URL has expired.",
                  );
                }}
              />
            ) : (
              <div className="text-slate-400 text-sm animate-pulse p-4">
                Generating secure video stream...
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 truncate">
            Status:{" "}
            <span
              className={
                playingVideo.status == "completed"
                  ? "text-emerald-400 font-medium"
                  : "text-amber-400 font-medium"
              }
            >
              {playingVideo.status == "completed" ? "Completed" : "In Progress"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
