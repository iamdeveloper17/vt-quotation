// middleware/adminOnly.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

const adminOnly = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("🧾 Decoded token:", decoded); // ✅ This must show { userId, role: "admin", ... }
  
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
  
    req.user = decoded;
    next();
  } catch (error) {
    console.log("❌ JWT error:", error); // ✅ Catch exact error
    res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = adminOnly;



// const jwt = require("jsonwebtoken");
// const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// const adminOnly = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

 
// };

// module.exports = adminOnly;
