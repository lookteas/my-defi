import React, { useState, useEffect } from 'react';
import { Contract, formatEther, parseEther, ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { CONTRACTS } from '../config/contracts';
import { YIELD_FARM_ABI, ERC20_ABI } from '../config/abis';
import { UI_CONFIG, CONTRACT_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants';
import { getAvailableProvider, safeContractCall, formatNumber } from '../utils/providerUtils';
import './styles/YieldFarmInterface.css';

const YieldFarmInterface: React.FC = () => {
  const { provider, signer, account } = useWallet();
  const [lpBalance, setLpBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [pendingRewards, setPendingRewards] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [apy, setApy] = useState('0');
  
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取农场信息
  const fetchFarmInfo = async () => {
    if (!provider || !account) {
      // 设置默认值，避免显示错误
      setLpBalance(UI_CONFIG.DEFAULT_BALANCE);
      setStakedAmount(UI_CONFIG.DEFAULT_BALANCE);
      setPendingRewards(UI_CONFIG.DEFAULT_BALANCE);
      setTotalStaked(UI_CONFIG.DEFAULT_BALANCE);
      setApy(UI_CONFIG.DEFAULT_APY);
      return;
    }

    try {
      // 使用工具函数获取可用的provider
      const currentProvider = await getAvailableProvider(provider);
      
      const farmContract = new Contract(
        CONTRACTS.YieldFarm,
        YIELD_FARM_ABI,
        currentProvider
      );
      
      const lpContract = new Contract(
        CONTRACTS.LiquidityPool,
        ERC20_ABI,
        currentProvider
      );

      // 使用默认池ID
      const poolId = CONTRACT_CONFIG.DEFAULT_POOL_ID;

      // 使用安全的合约调用，带有默认值
      const [lpBal, userInfoData, pendingRewardsData, poolInfoData] = await Promise.all([
        safeContractCall(() => lpContract.balanceOf(account), BigInt(0)),
        safeContractCall(() => farmContract.userInfo(poolId, account), [BigInt(0), BigInt(0), BigInt(0), BigInt(0)]),
        safeContractCall(() => farmContract.pendingReward(poolId, account), BigInt(0)),
        safeContractCall(() => farmContract.poolInfo(poolId), [ethers.ZeroAddress, BigInt(0), BigInt(0), BigInt(0), BigInt(0)])
      ]);

      setLpBalance(formatNumber(formatEther(lpBal), UI_CONFIG.DECIMAL_PLACES));
      setStakedAmount(formatNumber(formatEther(userInfoData[0]), UI_CONFIG.DECIMAL_PLACES));
      setPendingRewards(formatNumber(formatEther(pendingRewardsData), UI_CONFIG.DECIMAL_PLACES));
      setTotalStaked(formatNumber(formatEther(poolInfoData[4]), UI_CONFIG.DECIMAL_PLACES));
      
      // APY计算
      try {
        const rewardPerSecond = await safeContractCall(
          () => farmContract.rewardPerSecond(), 
          BigInt(0)
        );
        const totalStakedBN = poolInfoData[4];
        
        if (totalStakedBN > 0 && rewardPerSecond > 0) {
          const yearlyRewards = parseFloat(formatEther(rewardPerSecond)) * CONTRACT_CONFIG.SECONDS_PER_YEAR;
          const totalStakedValue = parseFloat(formatEther(totalStakedBN));
          
          // 防止除零和异常值
          if (totalStakedValue > 0) {
            let calculatedApy = (yearlyRewards / totalStakedValue) * 100;
            
            // 设置合理的APY上限，防止显示异常值
            const MAX_APY = 10000; // 最大10000%
            if (calculatedApy > MAX_APY || !isFinite(calculatedApy) || isNaN(calculatedApy)) {
              console.warn('APY计算结果异常:', calculatedApy, '使用默认值');
              calculatedApy = parseFloat(UI_CONFIG.DEFAULT_APY);
            }
            
            setApy(formatNumber(calculatedApy, UI_CONFIG.PERCENTAGE_DECIMAL_PLACES));
          } else {
            setApy(UI_CONFIG.DEFAULT_APY);
          }
        } else {
          setApy(UI_CONFIG.DEFAULT_APY);
        }
      } catch (error) {
        console.error('计算APY失败:', error);
        setApy(UI_CONFIG.DEFAULT_APY);
      }
      
      console.log('农场信息获取成功:', {
        lpBalance: formatEther(lpBal),
        stakedAmount: formatEther(userInfoData[0]),
        pendingRewards: formatEther(pendingRewardsData)
      });
    } catch (error) {
      console.error('获取农场信息失败:', error);
      // 设置默认值，避免显示错误
      setLpBalance(UI_CONFIG.DEFAULT_BALANCE);
      setStakedAmount(UI_CONFIG.DEFAULT_BALANCE);
      setPendingRewards(UI_CONFIG.DEFAULT_BALANCE);
      setTotalStaked(UI_CONFIG.DEFAULT_BALANCE);
      setApy(UI_CONFIG.DEFAULT_APY);
    }
  };

  // 质押LP代币
  const handleStake = async () => {
    if (!signer || !stakeAmount) return;

    setLoading(true);
    try {
      const amount = parseEther(stakeAmount);
      const poolId = 0; // 使用池ID 0

      // 授权LP代币
      const lpContract = new Contract(
        CONTRACTS.LiquidityPool,
        ERC20_ABI,
        signer
      );

      const approveTx = await lpContract.approve(CONTRACTS.YieldFarm, amount);
      await approveTx.wait();

      // 质押
      const farmContract = new Contract(
        CONTRACTS.YieldFarm,
        YIELD_FARM_ABI,
        signer
      );

      const tx = await farmContract.deposit(poolId, amount);
      await tx.wait();

      alert('质押成功!');
      setStakeAmount('');
      fetchFarmInfo();
    } catch (error) {
      console.error('质押失败:', error);
      alert('质押失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 取消质押
  const handleUnstake = async () => {
    if (!signer || !unstakeAmount) return;

    setLoading(true);
    try {
      const poolId = 0; // 使用池ID 0
      const farmContract = new Contract(
        CONTRACTS.YieldFarm,
        YIELD_FARM_ABI,
        signer
      );

      const tx = await farmContract.withdraw(poolId, parseEther(unstakeAmount));
      await tx.wait();

      alert('取消质押成功!');
      setUnstakeAmount('');
      fetchFarmInfo();
    } catch (error) {
      console.error('取消质押失败:', error);
      alert('取消质押失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 收获奖励
  const handleHarvest = async () => {
    if (!signer) return;

    setLoading(true);
    try {
      const poolId = 0; // 使用池ID 0
      const farmContract = new Contract(
        CONTRACTS.YieldFarm,
        YIELD_FARM_ABI,
        signer
      );

      const tx = await farmContract.harvest(poolId);
      await tx.wait();

      alert('收获奖励成功!');
      fetchFarmInfo();
    } catch (error) {
      console.error('收获奖励失败:', error);
      alert('收获奖励失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 计算年收益
  const calculateYearlyRewards = () => {
    const staked = parseFloat(stakedAmount);
    const apyRate = parseFloat(apy);
    
    // 验证输入值的有效性
    if (staked === 0 || apyRate === 0 || !isFinite(staked) || !isFinite(apyRate)) {
      return '0.0000';
    }
    
    // 防止APY过高导致的异常计算
    const maxReasonableApy = 10000; // 最大合理APY 10000%
    const safeApyRate = Math.min(apyRate, maxReasonableApy);
    
    const yearlyRewards = (staked * safeApyRate) / 100;
    
    // 确保结果是有限数值
    if (!isFinite(yearlyRewards) || isNaN(yearlyRewards)) {
      return '0.0000';
    }
    
    return formatNumber(yearlyRewards, 4);
  };

  // 计算每日奖励
  const calculateDailyRewards = () => {
    const staked = parseFloat(stakedAmount);
    const apyRate = parseFloat(apy);
    
    // 验证输入值的有效性
    if (staked === 0 || apyRate === 0 || !isFinite(staked) || !isFinite(apyRate)) {
      return '0.0000';
    }
    
    // 防止APY过高导致的异常计算
    const maxReasonableApy = 10000; // 最大合理APY 10000%
    const safeApyRate = Math.min(apyRate, maxReasonableApy);
    
    const dailyRate = safeApyRate / 365;
    const dailyRewards = (staked * dailyRate) / 100;
    
    // 确保结果是有限数值
    if (!isFinite(dailyRewards) || isNaN(dailyRewards)) {
      return '0.0000';
    }
    
    return dailyRewards.toFixed(4);
  };

  useEffect(() => {
    fetchFarmInfo();
  }, [provider, account]);

  return (
    <div className="yield-farm-interface">
      {/* 页面标题 */}
      <div className="page-header">
        <h1 className="page-title">流动性挖矿</h1>
        <p className="page-subtitle">质押LP代币，获得MDT奖励</p>
      </div>

      {/* 主要统计数据 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">总锁定价值</div>
          <div className="stat-value">$26,400.00</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">年化收益率</div>
          <div className="stat-value highlight">{apy}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">我的奖励</div>
          <div className="stat-value">{formatNumber(parseFloat(pendingRewards), 4)} MDT</div>
          <button 
            className="harvest-btn"
            onClick={handleHarvest}
            disabled={loading || parseFloat(pendingRewards) === 0}
          >
            {loading ? '收获中...' : '收获'}
          </button>
        </div>
      </div>

      {/* 主要操作区域 */}
      <div className="main-content">
        {/* 质押卡片 */}
        <div className="action-card">
          <div className="card-header">
            <h3>质押 LP 代币</h3>
            <div className="balance-info">
              余额: {formatNumber(parseFloat(lpBalance), 4)} LP
            </div>
          </div>
          <div className="card-body">
            <div className="input-group">
              <input
                type="number"
                placeholder="输入质押数量"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="amount-input"
              />
              <button 
                className="max-btn"
                onClick={() => setStakeAmount(lpBalance)}
              >
                最大
              </button>
            </div>
            <button
              className="action-btn primary"
              onClick={handleStake}
              disabled={loading || !stakeAmount}
            >
              {loading ? '质押中...' : '质押'}
            </button>
          </div>
        </div>

        {/* 取消质押卡片 */}
        <div className="action-card">
          <div className="card-header">
            <h3>取消质押</h3>
            <div className="balance-info">
              已质押: {formatNumber(parseFloat(stakedAmount), 4)} LP
            </div>
          </div>
          <div className="card-body">
            <div className="input-group">
              <input
                type="number"
                placeholder="输入取消质押数量"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                className="amount-input"
              />
              <button 
                className="max-btn"
                onClick={() => setUnstakeAmount(stakedAmount)}
              >
                最大
              </button>
            </div>
            <button
              className="action-btn secondary"
              onClick={handleUnstake}
              disabled={loading || !unstakeAmount}
            >
              {loading ? '取消质押中...' : '取消质押'}
            </button>
          </div>
        </div>
      </div>

      {/* 收益信息 */}
      <div className="earnings-card">
        <h3>收益预测</h3>
        <div className="earnings-grid">
          <div className="earning-item">
            <span className="earning-label">日收益</span>
            <span className="earning-value">{calculateDailyRewards()} MDT</span>
          </div>
          <div className="earning-item">
            <span className="earning-label">月收益</span>
            <span className="earning-value">{formatNumber(parseFloat(calculateDailyRewards()) * 30, 4)} MDT</span>
          </div>
          <div className="earning-item">
            <span className="earning-label">年收益</span>
            <span className="earning-value">{calculateYearlyRewards()} MDT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldFarmInterface;