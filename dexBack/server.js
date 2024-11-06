require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const PORT = 5000;

app.use(cors());

app.get("/api/0x-price", async (req, res) => {
  try {
    const response = await axios.get(`https://api.0x.org/swap/permit2/price`, {
      params: req.query,
      headers: {
        "0x-api-key": process.env.REACT_APP_ZEROX_KEY,
        "0x-version": "v2",
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get("/api/0x-quote", async (req, res) => {
  try {
    const response = await axios.get(`https://api.0x.org/swap/permit2/quote`, {
      params: req.query,
      headers: {
        "0x-api-key": process.env.REACT_APP_ZEROX_KEY,
        "0x-version": "v2",
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
