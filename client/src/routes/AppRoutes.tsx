import { Route, Routes } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import GenderMainPage from "../pages/Gender/GenderMainPage";
import EditGenderPage from "../pages/Gender/EditGenderPage";
import DeleteGenderPage from "../pages/Gender/DeleteGenderPage";
import UserMainPage from "../pages/User/UserMainPage";
import DashboardMainPage from "../pages/Dashboard/DashboardMainPage";
import InventoryMainPage from "../pages/Inventory/InventoryMainPage";
import POSMainPage from "../pages/POS/POSMainPage";
import LoginPage from "../pages/Auth/LoginPage";
import { AuthProvider } from "../contexts/AuthContext";
import ProtectedRoute from "./ProtectedRoute";


const AppRoutes = () => {
    return (
        <>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route element={<ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>}>
                        <Route path="dashboard" element={<DashboardMainPage />} />
                        <Route path="inventory" element={<InventoryMainPage />} />
                        <Route path="pos" element={<POSMainPage />} />
                        <Route path="genders" element={<GenderMainPage />} />
                        <Route path="/gender/edit/:gender_id" element={<EditGenderPage />} />
                        <Route path="/gender/delete/:gender_id" element={<DeleteGenderPage />} />
                        <Route path="/users" element={<UserMainPage />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </>
    )
}

export default AppRoutes;