import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { LoginPage } from './pages/LoginPage';
import { useAuthStore } from './store/authStore';
import { TooltipProvider } from "@/components/ui/Tooltip"

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <TooltipProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/chat" replace />} 
          />
          <Route 
            path="/chat" 
            element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} 
          />
        </Routes>
      </Router>
    </TooltipProvider>
  );
}

export default App;
