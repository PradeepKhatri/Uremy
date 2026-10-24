import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  LockKeyhole,
  PlayCircle,
  Tag,
  Play,
  Lock,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

let razorpayScriptPromise;

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayScriptPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

const CourseDetailPage = () => {
  const { token } = useAuth();

  const [course, setCourse] = useState("");
  const [isEnrolled, setIsEnrolled] = useState();

  const [videos, setVideos] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [playingVideo, setPlayingVideo] = useState(null);

  const [paymentMessage, setPaymentMessage] = useState("");
  const [checkoutCourseId, setCheckoutCourseId] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState("");

  const revisitCount = useMemo(() => {
    if (!Array.isArray(videos)) return 0;
    return videos.filter((video) => Boolean(video.revisit)).length;
  }, [videos]);

  const totalVideos = videos.length;

  const progressPercent =
    totalVideos > 0
      ? Math.round((course.completedvideos / course.totalvideos) * 100)
      : 0;

  const getVideos = async (courseId) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/videos/${courseId}`, {
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

      setCourse(data.course);
      setIsEnrolled(data.isEnrolled);
      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (fetchError) {
      console.error("Error getting videos:", fetchError);
      setError("Unable to load videos right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateVideoUrl = async (courseId, id) => {
    if (!token) return;

    try {
      setVideoLoadError("");
      const response = await fetch(`${API_URL}/video/${courseId}/${id}`, {
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
    getVideos(1);
  }, [token]);

  const startCheckout = async (course) => {
    setError("");
    setPaymentMessage("");

    if (!RAZORPAY_KEY_ID) {
      setError("Checkout is not configured. Please contact support.");
      return;
    }

    setCheckoutCourseId(course.id);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(
          "Unable to load the secure checkout. Please try again.",
        );
      }

      const orderResponse = await fetch(`${API_URL}/create-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId: course.id }),
      });
      const order = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(order.error || "Unable to create payment order.");
      }

      const checkout = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Uremy",
        description: course.title,
        order_id: order.order_id,
        handler: async (paymentResponse) => {
          try {
            const verificationResponse = await fetch(
              `${API_URL}/verify-payment`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(paymentResponse),
              },
            );
            const verification = await verificationResponse.json();

            if (!verificationResponse.ok) {
              throw new Error(
                verification.error || "Payment verification failed.",
              );
            }

            setPaymentMessage(
              `Payment verified. You are enrolled in ${course.title}.`,
            );
            await getVideos(course.id);
          } catch (verificationError) {
            setError(
              verificationError.message || "Payment verification failed.",
            );
          } finally {
            setCheckoutCourseId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentMessage("Checkout was closed. No payment was completed.");
            setCheckoutCourseId(null);
          },
        },
        theme: { color: "#4f46e5" },
      });

      checkout.on("payment.failed", (failure) => {
        setError(
          failure.error?.description || "Payment failed. Please try again.",
        );
        setCheckoutCourseId(null);
      });

      checkout.open();
    } catch (checkoutError) {
      console.error("Checkout failed:", checkoutError);
      setError(checkoutError.message || "Unable to start checkout.");
      setCheckoutCourseId(null);
    }
  };

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
      <div className="max-w-7xl mx-auto space-y-8">
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-900/50 bg-rose-950/40 p-3 text-sm text-rose-300"
          >
            {error}
          </p>
        )}
        {paymentMessage && (
          <p
            role="status"
            className="rounded-lg border border-emerald-900/50 bg-emerald-950/40 p-3 text-sm text-emerald-300"
          >
            {paymentMessage}
          </p>
        )}

        <header className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-9">
              <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                <span>Home</span>
                <span className="text-slate-600">/</span>
                <span className="text-indigo-400">Courses</span>
                <span className="text-slate-600">/</span>
                <span className="max-w-[180px] truncate text-slate-300">
                  {course.title}
                </span>
              </div>

              <h1 className="max-w-2xl text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                {course.title}
              </h1>

              {course.description && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                  {course.description}
                </p>
              )}

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
                  <GraduationCap size={22} />
                </div>

                <div>
                  <p className="text-xs text-slate-500">Your Instructor</p>
                  <p className="font-semibold text-slate-200">
                    {course.instructor}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-800 pt-5">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <PlayCircle size={17} className="text-indigo-400" />
                  <span>
                    <strong className="text-white">{course.totalvideos}</strong>{" "}
                    Videos
                  </span>
                </div>

                {!isEnrolled && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Clock size={17} className="text-indigo-400" />
                    <span>Learn at your own pace</span>
                  </div>
                )}

                {course.isEnrolled && (
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                    <CheckCircle size={17} />
                    Enrolled
                  </div>
                )}
              </div>
            </div>

            {course.isEnrolled ? (
              <div className="w-full md:w-80 shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-white">
                      Your Learning Progress
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Keep up the great work!
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
                    <BookOpen size={19} className="text-indigo-400" />
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(#818cf8 ${progressPercent}%, #1e293b ${progressPercent}% 100%)`,
                      }}
                    >
                      <div className="flex h-[66px] w-[66px] flex-col items-center justify-center rounded-full bg-slate-950">
                        <span className="text-xl font-extrabold tracking-tight text-white">
                          {progressPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200">
                        {progressPercent === 100
                          ? "Course completed!"
                          : progressPercent > 0
                            ? "Keep going!"
                            : "Ready to begin?"}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {progressPercent === 100
                          ? "You've completed every lesson."
                          : `${Math.max(course.totalvideos - course.completedvideos, 0)} lessons left to complete`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-400">
                        Overall completion
                      </span>
                      <span className="font-semibold tabular-nums text-indigo-300">
                        {course.completedvideos}/{course.totalvideos}
                      </span>
                    </div>

                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
                      role="progressbar"
                      aria-label="Course completion"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progressPercent}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-400 transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle size={15} />
                        <span className="text-xs font-medium">Completed</span>
                      </div>

                      <p className="mt-2 text-xl font-bold tabular-nums text-white">
                        {course.completedvideos}
                        <span className="ml-1 text-xs font-normal text-slate-500">
                          lessons
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <RotateCcw size={15} />
                        <span className="text-xs font-medium">Re-watch</span>
                      </div>

                      <p className="mt-2 text-xl font-bold tabular-nums text-white">
                        {revisitCount}
                        <span className="ml-1 text-xs font-normal text-slate-500">
                          flagged
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col border-t border-slate-800 bg-slate-950/50 md:border-l md:border-t-0">
                <div className="group relative overflow-hidden bg-slate-900">
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-slate-950/20" />

                    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-500/80">
                        <PlayCircle size={30} strokeWidth={1.6} />
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-200 backdrop-blur-md">
                        <BookOpen size={12} />
                        Course Preview
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">
                  {course.isEnrolled ? (
                    <>
                      <div className="mb-3 flex items-center gap-2 text-emerald-400">
                        <CheckCircle size={22} />
                        <span className="text-lg font-bold">
                          You're enrolled!
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-slate-400">
                        You already have access to this course. Continue
                        learning from where you left off.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                          <Tag size={13} />
                          40% OFF
                        </span>

                        <span className="text-xs text-slate-500">
                          Limited-time offer
                        </span>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-3xl font-extrabold tracking-tight text-white">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: course.currency || "INR",
                            maximumFractionDigits: 2,
                          }).format(Number(course.price))}
                        </span>

                        <span className="text-base text-slate-500 line-through decoration-red-400 decoration-2">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: course.currency || "INR",
                            maximumFractionDigits: 2,
                          }).format(Number(course.price) / 0.6)}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        One-time payment · Lifetime access
                      </p>

                      <button
                        type="button"
                        onClick={() => startCheckout(course)}
                        disabled={checkoutCourseId !== null}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/10 transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                      >
                        {checkoutCourseId === course.id ? (
                          "Opening checkout..."
                        ) : (
                          <>
                            <LockKeyhole size={16} />
                            Get Lifetime Access
                          </>
                        )}
                      </button>

                      <p className="mt-3 text-center text-xs text-slate-500">
                        Secure checkout · Instant access after payment
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
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
                  videos.map((video, index) => (
                    <tr
                      key={video.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        video.status === "completed" ? "bg-slate-950/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4 sm:px-6 text-center align-middle">
                        <input
                          type="checkbox"
                          disabled={!isEnrolled}
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
                          disabled={!isEnrolled && index !== 1}
                          onClick={() => {
                            if (!isEnrolled && index !== 1) return;

                            generateVideoUrl(1, video.id);
                            setPlayingVideo(video);
                          }}
                          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
                            isEnrolled || index === 1
                              ? "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95"
                              : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70"
                          }`}
                        >
                          {isEnrolled || index === 1 ? (
                            <Play size={13} className="fill-current" />
                          ) : (
                            <Lock size={13} />
                          )}

                          <span>
                            {isEnrolled || index === 1 ? "Play" : "Locked"}
                          </span>
                        </button>
                      </td>

                      <td className="py-3 px-4 sm:px-6 text-center align-middle">
                        <button
                          type="button"
                          onClick={() =>
                            toggleRevisit(video.id, Boolean(video.revisit))
                          }
                          disabled={!isEnrolled}
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
                      controlsList="nodownload"
                      controls
                      autoPlay
                      playsInline
                      preload="metadata"
                      src={videoUrl}
                      className="w-full h-full object-contain"
                      onError={() => {
                        setVideoLoadError(
                          "Something went wrong. Video is not available.",
                        );
                      }}
                    />
                  ) : (
                    <div className="text-slate-400 text-sm animate-pulse p-4">
                      {videoLoadError || "Loading..."}
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
