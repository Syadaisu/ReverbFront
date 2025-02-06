import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import Home from "./Components/Home";
import ProtectedRoute from "./Components/ProtectedRoutes";


function App() {
  return (
      <Routes>
          <Route path='login/*' element={<LoginPage />} />
          <Route path='register/*' element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path='home/*' element={<Home />} />
          </Route>
          
          <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
  );
}

export default App;