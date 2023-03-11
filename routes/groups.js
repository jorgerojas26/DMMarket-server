const router = require("express").Router();

const controller = require("../controllers/groups");

router.route("/").get(controller.GET_GROUPS);
router.route("/sales/:groupId").get(controller.GET_SALE_PRODUCTS_BY_GROUP);

module.exports = router;
