const router = require("express").Router();
const controller = require("./measurements.controller");

router.get('/', controller.getTimeSeries);
router.get('/metrics', controller.getMetrics);
router.post('/seed', controller.seed);
router.delete('/clear', controller.clear);

module.exports = router;
