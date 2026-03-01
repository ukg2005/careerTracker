import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";
import JobDetails from "./pages/JobDetails";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";

// Only allows access if a token exists, otherwise redirects to login
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to='/login' replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes — no guard, always accessible */}
        <Route path='/login' element={<Login />} />
        <Route path='/verify-otp' element={<VerifyOTP />} />

        {/* Protected Routes */}
        <Route path='/dashboard' element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path='/analytics' element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path='/profile' element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path='/jobs/:id' element={<PrivateRoute><JobDetails /></PrivateRoute>} />

        {/* Default redirect to login */}
        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;