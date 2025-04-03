import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logovego from "../images/logo_vego.png";
import "../side_link/Print.css";

const VegoPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceRef = useRef(null);

  const storedInvoice = localStorage.getItem("lastInvoice");
  const { formData } = location.state || (storedInvoice ? { formData: JSON.parse(storedInvoice) } : {});

  if (!formData || !formData.items) {
    return <p className="text-center text-red-500">No Quotation Data Available</p>;
  }

  const subtotal = formData.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const totalGST = formData.items.reduce((acc, item) => acc + (item.quantity * item.price * item.gst) / 100, 0);
  const grandTotal = subtotal + totalGST;

  const numberToIndianWords = (num) => {
    if (!Number.isFinite(num)) return "Invalid Amount";
    num = Math.round(num);
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const places = ["", "Thousand", "Lakh", "Crore"];

    if (num === 0) return "Zero Rupees Only";

    const getWords = (n) => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n === 10) return "Ten";
      if (n < 20) return teens[n - 11];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + (n % 100 !== 0 ? getWords(n % 100) : "");
      return "";
    };

    let parts = [], placeIndex = 0, isThousandHandled = false;
    while (num > 0) {
      let divisor = placeIndex === 1 ? 100 : 1000;
      let part = num % divisor;
      if (part) {
        if (placeIndex === 1 && !isThousandHandled) {
          parts.push(getWords(part) + " " + places[placeIndex]);
          isThousandHandled = true;
        } else {
          parts.push(getWords(part) + (places[placeIndex] ? " " + places[placeIndex] : ""));
        }
      }
      num = Math.floor(num / divisor);
      placeIndex++;
    }
    return parts.reverse().join(" ") + " Rupees Only";
  };

  const handleCleanPrint = () => {
    const content = document.getElementById("invoice").innerHTML;
  
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
  
    document.body.appendChild(iframe);
  
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Invoice</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              .no-print {
                display: none !important;
                visibility: hidden !important;
              }
              @page {
                margin: 0;
              }
              body {
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    doc.close();
  
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
      }, 500);
    };
  };

  const rows = Array.from({ length: 4 });

  return (
    <div className="w-full max-w-[210mm] min-h-screen sm:min-h-[297mm] p-4 sm:p-6 bg-white mx-auto overflow-auto" id="invoice">
  <table className="w-full print:table border-collapse">
    <thead className="print:table-header-group">
      <tr>
        <td colSpan={8} className="print:border-none">
          <div className="flex items-center justify-between mt-4 sm:mb-6">
            <img src={logovego} alt="Company Logo" className="w-full sm:max-w-[150px]" />
          </div>
        </td>
      </tr>
    </thead>

    <tbody className="print:table-row-group print:pb-4">
      <tr>
        <td colSpan={8}>
          <div>
            <h1 className="font-bold text-blue-500 uppercase text-lg sm:text-2xl mb-4 mt-4 sm:mt-8">quotation {formData.quotationNumber}</h1>
          </div>
        </td>
      </tr>
      <tr>
        <td colSpan={8}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-blue-500 px-2 py-1 font-semibold rounded">Company Details</h3>
              <div className="p-2 text-xs sm:text-sm text-zinc-700">
                <p className="text-sm sm:text-base font-bold mb-1">{formData.companyName}</p>
                <p><span className="font-bold">Address :</span> {formData.companyAddress}</p>
                <p><span className="font-bold">Contact no. :</span> {formData.companyContact}</p>
                <p><span className="font-bold">Email :</span> {formData.companyEmail}</p>
                <p><span className="font-bold">GSTIN :</span> {formData.companyGSTIN}</p>
              </div>
            </div>
            <div>
              <h3 className="text-blue-500 px-2 py-1 font-semibold rounded">Bill To</h3>
              <div className="p-2 text-xs sm:text-sm text-zinc-700">
                <p className="text-sm sm:text-base font-bold mb-1">{formData.clientName}</p>
                <p><span className="font-bold">Address :</span> {formData.clientAddress}</p>
                <p><span className="font-bold">Contact no. :</span> {formData.clientContact}</p>
                <p><span className="font-bold">Email :</span> {formData.clientEmail}</p>
                <p><span className="font-bold">GSTIN :</span> {formData.clientGSTIN}</p>
              </div>
            </div>
          </div>
        </td>
      </tr>

      <tr className="text-black text-xs sm:text-sm">
        <th className="border border-gray-400 p-1 sm:p-2">S No.</th>
        <th className="border border-gray-400 p-1 sm:p-2">Model No.</th>
        <th className="border border-gray-400 p-1 sm:p-2 text-left">Description</th>
        <th className="border border-gray-400 p-1 sm:p-2">HSN</th>
        <th className="border border-gray-400 p-1 sm:p-2">Qty</th>
        <th className="border border-gray-400 p-1 sm:p-2">Unit Price</th>
        <th className="border border-gray-400 p-1 sm:p-2">GST (%)</th>
        <th className="border border-gray-400 p-1 sm:p-2">GST Amt</th>
        <th className="border border-gray-400 p-1 sm:p-2">Total</th>
      </tr>
      {formData.items.map((item, index) => (
        <tr key={index} className="text-center text-xs">
          <td className="border border-gray-400 p-1">{index + 1}</td>
          <td className="border border-gray-400 p-1">{item.model}</td>
          <td className="border border-gray-400 py-1 px-2 text-left">{item.description}</td>
          <td className="border border-gray-400 p-1">{item.hsn}</td>
          <td className="border border-gray-400 p-1">{item.quantity}</td>
          <td className="border border-gray-400 p-1">₹{item.price}</td>
          <td className="border border-gray-400 p-1">{item.gst}%</td>
          <td className="border border-gray-400 p-1">₹{((item.quantity * item.price * item.gst) / 100).toFixed(2)}</td>
          <td className="border border-gray-400 p-1">₹{(item.quantity * item.price + (item.quantity * item.price * item.gst) / 100).toFixed(2)}</td>
        </tr>
      ))}

      <tr>
        <td colSpan={8}>
          <div className="mb-6 text-xs sm:text-sm mt-6">
            <p><strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}</p>
            <p><strong>Total GST:</strong> ₹{totalGST.toFixed(2)}</p>
            <p className="text-green-700 font-semibold text-sm sm:text-base"><strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}</p>
            <p className="text-gray-700 text-xs sm:text-sm"><strong>In Words:</strong> {numberToIndianWords(grandTotal)}</p>
          </div>
        </td>
      </tr>

      <tr>
        <td colSpan={8}>
          <div className="mb-6">
            <h2 className="text-sm sm:text-base font-semibold mb-2">Terms & Conditions</h2>
            {formData.terms.split('\n').map((part, i) => (
              <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-line" key={i}>{part}</p>
            ))}
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <div className="flex flex-col sm:flex-row gap-4 mt-4 no-print">
    <button onClick={handleCleanPrint} className="bg-green-500 text-white px-4 py-2 rounded">Print Quotation</button>
    <button onClick={() => navigate("/quotation/vego", { state: { editData: formData } })} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
      Edit Quotation
    </button>
    <button onClick={() => { localStorage.removeItem("lastInvoice"); navigate("/home/quotation"); }} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
      Done
    </button>
  </div>
</div>
  );
};

export default VegoPage;