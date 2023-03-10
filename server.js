import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fetch = require("node-fetch");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT || 5000;

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

import db from "./dbConnect.mjs";

app.post("/convert", async (req, res) => {
  let { from, to, amount } = req.body;

  const key = "8741d8253924eeaccbabc655bdacdd680234d102";

  const url = `https://api.getgeoapi.com/v2/currency/convert?api_key=${key}&from=${from}
  &to=${to}&amount=${amount}&format=json`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const dbMongo = db;
      dbMongo.collection("rescentRequest").insertOne(data, function (err, res) {
        if (err) throw err;
      });
      res.send(data);
    });
});

app.get("/rescentRequest", async (req, res) => {
  const client = db;
  let query = {};
  try {
    const data = await client
      .collection("rescentRequest")
      .find(query)
      .toArray();
    res.json(data);
  } catch (e) {
    console.log(e);
  }
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
