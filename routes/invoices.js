const router = require("express").Router();

const controller = require("../controllers/invoices");

router.route("/").get(controller.GET_INVOICES);
router.route("/sales").get(controller.GET_SALES);
router.route("/sales/:categoryId").get(controller.GET_SALES_BY_CATEGORY);
router.route("/group").get(controller.GET_BY_GROUP);

module.exports = router;
