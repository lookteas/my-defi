import React, { useState, useEffect } from 'react';
import { Contract, formatEther, parseEther } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { CONTRACTS } from '../config/contracts';
import { LENDING_POOL_ABI, ERC20_ABI, MYDEFI_TOKEN_ABI } from '../config/abis';
import { UI_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants';
import { getAvailableProvider, safeContractCall, formatNumber } from '../utils/providerUtils';
import './styles/LendingInterface.css';

const LendingInterface: React.FC = () => {
  const { provider, signer, account } = useWallet();
  const [depositBalance, setDepositBalance] = useState('0');
  const [borrowBalance, setBorrowBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [interestRate, setInterestRate] = useState('0');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取借贷信息
  const fetchLendingInfo = async () => {
    if (!provider || !account) {
      // 设置默认值，避免显示错误
      setDepositBalance(UI_CONFIG.DEFAULT_BALANCE);
      setBorrowBalance(UI_CONFIG.DEFAULT_BALANCE);
      setUsdcBalance(UI_CONFIG.DEFAULT_BALANCE);
      setInterestRate(UI_CONFIG.DEFAULT_INTEREST_RATE);
      return;
    }

    try {
      // 使用工具函数获取可用的provider
      const currentProvider = await getAvailableProvider(provider);
      
      const lendingContract = new Contract(
        CONTRACTS.LendingPool,
        LENDING_POOL_ABI,
        currentProvider
      );
      
      const usdcContract = new Contract(
        CONTRACTS.MockUSDC,
        ERC20_ABI,
        currentProvider
      );

      // 使用安全的合约调用，带有默认值
      const [userInfo, usdcBal] = await Promise.all([
        safeContractCall(() => lendingContract.getUserInfo(account), [BigInt(0), BigInt(0), BigInt(0)]),
        safeContractCall(() => usdcContract.balanceOf(account), BigInt(0))
      ]);

      setDepositBalance(formatNumber(formatEther(userInfo[0]), UI_CONFIG.DECIMAL_PLACES)); // supplied
      setBorrowBalance(formatNumber(formatEther(userInfo[1]), UI_CONFIG.DECIMAL_PLACES)); // borrowed
      setUsdcBalance(formatNumber(formatEther(usdcBal), UI_CONFIG.DECIMAL_PLACES));
      setInterestRate(UI_CONFIG.DEFAULT_INTEREST_RATE); // 固定利率
      
      console.log('借贷信息获取成功:', {
        depositBalance: formatEther(userInfo[0]),
        borrowBalance: formatEther(userInfo[1]),
        usdcBalance: formatEther(usdcBal)
      });
    } catch (error) {
      console.error('获取借贷信息失败:', error);
      // 设置默认值，避免显示错误
      setDepositBalance(UI_CONFIG.DEFAULT_BALANCE);
      setBorrowBalance(UI_CONFIG.DEFAULT_BALANCE);
      setUsdcBalance(UI_CONFIG.DEFAULT_BALANCE);
      setInterestRate(UI_CONFIG.DEFAULT_INTEREST_RATE);
    }
  };

  // 存款
  const handleDeposit = async () => {
    if (!signer || !depositAmount) return;

    setLoading(true);
    try {
      // 先授权USDC代币
      const usdcContract = new Contract(
        CONTRACTS.MockUSDC,
        MYDEFI_TOKEN_ABI,
        signer
      );

      const amount = parseEther(depositAmount);
      
      // 授权LendingPool使用USDC
      const approveTx = await usdcContract.approve(CONTRACTS.LendingPool, amount);
      await approveTx.wait();

      // 调用supply函数
      const lendingContract = new Contract(
        CONTRACTS.LendingPool,
        LENDING_POOL_ABI,
        signer
      );

      const tx = await lendingContract.supply(amount);
      await tx.wait();
      
      alert('存款成功!');
      setDepositAmount('');
      fetchLendingInfo();
    } catch (error) {
      console.error('存款失败:', error);
      alert('存款失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 提款
  const handleWithdraw = async () => {
    if (!signer || !withdrawAmount) return;

    setLoading(true);
    try {
      const lendingContract = new Contract(
        CONTRACTS.LendingPool,
        LENDING_POOL_ABI,
        signer
      );

      const tx = await lendingContract.withdraw(
        parseEther(withdrawAmount)
      );
      
      await tx.wait();
      alert('提款成功!');
      setWithdrawAmount('');
      fetchLendingInfo();
    } catch (error) {
      console.error('提款失败:', error);
      alert('提款失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 借款
  const handleBorrow = async () => {
    if (!signer || !borrowAmount) return;

    setLoading(true);
    try {
      const lendingContract = new Contract(
        CONTRACTS.LendingPool,
        LENDING_POOL_ABI,
        signer
      );

      const tx = await lendingContract.borrow(
        parseEther(borrowAmount)
      );
      
      await tx.wait();
      alert('借款成功!');
      setBorrowAmount('');
      fetchLendingInfo();
    } catch (error) {
      console.error('借款失败:', error);
      alert('借款失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 还款
  const handleRepay = async () => {
    if (!signer || !repayAmount) return;

    setLoading(true);
    try {
      // 先授权USDC代币
      const usdcContract = new Contract(
        CONTRACTS.MockUSDC,
        MYDEFI_TOKEN_ABI,
        signer
      );

      const amount = parseEther(repayAmount);
      
      // 授权LendingPool使用USDC
      const approveTx = await usdcContract.approve(CONTRACTS.LendingPool, amount);
      await approveTx.wait();

      // 调用repay函数
      const lendingContract = new Contract(
        CONTRACTS.LendingPool,
        LENDING_POOL_ABI,
        signer
      );

      const tx = await lendingContract.repay(amount);
      await tx.wait();
      
      alert('还款成功!');
      setRepayAmount('');
      fetchLendingInfo();
    } catch (error) {
      console.error('还款失败:', error);
      alert('还款失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLendingInfo();
  }, [provider, account]);

  return (
    <div className="lending-interface">
      <h2>借贷协议</h2>
      
      {/* 借贷信息概览 */}
      <div className="lending-overview">
        <div className="overview-cards">
          <div className="overview-card">
            <div className="card-header">
              <h3>💰 存款余额</h3>
            </div>
            <div className="card-value">{parseFloat(depositBalance).toFixed(4)} USDC</div>
          </div>
          <div className="overview-card">
            <div className="card-header">
              <h3>📊 借款余额</h3>
            </div>
            <div className="card-value">{parseFloat(borrowBalance).toFixed(4)} USDC</div>
          </div>
          <div className="overview-card">
            <div className="card-header">
              <h3>💵 USDC 余额</h3>
            </div>
            <div className="card-value">{parseFloat(usdcBalance).toFixed(4)} USDC</div>
          </div>
          <div className="overview-card">
            <div className="card-header">
              <h3>📈 利率</h3>
            </div>
            <div className="card-value">{interestRate}%</div>
          </div>
        </div>
        <button className="refresh-button" onClick={fetchLendingInfo}>
          🔄 刷新数据
        </button>
      </div>

      <div className="lending-actions">
        {/* 存款功能 */}
        <div className="action-section">
          <h3>💳 存款</h3>
          <p>存入 USDC 赚取利息</p>
          <div className="form-group">
            <label>存款数量 (USDC):</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="输入存款数量 (例: 1000)"
              step="0.01"
            />
          </div>
          <button 
            className="action-button deposit-button"
            onClick={handleDeposit}
            disabled={loading || !depositAmount}
          >
            {loading ? '处理中...' : '存款'}
          </button>
        </div>

        {/* 提款功能 */}
        <div className="action-section">
          <h3>💸 提款</h3>
          <p>提取您的存款和利息</p>
          <div className="form-group">
            <label>提款数量 (USDC):</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="输入提款数量 (例: 500)"
              step="0.01"
            />
          </div>
          <button 
            className="action-button withdraw-button"
            onClick={handleWithdraw}
            disabled={loading || !withdrawAmount}
          >
            {loading ? '处理中...' : '提款'}
          </button>
        </div>

        {/* 借款功能 */}
        <div className="action-section">
          <h3>🏦 借款</h3>
          <p>借出 USDC 进行投资</p>
          <div className="form-group">
            <label>借款数量 (USDC):</label>
            <input
              type="number"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              placeholder="输入借款数量 (例: 200)"
              step="0.01"
            />
          </div>
          <button 
            className="action-button borrow-button"
            onClick={handleBorrow}
            disabled={loading || !borrowAmount}
          >
            {loading ? '处理中...' : '借款'}
          </button>
        </div>

        {/* 还款功能 */}
        <div className="action-section">
          <h3>💰 还款</h3>
          <p>偿还您的借款</p>
          <div className="form-group">
            <label>还款数量 (USDC):</label>
            <input
              type="number"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              placeholder="输入还款数量 (例: 100)"
              step="0.01"
            />
          </div>
          <button 
            className="action-button repay-button"
            onClick={handleRepay}
            disabled={loading || !repayAmount}
          >
            {loading ? '处理中...' : '还款'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LendingInterface;