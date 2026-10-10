import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decodedPayload;

    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

export default authenticate;
