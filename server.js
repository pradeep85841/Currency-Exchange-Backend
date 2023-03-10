import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fetch = require("node-fetch");
const { Headers } = fetch;
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

var prices;

const source1 = (from, to, amount) => {
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
};

const source2 = async (from, to, amount) => {
  const url = `https://v6.exchangerate-api.com/v6/0fcf2bdbcbf918143958662b/pair/${from}/${to}/${amount}`;

  try {
    let response = await fetch(url);
    return response.json();
  } catch {
    (err) => console.error(err);
  }
};

const source3 = async (from, to, amount) => {
  var myHeaders = new Headers();
  myHeaders.append("apikey", "IH9OcI56kSHefCSSr3s5rqBzDZ6PBJhP");

  var requestOptions = {
    method: "GET",
    redirect: "follow",
    headers: myHeaders,
  };
  try {
    let response = await fetch(
      `https://api.apilayer.com/fixer/convert?to=${to}&from=${from}&amount=${amount}`,
      requestOptions
    );
    return response.json();
  } catch {
    (err) => console.error(err);
  }
};

/*
      const dbMongo = db;
      dbMongo.collection("rescentRequest").insertOne(data, function (err, res) {
        if (err) throw err;
      });
      */

app.post("/convert", async (req, res) => {
  let { from, to, amount } = req.body;
  let prices = [0];
  let resource1 = await source1(from, to, amount);
  let resource2 = await source2(from, to, amount);
  let resource3 = await source3(from, to, amount);
  prices[0] = resource2.conversion_rate;
  prices[1] = resource3.info.rate;
  let min_rate = Math.min(...prices);
  let max_rate = Math.max(...prices);
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
