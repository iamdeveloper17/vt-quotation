import React, { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

const HanumanForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state?.editData;

  const { register, control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      companyName: "Hanuman Healthcare",
      companyAddress: "D-71 SF, Malviya Nagar, New Delhi, 110017",
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
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const [suggestions, setSuggestions] = useState({});
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [isClientNameFocused, setIsClientNameFocused] = useState(false);
  const isSelectingRef = useRef(false);
  const clientNameWrapperRef = useRef(null);

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
    } catch (err) {
      console.error("Error fetching quotation number:", err);
    }
  };

  const onSubmit = async (data) => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return alert("User not logged in. Please log in again.");

    const nonEmptyItems = data.items.filter(item => item.description && item.quantity && item.price);
    const calculatedItems = nonEmptyItems.map(item => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const gst = Number(item.gst) || 0;
      const gstAmount = (quantity * price * gst) / 100;
      const totalAmount = quantity * price + gstAmount;
      return { ...item, gstAmount, totalAmount };
    });

    const subTotal = calculatedItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const totalGST = calculatedItems.reduce((acc, item) => acc + item.gstAmount, 0);
    const grandTotal = subTotal + totalGST;

    const finalData = {
      ...data,
      userEmail,
      items: calculatedItems,
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
          body: JSON.stringify(finalData),
        }
      );

      if (response.ok) {
        await fetch("https://vt-quotation.onrender.com/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.clientName,
            address: data.clientAddress,
            contact: data.clientContact,
            email: data.clientEmail,
            gstin: data.clientGSTIN,
          }),
        });

        if (!editData) {
          for (const item of calculatedItems) {
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
            } catch (error) {
              console.error("❌ Failed to save item:", item.description);
            }
          }
        }

        alert(editData ? "Quotation updated!" : "Quotation saved!");
        localStorage.setItem("lastInvoice", JSON.stringify(finalData));
        navigate("/hanumanpage");
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

  const handleDescriptionChange = async (index, value) => {
    if (!value) return setSuggestions(prev => ({ ...prev, [index]: [] }));

    try {
      const res = await fetch(`https://vt-quotation.onrender.com/items/search?query=${value}`);
      const data = await res.json();
      setSuggestions(prev => ({ ...prev, [index]: data }));
    } catch (err) {
      console.error("Error fetching item suggestions:", err);
    }
  };

  const handleSelectSuggestion = (index, item) => {
    setValue(`items.${index}.description`, item.description);
    setValue(`items.${index}.model`, item.model);
    setValue(`items.${index}.hsn`, item.hsn);
    setValue(`items.${index}.price`, item.price);
    setValue(`items.${index}.gst`, item.gst);
    setSuggestions(prev => ({ ...prev, [index]: [] }));
  };

  const handleClientNameChange = async (value) => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }
    if (!value) return setClientSuggestions([]);
    try {
      const res = await fetch(`https://vt-quotation.onrender.com/clients/search?query=${value}`);
      const data = await res.json();
      setClientSuggestions(data);
    } catch (err) {
      console.error("Error fetching client suggestions:", err);
    }
  };

  const handleSelectClient = (client) => {
    isSelectingRef.current = true;
    setValue("clientEmail", client.email);
    setValue("clientName", client.name);
    setValue("clientAddress", client.address);
    setValue("clientContact", client.contact);
    setValue("clientGSTIN", client.gstin);
    setClientSuggestions([]);
    setIsClientNameFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clientNameWrapperRef.current && !clientNameWrapperRef.current.contains(e.target)) {
        setIsClientNameFocused(false);
        setClientSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-blue-500 uppercase">
        {editData ? "Edit Quotation" : "Create Quotation"}
      </h2>

      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company and Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <input {...register("companyName")} placeholder="Company Name" required className="w-full p-2 border rounded text-sm" />
            <input {...register("companyAddress")} placeholder="Company Address" required className="w-full p-2 border rounded text-sm" />
            <input {...register("companyContact")} type="number" placeholder="Company Contact" required className="w-full p-2 border rounded text-sm" />
            <input {...register("companyEmail")} type="email" placeholder="Company Email" required className="w-full p-2 border rounded text-sm" />
            <input {...register("companyGSTIN")} placeholder="Company GSTIN" required className="w-full p-2 border rounded text-sm" />
          </div>
          <div className="space-y-3 relative w-full">
            <div ref={clientNameWrapperRef}>
              <input
                {...register("clientName")}
                placeholder="Client Name"
                required
                className="w-full p-2 border rounded text-sm"
                onChange={(e) => handleClientNameChange(e.target.value)}
                onFocus={() => setIsClientNameFocused(true)}
              />
              {clientSuggestions.length > 0 && isClientNameFocused && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-40 overflow-y-auto">
                  {clientSuggestions.map((client, i) => (
                    <li
                      key={i}
                      className="p-2 cursor-pointer hover:bg-blue-300"
                      onClick={() => handleSelectClient(client)}
                    >
                      {client.name} — {client.email}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input {...register("clientAddress")} placeholder="Client Address" required className="w-full p-2 border rounded text-sm" />
            <input {...register("clientContact")} type="number" placeholder="Client Contact" required className="w-full p-2 border rounded text-sm" />
            <input {...register("clientEmail")} type="email" placeholder="Client Email" required className="w-full p-2 border rounded text-sm" />
            <input {...register("clientGSTIN")} placeholder="Client GSTIN" required className="w-full p-2 border rounded text-sm" />
          </div>
        </div>

        {/* Date & Quotation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><input {...register("date")} type="date" required className="w-full p-2 border rounded text-sm" /></div>
          <div><input {...register("validUntil")} type="date" required className="w-full p-2 border rounded text-sm" /></div>
          <div><input {...register("quotationNumber")} type="text" value={watch("quotationNumber") || "Loading..."} readOnly className="w-full p-2 border rounded text-sm" /></div>
        </div>

        {/* Items */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Items</h3>
          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-4 mb-4">
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
              <button type="button" onClick={() => remove(index)} className="text-white bg-red-500 rounded-full px-4 py-1 text-sm hover:bg-red-600">
                X
              </button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="bg-blue-600 text-white px-4 py-2 rounded text-sm mt-2 hover:bg-blue-700">
            Add Item
          </button>
        </div>

        {/* Terms */}
        <div>
          <textarea {...register("terms")} rows={4} placeholder="Terms & Conditions" className="w-full border rounded p-2 text-sm" required />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 mt-6">
          <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
            {editData ? "View Quotation" : "Submit Quotation"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
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

export default HanumanForm;
