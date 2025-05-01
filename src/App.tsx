import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/Navbar';
import { Auth } from './pages/Auth';
import { Profile } from './pages/Profile';
import { Portfolio } from './pages/Portfolio';
import { Connections } from './pages/Connections';

function App() {
  const { setSession, user } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/profile" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/profile/:userId" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/portfolio" element={user ? <Portfolio /> : <Navigate to="/auth" />} />
          <Route path="/connections" element={user ? <Connections /> : <Navigate to="/auth" />} />
          <Route path="/" element={<Navigate to={user ? "/profile" : "/auth"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;