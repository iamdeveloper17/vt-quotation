import React, { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

const BRbioForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state?.editData;

  const { register, control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      companyName: "BR Biomedical Pvt Ltd",
      companyAddress: "D-71, MALVIYA NAGAR, NEW DLEHI, South Delhi, Delhi, 110017",
      companyContact: "18002124669",
      companyEmail: "sales@brbiomedical.com",
      companyGSTIN: "07AACCB9500D1Z4",
      quotationNumber: "",
      date: "",
      validUntil: "",
      clientName: "",
      clientAddress: "",
      clientContact: "",
      clientEmail: "",
      clientGSTIN: "",
      subject: "",
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
          model: "",
          hasFeature: false,
          feature: ""
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

    // ✅ Clean empty items (optional, but good UX)
    const nonEmptyItems = data.items.filter(item => item.description && item.quantity && item.price);

    // ✅ Calculate gstAmount and totalAmount
    const calculatedItems = nonEmptyItems.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const gst = Number(item.gst) || 0;

      const gstAmount = (quantity * price * gst) / 100;
      const totalAmount = quantity * price + gstAmount;

      // Keep all original fields like feature, hasFeature and add gstAmount and totalAmount
      return {
        ...item, // ✅ Spread everything including feature
        gstAmount,
        totalAmount,
      };
    });


    // ✅ Save unique suggestions for autocomplete
    const newSuggestions = calculatedItems.map(({ description, hsn, price, gst, model }) => ({
      description, hsn, price, gst, model
    }));

    const stored = JSON.parse(localStorage.getItem("savedItems")) || [];
    const updatedSuggestions = [...new Map([...stored, ...newSuggestions].map(i => [i.description, i])).values()];
    localStorage.setItem("savedItems", JSON.stringify(updatedSuggestions));

    // ✅ Totals
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
        // const clientResult = await clientRes.json();
        // console.log("✅ Client Save Response:", clientResult);
        if (clientRes.ok) {
          const clientResult = await clientRes.json();
          console.log("✅ Client Save Response:", clientResult);
        } else {
          const errorText = await clientRes.text();
          console.error("❌ Client save failed. Response:", errorText);
        }


        // ✅ Save items only for new quotations
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
            } catch (err) {
              console.error("❌ Failed to save item:", item.description, err);
            }
          }
        }

        alert(editData ? "Quotation updated!" : "Quotation saved!");
        localStorage.setItem("lastInvoice", JSON.stringify(finalData));
        navigate("/brbiopage");
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

  const [suggestions, setSuggestions] = useState({});

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
    setValue(`items.${index}.model`, item.model); // ✅ Add this line
    setValue(`items.${index}.hsn`, item.hsn);
    setValue(`items.${index}.price`, item.price);
    setValue(`items.${index}.gst`, item.gst);
    setSuggestions((prev) => ({ ...prev, [index]: [] }));
  };

  // Autofill client details on email blur
  const handleClientEmailBlur = async (e) => {
    const email = e.target.value;
    if (!email) return;

    try {
      const res = await fetch(`https://vt-quotation.onrender.com/clients?email=${email}`);
      if (res.ok) {
        const client = await res.json();
        setValue("clientName", client.name || "");
        setValue("clientAddress", client.address || "");
        setValue("clientContact", client.contact || "");
        setValue("clientGSTIN", client.gstin || "");
      }
    } catch (err) {
      console.error("❌ Error autofilling client:", err);
    }
  };

  const [clientSuggestions, setClientSuggestions] = useState([]);

  const handleClientNameChange = async (value) => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return; // 🛑 Stop fetching if currently selecting
    }

    if (!value) {
      setClientSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://vt-quotation.onrender.com/clients/search?query=${value}`);
      const data = await res.json();
      setClientSuggestions(data);
    } catch (err) {
      console.error("❌ Error fetching client suggestions:", err);
    }
  };

  const isSelectingRef = useRef(false);

  const clientNameRef = useRef(null);
  const [isClientNameFocused, setIsClientNameFocused] = useState(false);

  const handleSelectClient = (client) => {
    isSelectingRef.current = true; // 🛡 Mark selecting mode
    setValue("clientEmail", client.email);
    setValue("clientName", client.name);
    setValue("clientAddress", client.address);
    setValue("clientContact", client.contact);
    setValue("clientGSTIN", client.gstin);
    setClientSuggestions([]);
    setIsClientNameFocused(false);
  };

  const clientNameWrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientNameWrapperRef.current && !clientNameWrapperRef.current.contains(event.target)) {
        setIsClientNameFocused(false);
        setClientSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🛠️ Add or Remove Terms
  const handleTermCheckboxChange = (isChecked, termText) => {
    const currentTerms = watch("terms") || "";
    let updatedTerms = currentTerms;

    if (isChecked) {
      if (!currentTerms.includes(termText)) {
        updatedTerms = currentTerms.trim() + (currentTerms ? "\n" : "") + `• ${termText}`;
      }
      setCheckedTerms(prev => [...prev, termText]);
    } else {
      const regex = new RegExp(`• ${termText}\\n?`, "g");
      updatedTerms = currentTerms.replace(regex, "").trim();
      setCheckedTerms(prev => prev.filter(t => t !== termText));
    }

    setValue("terms", updatedTerms);
  };

  const [checkedTerms, setCheckedTerms] = useState([]);

  const termsList = [
    "PRICES: The prices are expressed in F.O.R Hospital basis in (INR)",
    "GST & ANY OTHER LOCAL TAX: GST @ 12% shall be chargeable",
    "PAYMENT: As per your terms & conditions.",
    "Country OF ORIGIN: Singapore.",
    "DELIVERY PERIOD: As per your terms & conditions",
    "WARRANTY: Comprehensive Warranty for 3 Years as per tender terms & conditions",
    "AMC/CMC AFTER WARRANTEE: AMC/CMC charge for next 7 years after expiry of warranty period of 3 years are mentioned in Price Schedule - Annexure - 2",
    "INSTALLATION/DEMONSTRATION TRAINING: Shall be provided FOC at Users site by our Engineers.",
    "PERFORMANCE BANK GURANTEE: Will besubmitted after delivery and installation as per the terms of the tender.",
    "VALIDITY OF OFFER: (200 days) from the date of opening of tender."
  ];

  useEffect(() => {
    if (editData && editData.items) {
      reset({ ...editData, items: editData.items });

      // 🌟 New: update checkboxes state based on existing terms
      const existingTerms = editData.terms || "";
      const matchedTerms = termsList.filter(term => existingTerms.includes(term));
      setCheckedTerms(matchedTerms);
    } else {
      setValue("date", new Date().toISOString().split("T")[0]);
      setValue(
        "terms",
        "Best Terms and Conditions of a company serve as a legal agreement between the business and its customers, clients, or users..."
      );
      fetchQuotationNumber();
    }
  }, [editData, reset, setValue]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-center text-blue-500 uppercase">
        {editData ? "Edit Quotation" : "Create Quotation"}
      </h2>

      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Company & Client Info */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-3 relative w-full">
            <div ref={clientNameWrapperRef} className="relative w-full">
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
                      {client.name} — {client.email} — {client.contact}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input {...register("clientAddress")} placeholder="Client Address" required className="w-full p-2 border rounded text-sm" />
            {/* <input type="number" {...register("clientContact")} placeholder="Client Contact" className="w-full p-2 border rounded text-sm" /> */}
            <input
  type="text"
  {...register("clientContact", {
    pattern: {
      value: /^(\d{0,15}|N\/A)?$/,
      message: "Enter digits or 'N/A'",
    },
  })}
  placeholder="Client Contact"
  className="w-full p-2 border rounded text-sm"
/>

            <input
              type="email"
              {...register("clientEmail")}
              placeholder="Client Email"
              required
              className="w-full p-2 border rounded text-sm"
            />
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

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div>
            <label className="block font-semibold text-sm mb-1">Subject</label>
            <input {...register("subject")} type="text" required className="w-full p-2 border rounded text-sm" />
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Items</h3>

          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-4 mb-4 rounded-xl">

              {/* Existing inputs like index, model, description, etc. */}
              <input value={index + 1} readOnly className="p-2 border rounded text-sm bg-gray-100" />
              <input {...register(`items.${index}.model`)} placeholder="Model no." className="p-2 border rounded text-sm" required />

              {/* Rest of the fields like description, hsn, qty, price, gst, etc. */}
              <div className="relative w-full col-span-2 lg:col-span-3">
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
              <input {...register(`items.${index}.quantity`)} type="number" placeholder="Qty" className="p-2 border rounded text-sm" required />
              <input {...register(`items.${index}.price`)} type="number" placeholder="Unit Price" className="p-2 border rounded text-sm" required />
              <input {...register(`items.${index}.gst`)} type="number" placeholder="GST %" className="p-2 border rounded text-sm" required />

              <button type="button" onClick={() => remove(index)} className="text-white bg-red-500 rounded-full px-4 py-1 text-sm hover:bg-red-600">
                X
              </button>


              {/* Checkbox for feature */}
              <div className="col-span-full flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register(`items.${index}.hasFeature`)}
                  id={`feature-toggle-${index}`}
                  className="h-4 w-4"
                />
                <label htmlFor={`feature-toggle-${index}`} className="text-sm">Add Feature Description</label>
              </div>

              {/* Conditionally show textarea if checkbox is checked */}
              {watch(`items.${index}.hasFeature`) && (
                <textarea
                  {...register(`items.${index}.feature`)}
                  placeholder="Feature details..."
                  rows={4}
                  className="col-span-full border p-2 rounded text-sm"
                />
              )}
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

        {/* New: Terms & Conditions Checkboxes */}
        {/* Terms Checkboxes */}
        {/* Terms Checkboxes */}
        <div className="space-y-2 mb-6">
          <h3 className="font-semibold text-sm mb-2">Select Terms & Conditions</h3>

          {termsList.map((term, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`term-${index}`}
                className="h-3 w-3"
                checked={checkedTerms.includes(term)} // 🌟 This makes them stay checked!
                onChange={(e) => handleTermCheckboxChange(e.target.checked, term)}
              />
              <label htmlFor={`term-${index}`} className="text-xs">{term}</label>
            </div>
          ))}
        </div>


        {/* Terms Textarea */}
        <div>
          <label className="block font-semibold text-sm mb-1">Terms & Conditions</label>
          <textarea
            {...register("terms")}
            rows={8}
            className="w-full border rounded p-2 text-sm"
            placeholder="Type your additional Terms & Conditions here..."
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

export default BRbioForm;
