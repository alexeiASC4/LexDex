import React from "react";
import Logo from "../logo.svg";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Modal, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import networkList from "../networkList.json";

function Header(props) {
  const { address, isConnected, connect, network, setSelectedNetwork } = props;
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSelectNetwork = (network) => {
    setSelectedNetwork(network);
    setIsModalVisible(false);
    console.log("Network: " + network.name);
    message.info(`Make sure wallet is connected to ${network.name}`);
  };

  return (
    <header>
      <Modal
        open={isModalVisible}
        footer={null}
        onCancel={() => setIsModalVisible(false)}
        title="Select a network"
      >
        {networkList.map((e, i) => (
          <div
            className="tokenChoice"
            key={i}
            onClick={() => handleSelectNetwork(networkList[i])}
          >
            <img src={e.img} alt={e.name} className="tokenLogo" />
            <div className="tokenChoiceNames">
              <div className="tokenName">{e.name}</div>
            </div>
          </div>
        ))}
      </Modal>
      <div className="leftH">
        <div
          style={{
            color: "#7ff9ff",
            fontFamily: "fantasy",
            alignItems: "center",
            display: "flex",
          }}
        >
          <img src={Logo} alt="logo" className="logo" />
          <h2 style={{ paddingTop: "5px" }}>LexDex</h2>
        </div>
        <Link to="/" className="link">
          <div className="headerItem">Swap</div>
        </Link>
        <Link to="/tokens" className="link">
          <div className="headerItem">Tokens</div>
        </Link>
      </div>
      <div className="rightH">
        <div
          className="headerItem"
          style={{
            backgroundColor: "#243056",
            borderRadius: "100px",
            gap: "5px",
          }}
          onClick={() => setIsModalVisible(true)}
        >
          <img src={network.img} alt="logo" className="eth" />
          {network.name}
          <DownOutlined />
        </div>
        <div className="connectButton" onClick={connect}>
          {isConnected
            ? address.slice(0, 4) + "..." + address.slice(38)
            : "Connect"}
        </div>
      </div>
    </header>
  );
}

export default Header;
