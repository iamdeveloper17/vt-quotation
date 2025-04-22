import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Quotation = () => {
  const [invoices, setInvoices] = useState([]);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const navigate = useNavigate();

  const companies = [
    "BR Biomedical Pvt Ltd",
    "Hanuman HealthCare",
    "Vego & Thomson Pvt Ltd",
    "HH Corporation India",
  ];

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const userEmail = localStorage.getItem("userEmail");
    const userRole = localStorage.getItem("userRole");

    if (!userEmail || !userRole) {
      console.error("Missing user info. Redirecting to login.");
      return;
    }

    try {
      let url = "https://vt-quotation.onrender.com/invoices";

      if (userRole !== "admin") {
        url += `?userEmail=${userEmail}`; // regular user gets filtered data
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };


  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await fetch(`https://vt-quotation.onrender.com/invoices/${id}`, { method: "DELETE" });
        setInvoices(invoices.filter((invoice) => invoice._id !== id));
        alert("Quotation deleted successfully!");
      } catch (error) {
        console.error("Error deleting invoice:", error);
        alert("Failed to delete invoice");
      }
    }
  };

  const handleEdit = (invoice) => {
    // navigate("/invoiceForm", { state: { editData: invoice } });
    console.log(invoice.companyName)
    if (invoice.companyName === "BR Biomedical Pvt Ltd") {
      navigate("/quotation/br", { state: { editData: invoice } });
    }
    else if (invoice.companyName === "Hanuman Healthcare") {
      navigate("/quotation/hanuman", { state: { editData: invoice } });
    }
    else if (invoice.companyName === "Vego & Thomson Pvt Ltd") {
      navigate("/quotation/vego", { state: { editData: invoice } });
    }
    else if (invoice.companyName === "HH Corporation India") {
      navigate("/quotation/hh", { state: { editData: invoice } });
    }
    else {
      alert("it is not company")
    }
  };

  const handleCompanySelect = (companyName) => {
    setShowCompanySelector(false);

    // Navigate to a specific route for the selected company
    switch (companyName) {
      case "BR Biomedical Pvt Ltd":
        navigate("/quotation/br", { state: { selectedCompany: companyName } });
        break;
      case "Hanuman HealthCare":
        navigate("/quotation/hanuman", { state: { selectedCompany: companyName } });
        break;
      case "Vego & Thomson Pvt Ltd":
        navigate("/quotation/vego", { state: { selectedCompany: companyName } });
        break;
      case "HH Corporation India":
        navigate("/quotation/hh", { state: { selectedCompany: companyName } });
        break;
      default:
        navigate("/quotation", { state: { selectedCompany: companyName } });
    }
  };

  const canCreateQuotation = localStorage.getItem("canCreateQuotation") === "true" ||
  localStorage.getItem("userRole") === "admin";

  if (!canCreateQuotation) {
    return (
      <div className="text-red-600 font-bold text-center mt-20 text-xl">
        🚫 You do not have permission to view the Quotation page.
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4 uppercase text-center text-[#343148FF]">Quotation List</h2>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={() => setShowCompanySelector(true)}
      >
        Create New Quotation
      </button>

      {showCompanySelector && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-sm w-full mx-4">
            <h2 className="text-2xl font-semibold mb-4 text-center">Select Company</h2>
            <ul className="space-y-2">
              {companies.map((company, index) => (
                <li key={index}>
                  <button
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition hover:cursor-pointer"
                    onClick={() => handleCompanySelect(company)}
                  >
                    {company}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowCompanySelector(false)}
              className="mt-4 text-lg text-white w-full text-center bg-red-600 p-2 rounded hover:cursor-pointer hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="hidden md:block mt-4 h-[500px] overflow-y-auto shadow-xl border border-gray-300 rounded-lg">
        <table className="w-full table-auto border-collapse">
          <thead className="sticky top-0 bg-[#D7C49EFF]">
            <tr>
              <th className="p-2 border border-gray-300">Quotation No</th>
              <th className="p-2 border border-gray-300">Company Name</th>
              <th className="p-2 border border-gray-300">Client Name</th>
              <th className="p-2 border border-gray-300">Date</th>
              <th className="p-2 border border-gray-300">Subtotal</th>
              <th className="p-2 border border-gray-300">Total GST</th>
              <th className="p-2 border border-gray-300">Grand Total</th>
              <th className="p-2 border border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice._id} className="text-center">
                  <td className="p-2 border border-gray-300">{invoice.quotationNumber || "N/A"}</td>
                  <td className="p-2 border border-gray-300">{invoice.companyName || "N/A"}</td>
                  <td className="p-2 border border-gray-300">{invoice.clientName || "N/A"}</td>
                  <td className="p-2 border border-gray-300">
                    {invoice.date ? new Date(invoice.date).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="p-2 border border-gray-300">₹{invoice.subTotal?.toFixed(2) || "N/A"}</td>
                  <td className="p-2 border border-gray-300">₹{invoice.totalGST?.toFixed(2) || "N/A"}</td>
                  <td className="p-2 border border-gray-300 font-bold">₹{invoice.grandTotal?.toFixed(2) || "N/A"}</td>
                  <td className="p-2 border border-gray-300 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(invoice._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded ml-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="h-96 p-4">
                  <div className="flex justify-center items-center h-full w-full text-center text-gray-700">
                  No quotations found
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      <div className="block md:hidden mt-4 max-h-[68vh] overflow-y-auto space-y-4 bg-[#D7C49EFF] rounded-md p-2 shadow-xl">
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <div key={invoice._id} className="bg-white shadow-sm rounded-md p-4">
              <p><strong>Quotation No:</strong> {invoice.quotationNumber || "N/A"}</p>
              <p><strong>Company:</strong> {invoice.companyName || "N/A"}</p>
              <p><strong>Client:</strong> {invoice.clientName || "N/A"}</p>
              <p><strong>Date:</strong> {invoice.date ? new Date(invoice.date).toLocaleDateString() : "N/A"}</p>
              <p><strong>Subtotal:</strong> ₹{invoice.subTotal?.toFixed(2) || "N/A"}</p>
              <p><strong>GST:</strong> ₹{invoice.totalGST?.toFixed(2) || "N/A"}</p>
              <p><strong>Total:</strong> ₹{invoice.grandTotal?.toFixed(2) || "N/A"}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => handleEdit(invoice)} className="bg-blue-600 text-white px-3 py-1 rounded">
                  Edit
                </button>
                <button onClick={() => handleDelete(invoice._id)} className="bg-red-600 text-white px-3 py-1 rounded">
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No quotations found</p>
        )}
      </div>
    </div>
  );
}

export default Quotation;