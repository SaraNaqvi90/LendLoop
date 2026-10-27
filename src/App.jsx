import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Shell';
import { AdminPage, AuthPage, BrowsePage, BookingsPage, ItemDetailPage, ListItemPage, MyItemsPage, NotificationsPage, ProfilePage, WalletPage } from './pages/Pages';
import './lendloop.css';
function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><span className="spinner"/> Connecting to LendLoop…</div>;
  return <Routes>
    <Route path="/auth/:mode" element={user ? <Navigate to="/" replace/> : <AuthPage/>}/>
    <Route element={<Layout/>}>
      <Route path="/" element={<BrowsePage/>}/><Route path="/items/:id" element={<ItemDetailPage/>}/>
      <Route path="/list-item" element={user ? <ListItemPage/> : <Navigate to="/auth/login" replace/>}/>
      <Route path="/my-items" element={user ? <MyItemsPage/> : <Navigate to="/auth/login" replace/>}/>
      <Route path="/bookings" element={user ? <BookingsPage/> : <Navigate to="/auth/login" replace/>}/>
      <Route path="/wallet" element={user ? <WalletPage/> : <Navigate to="/auth/login" replace/>}/>
      <Route path="/notifications" element={user ? <NotificationsPage/> : <Navigate to="/auth/login" replace/>}/>
      <Route path="/profile" element={user ? <ProfilePage/> : <Navigate to="/auth/login" replace/>}/>
      <Route path="/admin" element={user?.role === 'admin' ? <AdminPage/> : <Navigate to="/" replace/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Route>
  </Routes>;
}
export default function App() { return <AuthProvider><AppRoutes/></AuthProvider>; }
