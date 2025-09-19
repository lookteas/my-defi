import React, { useState, useEffect } from 'react';
import { ethers, Contract, formatEther, parseEther } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { CONTRACTS } from '../config/contracts';
import { LIQUIDITY_POOL_ABI, ERC20_ABI, MYDEFI_TOKEN_ABI } from '../config/abis';
import { UI_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants';
import { getAvailableProvider, safeContractCall, formatNumber } from '../utils/providerUtils';
import './styles/DEXInterface.css';

const DEXInterface: React.FC = () => {
  const { provider, signer, account } = useWallet();
  const [tokenBalance, setTokenBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [lpBalance, setLpBalance] = useState('0');
  const [reserves, setReserves] = useState({ token: '0', usdc: '0' });
  const [price, setPrice] = useState('0');
  
  // 添加流动性状态
  const [addTokenAmount, setAddTokenAmount] = useState('');
  const [addUsdcAmount, setAddUsdcAmount] = useState('');
  
  // 移除流动性状态
  const [removeLpAmount, setRemoveLpAmount] = useState('');
  
  // 交换状态
  const [swapAmount, setSwapAmount] = useState('');
  const [swapFromToken, setSwapFromToken] = useState('token');
  const [expectedOutput, setExpectedOutput] = useState('0');
  
  const [loading, setLoading] = useState(false);

  // 获取DEX信息
  const fetchDEXInfo = async () => {
    if (!provider || !account) {
      // 设置默认值，避免显示错误
      setTokenBalance('0');
      setUsdcBalance('0');
      setLpBalance('0');
      setReserves({ token: '0', usdc: '0' });
      setPrice('0');
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
      
      const liquidityContract = new Contract(
        CONTRACTS.LiquidityPool,
        LIQUIDITY_POOL_ABI,
        currentProvider
      );
      
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

      // 并行获取所有数据，增加详细错误处理
      console.log('开始获取DEX信息...');
      console.log('合约地址:', {
        MyDeFiToken: CONTRACTS.MyDeFiToken,
        MockUSDC: CONTRACTS.MockUSDC,
        LiquidityPool: CONTRACTS.LiquidityPool
      });

      const [tokenBal, usdcBal, lpBal, reserveData, priceData] = await Promise.all([
        tokenContract.balanceOf(account).catch((err) => {
          console.error('获取token余额失败:', err);
          return BigInt(0);
        }),
        usdcContract.balanceOf(account).catch((err) => {
          console.error('获取USDC余额失败:', err);
          return BigInt(0);
        }),
        liquidityContract.balanceOf(account).catch((err) => {
          console.error('获取LP余额失败:', err);
          return BigInt(0);
        }),
        liquidityContract.getReserves().catch((err) => {
          console.error('获取储备量失败:', err);
          return [BigInt(0), BigInt(0)];
        }),
        liquidityContract.getPrice().catch((err) => {
          console.error('获取价格失败:', err);
          return BigInt(0);
        })
      ]);

      setTokenBalance(formatEther(tokenBal));
      setUsdcBalance(formatEther(usdcBal));
      setLpBalance(formatEther(lpBal));
      setReserves({
        token: formatEther(reserveData[0]),
        usdc: formatEther(reserveData[1])
      });
      setPrice(formatEther(priceData));
      
      console.log('DEX信息获取成功:', {
        tokenBalance: formatEther(tokenBal),
        usdcBalance: formatEther(usdcBal),
        lpBalance: formatEther(lpBal)
      });
    } catch (error) {
      console.error('获取DEX信息失败 - 详细错误信息:', error);
      console.error('错误类型:', typeof error);
      console.error('错误消息:', (error as Error)?.message);
      console.error('错误堆栈:', (error as Error)?.stack);
      
      // 如果是网络错误，打印更多信息
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('错误代码:', (error as any).code);
        console.error('错误原因:', (error as any).reason);
      }
      
      // 设置默认值，避免显示错误
      setTokenBalance('0');
      setUsdcBalance('0');
      setLpBalance('0');
      setReserves({ token: '0', usdc: '0' });
      setPrice('0');
    }
  };

  // 添加流动性
  const handleAddLiquidity = async () => {
    if (!signer || !addTokenAmount || !addUsdcAmount) return;

    setLoading(true);
    try {
      const tokenAmount = parseEther(addTokenAmount);
      const usdcAmount = parseEther(addUsdcAmount);

      // 授权代币
      const tokenContract = new Contract(
        CONTRACTS.MyDeFiToken,
        MYDEFI_TOKEN_ABI,
        signer
      );
      
      const usdcContract = new Contract(
        CONTRACTS.MockUSDC,
        MYDEFI_TOKEN_ABI,
        signer
      );

      const tokenApproveTx = await tokenContract.approve(CONTRACTS.LiquidityPool, tokenAmount);
      await tokenApproveTx.wait();

      const usdcApproveTx = await usdcContract.approve(CONTRACTS.LiquidityPool, usdcAmount);
      await usdcApproveTx.wait();

      // 添加流动性
      const liquidityContract = new Contract(
        CONTRACTS.LiquidityPool,
        LIQUIDITY_POOL_ABI,
        signer
      );

      const tx = await liquidityContract.addLiquidity(tokenAmount, usdcAmount);
      await tx.wait();

      alert('添加流动性成功!');
      setAddTokenAmount('');
      setAddUsdcAmount('');
      fetchDEXInfo();
    } catch (error) {
      console.error('添加流动性失败:', error);
      alert('添加流动性失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 移除流动性
  const handleRemoveLiquidity = async () => {
    if (!signer || !removeLpAmount) return;

    setLoading(true);
    try {
      const liquidityContract = new Contract(
        CONTRACTS.LiquidityPool,
        LIQUIDITY_POOL_ABI,
        signer
      );

      const tx = await liquidityContract.removeLiquidity(
        parseEther(removeLpAmount)
      );
      
      await tx.wait();
      alert('移除流动性成功!');
      setRemoveLpAmount('');
      fetchDEXInfo();
    } catch (error) {
      console.error('移除流动性失败:', error);
      alert('移除流动性失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 交换代币
  const handleSwap = async () => {
    if (!signer || !swapAmount) return;

    // 输入验证：确保是正数
    const numericAmount = parseFloat(swapAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('请输入有效的正数金额');
      return;
    }

    setLoading(true);
    try {
      console.log('开始执行交换...');
      console.log('交换参数:', { swapAmount, swapFromToken });
      
      const liquidityContract = new Contract(
        CONTRACTS.LiquidityPool,
        LIQUIDITY_POOL_ABI,
        signer
      );

      const amount = parseEther(swapAmount);
      console.log('交换数量:', amount.toString());

      if (swapFromToken === 'token') {
        console.log('执行token->USDC交换...');
        // 授权代币
        const tokenContract = new Contract(
          CONTRACTS.MyDeFiToken,
          MYDEFI_TOKEN_ABI,
          signer
        );
        
        console.log('授权token...');
        const approveTx = await tokenContract.approve(CONTRACTS.LiquidityPool, amount);
        console.log('授权交易哈希:', approveTx.hash);
        await approveTx.wait();
        console.log('授权完成');

        console.log('执行swapAForB...');
        // 计算最小输出量（允许1%滑点）
        const reserveAValue = parseEther(reserves.token);
        const reserveBValue = parseEther(reserves.usdc);
        const expectedOut = await liquidityContract.getAmountOut(amount, reserveAValue, reserveBValue);
        const minAmountOut = expectedOut * BigInt(99) / BigInt(100); // 1% 滑点保护
        console.log('预期输出:', expectedOut.toString(), '最小输出:', minAmountOut.toString());
        
        const tx = await liquidityContract.swapAForB(amount, minAmountOut);
        console.log('交换交易哈希:', tx.hash);
        await tx.wait();
        console.log('交换完成');
      } else {
        console.log('执行USDC->token交换...');
        // 授权USDC
        const usdcContract = new Contract(
          CONTRACTS.MockUSDC,
          MYDEFI_TOKEN_ABI,
          signer
        );
        
        console.log('授权USDC...');
        const approveTx = await usdcContract.approve(CONTRACTS.LiquidityPool, amount);
        console.log('授权交易哈希:', approveTx.hash);
        await approveTx.wait();
        console.log('授权完成');

        console.log('执行swapBForA...');
        // 计算最小输出量（允许1%滑点）
        const reserveAValue = parseEther(reserves.token);
        const reserveBValue = parseEther(reserves.usdc);
        const expectedOut = await liquidityContract.getAmountOut(amount, reserveBValue, reserveAValue);
        const minAmountOut = expectedOut * BigInt(99) / BigInt(100); // 1% 滑点保护
        console.log('预期输出:', expectedOut.toString(), '最小输出:', minAmountOut.toString());
        
        const tx = await liquidityContract.swapBForA(amount, minAmountOut);
        console.log('交换交易哈希:', tx.hash);
        await tx.wait();
        console.log('交换完成');
      }

      alert('交换成功!');
      setSwapAmount('');
      setExpectedOutput('0');
      fetchDEXInfo();
    } catch (error) {
      console.error('交换失败 - 详细错误:', error);
      console.error('错误类型:', typeof error);
      console.error('错误消息:', (error as Error)?.message);
      console.error('错误堆栈:', (error as Error)?.stack);
      
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('错误代码:', (error as any).code);
        console.error('错误原因:', (error as any).reason);
      }
      
      alert('交换失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 计算预期输出
  const calculateExpectedOutput = async () => {
    if (!provider || !swapAmount) {
      setExpectedOutput('0');
      return;
    }

    try {
      console.log('开始计算预期输出...');
      console.log('交换参数:', { swapAmount, swapFromToken });
      
      // 输入验证：确保是正数
      const numericAmount = parseFloat(swapAmount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        console.log('无效输入值:', swapAmount);
        setExpectedOutput('0');
        return;
      }
      
      const liquidityContract = new Contract(
        CONTRACTS.LiquidityPool,
        LIQUIDITY_POOL_ABI,
        provider
      );

      const amount = parseEther(swapAmount);
      console.log('解析后的数量:', amount.toString());
      
      // 获取当前储备量
      console.log('获取储备量...');
      const reserveData = await liquidityContract.getReserves();
      const reserveA = reserveData[0]; // token储备
      const reserveB = reserveData[1]; // USDC储备
      
      console.log('储备量:', {
        reserveA: reserveA.toString(),
        reserveB: reserveB.toString()
      });
      
      let output;

      if (swapFromToken === 'token') {
        // 从token换到USDC: amountIn=token数量, reserveIn=token储备, reserveOut=USDC储备
        console.log('计算token->USDC输出...');
        output = await liquidityContract.getAmountOut(amount, reserveA, reserveB);
      } else {
        // 从USDC换到token: amountIn=USDC数量, reserveIn=USDC储备, reserveOut=token储备
        console.log('计算USDC->token输出...');
        output = await liquidityContract.getAmountOut(amount, reserveB, reserveA);
      }

      console.log('计算结果:', output.toString());
      setExpectedOutput(formatEther(output));
    } catch (error) {
      console.error('计算预期输出失败 - 详细错误:', error);
      console.error('错误类型:', typeof error);
      console.error('错误消息:', (error as Error)?.message);
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('错误代码:', (error as any).code);
        console.error('错误原因:', (error as any).reason);
      }
      setExpectedOutput('0');
    }
  };

  useEffect(() => {
    fetchDEXInfo();
  }, [provider, account]);

  useEffect(() => {
    calculateExpectedOutput();
  }, [swapAmount, swapFromToken, provider]);

  return (
    <div className="dex-interface">
      <h2>DEX 交易</h2>
      
      {/* DEX 信息概览 */}
      <div className="dex-overview">
        <div className="overview-cards">
          <div className="overview-card">
            <h3>🪙 MDT 余额</h3>
            <div className="card-value">{parseFloat(tokenBalance).toFixed(4)} MDT</div>
          </div>
          <div className="overview-card">
            <h3>💵 USDC 余额</h3>
            <div className="card-value">{parseFloat(usdcBalance).toFixed(4)} USDC</div>
          </div>
          <div className="overview-card">
            <h3>🏊 LP 代币</h3>
            <div className="card-value">{parseFloat(lpBalance).toFixed(4)} LP</div>
          </div>
          <div className="overview-card">
            <h3>💰 MDT 价格</h3>
            <div className="card-value">{parseFloat(price).toFixed(6)} USDC</div>
          </div>
        </div>
        
        <div className="pool-info">
          <h3>流动性池储备</h3>
          <div className="reserves">
            <div className="reserve-item">
              <span>MDT: {parseFloat(reserves.token).toFixed(4)}</span>
            </div>
            <div className="reserve-item">
              <span>USDC: {parseFloat(reserves.usdc).toFixed(4)}</span>
            </div>
          </div>
        </div>
        
        <button className="refresh-button" onClick={fetchDEXInfo}>
          🔄 刷新数据
        </button>
      </div>

      <div className="dex-actions">
        {/* 添加流动性 */}
        <div className="action-section">
          <h3>➕ 添加流动性</h3>
          <p>提供流动性赚取交易手续费</p>
          <div className="form-group">
            <label>MDT 数量:</label>
            <input
              type="number"
              value={addTokenAmount}
              onChange={(e) => setAddTokenAmount(e.target.value)}
              placeholder="输入 MDT 数量 (例: 100)"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>USDC 数量:</label>
            <input
              type="number"
              value={addUsdcAmount}
              onChange={(e) => setAddUsdcAmount(e.target.value)}
              placeholder="输入 USDC 数量 (例: 100)"
              step="0.01"
            />
          </div>
          <button 
            className="action-button add-liquidity-button"
            onClick={handleAddLiquidity}
            disabled={loading || !addTokenAmount || !addUsdcAmount}
          >
            {loading ? '处理中...' : '添加流动性'}
          </button>
        </div>

        {/* 移除流动性 */}
        <div className="action-section">
          <h3>➖ 移除流动性</h3>
          <p>移除流动性并获得代币</p>
          <div className="form-group">
            <label>LP 代币数量:</label>
            <input
              type="number"
              value={removeLpAmount}
              onChange={(e) => setRemoveLpAmount(e.target.value)}
              placeholder="输入 LP 代币数量 (例: 10)"
              step="0.01"
            />
          </div>
          <button 
            className="action-button remove-liquidity-button"
            onClick={handleRemoveLiquidity}
            disabled={loading || !removeLpAmount}
          >
            {loading ? '处理中...' : '移除流动性'}
          </button>
        </div>

        {/* 代币交换 */}
        <div className="action-section">
          <h3>🔄 代币交换</h3>
          <p>在 MDT 和 USDC 之间进行交换</p>
          <div className="form-group">
            <label>交换方向:</label>
            <select 
              value={swapFromToken} 
              onChange={(e) => setSwapFromToken(e.target.value)}
            >
              <option value="MDT">MDT → USDC</option>
              <option value="USDC">USDC → MDT</option>
            </select>
          </div>
          <div className="form-group">
            <label>输入数量:</label>
            <input
              type="number"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              placeholder="输入交换数量 (例: 50)"
              step="0.01"
              min="0"
            />
          </div>
          <div className="expected-output">
            <span>预期获得: {expectedOutput} {swapFromToken === 'MDT' ? 'USDC' : 'MDT'}</span>
          </div>
          <button 
            className="action-button swap-button"
            onClick={handleSwap}
            disabled={loading || !swapAmount}
          >
            {loading ? '处理中...' : '交换'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DEXInterface;