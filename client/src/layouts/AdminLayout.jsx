import AdminSidebar from '../components/AdminSidebar';

const AdminLayout = ({ children }) => {
  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
    }}>
      {/* Sidebar container - now width is controlled by sidebar component */}
      <AdminSidebar />
      
      {/* Main content area */}
      <main style={{ 
        flex: 1, 
        padding: '2rem', 
        overflow: 'auto',
        backgroundColor: 'white',
        transition: 'margin-left 0.3s ease',
      }}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;