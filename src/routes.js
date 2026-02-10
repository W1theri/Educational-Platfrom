const express = require("express");
const measurementRoutes = require("./modules/measurements/measurements.routes");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/users.routes");
const courseRoutes = require("./modules/courses/courses.routes");
const assignmentRoutes = require("./modules/assignments/assignments.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/measurements", measurementRoutes);
router.use("/courses", courseRoutes);
router.use("/assignments", assignmentRoutes);

module.exports = router;
