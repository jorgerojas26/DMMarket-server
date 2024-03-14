const router = require("express").Router();
const controller = require("../controllers/clients");
const showNoe = require("../middlewares/showNoe");

router.route("/").get(controller.GET_CLIENTS);
router.route("/best").get(showNoe, controller.GET_BEST_CLIENTS);
router
  .route("/best/product/:productId")
  .get(showNoe, controller.GET_BEST_CLIENTS_PER_PRODUCT);
router
  .route("/average/month/:clientId")
  .get(showNoe, controller.MONTHLY_AVERAGE);

module.exports = router;
