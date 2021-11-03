const router = require("express").Router();

const controller = require("../controllers/clients");

router.route("/").get(controller.GET_CLIENTS);
router.route("/best").get(controller.GET_BEST_CLIENTS);
router
  .route("/best/product/:productId")
  .get(controller.GET_BEST_CLIENTS_PER_PRODUCT);
router.route("/average/month/:clientId").get(controller.MONTHLY_AVERAGE);

module.exports = router;
