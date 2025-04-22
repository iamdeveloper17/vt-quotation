import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

const HanumanPurchaseForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state?.editData;

  const { register, control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      companyName: "Hanuman Healthcare",
      companyAddress: "D-71 SF, Malviya Nagar, New Delhi, 110017 ",
      companyContact: "18002124669",
      companyEmail: "info@hanumanhealthcare.com",
      companyGSTIN: "07BRFPA9155H1ZS",
      quotationNumber: "",
      date: "",
      validUntil: "",
      clientName: "",
      clientAddress: "",
      clientContact: "",
      clientEmail: "",
      clientGSTIN: "",
      items: [
        {
          description: "",
          hsn: "",
          quantity: "",
          unit: "PCS",
          price: "",
          gst: "",
          gstAmount: "",
          totalAmount: "",
          model: ""
        },
      ],
      terms: "",
      purchaseNumber: "",
      orderAgainst: "",
      deliveryPeriod: "",
      placeInstallation: ""
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (editData && editData.items) {
      reset({ ...editData, items: editData.items });
    } else {
      setValue("date", new Date().toISOString().split("T")[0]);
      setValue(
        "terms",
        `1. Description: We are pleased to give you the work/Purchase Order against {{orderAgainst}}

2. Payment Terms: 50% as in advance and the final 50% at the time of handover

3. Warranty: 3 standard Year + 2 Years Extra Extended Warranty.

4. Replacement: Replacement of defective goods must be changed without any charges. Our Technical team shall inspect the product upon delivery & installation, if found defective/not compliant/used the same shall be replaced without any additional costs. For defective/inferior supply we shall have legal remedy for recovery as well. In case of supply of second-hand goods / used items, the penalty of @200% cost of goods shall be implemented.

5. Training: Training and Site repair must be done without any charges if required.

6. Late supply Clause: If the Delivery of the order is getting delayed it will be charged 2.5% per week as a Late Delivery (LD) Terms

7. Banking Details of Supplier: Proforma Invoice should be with Signature and stamp and Bank details will be there to prevent any mistake

8. Delivery Period: On {{deliveryPeriod}}

9. Place of Delivery: On Actual Site

10. Place of Installation: {{placeInstallation}}

11. Jurisdiction: In case of any dispute all jurisdiction will be in Delhi court.

12. Paper Required: Company GST & PAN Card, Aadhaar Card, KYC Documents (Sign & Stamp)

13. Scope of Work: All charges for local requirement at the time of Installation included in price

14. Invoicing Instructions: The invoice should be prepared as follows:`
      );
      fetchQuotationNumber();
    }
  }, [editData, reset, setValue]);

  const fetchQuotationNumber = async () => {
    try {
      const res = await fetch("https://vt-quotation.onrender.com/invoices/last-number");
      const data = await res.json();
      setValue("quotationNumber", data.quotationNumber + 1);
      console.log("DATA TO BE SENT:", {
        purchaseNumber: data.purchaseNumber,
        orderAgainst: data.orderAgainst,
        deliveryPeriod: data.deliveryPeriod,
        placeInstallation: data.placeInstallation,
      });
    } catch (error) {
      console.error("Error fetching quotation number:", error);
    }
  };

  // const onSubmit = async (data) => {
  //   const userEmail = localStorage.getItem("userEmail");
  //   if (!userEmail) return alert("User not logged in. Please log in again.");

  //   const updatedItems = data.items.map((item) => {
  //     const gstAmount = (item.quantity * item.price * item.gst) / 100;
  //     const totalAmount = item.quantity * item.price + gstAmount;
  //     return { ...item, gstAmount, totalAmount };
  //   });

  //   const subTotal = updatedItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
  //   const totalGST = updatedItems.reduce((acc, item) => acc + item.gstAmount, 0);
  //   const grandTotal = subTotal + totalGST;

  //   const updatedData = {
  //     ...data,
  //     userEmail,
  //     items: updatedItems,
  //     subTotal,
  //     totalGST,
  //     grandTotal,
  //   };

  //   console.log("Data sent to backend:", updatedData);

  //   console.log("purchaseNumber:", data.purchaseNumber);
  //   console.log("orderAgainst:", data.orderAgainst);
  //   console.log("deliveryPeriod:", data.deliveryPeriod);
  //   console.log("placeInstallation:", data.placeInstallation);


  //   try {
  //     const response = await fetch(
  //       editData?._id
  //         ? `https://vt-quotation.onrender.com/purchase-orders/${editData._id}`
  //         : "https://vt-quotation.onrender.com/purchase-orders",
  //       {
  //         method: editData?._id ? "PUT" : "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(updatedData),
  //       }
  //     );

  //     if (response.ok) {
  //       alert(editData ? "Quotation updated!" : "Quotation saved!");
  //       localStorage.setItem("lastInvoice", JSON.stringify(updatedData));
  //       navigate("/hanumanpurchasepage");
  //     } else {
  //       alert("Something went wrong");
  //     }
  //   } catch (err) {
  //     console.error("Submission error:", err);
  //     alert("Error connecting to server");
  //   }
  // };

  const onSubmit = async (data) => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return alert("User not logged in. Please log in again.");
  
    const updatedItems = data.items.map((item) => {
      const gstAmount = (item.quantity * item.price * item.gst) / 100;
      const totalAmount = item.quantity * item.price + gstAmount;
      return { ...item, gstAmount, totalAmount };
    });
  
    const subTotal = updatedItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const totalGST = updatedItems.reduce((acc, item) => acc + item.gstAmount, 0);
    const grandTotal = subTotal + totalGST;
  
    const updatedData = {
      ...data,
      userEmail,
      items: updatedItems,
      subTotal,
      totalGST,
      grandTotal,
    };
  
    console.log("Data sent to backend:", updatedData);
  
    try {
      const response = await fetch(
        editData?._id
          ? `https://vt-quotation.onrender.com/purchase-orders/${editData._id}`
          : "https://vt-quotation.onrender.com/purchase-orders",
        {
          method: editData?._id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );
  
      if (response.ok) {
        // 🟢 Save new items to the Item collection (only for new POs)
        if (!editData) {
          for (const item of updatedItems) {
            try {
              await fetch("https://vt-quotation.onrender.com/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  description: item.description,
                  model: item.model,
                  hsn: item.hsn,
                  price: item.price,
                  gst: item.gst,
                }),
              });
            } catch (err) {
              console.error("❌ Failed to save item to DB:", item.description, err);
            }
          }
        }
  
        alert(editData ? "Quotation updated!" : "Quotation saved!");
        localStorage.setItem("lastInvoice", JSON.stringify(updatedData));
        navigate("/hanumanpurchasepage");
      } else {
        alert("Something went wrong");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Error connecting to server");
    }
  };

  
  const addItem = () => {
    append({
      description: "",
      hsn: "",
      quantity: "",
      unit: "PCS",
      price: "",
      gst: "",
      gstAmount: "",
      totalAmount: "",
    });
  };


  const [savedItems, setSavedItems] = useState([]);
  const [suggestions, setSuggestions] = useState({});

  useEffect(() => {
    const storedItems = JSON.parse(localStorage.getItem("savedItems")) || [];
    setSavedItems(storedItems);
  }, []);

  useEffect(() => {
    register("purchaseNumber");
    register("orderAgainst");
    register("deliveryPeriod");
    register("placeInstallation");
  }, [register]);


  // const handleDescriptionChange = (index, value) => {
  //   if (!value) return setSuggestions((prev) => ({ ...prev, [index]: [] }));

  //   const matches = savedItems.filter((item) =>
  //     item.description.toLowerCase().includes(value.toLowerCase())
  //   );

  //   setSuggestions((prev) => ({ ...prev, [index]: matches }));
  // };

  const handleDescriptionChange = async (index, value) => {
    if (!value) return setSuggestions((prev) => ({ ...prev, [index]: [] }));
  
    try {
      const res = await fetch(`https://vt-quotation.onrender.com/items/search?query=${value}`);
      const data = await res.json();
  
      setSuggestions((prev) => ({ ...prev, [index]: data }));
    } catch (err) {
      console.error("❌ Error fetching item suggestions:", err);
    }
  };
  

  const handleSelectSuggestion = (index, item) => {
    setValue(`items.${index}.description`, item.description);
    setValue(`items.${index}.model`, item.model); // ✅ Add this line
    setValue(`items.${index}.hsn`, item.hsn);
    setValue(`items.${index}.price`, item.price);
    setValue(`items.${index}.gst`, item.gst);
    setSuggestions((prev) => ({ ...prev, [index]: [] }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-center text-blue-500 uppercase">
        {editData ? "Edit PO" : "Create PO"}
      </h2>

      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Company & Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <input {...register("companyName")} placeholder="Company Name" required className="w-full p-2 border rounded text-sm" />
            <input {...register("companyAddress")} placeholder="Company Address" required className="w-full p-2 border rounded text-sm" />
            <input type="number" {...register("companyContact")} placeholder="Company Contact" required className="w-full p-2 border rounded text-sm" />
            <input type="email" {...register("companyEmail")} placeholder="Company Email" required className="w-full p-2 border rounded text-sm" />
            <input {...register("companyGSTIN")} placeholder="Company GSTIN" required className="w-full p-2 border rounded text-sm" />
          </div>
          <div className="space-y-3">
            <input {...register("clientName")} placeholder="Sales Manager Name" required className="w-full p-2 border rounded text-sm" />
            <input {...register("clientAddress")} placeholder="Address" required className="w-full p-2 border rounded text-sm" />
            <input type="number" {...register("clientContact")} placeholder="Contact" required className="w-full p-2 border rounded text-sm" />
            <input type="email" {...register("clientEmail")} placeholder="Email" required className="w-full p-2 border rounded text-sm" />
            <input {...register("clientGSTIN")} placeholder="GSTIN" required className="w-full p-2 border rounded text-sm" />
          </div>
        </div>

        {/* Date & Quotation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold text-sm mb-1">Date</label>
            <input {...register("date")} type="date" required className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Purchase Order No.</label>
            <input {...register("purchaseNumber")} type="number" required className="w-full p-2 border rounded text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-semibold text-sm mb-1">Purchase Order Against</label>
            <input {...register("orderAgainst")} type="text" required className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Delivery Period On</label>
            <input {...register("deliveryPeriod")} type="text" required className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Place of Installation</label>
            <input {...register("placeInstallation")} type="text" required className="w-full p-2 border rounded text-sm" />
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Items</h3>

          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-4 mb-4 rounded-xl">
              <input value={index + 1} readOnly className="p-2 border rounded text-sm bg-gray-100" />
              <input {...register(`items.${index}.model`)} placeholder="Model no." className="p-2 border rounded text-sm" required />
              <div className="relative w-full col-span-2 lg:col-span-2">
                <input
                  {...register(`items.${index}.description`)}
                  placeholder="Description"
                  className="p-2 border rounded text-sm w-full"
                  required
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                />

                {suggestions[index]?.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-40 overflow-y-auto">
                    {suggestions[index].map((item, i) => (
                      <li
                        key={i}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSelectSuggestion(index, item)}
                      >
                        {item.description} — {item.model}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input {...register(`items.${index}.hsn`)} placeholder="HSN" className="p-2 border rounded text-sm" />
              <input {...register(`items.${index}.quantity`)} type="number" placeholder="Qty" className="p-2 border rounded text-sm" required />
              <input {...register(`items.${index}.price`)} type="number" placeholder="Unit Price" className="p-2 border rounded text-sm" required />
              <input {...register(`items.${index}.gst`)} type="number" placeholder="GST %" className="p-2 border rounded text-sm" required />
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-white bg-red-500 rounded-full px-4 py-1 text-sm hover:bg-red-600"
              >
                X
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm mb-4 hover:bg-blue-700"
          >
            Add Item
          </button>
        </div>

        {/* Terms */}
        <div>
          <label className="block font-semibold text-sm mb-1">Term & Conditions</label>

          <textarea
            {...register("terms")}
            rows={4}
            className="w-full border rounded p-2 text-sm"
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 mt-6 print:hidden">
          <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
            {editData ? "View PO" : "Submit PO"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="bg-zinc-400 text-white px-6 py-2 rounded hover:bg-zinc-500">
            Back
          </button>
          <button type="button" onClick={() => navigate("/home/purchase_order")} className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600">
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

export default HanumanPurchaseForm;
