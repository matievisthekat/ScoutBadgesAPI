const express = require("express");
const app = express();

app.get("/scouts/badges/interest", (req, res) =>
  res.send(require("./badges/ib.json"))
);

app.get("/scouts/badges/scoutcraft", (req, res) =>
  res.send(require("./badges/sc.json"))
);

const port = process.env.PORT || 4556;
app.listen(port, () => console.log(`Listening on port ${port}`));
