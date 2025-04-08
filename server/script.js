const dummyData = require("./data/dummyData.json");
const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/search-ports", (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : "";
  let ports = dummyData;
  if (query) {
    ports = dummyData.filter((port) => {
      if (!port.name && !port.code) return false;
      return (
        (port.name && port.name.toLowerCase().includes(query)) ||
        (port.code && port.code.toLowerCase().includes(query)) ||
        (port.country && port.country.toLowerCase().includes(query))
      );
    });
  }
  ports = ports.length > 20 ? ports.slice(0, 20) : ports;
  res.json(ports);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
