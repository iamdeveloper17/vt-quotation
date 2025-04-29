const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt"); // To hash passwords
const axios = require("axios"); // For email validation API
const jwt = require("jsonwebtoken");
const EmployeeModel = require("./models/Employee");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();
const { InvoiceModel, Counter } = require("./models/Invoice");
const adminOnly = require("./middleware/adminOnly");
const PurchaseOrderModel = require("./models/PurchaseOrder");
const Item = require("./models/Item");
const Client = require("./models/Client");
const SalesManager = require("./models/SalesManager");

// const JWT_SECRET = "your_secret_key"; // Replace with a strong secret key
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

const { createCanvas } = require("canvas");
const path = require("path");
const authMiddleware = require("./middleware/authMiddleware");
const { env } = require("process");

const app = express();
app.use(express.json());

const corsOptions = {
  origin: [
    "https://vt-quotation-ux.vercel.app", 
    "http://localhost:3000"
  ], // 👈 allow both production and local development frontend
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

// app.use(cors());

const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"; // Replace with your Google Client ID
const client = new OAuth2Client(CLIENT_ID);

// ✅ Connect to MongoDB
mongoose
  .connect("mongodb+srv://it3user:it3user@cluster0.vuk5zjq.mongodb.net/vt-quotation-db?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Middleware to Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "❌ Access Denied. No Token Provided." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    res.status(400).json({ message: "❌ Invalid Token" });
  }
};

const getNextQuotationNumber = async () => {
  let counter = await Counter.findOne({ name: "quotationNumber" });

  if (!counter) {
    counter = new Counter({ name: "quotationNumber", value: 1 });
  } else {
    counter.value += 1;
  }

  await counter.save();
  return counter.value;
};

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body; // ✅ Add role here

    // Check if user already exists
    const existingUser = await EmployeeModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user with role (default to 'user' if not passed)
    const newUser = new EmployeeModel({
      name,
      email,
      password,
      role: role || "user", // ✅ Save role in DB
    });

    await newUser.save();

    // ✅ Create token including role
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // ✅ Return token and role to frontend
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {

    if (email === "admin@secret.com" && password === "cipher123") {
      const token = jwt.sign({ userId: "admin-static-id", role: "admin" }, JWT_SECRET, { expiresIn: "2h" });
    
      return res.status(200).json({
        message: "Admin login successful",
        token,
        user: {
          name: "Admin User",
          email,
          role: "admin",
          canCreateQuotation: true,
          canCreatePurchaseOrder: true
        },
      });
    }
    
    

    // ✅ Then: Handle regular users from MongoDB
    const user = await EmployeeModel.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        canCreateQuotation: user.canCreateQuotation || false,
        canCreatePurchaseOrder: user.canCreatePurchaseOrder || false
      }
    });
    

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


app.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await EmployeeModel.findById(decoded.userId).select("name email");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/invoices/last-number", async (req, res) => {
  try {
    const lastInvoice = await InvoiceModel.findOne().sort({ quotationNumber: -1 }); // Get the last invoice

    // ✅ If invoices exist, continue from the last quotation number
    const lastQuotationNumber = lastInvoice ? lastInvoice.quotationNumber : 0; // Start from 1 if no invoices exist

    res.json({ quotationNumber: lastQuotationNumber });
  } catch (error) {
    console.error("Error fetching last quotation number:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/invoices", async (req, res) => {
  try {
    let {
      quotationNumber,
      date,
      validUntil,
      companyName,
      companyAddress,
      companyContact,
      companyEmail,
      companyGSTIN,
      clientName,
      clientAddress,
      clientContact,
      clientEmail,
      clientGSTIN,
      items,
      subTotal,
      totalGST,
      grandTotal,
      terms,
      footerNote,
      userEmail,
      purchaseNumber,
      orderAgainst,
      deliveryPeriod,
      placeInstallation
    } = req.body;

    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }

    // 🔥 Fix items: Force hasFeature and feature even if missing
    items = items.map(item => ({
      description: item.description,
      hsn: item.hsn,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      gst: item.gst,
      gstAmount: item.gstAmount,
      totalAmount: item.totalAmount,
      model: item.model,
      hasFeature: item.hasFeature || false,
      feature: item.feature || ""
    }));

    let newQuotationNumber = quotationNumber;

    if (!quotationNumber) {
      const counter = await getNextQuotationNumber();
      newQuotationNumber = counter;
    }

    const existing = await InvoiceModel.findOne({ quotationNumber });

    if (existing) {
      const updatedInvoice = await InvoiceModel.findOneAndUpdate(
        { quotationNumber },
        {
          date,
          validUntil,
          companyName,
          companyAddress,
          companyContact,
          companyEmail,
          companyGSTIN,
          clientName,
          clientAddress,
          clientContact,
          clientEmail,
          clientGSTIN,
          items, // ✅ Now corrected
          subTotal,
          totalGST,
          grandTotal,
          terms,
          footerNote,
          userEmail,
          purchaseNumber,
          orderAgainst,
          deliveryPeriod,
          placeInstallation,
        },
        { new: true }
      );

      return res.status(200).json({ message: "Invoice updated successfully", quotationNumber });
    }

    const newInvoice = new InvoiceModel({
      quotationNumber: newQuotationNumber,
      date,
      validUntil,
      companyName,
      companyAddress,
      companyContact,
      companyEmail,
      companyGSTIN,
      clientName,
      clientAddress,
      clientContact,
      clientEmail,
      clientGSTIN,
      items, // ✅ Fixed items here too
      subTotal,
      totalGST,
      grandTotal,
      terms,
      footerNote,
      userEmail,
      purchaseNumber,
      orderAgainst,
      deliveryPeriod,
      placeInstallation,
    });

    await newInvoice.save();
    res.status(201).json({ message: "Quotation saved successfully", quotationNumber: newQuotationNumber });
  } catch (error) {
    console.error("Error saving quotation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get("/invoices", async (req, res) => {
  try {
    const userEmail = req.query.userEmail;
    const filter = userEmail ? { userEmail } : {}; // Fetch invoices only for logged-in user

    const invoices = await InvoiceModel.find(filter);

    console.log(`Fetched ${invoices.length} invoices for ${userEmail || "all users"}`);
    console.log("Sample Invoice Data:", invoices[0]); // ✅ Log first invoice to check fields

    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/invoices/:id", async (req, res) => {
  try {
      const invoice = await InvoiceModel.findById(req.params.id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      invoice.grandTotalInWords = numberToIndianWords(invoice.grandTotal); // ✅ Convert Grand Total to Words
      res.json(invoice);
  } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});


app.delete("/invoices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await InvoiceModel.findByIdAndDelete(id);
    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting invoice" });
  }
});

app.put("/invoices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedInvoice = await InvoiceModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ message: "Invoice updated successfully", updatedInvoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ message: "Error updating invoice" });
  }
});

app.get("/admin/users", adminOnly, async (req, res) => {
  try {
    console.log("Admin user accessing users list:", req.user); // 🧠 Log who's calling it
    const users = await EmployeeModel.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});


app.delete("/admin/users/:id", adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;

    // Optional: prevent admin from deleting themselves
    if (req.user.userId === userId) {
      return res.status(403).json({ message: "Admins cannot delete themselves" });
    }

    await EmployeeModel.findByIdAndDelete(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});


// routes or directly in your server.js / index.js


// ✅ PUT route to update user permission (quotation / purchase)
// Update user permissions
app.put("/admin/users/:id/permissions", adminOnly, async (req, res) => {
  try {
    const { canCreateQuotation, canCreatePurchaseOrder } = req.body;

    const updatedUser = await EmployeeModel.findByIdAndUpdate(
      req.params.id,
      { canCreateQuotation, canCreatePurchaseOrder },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Permissions updated", user: updatedUser });
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/purchase-orders", async (req, res) => {
  try {
    const {
      purchaseNumber,
      date,
      orderAgainst,
      deliveryPeriod,
      placeInstallation,
      companyName,
      companyAddress,
      companyContact,
      companyEmail,
      companyGSTIN,
      SalesManagerName,
      Address,
      Contact,
      Email,
      GSTIN,
      items,
      terms,
      subTotal,
      totalGST,
      grandTotal,
      userEmail,
    } = req.body;

    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }

    const newOrder = new PurchaseOrderModel({
      purchaseNumber,
      date,
      orderAgainst,
      deliveryPeriod,
      placeInstallation,
      companyName,
      companyAddress,
      companyContact,
      companyEmail,
      companyGSTIN,
      SalesManagerName,
      Address,
      Contact,
      Email,
      GSTIN,
      items,
      terms,
      subTotal,
      totalGST,
      grandTotal,
      userEmail,
    });

    await newOrder.save();
    res.status(201).json({ message: "Purchase order saved", id: newOrder._id });
  } catch (error) {
    console.error("Error saving purchase order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE Purchase Order

app.put("/purchase-orders/:id", async (req, res) => {
  try {
    const {
      purchaseNumber,
      date,
      orderAgainst,
      deliveryPeriod,
      placeInstallation,
      companyName,
      companyAddress,
      companyContact,
      companyEmail,
      companyGSTIN,
      SalesManagerName,
      Address,
      Contact,
      Email,
      GSTIN,
      items,
      terms,
      subTotal,
      totalGST,
      grandTotal,
      userEmail,
    } = req.body;

    const updated = await PurchaseOrderModel.findByIdAndUpdate(req.params.id, {
      purchaseNumber,
      date,
      orderAgainst,
      deliveryPeriod,
      placeInstallation,
      companyName,
      companyAddress,
      companyContact,
      companyEmail,
      companyGSTIN,
      SalesManagerName,
      Address,
      Contact,
      Email,
      GSTIN,
      items,
      terms,
      subTotal,
      totalGST,
      grandTotal,
      userEmail,
    }, { new: true });

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Purchase order updated", updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



// GET All Purchase Orders
app.get("/purchase-orders", async (req, res) => {
  try {
    const userEmail = req.query.userEmail;
    const filter = userEmail ? { userEmail } : {};
    const orders = await PurchaseOrderModel.find(filter);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET Single Purchase Order by ID
app.get("/purchase-orders/:id", async (req, res) => {
  try {
    const order = await PurchaseOrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE Purchase Order
app.delete("/purchase-orders/:id", async (req, res) => {
  try {
    await PurchaseOrderModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Purchase order deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/auth/refresh", verifyToken, async (req, res) => {
  try {
    const user = await EmployeeModel.findById(req.user.userId).select("role canCreateQuotation canCreatePurchaseOrder name email");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      canCreateQuotation: user.canCreateQuotation || false,
      canCreatePurchaseOrder: user.canCreatePurchaseOrder || false
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/items", async (req, res) => {
  try {
    const { description, model, hsn, price, gst } = req.body;
    const existing = await Item.findOne({ description, model });
    if (existing) {
      return res.status(200).json({ message: "Item already exists", item: existing });
    }
    const newItem = new Item({ description, model, hsn, price, gst });
    await newItem.save();
    res.status(201).json({ message: "Item saved", item: newItem });
  } catch (err) {
    console.error("❌ Error saving item:", err);
    res.status(500).json({ message: "Error saving item" });
  }
});

// ✅ GET all items (for admin table view)
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ description: 1 });
    res.json(items);
  } catch (error) {
    console.error("❌ Error fetching items:", error);
    res.status(500).json({ message: "Error fetching items" });
  }
});


app.get("/items/search", async (req, res) => {
  const { query } = req.query;
  try {
    const items = await Item.find({ description: { $regex: query, $options: "i" } }).limit(5);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/items/:id", async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Error deleting item" });
  }
});

app.put("/admin/users/:id/password", adminOnly, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  await EmployeeModel.findByIdAndUpdate(req.params.id, { password });
  res.json({ message: "Password updated" });
});


// Update user info

app.put("/admin/users/:id", adminOnly, async (req, res) => {
  const { name, email, password, role } = req.body;

  const update = { name, email, role };

  if (password && password.length >= 6) {
    update.password = password;
  }

  console.log("🧪 Final user update object:", update); // <--- ADD THIS LINE

  try {
    const updatedUser = await EmployeeModel.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated", user: updatedUser });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Save/update client
app.post("/clients", async (req, res) => {
  const { name, address, contact, email, gstin } = req.body;
  try {
    const existing = await Client.findOne({ email });
    if (existing) {
      await Client.updateOne({ email }, { name, address, contact, gstin });
      return res.json({ message: "Client updated" });
    }
    const newClient = new Client({ name, address, contact, email, gstin });
    await newClient.save();
    res.status(201).json({ message: "Client saved" });
  } catch (err) {
    console.error("Error saving client:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// Get client by email
app.get("/clients", async (req, res) => {
  const { email } = req.query;
  try {
    const client = await Client.findOne({ email });
    if (client) {
      res.json(client);
    } else {
      res.status(404).json({ message: "Client not found" });
    }
  } catch (err) {
    console.error("Error finding client:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/clients/search", async (req, res) => {
  const { query } = req.query;
  try {
    const clients = await Client.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).limit(5); // return max 5 results
    res.json(clients);
  } catch (error) {
    console.error("Error searching clients:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// controllers/salesManagerController.js

// Create a Sales Manager


// Save or Update Sales Manager
app.post("/salesmanagers", async (req, res) => {
  const { name, address, contact, email, gstin } = req.body;
  try {
    const existing = await SalesManager.findOne({ email });
    if (existing) {
      await SalesManager.updateOne({ email }, { name, address, contact, gstin });
      return res.json({ message: "Sales Manager updated" });
    }
    const newManager = new SalesManager({ name, address, contact, email, gstin });
    await newManager.save();
    res.status(201).json({ message: "Sales Manager saved" });
  } catch (err) {
    console.error("Error saving Sales Manager:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Search Sales Managers
app.get("/salesmanagers/search", async (req, res) => {
  const { query } = req.query;
  try {
    const managers = await SalesManager.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).limit(5); // Return top 5 matches
    res.json(managers);
  } catch (error) {
    console.error("Error searching Sales Managers:", error);
    res.status(500).json({ message: "Server error" });
  }
});



const port = process.env.PORT;

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});


