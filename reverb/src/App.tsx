import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import MainPage from "./Pages/MainPage";


function App() {
  return (
      <Routes>
          <Route path='login/*' element={<LoginPage />} />
          <Route path='register/*' element={<RegisterPage />} />
          <Route path='home/*' element={<MainPage />} />
          <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
  );
}

export default App;