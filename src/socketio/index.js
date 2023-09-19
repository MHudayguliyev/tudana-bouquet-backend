const socketio = require("socket.io");
const jwt = require("jsonwebtoken");
const ENV = require("../config");
const axiosInstance = require('../axios/index')
const { Subscriber } = require("../db/DBEventListener");

const sockets = {};

sockets.init = function (server, emitEventName, emitEventData) {
  // socket.io setup
  const io = socketio(server, {
    cors: {
      origin: ENV.FRONT_LOCAL_URL,
      methods: ["GET", "POST"],
      allowHeaders: ["custom"],
      credentials: true,
    },
  });

  io.use(function (socket, next) {
    if (socket.handshake.auth && socket.handshake.auth.token) {
      jwt.verify(
        socket.handshake.auth.token,
        ENV.ACCESS_KEY,
        function (err, decoded) {
          if (err) return next(new Error("Authentication error"));
          socket.decoded = decoded;
          next();
        }
      );
    } else {
      next(new Error("Authentication error"));
    }
  }).on("connection", function (socket) {
    // console.log("Socket.io connected");

    try {
      Subscriber.notifications.on("new_order", async (payload) => {
        const {data} = await axiosInstance.get('dashboard/socket-general-statistics')
        socket.emit("updated_order_data", data);
      });
  
      Subscriber.notifications.on("new_order", async (payload) => {
        const {data} = await axiosInstance.get('dashboard/socket-dashboard-statistics')
        socket.emit("fresh_dashboard_data", data);
      });
  
      Subscriber.notifications.on("new_order", async (payload) => {
        const {data} = await axiosInstance.get('dashboard/socket-top-customers')
        socket.emit("fresh_top_customers_data", data);
      });
  
  
      Subscriber.notifications.on("new_order", async (payload) => {
        const {data} = await axiosInstance.get('dashboard/socket-latest-orders')
        console.log('latest orders', data)
        socket.emit("fresh_latest_orders_data", data);
      });
  
      // Subscriber.notifications.on("new_order", async (payload) => {
      //   const {data} = await axiosInstance.get('/dashboard/socket-calendar-data')
      //   console.log('monthly gotten calendar data', data)
      //   socket.emit("fresh_calendar_data", data);
      // });
  
      socket.emit(emitEventName, emitEventData);
    } catch (error) {
      console.log(error)
    }
  });
};

module.exports = sockets;
