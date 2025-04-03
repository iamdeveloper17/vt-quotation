const Invoice = require("../models/invoice.model");

// Function to generate the next quotation number
const getNextQuotationNumber = async () => {
  const lastInvoice = await Invoice.findOne().sort({ quotationNumber: -1 }); // Get last invoice
  return lastInvoice ? lastInvoice.quotationNumber + 1 : 1; // Start from 1 if none exists
};

// Create a new invoice
exports.createInvoice = async (req, res) => {
  try {
    let { quotationNumber, date, ...otherData } = req.body;

    // Auto-generate quotation number only if it's a new invoice (not editing)
    if (!quotationNumber) {
      quotationNumber = await getNextQuotationNumber();
    }

    if (!date) {
      date = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
    }

    const newInvoice = new Invoice({
      quotationNumber,
      date,
      ...otherData,
    });

    await newInvoice.save();
    res.status(201).json({ message: "Invoice saved", invoice: newInvoice });
  } catch (error) {
    res.status(500).json({ message: "Error saving invoice", error });
  }
};
