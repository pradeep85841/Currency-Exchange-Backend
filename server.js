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

let date_ob = new Date();

let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();

const source1 = async (from, to, amount) => {
  const key = "8741d8253924eeaccbabc655bdacdd680234d102";

  const url = `https://api.getgeoapi.com/v2/currency/convert?api_key=${key}&from=${from}
  &to=${to}&amount=${amount}&format=json`;

  try {
    let response = await fetch(url);
    return response.json();
  } catch {
    (err) => console.error(err);
  }
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
  let links = [
    "https://api.getgeoapi.com",
    "https://v6.exchangerate-api.com",
    "https://api.apilayer.com",
  ];
  let prices = [0];
  let resource1 = await source1(from, to, amount);
  let resource2 = await source2(from, to, amount);
  let resource3 = await source3(from, to, amount);

  prices[0] = parseFloat(resource1.rates[to].rate);
  prices[1] = resource2.conversion_rate;
  prices[2] = resource3.info.rate;

  let min_rate = Math.min(...prices);
  let max_rate = Math.max(...prices);

  let i = prices.indexOf(min_rate);
  let j = prices.indexOf(max_rate);

  let min_source = links[i];
  let max_source = links[j];

  let min_amount = min_rate * amount;
  let max_amount = max_rate * amount;

  let time =
    year +
    "-" +
    month +
    "-" +
    date +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds;
  let backendData = {
    timeStamp: time,
    from: from,
    to: to,
    min_rate: min_rate,
    min_source: min_source,
    min_amount: min_amount,
    max_rate: max_rate,
    max_source: max_source,
    max_amount: max_amount,
  };

  const dbMongo = db;
  dbMongo
    .collection("rescentRequest")
    .insertOne(backendData, function (err, res) {
      if (err) throw err;
    });
  res.send(backendData);
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
