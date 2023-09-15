const createSubscriber = require("pg-listen");
const ENV = require("../config");
const connectionString = `postgresql://${ENV.DB_USER_LOCAL}:${ENV.DB_PASSWORD_LOCAL}@${ENV.DB_HOST_LOCAL}:${ENV.DB_PORT_LOCAL}/${ENV.DB_NAME_LOCAL}`;

const subscriber = createSubscriber({ connectionString: connectionString });

subscriber.events.on("error", (error) => {
  console.log("Fatal database connection error: ", error);
  process.exit(1);
});

process.on("exit", () => {
  subscriber.close();
});


module.exports = {
    listen: async () => {
        await subscriber.connect()
        await subscriber.listenTo('new_order')
    },
    Subscriber: subscriber
}
