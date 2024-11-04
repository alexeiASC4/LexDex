import "./App.css";
import LinkedInLogo from "./linkedin.png";
import Header from "./components/Header";
import Swap from "./components/Swap";
import Tokens from "./components/Tokens";
import { Routes, Route } from "react-router-dom";
import { useConnect, useAccount } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { useState } from "react";
import networkList from "./networkList.json";

function App() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });

  const [selectedNetwork, setSelectedNetwork] = useState(networkList[0]);

  return (
    <div className="App">
      <Header
        connect={connect}
        isConnected={isConnected}
        address={address}
        network={selectedNetwork}
        setSelectedNetwork={setSelectedNetwork}
      />
      <div className="mainWindow">
        <Routes>
          <Route
            path="/"
            element={
              <Swap
                isConnected={isConnected}
                address={address}
                selectedNetwork={selectedNetwork}
              />
            }
          />
          <Route path="/tokens" element={<Tokens />} />
        </Routes>
      </div>
      <div
        style={{
          paddingTop: "10px",
          color: "salmon",
        }}
      >
        For demo purposes. Not optimized for production use.
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingTop: "10px",
          justifyContent: "center",
        }}
      >
        <h4>By Alexei Tulloch</h4>
        <a
          href="https://www.linkedin.com/in/alexei-tulloch-neversettle/"
          target="blank"
          style={{ paddingLeft: "20px" }}
        >
          <img
            src={LinkedInLogo}
            alt="LinkedIn"
            style={{ width: "30px", height: "30px" }}
          />
        </a>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          fontSize: "0.8em",
          width: "100%",
          textAlign: "center",
        }}
      >
        © 2024. All vibes reserved.
      </div>
    </div>
  );
}

export default App;
