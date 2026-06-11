import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Challenge from './pages/Challenge';
import Leaderboard from './pages/Leaderboard';
import Onboarding from './pages/Onboarding';
import AddQuestion from './pages/admin/AddQuestion';
import ProtectedRoute from './routes/ProtectedRoute';

import { AntiCheatProvider } from './context/AntiCheatContext';

function App() {
  return (
    <Router>
      <AntiCheatProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/challenge/:slug" element={<Challenge />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin/add-question" element={<AddQuestion />} />
          </Route>
        </Routes>
      </AntiCheatProvider>
    </Router>
  );
}

export default App;
