import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from "../images/logo.png";
import { FiMenu, FiX } from "react-icons/fi";

const Side_Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    console.log("User Logged Out");
    window.location.href = "/";
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed left-4 z-50 text-3xl text-[#343148FF] bg-transparent mb-10 h-[9%]"
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Backdrop (for mobile menu open state) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`
    fixed top-0 left-0 h-full w-[250px] bg-[#F4F4F4] text-[#212121] shadow-xl z-40
    transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
    flex flex-col justify-between md:static
  `}
      >

        {/* Logo */}
        <div className="flex justify-center items-center py-6 border-b border-gray-300">
          <img src={logo} className="h-20 w-24 object-contain" alt="Logo" />
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 mt-6">
          <ul className="space-y-2">
            {[
              { path: "/home/dashboard", label: "Dashboard" },
              { path: "/home/quotation", label: "Quotation" },
              { path: "/home/purchase_order", label: "Purchase Order" },
            ].map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)} // Close sidebar on mobile after click
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-md font-medium transition-all duration-300 ${isActive
                      ? "bg-[#B5A680] text-[#343148FF]"
                      : "hover:bg-[#968054] hover:text-[#343148FF]"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {userRole === "admin" && (
              <li>
                <NavLink
                  to="/home/adminusers"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-md font-medium transition-all duration-300 ${isActive
                      ? "bg-[#B5A680] text-[#343148FF]"
                      : "hover:bg-[#968054] hover:text-[#343148FF]"
                    }`
                  }
                >
                  Users
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* Logout */}
        <div className="px-4 pb-6">
          <button
            onClick={handleLogout}
            className="w-full bg-[#B5A680] text-[#343148FF] hover:bg-red-800 hover:text-white transition-all duration-300 font-medium py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Side_Navbar;
