import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// --- 1. INITIALIZATION ---
// This connects your frontend to your specific Supabase project in the cloud.
// It uses environment variables so you don't hardcode secrets.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,      // Your unique Project URL
  import.meta.env.VITE_SUPABASE_ANON_KEY  // Your "Public" key (safe to expose in browsers)
);

// Icon components (No Supabase logic here, just SVG graphics)
const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> );
const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg> );
const LogoutIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg> );

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- 2. CHECK ACTIVE SESSION ---
    // When the app loads, ask Supabase: "Is the user already logged in?"
    // This checks LocalStorage for a valid token.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // --- 3. LISTEN FOR AUTH CHANGES ---
    // This is a realtime listener. It triggers automatically if:
    // - The user signs in
    // - The user signs out
    // - The token expires and refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Cleanup: Remove the listener when the component unmounts to prevent memory leaks
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  // Logic: If we have a session (user is logged in), show the Dashboard.
  // Otherwise, show the Login screen.
  return !session ? <AuthScreen /> : <Dashboard session={session} />;
}

function Dashboard({ session }) {
  // In a real app, you would fetch these from the database using:
  // const { data, error } = await supabase.from('tasks').select('*')
  const [tasks, setTasks] = useState([
    { id: 1, title: "Design System Draft", column: "todo", tag: "Design" },
    { id: 2, title: "Setup Supabase Auth", column: "done", tag: "Backend" },
    { id: 3, title: "Fix Navigation Bug", column: "in-progress", tag: "Bug" },
  ]);
  
  const [newTask, setNewTask] = useState("");
  const [isAdding, setIsAdding] = useState(false); 

  const columns = [
    { id: "todo", title: "To Do", color: "bg-gray-100" },
    { id: "in-progress", title: "In Progress", color: "bg-blue-50" },
    { id: "done", title: "Done", color: "bg-green-50" },
  ];

  // --- 4. SIGN OUT ---
  // This clears the LocalStorage token and notifies Supabase.
  // Because of the 'onAuthStateChange' listener in App(), 
  // the UI will automatically flip back to the Login screen.
  const handleLogout = async () => await supabase.auth.signOut();

  const addTask = (columnId) => {
    if (!newTask.trim()) return;
    const newTaskObj = {
      id: Date.now(), 
      title: newTask,
      column: columnId,
      tag: "General"
    };
    setTasks([...tasks, newTaskObj]);
    setNewTask("");
    setIsAdding(null);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const moveTask = (taskId, direction) => {
    const colOrder = ["todo", "in-progress", "done"];
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const currentIndex = colOrder.indexOf(t.column);
        const nextIndex = direction === 'next' 
          ? Math.min(currentIndex + 1, 2) 
          : Math.max(currentIndex - 1, 0);
        return { ...t, column: colOrder[nextIndex] };
      }
      return t;
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-gray-900 selection:bg-blue-100">
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white font-bold">
            T
          </div>
          <h1 className="text-lg font-semibold tracking-tight">TaskBoard</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden text-sm text-gray-500 sm:block">
            {/* Displaying user email from the session object */}
            {session.user.email}
          </div>
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <LogoutIcon />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Board UI Code (omitted for brevity, same as previous) */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-[#F9FAFB] p-6">
         {/* ... Columns and cards rendering logic ... */}
         {/* Since this part is pure React/UI and doesn't touch Supabase, I've shortened it here to focus on the request */}
         <div className="flex h-full gap-6 min-w-[1000px]">
            {columns.map((col) => (
                <div key={col.id} className="flex h-full w-80 flex-col rounded-2xl bg-gray-50/50 shadow-sm ring-1 ring-gray-200">
                   {/* Column Header */}
                   <div className="flex items-center justify-between p-4 pb-2">
                     <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{col.title}</h2>
                     <button onClick={() => setIsAdding(col.id)}><PlusIcon/></button>
                   </div>
                   {/* Render Tasks */}
                   <div className="flex-1 p-3">
                      {tasks.filter(t => t.column === col.id).map(task => (
                         <div key={task.id} className="p-4 bg-white shadow-sm rounded-xl mb-3">
                           {task.title}
                           {/* ... */}
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

function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleAuth = async (action) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    let result;
    if (action === "login") {
      // --- 5. LOGGING IN ---
      // Checks credentials against Supabase Auth Users table.
      // Returns a Session (JWT) if correct.
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      // --- 6. SIGNING UP ---
      // Creates a new user in the Auth table.
      // Usually triggers a "Confirm your email" email by default.
      result = await supabase.auth.signUp({ email, password });
    }

    if (result.error) {
      setError(result.error.message);
    } else if (action === 'signup' && result.data.user && !result.data.session) {
      setMessage("Success! Check your email to verify.");
    }
    setLoading(false);
  };

  return (
      // ... Login UI (Inputs and Buttons) ...
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        {/* ... */}
        <button onClick={() => handleAuth("login")}>Sign In</button>
        <button onClick={() => handleAuth("signup")}>Create Account</button>
      </div>
  );
}

const LoadingScreen = () => ( <div>Loading...</div> );