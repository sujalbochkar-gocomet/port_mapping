const express = require("express");
const app = express();
const port = 3000;
const dummyData = require(".Data/");

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/search-ports", (req, res) => {
  const ports = dummyData;
  res.json(ports);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
