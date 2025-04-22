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

// const JWT_SECRET = "your_secret_key"; // Replace with a strong secret key
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

const { createCanvas } = require("canvas");
const path = require("path");
const authMiddleware = require("./middleware/authMiddleware");
const { env } = require("process");

const app = express();
app.use(express.json());
app.use(cors());

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
    // ✅ First: Check if it's the predefined admin
    // if (email === "admin@secret.com" && password === "cipher123") {
    //   const token = jwt.sign({ userId: "admin-static-id", role: "admin" }, JWT_SECRET, { expiresIn: "2h" });
    
    //   return res.status(200).json({
    //     message: "Admin login successful",
    //     token,
    //     user: {
    //       name: "Admin User",
    //       email,
    //       role: "admin"
    //     },
    //   });
    // }
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

    // res.status(200).json({
    //   message: "Login successful",
    //   token,
    //   user: {
    //     name: user.name,
    //     email: user.email,
    //     role: user.role,
    //   },
    // });
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
    const {
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
      // ✅ Add these 4:
      purchaseNumber,
      orderAgainst,
      deliveryPeriod,
      placeInstallation
    } = req.body;

    console.log("Received in backend:", {
      purchaseNumber,
      orderAgainst,
      deliveryPeriod,
      placeInstallation,
    });

    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }

    let newQuotationNumber = quotationNumber;

    if (!quotationNumber) {
      const counter = await getNextQuotationNumber();
      newQuotationNumber = counter;
    }

    // ✅ Check if invoice with same quotation number exists
    const existing = await InvoiceModel.findOne({ quotationNumber });

    if (existing) {
      // ✅ Update the existing invoice
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
          items,
          subTotal,
          totalGST,
          grandTotal,
          terms,
          footerNote,
          userEmail,
          // ✅ Add these too:
          purchaseNumber,
          orderAgainst,
          deliveryPeriod,
          placeInstallation,
        },
        { new: true }
      );

      return res.status(200).json({ message: "Invoice updated successfully", quotationNumber });
    }

    // ✅ Create new invoice if not found
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
      items,
      subTotal,
      totalGST,
      grandTotal,
      terms,
      footerNote,
      userEmail,
      // ✅ Add them here too:
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



// app.get("/admin/users", adminOnly, async (req, res) => {
//   try {
//     const users = await EmployeeModel.find().select("-password"); // hide passwords
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching users" });
//   }
// });

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

// app.get("/items/search", async (req, res) => {
//   const { query } = req.query;
//   try {
//     const items = await ItemModel.find({ description: { $regex: query, $options: "i" } }).limit(5);
//     res.json(items);
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });


// CREATE Purchase Order
app.post("/purchase-orders", async (req, res) => {
  try {
    const newOrder = new PurchaseOrderModel(req.body);
    await newOrder.save();
    res.status(201).json({ message: "Purchase order saved successfully", id: newOrder._id });
  } catch (error) {
    console.error("Error saving purchase order:", error);
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

// UPDATE Purchase Order
app.put("/purchase-orders/:id", async (req, res) => {
  try {
    const updated = await PurchaseOrderModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Purchase order updated", updated });
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


// app.post("/items", async (req, res) => {
//   try {
//     const newItem = new Item(req.body);
//     await newItem.save();
//     res.status(201).json({ message: "Item saved", item: newItem });
//   } catch (error) {
//     console.error("Error saving item:", error);
//     res.status(500).json({ message: "Error saving item" });
//   }
// });

// app.post("/items", async (req, res) => {
//   try {
//     const { description, model } = req.body;

//     const existing = await Item.findOne({ description, model });
//     if (existing) {
//       return res.status(200).json({ message: "Item already exists", item: existing });
//     }

//     const newItem = new Item(req.body);
//     await newItem.save();
//     res.status(201).json({ message: "Item saved", item: newItem });
//   } catch (error) {
//     console.error("Error saving item:", error);
//     res.status(500).json({ message: "Error saving item" });
//   }
// });

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

app.get("/items/search", async (req, res) => {
  const { query } = req.query;
  try {
    const items = await Item.find({ description: { $regex: query, $options: "i" } }).limit(5);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});




const port = process.env.PORT;

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});


