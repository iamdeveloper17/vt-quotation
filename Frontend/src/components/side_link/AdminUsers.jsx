import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await axios.get("https://vt-quotation.onrender.com/admin/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        console.log("Fetched users:", res.data);
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to load users", error);
      }
    };

    fetchAllUsers();
  }, []);

  const handlePermissionChange = async (userId, field, value) => {
    const token = localStorage.getItem("token");
    const user = users.find((u) => u._id === userId);
    if (!user) return alert("User not found");

    const updatedPermissions = {
      canCreateQuotation: field === "canCreateQuotation" ? value : user.canCreateQuotation,
      canCreatePurchaseOrder: field === "canCreatePurchaseOrder" ? value : user.canCreatePurchaseOrder,
    };

    try {
      await axios.put(
        `https://vt-quotation.onrender.com/admin/users/${userId}/permissions`,
        updatedPermissions,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId ? { ...u, ...updatedPermissions } : u
        )
      );
      alert("✅ Permissions updated");
    } catch (error) {
      console.error("Failed to update user permissions", error);
      alert("❌ Could not update permission");
    }
  };

  const handleDelete = async (userId) => {
    const confirm = window.confirm("Are you sure you want to delete this user?");
    if (!confirm) return;

    try {
      await axios.delete(`https://vt-quotation.onrender.com/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setUsers(users.filter((user) => user._id !== userId));
      alert("✅ User deleted");
    } catch (error) {
      console.error("❌ Failed to delete user:", error);
      alert("❌ Could not delete user");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4 uppercase text-center text-[#343148FF]">
        Users List
      </h2>

      {/* ✅ DESKTOP TABLE VIEW */}
      <div className="hidden md:block mt-4 h-[500px] overflow-y-auto shadow-xl border border-gray-300 rounded-lg">
        <table className="w-full table-auto border-collapse">
          <thead className="sticky top-0 bg-[#D7C49EFF]">
            <tr>
              <th className="p-2 border border-gray-300">Name</th>
              <th className="p-2 border border-gray-300">Email</th>
              <th className="p-2 border border-gray-300">Role</th>
              <th className="p-2 border border-gray-300">Create Quotation</th>
              <th className="p-2 border border-gray-300">Create Purchase Order</th>
              <th className="p-2 border border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="text-center">
                  <td className="p-2 border border-gray-300">{user.name}</td>
                  <td className="p-2 border border-gray-300">{user.email}</td>
                  <td className="p-2 border border-gray-300">{user.role}</td>
                  <td className="p-2 border border-gray-300">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="checkbox"
                        checked={user.canCreateQuotation}
                        onChange={(e) =>
                          handlePermissionChange(user._id, "canCreateQuotation", e.target.checked)
                        }
                      />
                      <span className="text-sm">
                        {user.canCreateQuotation ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-gray-300">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="checkbox"
                        checked={user.canCreatePurchaseOrder}
                        onChange={(e) =>
                          handlePermissionChange(user._id, "canCreatePurchaseOrder", e.target.checked)
                        }
                      />
                      <span className="text-sm">
                        {user.canCreatePurchaseOrder ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-gray-300 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="h-96 p-4 text-center text-gray-600">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ MOBILE CARD VIEW */}
      <div className="block md:hidden mt-4 max-h-[68vh] overflow-y-auto space-y-4 bg-[#D7C49EFF] rounded-md p-2 shadow-xl">
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user._id} className="bg-white shadow-sm rounded-md p-4 space-y-2">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p>
                <strong>Can Create Quotation:</strong>
                <input
                  type="checkbox"
                  className="ml-2"
                  checked={user.canCreateQuotation}
                  onChange={(e) =>
                    handlePermissionChange(user._id, "canCreateQuotation", e.target.checked)
                  }
                />
              </p>
              <p>
                <strong>Can Create Purchase Order:</strong>
                <input
                  type="checkbox"
                  className="ml-2"
                  checked={user.canCreatePurchaseOrder}
                  onChange={(e) =>
                    handlePermissionChange(user._id, "canCreatePurchaseOrder", e.target.checked)
                  }
                />
              </p>
              <button
                onClick={() => handleDelete(user._id)}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No users found</p>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
