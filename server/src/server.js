const app = require("./app");
const deepgramService = require("./services/deepgramService");
const websocketService = require("./services/websocketService");
const constants = require("./config/constants");

// Initialize the Deepgram connection
deepgramService
  .initConnection()
  .catch((err) => console.error("Deepgram connection error:", err));

// Start the Express server
app.listen(constants.EXPRESS_PORT, () => {
  console.log(`Express server running on port ${constants.EXPRESS_PORT}`);
});
