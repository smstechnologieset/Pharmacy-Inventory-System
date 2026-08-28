import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <Header />
      <main className="main-content">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
