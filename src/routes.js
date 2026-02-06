const express = require("express");
const measurementRoutes = require("./modules/measurements/measurements.routes");

const router = express.Router();

router.use("/measurements", measurementRoutes);

module.exports = router;
