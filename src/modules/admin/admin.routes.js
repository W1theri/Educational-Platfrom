const router = require("express").Router();
const controller = require("./admin.controller");
const auth = require("../../middlewares/auth.middleware");
const { requireRoles } = require("../../middlewares/role.middleware");

router.get("/stats", auth, requireRoles("admin"), controller.getDashboardStats);
router.get("/analytics/courses", auth, requireRoles("admin"), controller.getCourseAnalytics);

module.exports = router;
