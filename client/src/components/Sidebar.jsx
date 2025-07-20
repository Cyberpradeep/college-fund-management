import { Link } from 'react-router-dom';

const CoordinatorSidebar = () => {
  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Coordinator Panel</h2>
      <ul className="space-y-4">
        <li><Link to="/coordinator/dashboard">Dashboard</Link></li>
        <li><Link to="/coordinator/upload">Upload Bill</Link></li>
        <li><Link to="/coordinator/transactions">My Bills</Link></li>
      </ul>
    </div>
  );
};

export default CoordinatorSidebar;
