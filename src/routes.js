const express = require("express");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/users.routes");
const courseRoutes = require("./modules/courses/courses.routes");
const assignmentRoutes = require("./modules/assignments/assignments.routes");
const lessonRoutes = require("./modules/lessons/lessons.routes");
const quizRoutes = require("./modules/quizzes/quizzes.routes");
const resourceRoutes = require("./modules/resources/resources.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/lessons", lessonRoutes);
router.use("/quizzes", quizRoutes);
router.use("/resources", resourceRoutes);

module.exports = router;
