import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  const onSelectCourse = (courseId) => {
    navigate(`/courses?course=${courseId}`);
  };

  const getCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/courses`);

      const data = await response.json();

      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error getting Courses:", error);
      setError("Unable to load Courses. Please try again.");
    }
  };

  useEffect(() => {
    getCourses();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Welcome Back {user?.name ? `, ${user.name}` : ""}!
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Select a course below to jump directly into video lessons, track
            your progress, and manage bookmarks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const progressPercent = Math.round(
              // (course.completedVideos / course.totalVideos) * 100,
              20,
            );

            return (
              <button
                key={course.id}
                type="button"
                onClick={() => onSelectCourse(course.id)}
                className="group block w-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col"
              >
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                    Popular
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                      {course.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        20/ {course.totalvideos} Videos
                      </span>
                      <span className="font-semibold text-slate-200">
                        {progressPercent}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Instructor: {course.instructor}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <span>
                    {progressPercent > 0 ? "Continue Course" : "Start Course"}
                  </span>
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
