import { useEffect, useState } from "react";
/** * SUPABASE CLIENT IMPORT
 * This library replaces the need for axios/fetch calls to a custom backend.
 * It acts as your API client, Authentication handler, and Database connector all in one.
 */
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";

// --- UTILS ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- ANIMATION CONSTANTS (SMOOTHER) ---
const SMOOTH_SPRING = { type: "spring", stiffness: 150, damping: 25, mass: 1 };

// --- CONFIGURATION ---
/**
 * INITIALIZATION
 * Connects your frontend directly to your Postgres database hosted on Supabase.
 * The 'ANON_KEY' is safe to expose in the browser because Supabase uses 
 * Row Level Security (RLS) policies in the database to restrict what this key can do.
 */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// --- THEME CONFIG (DARK MODE) ---
const WORKFLOW = [
  { 
    id: 'backlog', 
    label: 'Backlog', 
    bg: 'bg-slate-900/40', 
    border: 'border-slate-800/50', 
    text: 'text-slate-400', 
    dot: 'bg-slate-600',
    accent: 'ring-slate-500/20'
  },
  { 
    id: 'todo',    
    label: 'To Do',   
    bg: 'bg-indigo-900/20',   
    border: 'border-indigo-500/20',   
    text: 'text-indigo-400',  
    dot: 'bg-indigo-500',
    accent: 'ring-indigo-500/20'
  },
  { 
    id: 'review',  
    label: 'Review',  
    bg: 'bg-orange-900/20',  
    border: 'border-orange-500/20',  
    text: 'text-orange-400', 
    dot: 'bg-orange-500',
    accent: 'ring-orange-500/20'
  },
  { 
    id: 'done',    
    label: 'Done',    
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    accent: 'ring-emerald-500/20'
  }
];

// --- ICONS ---
const Icon = ({ path, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const Icons = {
  Plus: (props) => <Icon {...props} path={<><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></>} />,
  Trash: (props) => <Icon {...props} path={<><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></>} />,
  ArrowLeft: (props) => <Icon {...props} path={<polyline points="15 18 9 12 15 6"></polyline>} />,
  ArrowRight: (props) => <Icon {...props} path={<polyline points="9 18 15 12 9 6"></polyline>} />,
  Back: (props) => <Icon {...props} path={<path d="M19 12H5M12 19l-7-7 7-7"/>} />,
  User: (props) => <Icon {...props} path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>} />,
  Github: (props) => <Icon {...props} path={<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>} />,
  Google: (props) => (
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" className={props.className}>
        <path d="M20.64 12.2045c0-.6381-.0573-1.2518-.1636-1.8409H12v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4" />
        <path d="M12 21c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H3.9574v2.3318C5.4382 18.9832 8.4818 21 12 21z" fill="#34A853" />
        <path d="M6.964 13.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V7.9582H3.9573A8.9965 8.9965 0 0 0 3 12c0 1.4523.3477 2.8268.9573 4.0418l3.0067-2.3318z" fill="#FBBC05" />
        <path d="M12 5.3836c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C16.4632 2.6482 14.426 1.75 12 1.75c-3.5182 0-6.5618 2.0168-8.0427 4.9918l3.0067 2.3318c.7078-2.1273 2.692-3.7104 5.036-3.7104z" fill="#EA4335" />
    </svg>
  ),
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * CHECK SESSION
     * This checks LocalStorage to see if the user is already logged in.
     * Traditional Backend: You would check for a 'token' cookie or JWT in a header.
     */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    /**
     * REAL-TIME AUTH LISTENER
     * This is a listener (like a WebSocket) that waits for auth events.
     * If the user signs out in another tab, or their token expires, this triggers automatically.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0B0D14]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-4 border-indigo-900 border-t-indigo-500 rounded-full"
      />
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/auth" 
          element={!session ? <AuthScreen /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={session ? <BoardList session={session} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/board/:boardId" 
          element={session ? <BoardView session={session} /> : <Navigate to="/auth" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

// --- 1. BOARDS LIST COMPONENT ---
function BoardList({ session }) {
  const [boards, setBoards] = useState([]);
  const [newBoardName, setNewBoardName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const { user } = session;
  const avatarUrl = user.user_metadata?.avatar_url;
  
  const displayUsername = 
    user.user_metadata?.full_name || 
    user.user_metadata?.user_name || 
    user.user_metadata?.name ||
    user.user_metadata?.username || 
    user.email?.split('@')[0] || 
    "User";

  const firstName = displayUsername.split(' ')[0];

  useEffect(() => { fetchBoards(); }, []);

  const fetchBoards = async () => {
    /**
     * FETCH DATA (READ)
     * Traditional Backend: GET /api/boards
     * SQL: SELECT * FROM boards ORDER BY created_at DESC;
     * * .from('boards'): target the table
     * .select('*'): get all columns
     * .order(...): sort results
     */
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setBoards(data || []);
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    /**
     * INSERT DATA (CREATE)
     * Traditional Backend: POST /api/boards (body: { name, user_id })
     * SQL: INSERT INTO boards (name, user_id) VALUES ('My Board', '123') RETURNING *;
     */
    const { data, error } = await supabase
      .from('boards')
      .insert([{ name: newBoardName, user_id: session.user.id }])
      .select(); // .select() returns the newly created item so we can add it to state

    if (!error) {
      setBoards([data[0], ...boards]);
      setNewBoardName("");
      setIsCreating(false);
    }
  };

  const deleteBoard = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this board?")) return;

    /**
     * DELETE DATA (CASCADE)
     * 1. Delete tasks first (Manual Cascade)
     * Traditional Backend: DELETE /api/boards/:id/tasks
     * SQL: DELETE FROM tasks WHERE board_id = 'abc';
     */
    await supabase.from('tasks').delete().eq('board_id', id); 
    
    /**
     * 2. Delete the board
     * Traditional Backend: DELETE /api/boards/:id
     * SQL: DELETE FROM boards WHERE id = 'abc';
     */
    await supabase.from('boards').delete().eq('id', id);

    setBoards(boards.filter(b => b.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0B0D14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B0D14] to-[#0B0D14] p-8 font-sans text-gray-100"
    >
      <header className="flex items-center justify-between mb-16 max-w-7xl mx-auto pt-4">
        <div>
           <motion.h1 
             initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={SMOOTH_SPRING}
             className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400"
            >
             Projects
           </motion.h1>
           <motion.p 
             initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, ...SMOOTH_SPRING }}
             className="text-gray-500 mt-2 font-medium text-lg"
            >
              Let's build something great, {firstName}.
            </motion.p>
        </div>
        
        <div className="flex items-center gap-4 bg-gray-900/50 backdrop-blur-xl p-2 pr-4 rounded-full border border-white/10 shadow-lg shadow-black/50">
           {avatarUrl ? (
             <img 
               src={avatarUrl} 
               referrerPolicy="no-referrer"
               alt="Profile" 
               className="w-10 h-10 rounded-full border-2 border-gray-800 shadow-md object-cover" 
             />
           ) : (
             <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-black">
                {displayUsername.charAt(0).toUpperCase()}
             </div>
           )}
           
           <span className="text-sm font-bold text-gray-300 hidden sm:block">@{displayUsername.replace(/\s+/g, '').toLowerCase().slice(0, 15)}</span>
           
           <div className="h-5 w-px bg-gray-700 mx-1"></div>
           
           <button onClick={() => supabase.auth.signOut()} className="text-xs text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors">
             Log Out
           </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <motion.div 
          layout
          onClick={() => setIsCreating(true)}
          whileHover={{ scale: 1.02, backgroundColor: "rgba(30, 41, 59, 0.5)" }}
          whileTap={{ scale: 0.98 }}
          transition={SMOOTH_SPRING}
          className={cn(
            "group relative flex flex-col items-center justify-center h-56 rounded-[2rem] border-2 border-dashed border-gray-800 bg-gray-900/30 backdrop-blur-sm hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer",
            isCreating && "border-indigo-500 bg-gray-900 ring-4 ring-indigo-500/10 shadow-2xl"
          )}
        >
          {isCreating ? (
             <form onSubmit={createBoard} className="w-full px-10" onClick={e => e.stopPropagation()}>
                <input 
                  autoFocus
                  placeholder="Project Name..." 
                  className="w-full bg-transparent text-2xl font-bold placeholder:text-gray-600 text-gray-100 text-center outline-none"
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  onBlur={() => !newBoardName && setIsCreating(false)}
                />
                <p className="text-center text-xs text-indigo-400 font-bold uppercase tracking-wider mt-4 animate-pulse">Press Enter</p>
             </form>
          ) : (
             <>
               <div className="w-16 h-16 rounded-2xl bg-gray-800/50 shadow-inner border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 group-hover:bg-gray-800">
                  <Icons.Plus className="w-8 h-8 text-gray-500 group-hover:text-indigo-400 transition-colors" />
               </div>
               <span className="font-bold text-gray-500 group-hover:text-indigo-400 transition-colors">Create New Board</span>
             </>
          )}
        </motion.div>

        <AnimatePresence mode="popLayout">
          {boards.map((board, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05, ...SMOOTH_SPRING }}
              whileHover={{ y: -8, scale: 1.02, shadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)" }}
              whileTap={{ scale: 0.98 }}
              key={board.id} 
              onClick={() => navigate(`/board/${board.id}`)}
              className="group relative flex flex-col justify-between h-56 p-8 rounded-[2rem] bg-[#161922] shadow-xl shadow-black/20 border border-white/5 hover:border-indigo-500/30 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-[4rem] -mr-8 -mt-8 opacity-50 group-hover:scale-150 group-hover:opacity-100 transition-all duration-500 ease-out" />
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-gray-200 tracking-tight group-hover:text-indigo-400 transition-colors">{board.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active {new Date(board.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</p>
                </div>
              </div>

              <div className="flex justify-between items-end relative z-10">
                <div className="flex -space-x-3 pl-2">
                   {avatarUrl ? (
                      <img src={avatarUrl} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border-[3px] border-[#161922] object-cover shadow-sm" alt="Owner" />
                   ) : (
                      <div className="w-10 h-10 rounded-full border-[3px] border-[#161922] bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                        {displayUsername.charAt(0).toUpperCase()}
                      </div>
                   )}
                </div>
                <button 
                  onClick={(e) => deleteBoard(e, board.id)}
                  className="text-gray-600 hover:text-red-400 p-3 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-900/20 rounded-xl transform translate-y-4 group-hover:translate-y-0"
                >
                  <Icons.Trash className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

// --- 2. BOARD VIEW COMPONENT ---
function BoardView({ session }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeColumn, setActiveColumn] = useState(null);
  
  const [board, setBoard] = useState(null); 
  const { boardId } = useParams();
  const navigate = useNavigate();

  const { user } = session;
  const avatarUrl = user.user_metadata?.avatar_url;
  const displayUsername = 
    user.user_metadata?.full_name || 
    user.user_metadata?.user_name || 
    user.user_metadata?.username || 
    "User";

  useEffect(() => {
    const getBoard = async () => {
        /**
         * FETCH SINGLE ROW
         * Traditional Backend: GET /api/boards/:id
         * SQL: SELECT * FROM boards WHERE id = :boardId LIMIT 1;
         */
        const { data } = await supabase.from('boards').select('*').eq('id', boardId).single();
        if(data) setBoard(data);
        else navigate('/');
    };
    getBoard();
  }, [boardId, navigate]);

  useEffect(() => { 
    if(boardId) fetchTasks(); 
  }, [boardId]);

  const fetchTasks = async () => {
    /**
     * FILTERED FETCH
     * Traditional Backend: GET /api/tasks?board_id=:boardId
     * SQL: SELECT * FROM tasks WHERE board_id = :boardId ORDER BY created_at ASC;
     */
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });
    
    setTasks(data || []);
  };

  const handleAddTask = async (columnId) => {
    if (!newTaskTitle.trim()) return;

    /**
     * INSERT TASK
     * Traditional Backend: POST /api/tasks
     * SQL: INSERT INTO tasks (title, user_id, board_id, status) VALUES (...) RETURNING *;
     */
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ 
        title: newTaskTitle, 
        user_id: session.user.id, 
        board_id: boardId, 
        status: columnId 
    }])
      .select();

    if (!error) {
      setTasks([...tasks, ...data]);
      setNewTaskTitle("");
      setActiveColumn(null);
    }
  };

  const moveTask = async (task, direction) => {
    const currentIndex = WORKFLOW.findIndex(col => col.id === task.status);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= WORKFLOW.length) return;

    const newStatus = WORKFLOW[nextIndex].id;
    // Optimistic Update (Update UI instantly)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    /**
     * UPDATE ROW
     * Traditional Backend: PUT /api/tasks/:id
     * SQL: UPDATE tasks SET status = :newStatus WHERE id = :taskId;
     */
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  };

  const deleteTask = async (id) => {
    // Optimistic Update (Remove from UI instantly)
    setTasks(prev => prev.filter(t => t.id !== id));
    
    /**
     * DELETE ROW
     * Traditional Backend: DELETE /api/tasks/:id
     * SQL: DELETE FROM tasks WHERE id = :taskId;
     */
    await supabase.from('tasks').delete().eq('id', id);
  };

  if (!board) return (
    <div className="flex h-screen items-center justify-center bg-[#0B0D14]">
        <motion.div 
           initial={{ scale: 0 }} animate={{ scale: 1 }} 
           className="w-10 h-10 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin" 
        />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
      transition={{ type: "tween", duration: 0.3 }}
      className="flex flex-col h-screen bg-[#0B0D14] text-gray-100 font-sans overflow-hidden"
    >
      {/* HEADER */}
      <header className="flex-none flex items-center justify-between px-8 py-5 bg-[#0B0D14]/80 backdrop-blur-xl border-b border-white/5 shadow-sm z-50">
        <div className="flex items-center gap-6">
          <button 
             onClick={() => navigate('/')} 
             className="p-3 hover:bg-gray-800 rounded-2xl text-gray-500 hover:text-gray-200 transition-all group active:scale-95"
          >
            <Icons.Back className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
             <motion.h1 
                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-black tracking-tight text-gray-100 leading-none"
             >
                {board.name}
             </motion.h1>
             <div className="flex items-center gap-2 mt-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                 <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Live Board</span>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           
           <div className="h-8 w-px bg-gray-800 mx-2"></div>
           <div className="flex items-center gap-3">
             <span className="hidden sm:block text-xs font-bold text-gray-400">{displayUsername}</span>
             {avatarUrl ? (
               <img src={avatarUrl} referrerPolicy="no-referrer" alt="User" className="h-10 w-10 rounded-full border-2 border-[#0B0D14] ring-1 ring-white/10 shadow-md object-cover" />
             ) : (
               <div className="h-10 w-10 bg-gradient-to-br from-indigo-700 to-purple-800 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/20">
                 {session.user.email.charAt(0).toUpperCase()}
               </div>
             )}
           </div>
        </div>
      </header>

      {/* KANBAN BOARD */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-8 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="flex h-full gap-8 min-w-max">
          <LayoutGroup>
            {WORKFLOW.map((col, i) => (
              <motion.div 
                key={col.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ...SMOOTH_SPRING }}
                className="flex flex-col w-80 h-full select-none"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                   <div className="flex items-center gap-3">
                      <span className={cn("block w-3 h-3 rounded-full ring-4 ring-opacity-20 shadow-sm", col.dot, col.accent)}></span> 
                      <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">{col.label}</h2>
                      <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg border border-opacity-10", col.bg, col.text, col.border)}>
                        {tasks.filter(t => t.status === col.id).length}
                      </span>
                   </div>
                   <button 
                      onClick={() => setActiveColumn(col.id)} 
                      className={cn("p-1.5 rounded-lg transition-all hover:bg-gray-800 hover:shadow-sm", col.text)}
                   >
                      <Icons.Plus className="w-5 h-5" />
                   </button>
                </div>

                {/* Drop Zone / Task Container */}
                <div className={cn("flex-1 rounded-[2rem] p-3 space-y-3 overflow-y-auto border backdrop-blur-md shadow-inner transition-colors", col.bg, col.border)}>
                  <AnimatePresence>
                    {activeColumn === col.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={SMOOTH_SPRING}
                        className="overflow-hidden"
                      >
                        <div className="bg-[#1E293B] p-4 rounded-2xl shadow-2xl ring-1 ring-indigo-500/30 mx-1">
                          <textarea 
                            autoFocus
                            placeholder="What needs to be done?"
                            className="w-full resize-none outline-none text-sm placeholder:text-gray-600 text-gray-200 bg-transparent font-medium"
                            rows={3}
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => {
                              if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddTask(col.id);
                              }
                            }}
                          />
                          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-700">
                             <button onClick={() => setActiveColumn(null)} className="text-xs text-gray-500 hover:text-gray-300 font-bold px-2 py-1">Cancel</button>
                             <button onClick={() => handleAddTask(col.id)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg font-bold shadow-lg shadow-indigo-900/50 transition-all active:scale-95">Add</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {tasks.filter(t => t.status === col.id).map(task => (
                      <motion.div 
                        layoutId={task.id}
                        layout="position"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={SMOOTH_SPRING}
                        whileHover={{ y: -4, scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        key={task.id} 
                        className="group bg-[#161922] p-5 rounded-2xl shadow-md shadow-black/30 border border-gray-800 transition-all cursor-default relative overflow-hidden"
                      >
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", col.dot)} />
                        
                        <p className="text-sm font-semibold text-gray-300 leading-relaxed pl-2 group-hover:text-white transition-colors">{task.title}</p>
                        
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pl-2">
                           <button onClick={() => moveTask(task, 'prev')} disabled={col.id === 'backlog'} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-600 hover:text-indigo-400 disabled:opacity-0 transition-colors">
                              <Icons.ArrowLeft className="w-4 h-4" />
                           </button>
                           <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-red-900/20 text-gray-600 hover:text-red-400 transition-colors">
                              <Icons.Trash className="w-3.5 h-3.5" />
                           </button>
                           <button onClick={() => moveTask(task, 'next')} disabled={col.id === 'done'} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-600 hover:text-indigo-400 disabled:opacity-0 transition-colors">
                              <Icons.ArrowRight className="w-4 h-4" />
                           </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </LayoutGroup>
        </div>
      </main>
    </motion.div>
  );
}

// --- 3. AUTH SCREEN ---
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    /**
     * OAUTH LOGIN
     * Redirects the user to Google/GitHub to sign in.
     * Supabase handles the callback and session creation automatically.
     */
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
    });
    if (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fakeEmail = `${username.trim().toLowerCase()}@board.local`; 

    /**
     * PASSWORD LOGIN / SIGNUP
     * Uses Supabase's built-in email/password handler.
     * Traditional Backend: POST /api/login or POST /api/register
     */
    const { error } = isLogin 
      ? await supabase.auth.signInWithPassword({ email: fakeEmail, password })
      : await supabase.auth.signUp({ 
          email: fakeEmail, 
          password,
          options: { data: { username: username } } 
        });

    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0D14] p-6 font-sans relative overflow-hidden">
      {/* Animated Blobs (Glow effects) */}
      <motion.div 
         animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
         transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
         className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen" 
      />
      <motion.div 
         animate={{ rotate: -360, scale: [1, 1.2, 1] }} 
         transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
         className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen" 
      />
      <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-pink-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-full max-w-md bg-[#161922]/80 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl shadow-black/50 border border-white/5 relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"
          >
             <Icons.User className="w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">{isLogin ? "Welcome Back" : "Join Project"}</h1>
          <p className="text-gray-400 font-medium">{isLogin ? "Enter details to access workspace" : "Create your unique username"}</p>
        </div>

        <div className="space-y-4 mb-8">
          <motion.button
            onClick={() => handleOAuthLogin('google')}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:border-indigo-500/50 text-gray-200 p-4 rounded-2xl font-bold shadow-sm transition-all"
          >
            <Icons.Google className="w-5 h-5" />
            <span>Continue with Google</span>
          </motion.button>

          <motion.button
            onClick={() => handleOAuthLogin('github')}
            whileHover={{ scale: 1.02, backgroundColor: "#000" }} whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-black text-white p-4 rounded-2xl font-bold shadow-xl shadow-black/20 transition-all border border-gray-800"
          >
            <Icons.Github className="w-5 h-5 fill-current" />
            <span>Continue with GitHub</span>
          </motion.button>
        </div>

        <div className="relative flex py-2 items-center mb-8 opacity-50">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-[10px] font-black uppercase tracking-widest">Or continue with</span>
            <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 group">
             <label className="text-xs font-bold text-gray-500 ml-4 uppercase tracking-wider group-focus-within:text-indigo-400 transition-colors">Username</label>
             <input className="w-full p-4 bg-[#0B0D14]/50 border border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-[#0B0D14] transition-all font-bold text-gray-200" placeholder="johndoe" value={username} onChange={e=>setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2 group">
             <label className="text-xs font-bold text-gray-500 ml-4 uppercase tracking-wider group-focus-within:text-indigo-400 transition-colors">Password</label>
             <input className="w-full p-4 bg-[#0B0D14]/50 border border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-[#0B0D14] transition-all font-bold text-gray-200" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(79, 70, 229, 0.4)" }} whileTap={{ scale: 0.95 }}
            disabled={loading} 
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-indigo-900/20 disabled:opacity-70 mt-4 transition-all"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={()=>setIsLogin(!isLogin)} className="text-sm font-bold text-gray-500 hover:text-indigo-400 transition-colors">
            {isLogin ? "No account? Create one" : "Already have an account?"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}