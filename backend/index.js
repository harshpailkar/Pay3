const express = require("express");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 3001;
const ABI = require("./abi.json");

app.use(cors());
app.use(express.json());

function convertArrayToObjects(arr) {
  const dataArray = arr.map((transaction, index) => ({
    key: (arr.length + 1 - index).toString(),
    type: transaction[0],
    amount: transaction[1],
    message: transaction[2],
    address: `${transaction[3].slice(0,4)}...${transaction[3].slice(38)}`,
    subject: transaction[4]
  }));

  return dataArray.reverse();
}


app.get("/getNameAndBalance", async (req, res) => {
  const {userAddress} = req.query;
  const response = await Moralis.EvmApi.utils.runContractFunction({
    chain: "0xAA36A7",
    address: "0x9ef3A58c3ea93751a2A9170C1bDd4075923a4616",
    functionName: "getMyName",
    abi: ABI,
    params: {_user: userAddress},
  });

  const jsonResponseName = response.raw;

  const secResponse = await Moralis.EvmApi.balance.getNativeBalance({
    chain: "0xAA36A7",
    address: userAddress,
  });

  const jsonResponseBal = (secResponse.raw.balance / 1e18).toFixed(2);

  const thirResponse = await Moralis.EvmApi.token.getTokenPrice({
    address: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
  });

  const jsonResponseDollars = (thirResponse.raw.usdPrice * jsonResponseBal).toFixed(2);

  const fourResponse = await Moralis.EvmApi.utils.runContractFunction({
    chain: "0xAA36A7",
    address: "0x9ef3A58c3ea93751a2A9170C1bDd4075923a4616",
    functionName: "getMyHistory",
    abi: ABI,
    params: {_user: userAddress},
  });

  const jsonResponseHistory = convertArrayToObjects(fourResponse.raw);

  const fiveResponse = await Moralis.EvmApi.utils.runContractFunction({
    chain: "0xAA36A7",
    address: "0x9ef3A58c3ea93751a2A9170C1bDd4075923a4616",
    functionName: "getMyRequests",
    abi: ABI,
    params: {_user: userAddress},
  });

  const jsonResponseRequests = fiveResponse.raw;

  const jsonResponse = {
    name: jsonResponseName,
    balance: jsonResponseBal,
    dollars: jsonResponseDollars,
    history: fourResponse.raw,
    requests: jsonResponseRequests
  }


  return res.status(200).json(jsonResponse);
});



Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening for API Calls`);
  });
});
