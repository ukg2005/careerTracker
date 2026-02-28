import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";
import JobDetails from "./pages/JobDetails";

const Register = () => <h1>Register Page</h1>;
const Analytics = () => <h1>Analytics Page</h1>;

function PrivateMethod ({ children }: {children: React.ReactNode}) {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to='login/' replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path='/login' element={<PrivateMethod> <Login/> </PrivateMethod>} />
        <Route path='/register' element={<PrivateMethod> <Register/> </PrivateMethod>} />
        <Route path='/verify-otp' element={<PrivateMethod> <VerifyOTP/> </PrivateMethod>} />

        {/* Protected Routes */}
        <Route path='/dashboard' element={<PrivateMethod> <Dashboard/> </PrivateMethod>} />
        <Route path='/analytics' element={<PrivateMethod> <Analytics/> </PrivateMethod>} />
        <Route path='/jobs/:id' element={<PrivateMethod> <JobDetails/> </PrivateMethod>} />

        {/* Default redirect to login */}
        <Route path='*' element={<Navigate to='/login' replace/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;