import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logobr from "../images/logo_br.png";
import "../side_link/Print.css";

const BRbioPurchasePage = () => {
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
    const customTitle = `Purchase_Order-${formData.purchaseNumber}`;
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


  const rows = Array.from({ length: 4 });

  return (
    <div className="w-full max-w-[210mm] min-h-screen sm:min-h-[297mm] bg-white mx-auto overflow-auto my-4" id="invoice">

      <table className="w-full print:table border-collapse">
        <thead className="print:table-header-group">
          <tr>
            <td colSpan={9} className="print:border-none">
              <div className="flex items-center justify-between mt-4 mb-8 border-b-2 pb-4">
                <img src={logobr} alt="Company Logo" className="w-full" />
              </div>
            </td>
          </tr>
        </thead>

        <tbody className="print:table-row-group">
          <tr>
            <td colSpan={9}>
              <div>
                <p className="text-xs text-right md:text-sm"><strong>Date:</strong> {new Date(formData.date).toLocaleDateString("en-GB").replace(/\//g, "-")}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={9}>
              <div>
                <div className="text-xs md:text-sm">
                  <p className="text-sm font-bold mb-1 md:text-base">Mr. {formData.SalesManagerName}</p>
                  <p><span className="font-bold">Address :</span> {formData.Address}</p>
                  <p><span className="font-bold">Contact no. :</span> {formData.Contact}</p>
                  <p><span className="font-bold">Email :</span> {formData.Email}</p>
                  <p><span className="font-bold">GSTIN :</span> {formData.GSTIN}</p>
                </div>
              </div>
              {/* </div> */}
            </td>
          </tr>
          <tr>
            <td colSpan={9}>
              <div className="mt-4">
                <h1 className="uppercase font-bold text-center mb-2 text-blue-500 text-sm md:text-lg">Purchase Order no. {formData.purchaseNumber}</h1>
                <p className="text-sm md:text-base">Dear <span className="font-bold">Mr. {formData.SalesManagerName}</span>,	</p>
                <p className="text-xs md:text-sm mb-6">Please refer to our Conversation. We are pleased to confirm the purchase order with the following terms & conditions:
                </p>
              </div>
            </td>
          </tr>
          <tr className="text-xs md:text-sm">
            <th className="border border-gray-400 p-2">S No.</th>
            <th className="border border-gray-400 p-2">Model No.</th>
            <th className="border border-gray-400 p-2 text-left">Description</th>
            <th className="border border-gray-400 p-2">HSN</th>
            <th className="border border-gray-400 p-2">Qty</th>
            <th className="border border-gray-400 p-2">Unit Price</th>
            <th className="border border-gray-400 p-2">GST (%)</th>
            <th className="border border-gray-400 p-2">GST Amt</th>
            <th className="border border-gray-400 p-2">Total</th>
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
            <td colSpan={9}>
              <div className="mb-6 text-sm mt-6">
                <p><strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}</p>
                <p><strong>Total GST:</strong> ₹{totalGST.toFixed(2)}</p>
                <p className="text-green-700 font-semibold text-base"><strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}</p>
                <p className="text-xs"><strong>In Words:</strong> {numberToIndianWords(grandTotal)}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={9}>
              <div className="mb-6">
                <h2 className="text-sm md:text-base font-bold mb-2">Terms & Conditions</h2>
                {formData.terms.split("\n").map((line, i) => {
                  const replacedLine = line
                    .replace(/{{orderAgainst}}/g, `<span class="underline font-bold">${formData.orderAgainst}</span>`)
                    .replace(/{{deliveryPeriod}}/g, `<span class="underline font-bold">${formData.deliveryPeriod}</span>`)
                    .replace(/{{placeInstallation}}/g, `<span class="underline font-bold">${formData.placeInstallation}</span>`);

                  return (
                    <p className="text-xs md:text-sm" key={i} dangerouslySetInnerHTML={{ __html: replacedLine }} />
                  );
                })}
              </div>
              <div className="text-sm">
                <h3 className="text-blue-500 py-1 rounded text-base font-bold">Bill To</h3>
                <p className="text-sm font-bold mb-1">{formData.companyName}</p>
                <p><span className="font-bold">Address :</span> {formData.companyAddress}</p>
                <p><span className="font-bold">Contact no. :</span> {formData.companyContact}</p>
                <p><span className="font-bold">Email :</span> {formData.companyEmail}</p>
                <p><span className="font-bold">GSTIN :</span> {formData.companyGSTIN}</p>
              </div>
              <div className="mt-10">
                <p className="text-sm">Yours Sincerely,</p>
                <p className="text-sm font-bold">For {formData.companyName}</p>
                <p className="text-sm font-bold">Mr. Ankit Kumar</p>
                <p className="text-sm">Procurement Dept.</p>
              </div>
              <div className="text-center mt-8">
                <p className="underline text-sm font-bold">ACCEPTANCE OF ABOVE TERMS & CONDITIONS</p>
                <p className="text-xs mt-2">BY SIGNING THIS PAGE, THE SUPPLIER ACKNOWLEDGES AND AGREES TO THE TERMS AND CONDITIONS OF THIS ORDER COPY.</p>
              </div>
              <div className="w-[80%] mt-16 text-xs print:mt-10">
                <div className="grid grid-cols-3 gap-4 mb-4 items-center md:grid-cols-4">
                  <p className="font-bold">SIGNATURE:</p>
                  <div className="border-b border-black w-full h-5"></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4 items-center md:grid-cols-4">
                  <p className="font-bold">NAME WITH TITLE:</p>
                  <div className="border-b border-black w-full h-5"></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4 items-center md:grid-cols-4">
                  <p className="font-bold">DATE:</p>
                  <div className="border-b border-black w-full h-5"></div>
                </div>
              </div>
              <div className="w-full max-w-4xl mx-auto mt-12">
                <h2 className="text-center text-xl font-semibold underline mb-4">Delivery Schedule</h2>

                <table className="w-full border border-black border-collapse text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-black p-2">Date</th>
                      <th className="border border-black p-2">Via Which Transport</th>
                      <th className="border border-black p-2">Truck/Other Mode Details</th>
                      <th className="border border-black p-2">Driver Details</th>
                      <th className="border border-black p-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((_, index) => (
                      <tr key={index}>
                        <td className="border border-black p-2 h-12"></td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                        <td className="border border-black p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex gap-4 mt-4 no-print">
        <button onClick={handleCleanPrint} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Print PO</button>
        <button onClick={() => navigate("/purchase_order/br", { state: { editData: formData } })} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Edit PO
        </button>
        <button onClick={() => { localStorage.removeItem("lastInvoice"); navigate("/home/purchase_order"); }} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Done
        </button>
      </div>
    </div>
  );
};

export default BRbioPurchasePage;