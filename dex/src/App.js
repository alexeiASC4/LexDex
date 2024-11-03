import "./App.css";
import Header from "./components/Header.js";
import Swap from "./components/Swap.js";
import Tokens from "./components/Tokens.js";
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
    </div>
  );
}

export default App;
