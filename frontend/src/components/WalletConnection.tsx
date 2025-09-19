import React from 'react';
import { useWallet } from '../hooks/useWallet';
import './styles/WalletConnection.css';

const WalletConnection: React.FC = () => {
  const { 
    account, 
    isConnected, 
    isConnecting, 
    chainId, 
    connectWallet, 
    disconnectWallet 
  } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return 'Ethereum';
      case 31337:
        return 'Localhost';
      default:
        return `Chain ${chainId}`;
    }
  };

  if (isConnected && account) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="network-info">
            <span className="network-indicator"></span>
            {chainId && getNetworkName(chainId)}
          </div>
          <div className="account-info">
            <span className="account-address">{formatAddress(account)}</span>
          </div>
        </div>
        <button 
          className="disconnect-button"
          onClick={disconnectWallet}
        >
          断开连接
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connection">
      <button 
        className="connect-button"
        onClick={connectWallet}
        disabled={isConnecting}
      >
        {isConnecting ? '连接中...' : '连接钱包'}
      </button>
    </div>
  );
};

export default WalletConnection;