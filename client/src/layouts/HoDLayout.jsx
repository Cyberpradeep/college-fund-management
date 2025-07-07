import { useState } from 'react';
import HODSidebar from '../components/HODSidebar';

const HODLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 80 : 250;

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      paddingLeft: `${sidebarWidth}px`,
      transition: 'padding-left 0.3s ease'
    }}>
      <HODSidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <main style={{ 
        flex: 1, 
        padding: '2rem',
        width: '100%'
      }}>
        {children}
      </main>
    </div>
  );
};

export default HODLayout;