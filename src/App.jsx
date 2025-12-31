import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILS ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- CONFIGURATION ---
// [SUPABASE EXPLANATION]
// This initializes the client. It is like opening a connection pool in a backend app.
// The ANON_KEY is safe to expose because we use "Row Level Security" (RLS) in Postgres
// to restrict what this key can actually do based on who is logged in.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// --- THEME CONFIG ---
const WORKFLOW = [
  { id: 'backlog', label: 'Backlog', bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-600', dot: 'bg-stone-400' },
  { id: 'todo',    label: 'To Do',   bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-600',  dot: 'bg-blue-500' },
  { id: 'review',  label: 'Review',  bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-600', dot: 'bg-amber-500' },
  { id: 'done',    label: 'Done',    bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-600',dot: 'bg-emerald-500' }
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
  const [activeBoard, setActiveBoard] = useState(null);

  useEffect(() => {
    // [SUPABASE EXPLANATION]
    // Checks if the user has a valid JWT (JSON Web Token) in LocalStorage.
    // [TRADITIONAL ROUTE] GET /api/auth/me or GET /api/verify-token
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // [SUPABASE EXPLANATION]
    // A real-time listener. If the token expires or the user logs out in another tab,
    // this triggers automatically. You don't need to write refresh token logic.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-stone-50">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 border-2 border-stone-300 border-t-stone-800 rounded-full"
      />
    </div>
  );

  if (!session) return <AuthScreen />;

  return (
    <AnimatePresence mode="wait">
      {activeBoard ? (
        <BoardView key="board-view" session={session} board={activeBoard} onBack={() => setActiveBoard(null)} />
      ) : (
        <BoardList key="board-list" session={session} onSelectBoard={setActiveBoard} />
      )}
    </AnimatePresence>
  );
}

// --- 1. BOARDS LIST COMPONENT ---
function BoardList({ session, onSelectBoard }) {
  const [boards, setBoards] = useState([]);
  const [newBoardName, setNewBoardName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
    // [SUPABASE EXPLANATION]
    // .from('boards') -> SELECT FROM boards table
    // .select('*') -> Select all columns
    // .order(...) -> standard SQL ORDER BY
    //
    // [IMPORTANT]: Notice we didn't add `.eq('user_id', session.user.id)`.
    // In Supabase, we configure a Policy on the server (RLS) that says:
    // "Users can only see their own rows". So this query automatically applies
    // `WHERE user_id = current_user` on the backend!
    //
    // [SQL EQUIVALENT] SELECT * FROM boards ORDER BY created_at DESC;
    // [TRADITIONAL ROUTE] GET /api/boards
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setBoards(data || []);
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    // [SUPABASE EXPLANATION]
    // .insert([...]) -> INSERT INTO boards ...
    // .select() -> RETURNING * (This makes Supabase return the newly created row immediately)
    //
    // [SQL EQUIVALENT] 
    // INSERT INTO boards (name, user_id) VALUES ('Project X', '123') RETURNING *;
    // [TRADITIONAL ROUTE] POST /api/boards
    const { data, error } = await supabase
      .from('boards')
      .insert([{ name: newBoardName, user_id: session.user.id }])
      .select();

    if (!error) {
      setBoards([data[0], ...boards]);
      setNewBoardName("");
      setIsCreating(false);
    }
  };

  const deleteBoard = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this board?")) return;

    // [SUPABASE EXPLANATION]
    // Deleting child tasks first (if you didn't set "ON DELETE CASCADE" in SQL)
    // .delete().eq('board_id', id)
    //
    // [SQL EQUIVALENT] DELETE FROM tasks WHERE board_id = '123';
    // [TRADITIONAL ROUTE] DELETE /api/boards/:id/tasks (or handled by DB constraint)
    await supabase.from('tasks').delete().eq('board_id', id); 
    
    // [SQL EQUIVALENT] DELETE FROM boards WHERE id = '123';
    // [TRADITIONAL ROUTE] DELETE /api/boards/:id
    await supabase.from('boards').delete().eq('id', id);

    setBoards(boards.filter(b => b.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-8 font-sans text-stone-900"
    >
      <header className="flex items-center justify-between mb-12 max-w-6xl mx-auto">
        <div>
           <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">Projects</h1>
           <p className="text-stone-500 mt-2 font-medium">Welcome back, {firstName}</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 pr-3 rounded-full border border-stone-200 shadow-sm">
           {avatarUrl ? (
             <img 
               src={avatarUrl} 
               referrerPolicy="no-referrer"
               alt="Profile" 
               className="w-9 h-9 rounded-full border border-white shadow-sm object-cover" 
             />
           ) : (
             <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {displayUsername.charAt(0).toUpperCase()}
             </div>
           )}
           
           <span className="text-sm font-semibold text-stone-600 hidden sm:block">@{displayUsername.replace(/\s+/g, '').toLowerCase().slice(0, 15)}</span>
           
           <div className="h-4 w-px bg-stone-300 mx-1"></div>
           
           {/* [SUPABASE EXPLANATION] 
               Destroys the JWT session locally and on server.
               [TRADITIONAL ROUTE] POST /api/logout
           */}
           <button onClick={() => supabase.auth.signOut()} className="text-xs text-stone-500 hover:text-red-500 font-medium transition-colors">
             Sign Out
           </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Button */}
        <motion.div 
          layout
          onClick={() => setIsCreating(true)}
          className={cn(
            "group relative flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-stone-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer",
            isCreating && "border-blue-500 bg-white ring-4 ring-blue-500/10"
          )}
        >
          {isCreating ? (
             <form onSubmit={createBoard} className="w-full px-8" onClick={e => e.stopPropagation()}>
                <input 
                  autoFocus
                  placeholder="Project Name..." 
                  className="w-full bg-transparent text-xl font-bold placeholder:text-stone-300 text-center outline-none"
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  onBlur={() => !newBoardName && setIsCreating(false)}
                />
                <p className="text-center text-xs text-blue-500 font-medium mt-2">Press Enter to create</p>
             </form>
          ) : (
             <>
               <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300">
                  <Icons.Plus className="w-6 h-6 text-stone-400 group-hover:text-blue-600" />
               </div>
               <span className="font-semibold text-stone-500 group-hover:text-blue-700">Create New Board</span>
             </>
          )}
        </motion.div>

        {/* Board Cards */}
        <AnimatePresence>
          {boards.map((board, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              key={board.id} 
              onClick={() => onSelectBoard(board)}
              className="group relative flex flex-col justify-between h-48 p-8 rounded-3xl bg-white shadow-[0_2px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-stone-100 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-transparent to-stone-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div>
                <h3 className="text-2xl font-bold text-stone-800 tracking-tight group-hover:text-blue-600 transition-colors">{board.name}</h3>
                <p className="text-sm text-stone-400 mt-1 font-medium">Last active {new Date(board.created_at).toLocaleDateString()}</p>
              </div>

              <div className="flex justify-between items-end relative z-10">
                <div className="flex -space-x-2">
                   {avatarUrl ? (
                      <img src={avatarUrl} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="Owner" />
                   ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500">
                        {displayUsername.charAt(0).toUpperCase()}
                      </div>
                   )}
                </div>
                <button 
                  onClick={(e) => deleteBoard(e, board.id)}
                  className="text-stone-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-xl"
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
function BoardView({ session, board, onBack }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeColumn, setActiveColumn] = useState(null);
  
  const { user } = session;
  const avatarUrl = user.user_metadata?.avatar_url;
  const displayUsername = 
    user.user_metadata?.full_name || 
    user.user_metadata?.user_name || 
    user.user_metadata?.username || 
    "User";

  useEffect(() => { fetchTasks(); }, [board.id]);

  const fetchTasks = async () => {
    // [SUPABASE EXPLANATION]
    // Filtering data.
    // .eq('board_id', board.id) -> WHERE board_id = ...
    //
    // [SQL EQUIVALENT] SELECT * FROM tasks WHERE board_id = '123' ORDER BY created_at ASC;
    // [TRADITIONAL ROUTE] GET /api/boards/123/tasks
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('board_id', board.id)
      .order('created_at', { ascending: true });
    
    setTasks(data || []);
  };

  const handleAddTask = async (columnId) => {
    if (!newTaskTitle.trim()) return;

    // [SUPABASE EXPLANATION]
    // Inserting a new task linked to the user and board.
    // [SQL EQUIVALENT] INSERT INTO tasks (title, status...) VALUES (...) RETURNING *;
    // [TRADITIONAL ROUTE] POST /api/tasks
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ 
        title: newTaskTitle, 
        user_id: session.user.id, 
        board_id: board.id, 
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
    // 1. Optimistic UI Update (Update screen instantly)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    // 2. Database Update
    // [SUPABASE EXPLANATION]
    // .update({ status: ... }) -> UPDATE tasks SET status = ...
    // .eq('id', task.id)       -> WHERE id = ...
    //
    // [SQL EQUIVALENT] UPDATE tasks SET status = 'done' WHERE id = '999';
    // [TRADITIONAL ROUTE] PATCH /api/tasks/999
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    
    // [SQL EQUIVALENT] DELETE FROM tasks WHERE id = '999';
    // [TRADITIONAL ROUTE] DELETE /api/tasks/999
    await supabase.from('tasks').delete().eq('id', id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-screen bg-[#FDFDFD] text-stone-900 font-sans"
    >
      <header className="flex-none flex items-center justify-between px-8 py-5 bg-white/80 backdrop-blur-xl border-b border-stone-100 z-50 sticky top-0">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-xl text-stone-500 transition-colors group">
            <Icons.Back className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
             <h1 className="text-2xl font-bold tracking-tight text-stone-800 leading-none">{board.name}</h1>
             <span className="text-xs font-semibold text-stone-400 tracking-wider uppercase">Board View</span>
          </div>
        </div>
        
        <div className="relative group cursor-pointer flex items-center gap-3">
           <span className="hidden sm:block text-xs font-bold text-stone-400">{displayUsername}</span>
           {avatarUrl ? (
             <img src={avatarUrl} referrerPolicy="no-referrer" alt="User" className="h-9 w-9 rounded-full border border-stone-200 shadow-sm object-cover" />
           ) : (
             <div className="h-9 w-9 bg-gradient-to-br from-stone-700 to-black rounded-full shadow-lg flex items-center justify-center text-white font-bold text-xs">
               {session.user.email.charAt(0).toUpperCase()}
             </div>
           )}
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <div className="flex h-full gap-8 min-w-max">
          <LayoutGroup>
            {WORKFLOW.map((col) => (
              <div key={col.id} className="flex flex-col w-80 h-full select-none">
                <div className="flex items-center justify-between mb-4 px-1">
                   <div className="flex items-center gap-3">
                      <span className={cn("block w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm", col.dot)}></span> 
                      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600">{col.label}</h2>
                      <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                        {tasks.filter(t => t.status === col.id).length}
                      </span>
                   </div>
                   <button onClick={() => setActiveColumn(col.id)} className="text-stone-300 hover:text-stone-800 hover:bg-stone-100 p-1 rounded-lg transition-all">
                      <Icons.Plus className="w-5 h-5" />
                   </button>
                </div>

                <div className={cn("flex-1 rounded-3xl p-3 space-y-3 overflow-y-auto border border-transparent transition-colors", col.bg)}>
                  <AnimatePresence>
                    {activeColumn === col.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }} 
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white p-4 rounded-2xl shadow-xl ring-1 ring-black/5 mx-1 mb-2">
                          <textarea 
                            autoFocus
                            placeholder="Type task..."
                            className="w-full resize-none outline-none text-sm placeholder:text-stone-300 text-stone-700 font-medium"
                            rows={2}
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => {
                              if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddTask(col.id);
                              }
                            }}
                          />
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-stone-50">
                             <button onClick={() => setActiveColumn(null)} className="text-xs text-stone-500 hover:text-stone-800 font-semibold px-2">Cancel</button>
                             <button onClick={() => handleAddTask(col.id)} className="text-xs bg-stone-900 text-white px-4 py-1.5 rounded-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Add Card</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="popLayout">
                    {tasks.filter(t => t.status === col.id).map(task => (
                      <motion.div 
                        layoutId={task.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        key={task.id} 
                        className="group bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg border border-stone-100 transition-all cursor-default"
                      >
                        <p className="text-sm font-semibold text-stone-700 leading-relaxed">{task.title}</p>
                        
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                           <button onClick={() => moveTask(task, 'prev')} disabled={col.id === 'backlog'} className="p-1.5 rounded-md hover:bg-stone-50 text-stone-400 hover:text-stone-800 disabled:opacity-0 transition-colors">
                              <Icons.ArrowLeft className="w-4 h-4" />
                           </button>
                           <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-md hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors">
                              <Icons.Trash className="w-3.5 h-3.5" />
                           </button>
                           <button onClick={() => moveTask(task, 'next')} disabled={col.id === 'done'} className="p-1.5 rounded-md hover:bg-stone-50 text-stone-400 hover:text-stone-800 disabled:opacity-0 transition-colors">
                              <Icons.ArrowRight className="w-4 h-4" />
                           </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
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

  // [SUPABASE EXPLANATION]
  // This handles the entire OAuth flow: 
  // 1. Redirects user to Google/GitHub
  // 2. User consents
  // 3. User redirected back to your site
  // 4. Supabase extracts the code from the URL and creates a session
  // 
  // [TRADITIONAL ROUTE] You would need GET /api/auth/google, callback routes, strategy config (Passport.js), etc.
  const handleOAuthLogin = async (provider) => {
    setLoading(true);
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

    // [SUPABASE EXPLANATION]
    // Standard email/password login.
    // [TRADITIONAL ROUTE] POST /api/login or POST /api/register
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
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200/50 rounded-full blur-[100px] mix-blend-multiply animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/50 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/50 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-stone-900 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl">
             <Icons.User className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">{isLogin ? "Welcome Back" : "Join Project"}</h1>
          <p className="text-stone-400 text-sm font-medium mt-2">{isLogin ? "Enter your details to access workspace" : "Create your unique username"}</p>
        </div>

        <div className="space-y-3 mb-6">
          <motion.button
            onClick={() => handleOAuthLogin('google')}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 p-4 rounded-2xl font-bold shadow-sm transition-all"
          >
            <Icons.Google className="w-5 h-5" />
            <span>Continue with Google</span>
          </motion.button>

          <motion.button
            onClick={() => handleOAuthLogin('github')}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#24292F] hover:bg-[#2b3137] text-white p-4 rounded-2xl font-bold shadow-lg shadow-stone-900/10 transition-all"
          >
            <Icons.Github className="w-5 h-5 fill-current" />
            <span>Continue with GitHub</span>
          </motion.button>
        </div>

        <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-stone-300"></div>
            <span className="flex-shrink mx-4 text-stone-400 text-xs font-bold uppercase tracking-wider">Or use username</span>
            <div className="flex-grow border-t border-stone-300"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
             <label className="text-xs font-bold text-stone-500 ml-4 uppercase tracking-wider">Username</label>
             <input className="w-full p-4 bg-stone-50/50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-stone-900/10 focus:bg-white transition-all font-semibold text-stone-800" placeholder="johndoe" value={username} onChange={e=>setUsername(e.target.value)} required />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-bold text-stone-500 ml-4 uppercase tracking-wider">Password</label>
             <input className="w-full p-4 bg-stone-50/50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-stone-900/10 focus:bg-white transition-all font-semibold text-stone-800" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            disabled={loading} 
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-200 p-4 rounded-2xl font-bold shadow-sm disabled:opacity-70 mt-4 transition-colors"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={()=>setIsLogin(!isLogin)} className="text-sm font-semibold text-stone-400 hover:text-stone-800 transition-colors">
            {isLogin ? "No account? Create one" : "Already have an account?"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

//comment