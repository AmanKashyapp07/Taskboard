import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// --- CONFIGURATION ---
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Define the Professional Workflow Columns
const WORKFLOW = [
  { id: 'backlog', label: 'Backlog', color: 'bg-gray-200' },
  { id: 'todo',    label: 'To Do',   color: 'bg-blue-100' },
  { id: 'review',  label: 'Review',  color: 'bg-yellow-100' },
  { id: 'done',    label: 'Done',    color: 'bg-green-100' }
];

// --- ICONS ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const LeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const RightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>;

  return !session ? <AuthScreen /> : <Dashboard session={session} />;
}

function Dashboard({ session }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeColumn, setActiveColumn] = useState(null);

  // Fetch tasks
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) console.error("Error:", error);
    else setTasks(data || []);
  };

  // Add Task
  const handleAddTask = async (columnId) => {
    if (!newTaskTitle.trim()) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ 
        title: newTaskTitle, 
        user_id: session.user.id, 
        status: columnId // Now using 'status' instead of 'completed'
      }])
      .select();

    if (!error) {
      setTasks([...tasks, ...data]);
      setNewTaskTitle("");
      setActiveColumn(null);
    }
  };

  // Move Task (Left or Right)
  const moveTask = async (task, direction) => {
    const currentIndex = WORKFLOW.findIndex(col => col.id === task.status);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    // Boundary checks
    if (nextIndex < 0 || nextIndex >= WORKFLOW.length) return;

    const newStatus = WORKFLOW[nextIndex].id;

    // Optimistic Update (Update UI instantly before DB responds)
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (error) {
      // Revert if DB fails
      setTasks(oldTasks);
      alert("Failed to move task");
    }
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F7] text-gray-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
        <h1 className="text-xl font-bold tracking-tight">Project Workflow</h1>
        <div className="flex items-center gap-4">
           <span className="text-xs text-gray-400 hidden sm:block">
  @{session.user.user_metadata?.username || 'user'}
</span>
           <button onClick={() => supabase.auth.signOut()} className="text-xs font-semibold bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">Sign Out</button>
        </div>
      </header>

      {/* Board Canvas */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full gap-5 min-w-max">
          
          {WORKFLOW.map((col) => (
            <div key={col.id} className="flex flex-col w-80 h-full">
              
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-2">
                 <div className="flex items-center gap-2">
                    <span className={`block w-2 h-2 rounded-full ${col.color.replace('bg-', 'bg-')}`}></span> 
                    {/* Note: Tailwind dynamic classes need full names, so we just use the prop directly usually, but for simplicitly: */}
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">{col.label}</h2>
                    <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded-full text-gray-600">
                      {tasks.filter(t => t.status === col.id).length}
                    </span>
                 </div>
                 <button onClick={() => setActiveColumn(col.id)} className="text-gray-400 hover:text-gray-900 transition-colors">
                    <PlusIcon />
                 </button>
              </div>

              {/* Column Body */}
              <div className="flex-1 bg-gray-100/50 rounded-2xl p-3 space-y-3 overflow-y-auto ring-1 ring-black/5">
                
                {/* Inline Add Input */}
                {activeColumn === col.id && (
                  <div className="bg-white p-3 rounded-xl shadow-lg ring-2 ring-blue-500 animate-in fade-in zoom-in-95 duration-200">
                    <textarea 
                      autoFocus
                      placeholder="Type a new task..."
                      className="w-full resize-none outline-none text-sm placeholder:text-gray-400"
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
                    <div className="flex justify-end gap-2 mt-2">
                       <button onClick={() => setActiveColumn(null)} className="text-xs text-gray-500 font-medium hover:text-gray-700">Cancel</button>
                       <button onClick={() => handleAddTask(col.id)} className="text-xs bg-gray-900 text-white px-3 py-1 rounded-md font-semibold">Add</button>
                    </div>
                  </div>
                )}

                {/* Task Cards */}
                {tasks.filter(t => t.status === col.id).map(task => (
                  <div key={task.id} className="group relative bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
                    <p className="text-sm font-medium text-gray-800 leading-snug mb-3">{task.title}</p>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                       {/* Move Left Button */}
                       <button 
                         onClick={() => moveTask(task, 'prev')}
                         disabled={col.id === 'backlog'}
                         className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-0 transition-all"
                         title="Move Back"
                       >
                         <LeftIcon />
                       </button>

                       <div className="flex gap-2">
                         {/* Delete Button (Only visible on hover) */}
                         <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon />
                         </button>
                       </div>

                       {/* Move Right Button */}
                       <button 
                         onClick={() => moveTask(task, 'next')}
                         disabled={col.id === 'done'}
                         className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-0 transition-all"
                         title="Move Forward"
                       >
                         <RightIcon />
                       </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Reuse AuthScreen from previous response
// --- 3. UPDATED AUTH SCREEN (Username Support) ---
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(""); // Changed from email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Create the "Invisible Email"
    // We clean the username to remove spaces and force lowercase
    const cleanUsername = username.trim().toLowerCase();
    const fakeEmail = `${cleanUsername}@board.local`; 

    const { error } = isLogin 
      ? await supabase.auth.signInWithPassword({ 
          email: fakeEmail, 
          password 
        })
      : await supabase.auth.signUp({ 
          email: fakeEmail, 
          password,
          // We save the raw username in metadata so we can display it nicely later
          options: {
            data: { username: username } 
          }
        });

    if (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] p-6 font-sans">
      <div className="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-xl ring-1 ring-gray-900/5">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Welcome Back" : "Create Profile"}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase ml-2 mb-1">Username</label>
            <input 
              className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all" 
              type="text" 
              placeholder="e.g. johndoe" 
              value={username} 
              onChange={e=>setUsername(e.target.value)} 
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase ml-2 mb-1">Password</label>
            <input 
              className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-black text-white p-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? "Processing..." : isLogin ? "Enter Board" : "Sign Up"}
          </button>
        </form>

        <button onClick={()=>setIsLogin(!isLogin)} className="w-full mt-6 text-xs font-medium text-gray-400 hover:text-black transition-colors">
          {isLogin ? "New user? Create username" : "Have a username? Log in"}
        </button>
      </div>
    </div>
  );
}