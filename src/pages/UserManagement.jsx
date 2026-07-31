import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUser, deleteUser } from "../api/users";
import {
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiUsers,
  FiArrowUp,
  FiArrowDown,
  FiX,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiCheck,
  FiAlertTriangle
} from 'react-icons/fi';
import LeelamayiLoader from "../components/LeelamayiLoader";

export default function UserManagement() {
  const navigate = useNavigate();

  // State Management
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    location: ''
  });
  const [editErrors, setEditErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Custom Modal States
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [successModalState, setSuccessModalState] = useState({ isOpen: false, message: '' });
  const [errorModalState, setErrorModalState] = useState({ isOpen: false, message: '' });

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const roles = [
    "admin",
    "user",
  ];

  const locations = [...new Set(users.map(user => user.location).filter(Boolean))];

  // Helper for Initials
  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // get api for users 
  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      const { data } = await getUsers();

      const formattedUsers = data.map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.username,
        phone: user.phone_no || "",
        location: user.location || "",
        role: user.role,
        password: "",
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ESC Key Listener for Delete Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && deleteModalState.isOpen && !isDeleting) {
        setDeleteModalState({ isOpen: false, user: null });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteModalState.isOpen, isDeleting]);

  // Automatic Timeout for Success Modal
  useEffect(() => {
    if (successModalState.isOpen) {
      const timer = setTimeout(() => {
        setSuccessModalState({ isOpen: false, message: '' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successModalState.isOpen]);

  // Actions
  const handleRefresh = () => {
    fetchUsers();
  };

  // Open Delete Confirmation Modal
  const handleDeleteUser = (id, name) => {
    setDeleteModalState({ isOpen: true, user: { id, name } });
  };

  // Confirm and Execute Delete API
  const confirmDeleteUser = async () => {
    if (!deleteModalState.user) return;
    const { id } = deleteModalState.user;

    try {
      setIsDeleting(true);

      await deleteUser(id);

      await fetchUsers();

      // Close Delete Modal & Show Success Modal
      setDeleteModalState({ isOpen: false, user: null });
      setSuccessModalState({ isOpen: true, message: "User deleted successfully." });
    } catch (error) {
      console.error("Delete User Error:", error);
      setDeleteModalState({ isOpen: false, user: null });

      const backendMessage = error?.response?.data?.detail;
      setErrorModalState({
        isOpen: true,
        message: backendMessage || "Failed to delete user. Please try again."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Edit Modal & Pre-fill
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      password: user.password || 'Password123',
      role: user.role || '',
      location: user.location || ''
    });
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateEditForm = () => {
    const newErrors = {};
    if (!editFormData.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!editFormData.lastName.trim()) newErrors.lastName = 'Last name is required.';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editFormData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(editFormData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const phoneRegex = /^[0-9+\s-]{8,15}$/;
    if (!editFormData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!phoneRegex.test(editFormData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number.';
    }

    if (!editFormData.password) {
      newErrors.password = 'Password is required.';
    } else if (editFormData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!editFormData.role) newErrors.role = 'Role selection is required.';
    if (!editFormData.location) newErrors.location = 'Warehouse/Location selection is required.';

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // update user api
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!validateEditForm()) return;

    try {
      setIsUpdating(true);

      await updateUser(editingUser.id, {
        first_name: editFormData.firstName,
        last_name: editFormData.lastName,
        username: editFormData.email,
        phone_no: editFormData.phone,
        location: editFormData.location,
        role: editFormData.role,
      });

      await fetchUsers();

      setEditingUser(null);
      // Replaced Toast with Update Success Popup
      setSuccessModalState({ isOpen: true, message: "User updated successfully." });
    } catch (error) {
      console.error("Update User Error:", error);

      const backendMessage = error?.response?.data?.detail;
      setErrorModalState({
        isOpen: true,
        message: backendMessage || "Failed to update user."
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Sorting Handler
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Global Search across Full Name, Email, Phone, Location, and Role
  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return users
      .filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email ? user.email.toLowerCase() : '';
        const phone = user.phone ? user.phone.toLowerCase() : '';
        const location = user.location ? user.location.toLowerCase() : '';
        const role = user.role ? user.role.toLowerCase() : '';

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          location.includes(query) ||
          role.includes(query)
        );
      })
      .sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'name') {
          valA = `${a.firstName} ${a.lastName}`;
          valB = `${b.firstName} ${b.lastName}`;
        }

        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
  }, [users, searchTerm, sortConfig]);

  // Real CSV Export Functionality
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      setErrorModalState({ isOpen: true, message: "No data available to export." });
      return;
    }

    const headers = ["Name", "Email", "Phone Number", "Location", "Role"];
    
    const rows = filteredUsers.map(user => [
      `"${`${user.firstName} ${user.lastName}`.replace(/"/g, '""')}"`,
      `"${user.email.replace(/"/g, '""')}"`,
      `"${user.phone.replace(/"/g, '""')}"`,
      `"${user.location.replace(/"/g, '""')}"`,
      `"${user.role.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Users_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Pagination Calculations
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  // Compact Role Badge
  const renderRoleBadge = (role) => {
    let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
    if (role.includes("Admin")) colorClass = "bg-purple-50 text-purple-700 border-purple-200";
    else if (role.includes("Manager")) colorClass = "bg-blue-50 text-blue-700 border-blue-200";
    else if (role.includes("Inspector")) colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    else if (role.includes("Lead")) colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

    return (
      <span className={`inline-block truncate max-w-[130px] px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}>
        {role}
      </span>
    );
  };

  return (
    <>
      <LeelamayiLoader
        loading={isLoading}
        message="Loading Users"
      />
      <div className="w-full h-full min-h-full p-6 text-slate-800 font-sans relative">

        {/* 1. Pill-Shaped Global Search Bar */}
        <div className="mb-5 w-100">
          <div className="relative w-full h-[40px]">
            <FiSearch className="absolute left-[18px] top-1/2 transform -translate-y-1/2 text-[#9CA3AF] w-[20px] h-[20px]" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-full pl-[52px] pr-5 text-[14px] font-[400] text-slate-800 bg-white border border-gray-300 rounded-xl placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
          </div>
        </div>

        {/* 2. Header Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1E48] tracking-tight uppercase">
              USERS MANAGEMENT
            </h1>
            
            <p className="text-xs text-slate-500 mt-0.5">
              Manage system users, roles and permissions.
            </p>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/users/add')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0B1E48] hover:bg-[#071330] rounded-lg shadow-sm transition"
            >
              <FiPlus className="w-4 h-4" />
              Add New User
            </button>
          </div>
        </div>

        {/* 3. Main Users Table Card */}
        <div 
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-full"
          style={{ boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}
        >
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B1E48] text-white text-[11px] font-bold tracking-wider uppercase">
                  <th className="py-2.5 px-3 text-center w-12">Profile</th>
                  <th onClick={() => handleSort('name')} className="py-2.5 px-3 cursor-pointer hover:bg-white/10 transition">
                    <div className="flex items-center gap-1">
                      Name
                      {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Phone Number</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      <FiRefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0B1E48]" />
                      <p className="font-medium text-slate-600">Loading user profiles...</p>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      <FiUsers className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-xs">No user records found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      {/* Profile Initials Avatar */}
                      <td className="py-2 px-3 text-center">
                        <div className="w-6 h-6 rounded-full bg-[#0B1E48]/10 text-[#0B1E48] font-bold text-[9px] flex items-center justify-center mx-auto border border-[#0B1E48]/20">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                      </td>

                      {/* Merged Name Column */}
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {`${user.firstName} ${user.lastName}`}
                      </td>

                      {/* Email Column */}
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {user.email}
                      </td>

                      {/* Phone Number */}
                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {user.phone}
                      </td>

                      {/* Location */}
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {user.location}
                      </td>

                      {/* Role Badge */}
                      <td className="py-2 px-3">
                        {renderRoleBadge(user.role)}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            title="Edit User"
                            className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-[#0B1E48] transition"
                          >
                            <FiEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                            title="Delete User"
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Pagination Controls */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows Per Page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0B1E48]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="ml-2 text-slate-400">
              Showing {filteredUsers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{" "}
              {Math.min(currentPage * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition"
              title="First Page"
            >
              <FiChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition"
              title="Previous Page"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-[#0B1E48] text-white font-semibold rounded">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition"
              title="Next Page"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition"
              title="Last Page"
            >
              <FiChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-[#0B1E48] text-white p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-slate-300">USER MANAGEMENT</p>
                  <h2 className="text-lg font-bold">EDIT USER</h2>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1 hover:bg-white/10 rounded transition text-slate-300 hover:text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} noValidate className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={editFormData.firstName}
                      onChange={handleEditChange}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border ${
                        editErrors.firstName ? 'border-rose-500' : 'border-slate-200 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none transition text-slate-800`}
                    />
                    {editErrors.firstName && (
                      <p className="flex items-center gap-1 text-[11px] text-rose-500 mt-1">
                        <FiAlertCircle className="w-3 h-3" /> {editErrors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={editFormData.lastName}
                      onChange={handleEditChange}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border ${
                        editErrors.lastName ? 'border-rose-500' : 'border-slate-200 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none transition text-slate-800`}
                    />
                    {editErrors.lastName && (
                      <p className="flex items-center gap-1 text-[11px] text-rose-500 mt-1">
                        <FiAlertCircle className="w-3 h-3" /> {editErrors.lastName}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditChange}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border ${
                        editErrors.email ? 'border-rose-500' : 'border-slate-200 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none transition text-slate-800`}
                    />
                    {editErrors.email && (
                      <p className="flex items-center gap-1 text-[11px] text-rose-500 mt-1">
                        <FiAlertCircle className="w-3 h-3" /> {editErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditChange}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border font-mono ${
                        editErrors.phone ? 'border-rose-500' : 'border-slate-200 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none transition text-slate-800`}
                    />
                    {editErrors.phone && (
                      <p className="flex items-center gap-1 text-[11px] text-rose-500 mt-1">
                        <FiAlertCircle className="w-3 h-3" /> {editErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={editFormData.password}
                      onChange={handleEditChange}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border ${
                        editErrors.password ? 'border-rose-500' : 'border-slate-200 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none transition text-slate-800`}
                    />
                    {editErrors.password && (
                      <p className="flex items-center gap-1 text-[11px] text-rose-500 mt-1">
                        <FiAlertCircle className="w-3 h-3" /> {editErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={editFormData.role}
                      onChange={handleEditChange}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border ${
                        editErrors.role ? 'border-rose-500' : 'border-slate-200 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none transition text-slate-800`}
                    >
                      <option value="">Select Role</option>
                      {roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {editErrors.role && (
                      <p className="flex items-center gap-1 text-[11px] text-rose-500 mt-1">
                        <FiAlertCircle className="w-3 h-3" /> {editErrors.role}
                      </p>
                    )}
                  </div>

                  {/* Warehouse / Location */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Warehouse <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditChange}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border ${
                        editErrors.location ? 'border-rose-500' : 'border-slate-200 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none transition text-slate-800`}
                    >
                      <option value="">Select Warehouse</option>
                      {locations.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    {editErrors.location && (
                      <p className="flex items-center gap-1 text-[11px] text-rose-500 mt-1">
                        <FiAlertCircle className="w-3 h-3" /> {editErrors.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0B1E48] hover:bg-[#071330] rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Updating...
                      </span>
                    ) : (
                      <>
                        <FiSave className="w-3.5 h-3.5" />
                        Update User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOM MODAL 1: DELETE CONFIRMATION POPUP */}
        {deleteModalState.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[16px] shadow-2xl border border-slate-100 w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete User?</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteModalState({ isOpen: false, user: null })}
                  className="w-1/2 py-2 px-4 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteUser}
                  className="w-1/2 py-2 px-4 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM MODAL 2: SUCCESS POPUP (Used for Delete & Update Success) */}
        {successModalState.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[16px] shadow-2xl border border-slate-100 w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Success</h3>
              <p className="text-xs text-slate-500 mb-6">{successModalState.message}</p>
              <button
                type="button"
                onClick={() => setSuccessModalState({ isOpen: false, message: '' })}
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* CUSTOM MODAL 3: ERROR POPUP */}
        {errorModalState.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[16px] shadow-2xl border border-slate-100 w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Failed</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">{errorModalState.message}</p>
              <button
                type="button"
                onClick={() => setErrorModalState({ isOpen: false, message: '' })}
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                OK
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}