import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const CourseDetailPage = ({ title = "Striver System Design" }) => {
  const { token } = useAuth();

  const [videos, setVideos] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [playingVideo, setPlayingVideo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState("");

  const totalVideos = videos.length;

  const completedCount = useMemo(() => {
    if (!Array.isArray(videos)) return 0;
    return videos.filter((video) => video.status === "completed").length;
  }, [videos]);

  const revisitCount = useMemo(() => {
    if (!Array.isArray(videos)) return 0;
    return videos.filter((video) => Boolean(video.revisit)).length;
  }, [videos]);

  const progressPercent =
    totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  const getVideos = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/videos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      setVideos(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error("Error getting videos:", fetchError);
      setError("Unable to load videos right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateVideoUrl = async (id) => {
    if (!token) return;

    try {
      setVideoLoadError("");
      const response = await fetch(`${API_URL}/video/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setVideoUrl(data.url || "");
      // setPlayingVideo(data)
    } catch (fetchError) {
      console.error("Error getting video:", fetchError);
      setVideoLoadError("Video could not be loaded. Please try again.");
      setVideoUrl("");
    }
  };

  const updateProgress = async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/videos/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (fetchError) {
      console.error("Error updating video progress:", fetchError);
      setError("Unable to update progress. Please try again.");
      return null;
    }
  };

  useEffect(() => {
    getVideos();
  }, [token]);

  const toggleComplete = async (id, status) => {
    const nextStatus = status === "completed" ? "pending" : "completed";

    try {
      const updatedVideo = await updateProgress(id, { status: nextStatus });

      if (!updatedVideo) {
        return;
      }

      setVideos((prev) =>
        prev.map((video) =>
          video.id === id ? { ...video, status: nextStatus } : video,
        ),
      );
    } catch (error) {
      console.error("Failed to update completion:", error);
      setError("Unable to update course progress. Please try again.");
    }
  };

  const toggleRevisit = async (id, revisit) => {
    const nextRevisit = !revisit;

    try {
      const updatedVideo = await updateProgress(id, { revisit: nextRevisit });

      if (!updatedVideo) {
        return;
      }

      setVideos((prev) =>
        prev.map((video) =>
          video.id === id ? { ...video, revisit: nextRevisit } : video,
        ),
      );
    } catch (error) {
      console.error("Failed to update revisit flag:", error);
      setError("Unable to update revisit flag. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 md:p-8 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="">
              <span className="text-slate-600 text-sm font-bold pd-3">
                Home / {title}
              </span>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {title}
              </h1>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 w-full md:w-72 shrink-0 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Total Completion</span>
                <span className="text-indigo-400 text-sm">
                  {progressPercent}%
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>
                  {completedCount} of {totalVideos} completed
                </span>
                {revisitCount > 0 && (
                  <span className="text-amber-400">{revisitCount} flagged</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-900/50 bg-rose-950/40 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th
                    scope="col"
                    className="py-3 px-4 sm:px-6 w-16 text-center"
                  >
                    Status
                  </th>
                  <th scope="col" className="py-3 px-4 sm:px-6">
                    Lecture
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-4 sm:px-6 w-36 text-center"
                  >
                    Watch
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-4 sm:px-6 w-36 text-center"
                  >
                    Revisit
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 px-6 text-center text-slate-500 text-sm"
                    >
                      Loading videos...
                    </td>
                  </tr>
                ) : videos.length > 0 ? (
                  videos.map((video) => (
                    <tr
                      key={video.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        video.status === "completed" ? "bg-slate-950/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4 sm:px-6 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={video.status === "completed"}
                          onChange={() =>
                            toggleComplete(video.id, video.status)
                          }
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer accent-indigo-600"
                        />
                      </td>

                      <td className="py-3 px-4 sm:px-6 align-middle">
                        <div className="space-y-1">
                          <div className="font-semibold text-base text-slate-100">
                            {video.title}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 sm:px-6 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => {
                            generateVideoUrl(video.id);
                            setPlayingVideo(video);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
                        >
                          <Play size={13} className="fill-current" />
                          <span>Play</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 sm:px-6 text-center align-middle">
                        <button
                          type="button"
                          onClick={() =>
                            toggleRevisit(video.id, Boolean(video.revisit))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            video.revisit
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : "bg-slate-800/40 hover:bg-slate-800 border-slate-700/50 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Re-watch
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 px-6 text-center text-slate-500 text-sm"
                    >
                      No videos available for this course yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950/60 border-t border-slate-800 px-6 py-3 text-xs text-slate-500 flex justify-between items-center">
            <span>
              Showing {videos.length} of {totalVideos || 0} videos
            </span>
            <span>Click checkboxes or revisit flags to update status.</span>
          </div>
        </div>

        {playingVideo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/85 backdrop-blur-md transition-opacity duration-200"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setPlayingVideo(null);
                setVideoUrl("");
                setVideoLoadError("");
              }
            }}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
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
                  type="button"
                  onClick={() => {
                    setPlayingVideo(null);
                    setVideoUrl("");
                    setVideoLoadError("");
                  }}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-semibold px-3 py-1.5 transition-colors shrink-0"
                >
                  ✕ Close
                </button>
              </div>

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
                        setVideoLoadError(
                          "Video load failed. Check if your Cloudflare R2 bucket CORS settings allow your domain origin, or if the presigned URL has expired.",
                        );
                      }}
                    />
                  ) : (
                    <div className="text-slate-400 text-sm animate-pulse p-4">
                      {videoLoadError || "Generating secure video stream..."}
                    </div>
                  )}
                </div>

                {videoLoadError && (
                  <div className="mt-4 w-full rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    {videoLoadError}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400 truncate">
                  Status:{" "}
                  <span
                    className={
                      playingVideo.status === "completed"
                        ? "text-emerald-400 font-medium"
                        : "text-amber-400 font-medium"
                    }
                  >
                    {playingVideo.status === "completed"
                      ? "Completed"
                      : "In Progress"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;
