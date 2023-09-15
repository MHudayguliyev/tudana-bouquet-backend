const express = require("express");
const { GetGeneralStatistics, GetLatestOrders, GetTopCustomers, GetDashboardStatistics, GetCalendarData } = require("../controllers/Dashboard");
const router = express.Router();
const Authenticate = require("../scripts/helpers/Authenticate");

router.route("/get-general-statistics").get(Authenticate, GetGeneralStatistics);
router.route("/get-latest-orders").get(Authenticate, GetLatestOrders)
router.route("/get-top-customers").get(Authenticate, GetTopCustomers)
router.route("/get-dashboard-statistics").get(Authenticate, GetDashboardStatistics)
router.route("/get-calendar-data").get(Authenticate, GetCalendarData)


/// for socket io 
router.route("/socket-general-statistics").get(GetGeneralStatistics);
router.route("/socket-latest-orders").get(GetLatestOrders)
router.route("/socket-top-customers").get(GetTopCustomers)
router.route("/socket-dashboard-statistics").get(GetDashboardStatistics)
router.route("/socket-calendar-data").get(GetCalendarData)



module.exports = router;
