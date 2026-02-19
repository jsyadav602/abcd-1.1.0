import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
// import Users from "./pages/Users/Users";
import Users from "./pages/users/Users";
import AddUser from "./pages/users/AddUser";
import EditUser from "./pages/users/EditUser";
import UserDetails from "./pages/users/UserDetails";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            }
          />

          <Route
            path="/users"
            element={
              <MainLayout>
                <Users />
              </MainLayout>
            }
          />

          <Route
            path="/users/add"
            element={
              <MainLayout>
                <AddUser />
              </MainLayout>
            }
          />

          <Route
            path="/users/edit/:id"
            element={
              <MainLayout>
                <EditUser />
              </MainLayout>
            }
          />

          <Route
            path="/user-detail/:id"
            element={
              <MainLayout>
                <UserDetails />
              </MainLayout>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
