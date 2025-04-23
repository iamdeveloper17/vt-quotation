import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminItems = () => {
  const [items, setItems] = useState([]);

  // 🔄 Fetch all items
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get("https://vt-quotation.onrender.com/items", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setItems(res.data);
    } catch (error) {
      console.error("Failed to load items", error);
    }
  };

  // ❌ Handle delete
  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this item?");
    if (!confirm) return;

    try {
      await axios.delete(`https://vt-quotation.onrender.com/items/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setItems((prev) => prev.filter((item) => item._id !== id));
      alert("✅ Item deleted successfully");
    } catch (error) {
      console.error("❌ Failed to delete item:", error);
      alert("Error deleting item");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4 uppercase text-center text-[#343148FF]">
        Items List
      </h2>

      {/* ✅ DESKTOP TABLE VIEW */}
      <div className="hidden md:block mt-4 h-[500px] overflow-y-auto shadow-xl border border-gray-300 rounded-lg">
        <table className="w-full table-auto border-collapse">
          <thead className="sticky top-0 bg-[#D7C49EFF]">
            <tr>
              <th className="p-2 border border-gray-300">S.No</th>
              <th className="p-2 border border-gray-300">Description</th>
              <th className="p-2 border border-gray-300">Model</th>
              <th className="p-2 border border-gray-300">HSN</th>
              <th className="p-2 border border-gray-300">Price</th>
              <th className="p-2 border border-gray-300">GST (%)</th>
              <th className="p-2 border border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, idx) => (
                <tr key={item._id} className="text-center">
                  <td className="border border-gray-300 p-2">{idx + 1}</td>
                  <td className="border border-gray-300 p-2">{item.description}</td>
                  <td className="border border-gray-300 p-2">{item.model}</td>
                  <td className="border border-gray-300 p-2">{item.hsn}</td>
                  <td className="border border-gray-300 p-2">₹{item.price}</td>
                  <td className="border border-gray-300 p-2">{item.gst}%</td>
                  <td className="border border-gray-300 p-2">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="h-96 p-4">
                  <div className="flex justify-center items-center h-full w-full text-center text-gray-700">
                    No items found
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ MOBILE CARD VIEW */}
      <div className="block md:hidden mt-4 max-h-[68vh] overflow-y-auto space-y-4 bg-[#D7C49EFF] rounded-md p-2 shadow-xl">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div key={item._id} className="bg-white shadow-sm rounded-md p-4">
              <p><strong>S.No:</strong> {idx + 1}</p>
              <p><strong>Description:</strong> {item.description}</p>
              <p><strong>Model:</strong> {item.model}</p>
              <p><strong>HSN:</strong> {item.hsn}</p>
              <p><strong>Price:</strong> ₹{item.price}</p>
              <p><strong>GST:</strong> {item.gst}%</p>
              <button
                onClick={() => handleDelete(item._id)}
                className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No items found</p>
        )}
      </div>
    </div>
  );
};

export default AdminItems;
