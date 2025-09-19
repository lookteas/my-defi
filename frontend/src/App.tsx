import React, { useState } from 'react';
import './styles/App.css';
import { useWallet } from './hooks/useWallet';
import WalletConnection from './components/WalletConnection';
import TokenManager from './components/TokenManager';
import LendingInterface from './components/LendingInterface';
import DEXInterface from './components/DEXInterface';
import YieldFarmInterface from './components/YieldFarmInterface';

function App() {
  const { isConnected, account } = useWallet();
  const [activeTab, setActiveTab] = useState('token');

  const tabs = [
    { id: 'token', label: '代币管理', component: TokenManager },
    { id: 'lending', label: '借贷协议', component: LendingInterface },
    { id: 'dex', label: 'DEX 交易', component: DEXInterface },
    { id: 'farm', label: '流动性挖矿', component: YieldFarmInterface },
  ];

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🚀 My DeFi Protocol</h1>
          <WalletConnection />
        </div>
      </header>

      <main className="app-main">
        {!isConnected ? (
          <div className="welcome-section">
            <h2>欢迎使用 DeFi 协议</h2>
            <p>请连接您的钱包开始使用</p>
            <div className="features">
              <div className="feature-card">
                <h3>🪙 代币管理</h3>
                <p>管理您的 DeFi 代币，支持转账、mint 和 burn</p>
              </div>
              <div className="feature-card">
                <h3>🏦 借贷协议</h3>
                <p>存款赚取利息，或借出资金进行投资</p>
              </div>
              <div className="feature-card">
                <h3>🔄 DEX 交易</h3>
                <p>去中心化交易所，添加流动性和代币交换</p>
              </div>
              <div className="feature-card">
                <h3>🌾 流动性挖矿</h3>
                <p>质押代币获得奖励，参与流动性挖矿</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <div className="user-info">
              <h2>欢迎回来！</h2>
              <p>账户: {account?.slice(0, 6)}...{account?.slice(-4)}</p>
            </div>

            <nav className="tab-navigation">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="tab-content">
              {tabs.map(tab => {
                const Component = tab.component;
                return (
                  <div
                    key={tab.id}
                    className={`tab-panel ${activeTab === tab.id ? 'active' : ''}`}
                  >
                    {activeTab === tab.id && <Component />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
