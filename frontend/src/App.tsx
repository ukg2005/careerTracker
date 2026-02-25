import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";
import JobDetails from "./pages/JobDetails";

const Register = () => <h1>Register Page</h1>;
const Analytics = () => <h1>Analytics Page</h1>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path='/login' element={<Login/>} />
        <Route path='/register' element={<Register/>} />
        <Route path='/verify-otp' element={<VerifyOTP/>} />

        {/* Protected Routes */}
        <Route path='/dashboard' element={<Dashboard/>} />
        <Route path='/analytics' element={<Analytics/>} />
        <Route path='/jobs/:id' element={<JobDetails/>} />

        {/* Default redirect to login */}
        <Route path='*' element={<Navigate to='/login' replace/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;