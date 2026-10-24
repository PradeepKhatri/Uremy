import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const HomePage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
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

  const getEnrolledCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/enrolledCourses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      setEnrolledCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error getting Courses:", error);
      setError("Unable to load Courses. Please try again.");
    }
  };

  useEffect(() => {
    if (user) {
      getEnrolledCourses();
    }
    getCourses();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* If there are any enrolled courses */}
        {enrolledCourses.length > 0 && (
          <div className="flex flex-col gap-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Continue where you Left
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {enrolledCourses.map((course) => {
                const progressPercent = Math.round(
                  (course.completedVideos / course.totalvideos) * 100,
                );

                return (
                  <article
                    key={course.id}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectCourse(course.id)}
                      className="group block w-full text-left"
                    >
                      <div className="relative aspect-video bg-slate-950 overflow-hidden">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-1 text-base font-bold text-white transition-colors duration-200 group-hover:text-indigo-400">
                              {course.title}
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                              {course.completedVideos}/ {course.totalvideos}{" "}
                              Videos
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
                        </div>
                      </div>

                      <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <span>
                          {progressPercent > 0
                            ? "Continue Course"
                            : "Start Course"}
                        </span>
                        <span>→</span>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Explore Courses
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              return (
                <article
                  key={course.id}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course.id)}
                    className="group block w-full text-left"
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
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-1 text-base font-bold text-white transition-colors duration-200 group-hover:text-indigo-400">
                            {course.title}
                          </h3>

                          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-400">
                            {course.description ||
                              "Explore this course and start learning."}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-400">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: course.currency || "INR",
                            maximumFractionDigits: 2,
                          }).format(Number(course.price) || 0)}
                        </span>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Instructor: {course.instructor}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
