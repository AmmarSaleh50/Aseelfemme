import React from 'react';
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import { ToastProvider } from './components/ToastProvider';
import Home from './pages/Home';
import Collection from './pages/Collection';
import ProductDetail from './pages/ProductDetail';
import Accessories from './pages/Accessories';
import AccessoryDetail from './pages/AccessoryDetail';
import Ingredients from './pages/Ingredients';
import IngredientDetail from './pages/IngredientDetail';
import Journal from './pages/Journal';
import Contact from './pages/Contact';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductEdit from './pages/admin/ProductEdit';
import AdminIngredients from './pages/admin/IngredientsList';
import AdminIngredientEdit from './pages/admin/IngredientEdit';
import AdminCategories from './pages/admin/Categories';
import AdminCategoryEdit from './pages/admin/CategoryEdit';
import AdminAccessories from './pages/admin/AccessoriesList';
import AdminAccessoryEdit from './pages/admin/AccessoryEdit';
import AdminAccount from './pages/admin/Account';

function AdminGuard({ children }) {
  const token = localStorage.getItem('af_admin_token');
  return token ? children : <Navigate to="/admin/login" replace />;
}

import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';

function RootLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <ToastProvider>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        <Helmet>
          <meta name="description" content={t('meta.description')} />
        </Helmet>
        <Header />
        <main className="flex-1 pt-14 md:pt-20 pb-20">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname} className="h-full">
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
        <Footer />
        <CookieConsent />
      </div>
    </ToastProvider>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'collection', element: <Collection /> },
      { path: 'product/:slug', element: <ProductDetail /> },
      { path: 'accessories', element: <Accessories /> },
      { path: 'accessories/:slug', element: <AccessoryDetail /> },
      { path: 'ingredients', element: <Ingredients /> },
      { path: 'ingredients/:slug', element: <IngredientDetail /> },
      { path: 'journal', element: <Journal /> },
      { path: 'contact', element: <Contact /> },
      { path: 'admin/login', element: <AdminLogin /> },
      {
        path: 'admin',
        element: (
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/products',
        element: (
          <AdminGuard>
            <AdminProducts />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/products/new',
        element: (
          <AdminGuard>
            <AdminProductEdit />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/products/:id',
        element: (
          <AdminGuard>
            <AdminProductEdit />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/ingredients',
        element: (
          <AdminGuard>
            <AdminIngredients />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/ingredients/new',
        element: (
          <AdminGuard>
            <AdminIngredientEdit />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/ingredients/:id',
        element: (
          <AdminGuard>
            <AdminIngredientEdit />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/categories',
        element: (
          <AdminGuard>
            <AdminCategories />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/categories/new',
        element: (
          <AdminGuard>
            <AdminCategoryEdit />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/categories/:id',
        element: (
          <AdminGuard>
            <AdminCategoryEdit />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/accessories',
        element: (
          <AdminGuard>
            <AdminAccessories />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/accessories/new',
        element: (
          <AdminGuard>
            <AdminAccessoryEdit />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/accessories/:id',
        element: (
          <AdminGuard>
            <AdminAccessoryEdit />
          </AdminGuard>
        ),
      },
      {
        path: 'admin/account',
        element: (
          <AdminGuard>
            <AdminAccount />
          </AdminGuard>
        ),
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
