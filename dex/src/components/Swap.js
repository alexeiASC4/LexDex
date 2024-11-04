import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import tokenList from "../tokenList.json";
import { ethers } from "ethers";
import { useSendTransaction } from "wagmi";
import axios from "axios";

const TOKEN_ABI = [
  // Transfer function
  "function transfer(address to, uint amount) returns (bool)",
  // Approve function for allowance
  "function approve(address spender, uint amount) returns (bool)",
  // Allowance function
  "function allowance(address owner, address spender) view returns (uint)",
  // BalanceOf function
  "function balanceOf(address account) view returns (uint)",
  // Decimals function
  "function decimals() view returns (uint8)",
];

function Swap({ address, isConnected, selectedNetwork }) {
  const [slippage, setSlippage] = useState(0.5);
  const [tokenOneBalance, setTokenOneBalance] = useState(null);
  const [tokenTwoBalance, setTokenTwoBalance] = useState(null);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [swapApproved, setSwapApproved] = useState(false);
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: null,
    gas: null,
    gasPrice: null,
  });

  const { sendTransaction } = useSendTransaction({
    onError(error) {
      console.error("Transaction Error:", error);
      message.error("Transaction failed. Please try again.");
    },
    onSuccess(txResponse) {
      console.log("Transaction sent:", txResponse);
      message.info("Transaction sent. Waiting for confirmation...");

      // Define an async function to handle the transaction confirmation
      const confirmTransaction = async () => {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const receipt = await provider.waitForTransaction(txResponse.hash);
          console.log("Transaction confirmed:", receipt);
          message.success("Transaction confirmed!");
        } catch (waitError) {
          console.error(
            "Error waiting for transaction confirmation:",
            waitError
          );
          message.error("Error during transaction confirmation.");
        }
      };

      // Call the async function to handle the transaction confirmation
      confirmTransaction();
    },
  });

  const handleSlippageChange = (e) => setSlippage(e.target.value);

  const fetchTokenBalances = async () => {
    if (!address || !isConnected) return;

    const tokenOneAddress =
      selectedNetwork.id === "1" ? tokenOne.address : tokenOne.base_address;
    const tokenTwoAddress =
      selectedNetwork.id === "1" ? tokenTwo.address : tokenTwo.base_address;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const tokenOneContract = new ethers.Contract(
      tokenOneAddress,
      TOKEN_ABI,
      provider
    );
    const tokenTwoContract = new ethers.Contract(
      tokenTwoAddress,
      TOKEN_ABI,
      provider
    );

    try {
      const [tokenOneDecimals, tokenTwoDecimals] = await Promise.all([
        tokenOneContract.decimals(),
        tokenTwoContract.decimals(),
      ]);

      const [balanceOne, balanceTwo] = await Promise.all([
        tokenOneContract.balanceOf(address),
        tokenTwoContract.balanceOf(address),
      ]);

      setTokenOneBalance(
        ethers.utils.formatUnits(balanceOne, tokenOneDecimals)
      );
      setTokenTwoBalance(
        ethers.utils.formatUnits(balanceTwo, tokenTwoDecimals)
      );
    } catch (error) {
      console.error("Error fetching token balances or decimals:", error);
      message.error(
        "Failed to fetch token balances. Make sure LexDex is connected to the same Network as your wallet."
      );
    }
  };

  const changeAmount = async (e) => {
    setTokenOneAmount(e.target.value);
    if (!prices) {
      await fetchPrices();
    }

    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2));
    }
  };

  const clearPrices = () => {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
  };

  const resetInterface = () => {
    clearPrices();
    fetchTokenBalances();
  };

  const switchTokens = () => {
    clearPrices();
    const [one, two] = [tokenTwo, tokenOne];
    setTokenOne(one);
    setTokenTwo(two);
  };

  const openModal = (asset) => {
    setChangeToken(asset);
    setIsModalVisible(true);
  };

  const modifyToken = (i) => {
    clearPrices();
    const newToken = tokenList[i];
    if (changeToken === 1) {
      setTokenOne(newToken);
    } else {
      setTokenTwo(newToken);
    }
    setIsModalVisible(false);
  };

  const fetchPrices = async () => {
    const res = await axios.get("http://localhost:3001/tokenPrice", {
      params: { addressOne: tokenOne.address, addressTwo: tokenTwo.address },
    });
    setPrices(res.data);
  };

  const handleApprove = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const sellTokenAddress =
        selectedNetwork.id === "1" ? tokenOne.address : tokenOne.base_address;
      const buyTokenAddress =
        selectedNetwork.id === "1" ? tokenTwo.address : tokenTwo.base_address;

      const priceParams = new URLSearchParams({
        chainId: selectedNetwork.id,
        sellToken: sellTokenAddress,
        buyToken: buyTokenAddress,
        sellAmount: ethers.utils.parseUnits(
          tokenOneAmount.toString(),
          tokenOne.decimals
        ),
        taker: address,
      });

      // Fetch the price quote from your API
      const priceResponse = await fetch(
        "http://localhost:5000/api/0x-price?" + priceParams.toString()
      );
      const priceResponseJson = await priceResponse.json();
      console.log("priceR:", JSON.stringify(priceResponseJson, null, 2));

      // Check for sufficient liquidity before proceeding with approval
      if (!priceResponseJson.liquidityAvailable) {
        throw new Error("Insufficient liquidity for this trade.");
      }

      const tokenContract = new ethers.Contract(
        sellTokenAddress,
        TOKEN_ABI,
        signer
      );

      // Use allowance target from price response if available
      const allowanceTarget =
        priceResponseJson.issues.allowance?.spender ||
        "0x000000000022d473030f116ddee9f6b43ac78ba3"; //Permit2 address;
      if (!allowanceTarget) {
        throw new Error("Allowance target not defined or invalid.");
      }
      console.log("Allowance Target:", allowanceTarget);

      let allowance;
      try {
        allowance = await tokenContract.allowance(address, allowanceTarget);
        console.log("Current Allowance:", allowance.toString());
      } catch (error) {
        console.warn(
          "Allowance function not supported, proceeding with approve only:",
          error
        );
        allowance = ethers.constants.Zero; // Set to zero to ensure approval proceeds
      }

      const sellAmount = ethers.utils.parseUnits(
        tokenOneAmount.toString(),
        tokenOne.decimals
      );

      console.log("sell amount:", sellAmount);

      if (allowance.lt(sellAmount)) {
        // Call approve directly if allowance is insufficient or unsupported
        const approveTx = await tokenContract.approve(
          allowanceTarget,
          sellAmount
        );
        console.log("Approve tx:", approveTx);
        await approveTx.wait();
        message.success("Approval confirmed. Proceed with the swap.");
      } else {
        console.log("Approval already sufficient.");
      }

      setSwapApproved(true);
    } catch (error) {
      console.error("Approval error:", error);
      message.error("Approval failed. Please try again.");
    }
  };

  const handleSwap = async () => {
    try {
      console.log("Starting handleSwap");

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const sellTokenAddress =
        selectedNetwork.id === "1" ? tokenOne.address : tokenOne.base_address;
      const buyTokenAddress =
        selectedNetwork.id === "1" ? tokenTwo.address : tokenTwo.base_address;

      const quoteParams = new URLSearchParams({
        chainId: selectedNetwork.id,
        sellToken: sellTokenAddress,
        buyToken: buyTokenAddress,
        sellAmount: ethers.utils.parseUnits(
          tokenOneAmount.toString(),
          tokenOne.decimals
        ),
        taker: address,
      });

      const quoteResponse = await fetch(
        "http://localhost:5000/api/0x-quote?" + quoteParams.toString()
      );
      const quoteResponseJson = await quoteResponse.json();
      console.log(
        "Quote Response:",
        JSON.stringify(quoteResponseJson, null, 2)
      );

      const transaction = quoteResponseJson.transaction;
      if (!transaction || !transaction.to) {
        throw new Error("Transaction details are incomplete or invalid.");
      }

      const { to, data, gas, gasPrice, value } = transaction;

      // Set up domain and types
      const domain = {
        name: "Permit2",
        chainId: selectedNetwork.id,
        verifyingContract:
          quoteResponseJson.permit2.eip712.domain.verifyingContract,
      };

      const types = {
        TokenPermissions: [
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        PermitTransferFrom: [
          { name: "permitted", type: "TokenPermissions" },
          { name: "spender", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const message = quoteResponseJson.permit2.eip712.message;

      const signer = provider.getSigner();
      const signature = await signer._signTypedData(domain, types, message);

      const signatureBytes = ethers.utils.arrayify(signature);
      const signatureLength = ethers.utils.hexlify(signatureBytes.length);
      const signatureLengthPadded = ethers.utils.hexZeroPad(
        signatureLength,
        32
      );
      const dataWithSignature = ethers.utils.hexConcat([
        data,
        signatureLengthPadded,
        signatureBytes,
      ]);

      try {
        console.log("Simulating transaction...");
        const simulationResult = await provider.call({
          to,
          dataWithSignature,
          from: address,
          value: value || 0,
        });
        console.log(
          "Transaction simulation successful, result:",
          simulationResult
        );
      } catch (simulationError) {
        console.error("Transaction simulation failed:", simulationError);
        message.error(
          "Transaction likely to fail. Check token support and allowance."
        );
        return; // Exit early if simulation fails
      }

      setTxDetails({
        to: String(to),
        data: String(dataWithSignature),
        value: value,
        gas: gas,
        gasPrice: gasPrice,
      });
      console.log("Set txDetails for MetaMask:", {
        to: txDetails.to,
        data: txDetails.data,
        value: txDetails.value,
        gas: txDetails.gas,
        gasPrice: txDetails.gasPrice,
      });

      console.log("Values passed to sendTransaction:", {
        from: address,
        to: to,
        data: dataWithSignature,
        value: value,
        gas: gas,
        gasPrice: gasPrice,
      });

      sendTransaction({
        from: address,
        to: to,
        data: dataWithSignature,
        value: value,
        gasLimit: gas,
        gasPrice: gasPrice,
      });
    } catch (error) {
      console.error("Swap error:", error);
      message.error("Swap failed. Please try again.");
    }
  };

  useEffect(() => {
    fetchTokenBalances();
  }, [address, isConnected, tokenOne, tokenTwo]);

  useEffect(() => {
    if (selectedNetwork) {
      resetInterface();
    }
  }, [selectedNetwork]);

  const settings = (
    <div>
      <div>Slippage Tolerance</div>
      <Radio.Group value={slippage} onChange={handleSlippageChange}>
        <Radio.Button value={0.5}>0.5%</Radio.Button>
        <Radio.Button value={1}>1%</Radio.Button>
        <Radio.Button value={2.5}>2.5%</Radio.Button>
        <Radio.Button value={5}>5%</Radio.Button>
      </Radio.Group>
    </div>
  );

  return (
    <>
      <Modal
        open={isModalVisible}
        footer={null}
        onCancel={() => setIsModalVisible(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {tokenList.map((e, i) => (
            <div className="tokenChoice" key={i} onClick={() => modifyToken(i)}>
              <img src={e.img} alt={e.ticker} className="tokenLogo" />
              <div className="tokenChoiceNames">
                <div className="tokenName">{e.name}</div>
                <div className="tokenTicker">{e.ticker}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
      <div className="tradeBox" style={{ display: "inline" }}>
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="inputs">
          <div style={{ position: "relative" }}>
            <Input
              placeholder="0"
              value={tokenOneAmount}
              onChange={changeAmount}
              style={{ width: "100%" }}
            />
            <div className="assetOne" onClick={() => openModal(1)}>
              <img
                src={tokenOne.img}
                alt="assetOneLogo"
                className="assetLogo"
              />
              {tokenOne.ticker}
              <DownOutlined />
            </div>
            <div
              style={{
                position: "absolute",
                top: "20%",
                right: "20px",
                transform: "translateY(-50%)",
                fontSize: "0.7em",
                color: "#fff",
                pointerEvents: "none", // Prevents interaction with the balance text
              }}
              hidden={!isConnected}
            >
              Balance: {tokenOneBalance || 0} {tokenOne.ticker}
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <Input
              placeholder="0"
              value={tokenTwoAmount}
              style={{ width: "100%" }}
              disabled
            />
            <div
              className="assetTwo"
              style={{ marginTop: "-100px" }}
              onClick={() => openModal(2)}
            >
              <img
                src={tokenTwo.img}
                alt="assetTwoLogo"
                className="assetLogo"
              />
              {tokenTwo.ticker}
              <DownOutlined />
            </div>
            <div
              style={{
                position: "absolute",
                top: "20%",
                right: "20px",
                transform: "translateY(-50%)",
                fontSize: "0.7em",
                color: "#fff",
                pointerEvents: "none",
              }}
              hidden={!isConnected}
            >
              Balance: {tokenTwoBalance || 0} {tokenTwo.ticker}
            </div>
          </div>
          <div className="switchButton" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
        </div>
        <div
          className="swapButton"
          disabled={!tokenOneAmount || !isConnected}
          onClick={swapApproved ? handleSwap : handleApprove}
        >
          {swapApproved ? "Confirm Swap" : "Approve Swap"}
        </div>
      </div>
    </>
  );
}

export default Swap;
