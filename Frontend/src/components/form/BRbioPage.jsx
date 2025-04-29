import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logobr from "../images/logo_br.png";
import "../side_link/Print.css";

const BRbioPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceRef = useRef(null);

  const storedInvoice = localStorage.getItem("lastInvoice");
  const { formData } = location.state || (storedInvoice ? { formData: JSON.parse(storedInvoice) } : {});

  if (!formData || !formData.items) {
    return <p className="text-center text-red-500">No Quotation Data Available</p>;
  }

  const subtotal = formData.items.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
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
    const customTitle = `Quotation-${formData.quotationNumber}`;
    const content = document.getElementById("invoice").innerHTML;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return alert("Popup blocked. Please allow popups for this site.");

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>${customTitle}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              .no-print { display: none !important; visibility: hidden !important; }
              @page {
                margin: 0 !important;
                padding: 0 40px 35px 40px !important;
                size: A4;
              }
              body { margin: 0 !important; }
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 100);">
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="w-full max-w-[210mm] min-h-screen md:min-h-[297mm] bg-white mx-auto my-4" id="invoice">
      <table className="w-full table-auto border-collapse print:table">
        <thead className="print:table-header-group">
          <tr>
            <td colSpan={9} className="print:border-none">
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 mb-4 border-b-2 pb-4 border-black">
                <img src={logobr} alt="Company Logo" className="w-full" />
              </div>
            </td>
          </tr>
        </thead>

        <tbody className="print:table-row-group print:pb-4">
          <tr>
            <td colSpan={9}>
              <h1 className="text-lg md:text-2xl font-bold text-blue-500 uppercase mt-8 mb-6 text-center">
                Quotation {formData.quotationNumber}
              </h1>
              <p className="text-xs text-right md:text-sm"><span className="font-bold">Date:</span> {formData.date}</p>
              <p className="text-xs text-right md:text-sm"><span className="font-bold">Valid:</span> {formData.validUntil}</p>
            </td>
          </tr>

          <tr>
            <td colSpan={9}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 mt-12">
                <div>
                  <h3 className="text-blue-500 font-bold mb-2 text-sm md:text-base">Company Details</h3>
                  <div className="text-xs md:text-sm">
                    <p className="font-bold">{formData.companyName}</p>
                    <p><strong>Address:</strong> {formData.companyAddress}</p>
                    <p><strong>Contact:</strong> {formData.companyContact}</p>
                    <p><strong>Email:</strong> {formData.companyEmail}</p>
                    <p><strong>GSTIN:</strong> {formData.companyGSTIN}</p>
                  </div>
                </div>
                <div className="items-end text-right">
                  <h3 className="text-blue-500 font-bold mb-2 text-sm md:text-base">Bill To</h3>
                  <div className="text-xs md:text-sm">
                    <p className="font-bold">{formData.clientName}</p>
                    <p><strong>Address:</strong> {formData.clientAddress}</p>
                    <p><strong>Contact:</strong> {formData.clientContact}</p>
                    <p><strong>Email:</strong> {formData.clientEmail}</p>
                    <p><strong>GSTIN:</strong> {formData.clientGSTIN}</p>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr className="text-xs md:text-sm bg-gray-100">
            <th className="border border-gray-400 p-1 min-w-[50px]">S No.</th>
            <th className="border border-gray-400 p-1 min-w-[80px] max-w-[100px]">Model No.</th>
            <th className="border border-gray-400 px-2 py-1 min-w-[180px] max-w-[230px] text-left break-words">Description</th>
            <th className="border border-gray-400 p-1 min-w-[70px]">HSN</th>
            <th className="border border-gray-400 p-1 min-w-[40px]">Qty</th>
            <th className="border border-gray-400 p-1 min-w-[80px]">Unit Price</th>
            <th className="border border-gray-400 p-1 min-w-[60px]">GST (%)</th>
            <th className="border border-gray-400 p-1 min-w-[80px]">GST Amt</th>
            <th className="border border-gray-400 p-1 min-w-[80px]">Total</th>
          </tr>

          {formData.items.map((item, index) => (
            <tr key={index} className="text-center text-xs md:text-sm align-top">
              <td className="border border-gray-400 p-1">{index + 1}</td>
              <td className="border border-gray-400 p-1">{item.model}</td>
              <td className="border border-gray-400 px-2 py-1 text-left break-words max-w-[230px] whitespace-pre-wrap">
                <div className="text-sm leading-snug">
                  {item.description}
                  {item.hasFeature && item.feature && (
                    <div className="mt-2 text-xs text-gray-800">
                      <strong className="block mb-1">Features:</strong>
                      <span className="whitespace-pre-wrap">{item.feature}</span>
                    </div>
                  )}
                </div>
              </td>

              <td className="border border-gray-400 p-1">{item.hsn}</td>
              <td className="border border-gray-400 p-1">{item.quantity}</td>
              <td className="border border-gray-400 p-1">₹{item.price}</td>
              <td className="border border-gray-400 p-1">{item.gst}%</td>
              <td className="border border-gray-400 p-1">₹{((item.quantity * item.price * item.gst) / 100).toFixed(2)}</td>
              <td className="border border-gray-400 p-1">₹{(item.quantity * item.price + (item.quantity * item.price * item.gst) / 100).toFixed(2)}</td>
            </tr>
          ))}

          <tr>
            <td colSpan={9}>
              <div className="my-6 text-sm space-y-1">
                <p><strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}</p>
                <p><strong>Total GST:</strong> ₹{totalGST.toFixed(2)}</p>
                <p className="text-green-700 font-semibold text-base">
                  <strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}
                </p>
                <p className="text-xs md:text-sm"><strong>In Words:</strong> {numberToIndianWords(grandTotal)}</p>
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan={9}>
              <div className="mb-6">
                <h2 className="text-sm md:text-base font-bold mb-1">Terms & Conditions</h2>
                {formData.terms.split('\n').map((line, i) => (
                  <p key={i} className="text-xs md:text-sm whitespace-pre-line">{line}</p>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex flex-col sm:flex-row gap-3 mt-4 no-print">
        <button onClick={handleCleanPrint} className="bg-green-500 text-white px-4 py-2 rounded w-full sm:w-auto">
          Print Quotation
        </button>
        <button
          onClick={() => navigate("/quotation/br", { state: { editData: formData } })}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Edit Quotation
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("lastInvoice");
            navigate("/home/quotation");
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default BRbioPage;
