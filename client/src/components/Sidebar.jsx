import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <ul className="space-y-4">
        <li><Link to="/admin/users">Manage Users</Link></li>
        <li><Link to="/admin/departments">Departments</Link></li>
        <li><Link to="/admin/allocate">Allocate Funds</Link></li>
        <li><Link to="/admin/bills">Verify Bills</Link></li>
        <li><Link to="/admin/reports">Reports</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
