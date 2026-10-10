import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center text-lg">
            ▶
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              Uremy
            </h1>
            <p className="text-xs text-slate-400">Course Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-white">
              {user?.email || "Student"}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">
              Active Learner
            </span>
          </div>
          <button
            onClick={() => {
              logout();
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
