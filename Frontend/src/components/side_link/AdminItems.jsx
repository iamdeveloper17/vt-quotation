import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminItems = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get("https://vt-quotation.onrender.com/items", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        console.log("Fetched items:", res.data); // 👀 Check this in console
        setItems(res.data);
      } catch (error) {
        console.error("Failed to load items", error);
      }
    };
  
    fetchItems();
  }, []);
  

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4 uppercase text-center text-[#343148FF]">Item Suggestions</h2>

      <div className="overflow-x-auto mt-4">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Model</th>
              <th className="p-2 border">HSN</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">GST (%)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="text-center">
                <td className="border p-2">{item.description}</td>
                <td className="border p-2">{item.model}</td>
                <td className="border p-2">{item.hsn}</td>
                <td className="border p-2">₹{item.price}</td>
                <td className="border p-2">{item.gst}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminItems;
