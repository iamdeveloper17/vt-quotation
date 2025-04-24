import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

const HHCorpForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state?.editData;

  const { register, control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      companyName: "HH Corporation India",
      companyAddress: "D-71 SF, Malviya Nagar, New Delhi, 110017 ",
      companyContact: "9599290216",
      companyEmail: "accounts@hhcorp.in",
      companyGSTIN: "07BRFPA9155H1ZS",
      quotationNumber: "",
      date: "",
      validUntil: "",
      clientName: "",
      clientAddress: "",
      clientContact: "",
      clientEmail: "",
      clientGSTIN: "",
      items: [{
        description: "", hsn: "", quantity: "", unit: "PCS", price: "",
        gst: "", gstAmount: "", totalAmount: "", model: ""
      }],
      terms: "",
    },
  });

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

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const [savedItems, setSavedItems] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const [clientSuggestions, setClientSuggestions] = useState([]);

  useEffect(() => {
    if (editData && editData.items) {
      reset({ ...editData, items: editData.items });
    } else {
      setValue("date", new Date().toISOString().split("T")[0]);
      setValue("terms", "Best Terms and Conditions of a company serve as a legal agreement...");
      fetchQuotationNumber();
    }

    const storedItems = JSON.parse(localStorage.getItem("savedItems")) || [];
    setSavedItems(storedItems);
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

  const handleDescriptionChange = async (index, value) => {
    if (!value) return setSuggestions((prev) => ({ ...prev, [index]: [] }));
    try {
      const res = await fetch(`https://vt-quotation.onrender.com/items/search?query=${value}`);
      const data = await res.json();
      setSuggestions((prev) => ({ ...prev, [index]: data }));
    } catch (err) {
      console.error("❌ Error fetching suggestions:", err);
    }
  };

  const handleSelectSuggestion = (index, item) => {
    setValue(`items.${index}.description`, item.description);
    setValue(`items.${index}.model`, item.model);
    setValue(`items.${index}.hsn`, item.hsn);
    setValue(`items.${index}.price`, item.price);
    setValue(`items.${index}.gst`, item.gst);
    setSuggestions((prev) => ({ ...prev, [index]: [] }));
  };

  const handleClientEmailChange = async (value) => {
    if (!value) return setClientSuggestions([]);
    try {
      const res = await fetch(`https://vt-quotation.onrender.com/clients/search?query=${value}`);
      const data = await res.json();
      setClientSuggestions(data);
    } catch (err) {
      console.error("❌ Error fetching client suggestions:", err);
    }
  };

  const handleSelectClient = (client) => {
    setValue("clientEmail", client.email);
    setValue("clientName", client.name);
    setValue("clientAddress", client.address);
    setValue("clientContact", client.contact);
    setValue("clientGSTIN", client.gstin);
    setClientSuggestions([]);
  };

  const onSubmit = async (data) => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return alert("User not logged in");

    const nonEmptyItems = data.items.filter(i => i.description && i.quantity && i.price);
    const calculatedItems = nonEmptyItems.map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      const gst = Number(item.gst);
      const gstAmount = (quantity * price * gst) / 100;
      const totalAmount = quantity * price + gstAmount;
      return { ...item, gstAmount, totalAmount };
    });

    const newSuggestions = calculatedItems.map(({ description, hsn, price, gst, model }) => ({
      description, hsn, price, gst, model
    }));
    const stored = JSON.parse(localStorage.getItem("savedItems")) || [];
    const updatedSuggestions = [...new Map([...stored, ...newSuggestions].map(i => [i.description, i])).values()];
    localStorage.setItem("savedItems", JSON.stringify(updatedSuggestions));

    const subTotal = calculatedItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const totalGST = calculatedItems.reduce((acc, item) => acc + item.gstAmount, 0);
    const grandTotal = subTotal + totalGST;

    const finalData = { ...data, userEmail, items: calculatedItems, subTotal, totalGST, grandTotal };

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
        const clientRes = await fetch("https://vt-quotation.onrender.com/clients", {
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

        if (!clientRes.ok) {
          const errText = await clientRes.text();
          console.error("❌ Client save failed:", errText);
        }

        if (!editData) {
          for (const item of calculatedItems) {
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
          }
        }

        alert(editData ? "Quotation updated!" : "Quotation saved!");
        localStorage.setItem("lastInvoice", JSON.stringify(finalData));
        navigate("/hhpage");
      } else {
        alert("Something went wrong");
      }
    } catch (err) {
      console.error("❌ Submission error:", err);
      alert("Server error");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold text-center text-blue-600 uppercase mb-6">
        {editData ? "Edit Quotation" : "Create Quotation"}
      </h2>

      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Client + Email Suggestion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <input {...register("companyName")} placeholder="Company Name" className="w-full p-2 border rounded text-sm" required />
            <input {...register("companyAddress")} placeholder="Company Address" className="w-full p-2 border rounded text-sm" required />
            <input type="number" {...register("companyContact")} placeholder="Company Contact" className="w-full p-2 border rounded text-sm" required />
            <input type="email" {...register("companyEmail")} placeholder="Company Email" className="w-full p-2 border rounded text-sm" required />
            <input {...register("companyGSTIN")} placeholder="Company GSTIN" className="w-full p-2 border rounded text-sm" required />
          </div>

          <div className="space-y-2 relative">
            <input {...register("clientName")} placeholder="Client Name" className="w-full p-2 border rounded text-sm" required />
            <input {...register("clientAddress")} placeholder="Client Address" className="w-full p-2 border rounded text-sm" required />
            <input type="number" {...register("clientContact")} placeholder="Client Contact" className="w-full p-2 border rounded text-sm" required />
            <input
              type="email"
              {...register("clientEmail")}
              placeholder="Client Email"
              className="w-full p-2 border rounded text-sm"
              required
              onChange={(e) => handleClientEmailChange(e.target.value)}
            />
            {clientSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-40 overflow-y-auto">
                {clientSuggestions.map((client, i) => (
                  <li key={i} className="p-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSelectClient(client)}>
                    {client.email} — {client.name}
                  </li>
                ))}
              </ul>
            )}
            <input {...register("clientGSTIN")} placeholder="Client GSTIN" className="w-full p-2 border rounded text-sm" required />
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

export default HHCorpForm;
