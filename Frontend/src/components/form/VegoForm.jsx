import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

const VegoForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state?.editData;

  const { register, control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      companyName: "Vego & Thomson Pvt Ltd",
      companyAddress: "D-71, MALVIYA NAGAR, NEW DLEHI, South Delhi, Delhi, 110017",
      companyContact: "18002124669",
      companyEmail: "contact@vegothomsonindia.com",
      companyGSTIN: "07AAHCV1780G1Z7",
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
        "Best Terms and Conditions of a company serve as a legal agreement between the business and its customers, clients, or users..."
      );
      fetchQuotationNumber();
    }
  }, [editData, reset, setValue]);

  const fetchQuotationNumber = async () => {
    try {
      const res = await fetch("https://vt-quotation.onrender.com/invoices/last-number");
      const data = await res.json();
      setValue("quotationNumber", data.quotationNumber + 1);
    } catch (error) {
      console.error("Error fetching quotation number:", error);
    }
  };

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

    try {
      const response = await fetch(
        editData?._id
          ? `https://vt-quotation.onrender.com/invoices/${editData._id}`
          : "https://vt-quotation.onrender.com/invoices",
        {
          method: editData?._id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );

      if (response.ok) {
        alert(editData ? "Quotation updated!" : "Quotation saved!");
        localStorage.setItem("lastInvoice", JSON.stringify(updatedData));
        navigate("/vegopage");
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

  const handleDescriptionChange = (index, value) => {
    if (!value) return setSuggestions((prev) => ({ ...prev, [index]: [] }));

    const matches = savedItems.filter((item) =>
      item.description.toLowerCase().includes(value.toLowerCase())
    );

    setSuggestions((prev) => ({ ...prev, [index]: matches }));
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
        {editData ? "Edit Quotation" : "Create Quotation"}
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
            <input {...register("clientName")} placeholder="Client Name" required className="w-full p-2 border rounded text-sm" />
            <input {...register("clientAddress")} placeholder="Client Address" required className="w-full p-2 border rounded text-sm" />
            <input type="number" {...register("clientContact")} placeholder="Client Contact" required className="w-full p-2 border rounded text-sm" />
            <input type="email" {...register("clientEmail")} placeholder="Client Email" required className="w-full p-2 border rounded text-sm" />
            <input {...register("clientGSTIN")} placeholder="Client GSTIN" required className="w-full p-2 border rounded text-sm" />
          </div>
        </div>

        {/* Date & Quotation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-semibold text-sm mb-1">Date</label>
            <input {...register("date")} type="date" required className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Valid Until</label>
            <input {...register("validUntil")} type="date" required className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Quotation Number</label>
            <input
              {...register("quotationNumber")}
              type="text"
              value={watch("quotationNumber") || "Loading..."}
              readOnly
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm mb-4 hover:bg-blue-700"
          >
            Add Item
          </button>
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
        <div className="flex flex-wrap gap-4 mt-6">
          <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
            {editData ? "View Quotation" : "Submit Quotation"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="bg-zinc-400 text-white px-6 py-2 rounded hover:bg-zinc-500">
            Back
          </button>
          <button type="button" onClick={() => navigate("/home/quotation")} className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600">
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

export default VegoForm;
