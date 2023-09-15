const express = require("express");
const app = express();
const ENV = require("./src/config");
const cors = require("cors");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require('http')
const sockets = require('./src/socketio/index')
const DBEventListener = require('./src/db/DBEventListener')
const bodyParser = require('body-parser')


// -----------------  IMPORT  ROUTES ------------------------- //
const AuthRoutes = require("./src/routes/Auth");
const OrdersRoutes = require("./src/routes/Orders");
const CreateOrderRoutes = require("./src/routes/CreateOrder");
const ClientsRoute = require("./src/routes/Clients");
const Dashboard = require("./src/routes/Dashboard");
const GeneralRoutes = require("./src/routes/General");






// --------------  C O R S    CHECKING ----------------------- //
const whiteList = [
  "http://192.168.8.41:5000",
  "http://192.168.8.41",
  "http://192.168.8.39:5000",
  "http://192.168.8.39",
  "http://localhost:5001",
  "http://localhost",
  "http://192.168.8.101:5001",
  "http://192.168.8.101",
  "http://localhost:1112",
  "http://192.168.8.101:1112",
  "http://192.168.8.41:5173",
  "http://localhost:5173",
  "http://192.168.8.101:5173",
  "http://95.85.122.58",
  "http://95.85.122.58:80",
  "http://hasabym.com.tm",
  "http://hasabym.com.tm:80",
  "http://172.23.128.1:5173",
  "http://192.168.7.3:5173",
  "http://localhost:4173",
  "http://192.168.5.28:5173",
  "http://192.168.5.11:5173",
  "http://192.168.5.19:5173",
  "http://192.168.5.2:5173",
  "http:192.168.5.69",
  "http://192.168.31.37:5173"
];
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);
//       if (whiteList.indexOf(origin) === -1) {
//         const msg =
//           "The CORS policy for this site does not allow access from the specified Origin.";
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//   })
// );

app.use(cors())

// ---------------------  USE MIDDLEWARES ------------------------ //
app.use(logger("dev"));
app.use(express.json());
app.use("/src/images/", express.static(path.join(__dirname + "/src/images/")));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(function (req, res, next) {
  res.header("Content-Type", "application/json;charset=UTF-8");
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
// ---------------------  USE ROUTES ------------------------ //
const prefix = ENV.API_PREFIX;

app.use(`${prefix}/auth`, AuthRoutes);
app.use(`${prefix}/orders`, OrdersRoutes);
app.use(`${prefix}/create-order`, CreateOrderRoutes);
app.use(`${prefix}/clients`, ClientsRoute);
app.use(`${prefix}/dashboard`, Dashboard);
app.use(`${prefix}/general`, GeneralRoutes);



const server = http.createServer(app)
sockets.init(server)
DBEventListener.listen()


process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});




server.listen(ENV.PORT, (err) => {
  if (err) {
    console.log("ERROR with server: ", err);
  } else {
    console.log(`Running server on ${ENV.PORT} port...`);
  }
});