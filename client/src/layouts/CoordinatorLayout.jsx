
import { useState } from 'react';
import CoordinatorSidebar from '../components/CoordinatorSidebar';

// Use the same width values as in CoordinatorSidebar
const expandedWidth = 250;
const collapsedWidth = 80;

const CoordinatorLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <CoordinatorSidebar 
        collapsed={collapsed} 
        toggleSidebar={() => setCollapsed((c) => !c)} 
      />
      <div
        style={{
          flex: 1,
          background: '#f7f9fb',
          minHeight: '100vh',
          padding: '32px',
          marginLeft: collapsed ? collapsedWidth : expandedWidth,
          transition: 'margin-left 0.3s ease', // Match sidebar transition
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default CoordinatorLayout;
