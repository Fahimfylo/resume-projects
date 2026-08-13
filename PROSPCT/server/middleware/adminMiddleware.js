const jwt = require("jsonwebtoken");

const adminMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  if (!token || token === "undefined" || token === "null" || token === "") {
    return res.status(401).json({ message: "Access Denied: Invalid or missing token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // ✅ CRITICAL FIX: Enforce that this is an ADMIN token, not a regular user token
    const adminRole = decoded.role?.toLowerCase();
    if (adminRole !== "admin") {
      return res.status(403).json({ message: "Access Denied: Admin role required" });
    }

    // Attach decoded admin info to the request object
    req.admin = {
      _id: decoded.userId || decoded._id || decoded.id || decoded.sub,
      userId: decoded.userId || decoded._id || decoded.id || decoded.sub,
      role: decoded.role,
    };

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = adminMiddleware;
