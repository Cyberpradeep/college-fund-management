// Utility to fetch department name by ID
import API from '../services/api';

export async function getDepartmentNameById(departmentId) {
  try {
    const res = await API.get(`/departments`); // Admin endpoint, returns all departments
    const departments = res.data;
    const dept = departments.find(d => d._id === departmentId);
    return dept ? dept.name : departmentId;
  } catch (err) {
    return departmentId;
  }
}
