const router = require("express").Router();

const controller = require("../controllers/invoices");

router.route("/sales").get(controller.GET_SALES);
router.route("/group").get(controller.GET_BY_GROUP);

module.exports = router;
