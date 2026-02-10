const express = require("express");
const measurementRoutes = require("./modules/measurements/measurements.routes");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/users.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/measurements", measurementRoutes);

module.exports = router;
