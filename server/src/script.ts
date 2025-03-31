import { Request, Response } from "express";
import express from "express";
import cors from "cors";
import { Port } from "./types/types";

const dummyData = require("../data/dummyData");

const app = express();
const port = 3000;
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Hello World");
});

app.get("/search-ports", (req: Request, res: Response) => {
  const query = (req.query.q as string)?.toLowerCase() || "";
  let ports = dummyData;
  if (query) {
    ports = dummyData.filter((port: Port) => {
      if (!port.name && !port.code) return false;
      return (
        (port.name && port.name.toLowerCase().includes(query)) ||
        (port.code && port.code.toLowerCase().includes(query)) ||
        (port.country && port.country.toLowerCase().includes(query))
      );
    });
  }
  ports = ports.length > 20 ? ports.slice(0, 20) : ports;
  res.status(200).json(ports);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
