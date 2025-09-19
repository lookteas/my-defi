import React, { useState, useEffect } from 'react';
import { ethers, Contract, formatEther, parseEther } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { CONTRACTS } from '../config/contracts';
import { MYDEFI_TOKEN_ABI, ERC20_ABI } from '../config/abis';
import { UI_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants';
import { getAvailableProvider, safeContractCall, formatNumber } from '../utils/providerUtils';
import './styles/TokenManager.css';

const TokenManager: React.FC = () => {
  const { provider, signer, account } = useWallet();
  const [tokenBalance, setTokenBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取代币余额
  const fetchBalances = async () => {
    if (!provider || !account) {
      console.log('Provider 或 Account 不存在:', { provider: !!provider, account });
      setTokenBalance('0');
      setUsdcBalance('0');
      return;
    }

    try {
      // 使用当前连接的provider，如果失败则使用本地provider
      let currentProvider: ethers.BrowserProvider | ethers.JsonRpcProvider = provider;
      
      try {
        await currentProvider.getNetwork();
      } catch (networkError) {
        console.log('当前provider连接失败，使用本地provider');
        currentProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      }
      
      const tokenContract = new Contract(
        CONTRACTS.MyDeFiToken,
        MYDEFI_TOKEN_ABI,
        currentProvider
      );
      
      const usdcContract = new Contract(
        CONTRACTS.MockUSDC,
        ERC20_ABI,
        currentProvider
      );

      // 并行获取余额，提高效率
      const [tokenBal, usdcBal] = await Promise.all([
        tokenContract.balanceOf(account).catch(() => BigInt(0)),
        usdcContract.balanceOf(account).catch(() => BigInt(0))
      ]);

      setTokenBalance(formatEther(tokenBal));
      setUsdcBalance(formatEther(usdcBal));
      
      console.log('余额获取成功:', {
        token: formatEther(tokenBal),
        usdc: formatEther(usdcBal)
      });
    } catch (error) {
      console.error('获取余额失败:', error);
      // 设置默认值，避免显示错误
      setTokenBalance('0');
      setUsdcBalance('0');
    }
  };

  // 转账代币
  const handleTransfer = async () => {
    if (!signer || !transferAmount || !transferTo) return;

    setLoading(true);
    try {
      const tokenContract = new Contract(
        CONTRACTS.MyDeFiToken,
        MYDEFI_TOKEN_ABI,
        signer
      );

      const tx = await tokenContract.transfer(
        transferTo,
        parseEther(transferAmount)
      );
      
      await tx.wait();
      alert('转账成功！');
      setTransferAmount('');
      setTransferTo('');
      fetchBalances();
    } catch (error: any) {
      console.error('转账失败:', error);
      alert(`转账失败: ${error.message}`);
    }
    setLoading(false);
  };

  // Mint 代币
  const handleMint = async () => {
    if (!signer || !mintAmount || !account) return;

    setLoading(true);
    try {
      const tokenContract = new Contract(
        CONTRACTS.MyDeFiToken,
        MYDEFI_TOKEN_ABI,
        signer
      );

      const tx = await tokenContract.mint(
        account,
        parseEther(mintAmount)
      );
      
      await tx.wait();
      alert('Mint 成功！');
      setMintAmount('');
      fetchBalances();
    } catch (error: any) {
      console.error('Mint 失败:', error);
      alert(`Mint 失败: ${error.message}`);
    }
    setLoading(false);
  };

  // Burn 代币
  const handleBurn = async () => {
    if (!signer || !burnAmount) return;

    setLoading(true);
    try {
      const tokenContract = new Contract(
        CONTRACTS.MyDeFiToken,
        MYDEFI_TOKEN_ABI,
        signer
      );

      const tx = await tokenContract.burn(
        parseEther(burnAmount)
      );
      
      await tx.wait();
      alert('Burn 成功！');
      setBurnAmount('');
      fetchBalances();
    } catch (error: any) {
      console.error('Burn 失败:', error);
      alert(`Burn 失败: ${error.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBalances();
  }, [provider, account]);

  return (
    <div className="token-manager">
      <h2>代币管理</h2>
      
      {/* 余额显示 */}
      <div className="balance-section">
        <h3>我的余额</h3>
        <div className="balance-cards">
          <div className="balance-card">
            <div className="token-icon">🪙</div>
            <div className="balance-info">
              <div className="token-name">MyDeFi Token</div>
              <div className="balance-amount">{parseFloat(tokenBalance).toFixed(4)} MDT</div>
            </div>
          </div>
          <div className="balance-card">
            <div className="token-icon">💵</div>
            <div className="balance-info">
              <div className="token-name">Mock USDC</div>
              <div className="balance-amount">{parseFloat(usdcBalance).toFixed(4)} USDC</div>
            </div>
          </div>
        </div>
        <button className="refresh-button" onClick={fetchBalances}>
          🔄 刷新余额
        </button>
      </div>

      {/* 转账功能 */}
      <div className="action-section">
        <h3>转账 MDT</h3>
        <div className="form-group">
          <label>接收地址:</label>
          <input
            type="text"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>转账数量:</label>
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="输入转账数量 (例: 100)"
            step="0.01"
          />
        </div>
        <button 
          className="action-button"
          onClick={handleTransfer}
          disabled={loading || !transferAmount || !transferTo}
        >
          {loading ? '处理中...' : '转账'}
        </button>
      </div>

      {/* Mint 功能 */}
      <div className="action-section">
        <h3>Mint MDT (仅限 Owner)</h3>
        <div className="form-group">
          <label>Mint 数量:</label>
          <input
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="输入 Mint 数量 (例: 1000)"
            step="0.01"
          />
        </div>
        <button 
          className="action-button mint-button"
          onClick={handleMint}
          disabled={loading || !mintAmount}
        >
          {loading ? '处理中...' : 'Mint'}
        </button>
      </div>

      {/* Burn 功能 */}
      <div className="action-section">
        <h3>Burn MDT</h3>
        <div className="form-group">
          <label>Burn 数量:</label>
          <input
            type="number"
            value={burnAmount}
            onChange={(e) => setBurnAmount(e.target.value)}
            placeholder="输入 Burn 数量 (例: 50)"
            step="0.01"
          />
        </div>
        <button 
          className="action-button burn-button"
          onClick={handleBurn}
          disabled={loading || !burnAmount}
        >
          {loading ? '处理中...' : 'Burn'}
        </button>
      </div>
    </div>
  );
};

export default TokenManager;