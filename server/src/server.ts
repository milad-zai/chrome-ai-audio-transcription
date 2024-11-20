import app from "./app";
import deepgramService from "./services/deepgramService";
import websocketService from "./services/websocketService";
import constants from "./config/constants";

// Initialize the Deepgram connection
deepgramService
  .initConnection()
  .catch((err: Error) => console.error("Deepgram connection error:", err));

// Start the Express server
app.listen(constants.EXPRESS_PORT, () => {
  console.log(`Express server running on port ${constants.EXPRESS_PORT}`);
});
