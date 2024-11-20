import express, { Request, Response } from "express";
const app: express.Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Live Transcription API");
});

export default app;
