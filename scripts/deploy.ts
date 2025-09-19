import { ethers } from "hardhat";

async function main() {
  console.log("开始部署 DeFi 合约...");
  
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.utils.formatEther(await deployer.getBalance()));

  // 1. 部署 MyDeFiToken
  console.log("\n1. 部署 MyDeFiToken...");
  const MyDeFiToken = await ethers.getContractFactory("MyDeFiToken");
  const token = await MyDeFiToken.deploy();
  await token.deployed();
  console.log("MyDeFiToken 部署地址:", token.address);

  // 2. 部署 LendingPool
  console.log("\n2. 部署 LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(token.address);
  await lendingPool.deployed();
  console.log("LendingPool 部署地址:", lendingPool.address);

  // 3. 创建一个模拟的 USDC 代币用于流动性池
  console.log("\n3. 部署模拟 USDC 代币...");
  const MockUSDC = await ethers.getContractFactory("MyDeFiToken");
  const usdc = await MockUSDC.deploy();
  await usdc.deployed();
  console.log("Mock USDC 部署地址:", usdc.address);

  // 4. 部署 LiquidityPool (MD/USDC 交易对)
  console.log("\n4. 部署 LiquidityPool (MD/USDC)...");
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(
    token.address,
    usdc.address,
    "MD-USDC LP Token",
    "MD-USDC-LP"
  );
  await liquidityPool.deployed();
  console.log("LiquidityPool 部署地址:", liquidityPool.address);

  // 5. 部署 YieldFarm
  console.log("\n5. 部署 YieldFarm...");
  const YieldFarm = await ethers.getContractFactory("YieldFarm");
  const rewardPerSecond = ethers.utils.parseEther("1"); // 每秒 1 MD 奖励
  const startTime = Math.floor(Date.now() / 1000) + 60; // 1分钟后开始
  const yieldFarm = await YieldFarm.deploy(token.address, rewardPerSecond, startTime);
  await yieldFarm.deployed();
  console.log("YieldFarm 部署地址:", yieldFarm.address);

  // 6. 配置 YieldFarm 池子
  console.log("\n6. 配置 YieldFarm 池子...");
  await yieldFarm.addPool(100, liquidityPool.address); // 100 分配点给 LP 代币池
  console.log("已添加 LP 代币池到 YieldFarm");

  // 7. 为 YieldFarm 提供奖励代币
  console.log("\n7. 为 YieldFarm 提供奖励代币...");
  const rewardAmount = ethers.utils.parseEther("1000000"); // 100万 MD 作为奖励
  await token.transfer(yieldFarm.address, rewardAmount);
  console.log("已转移", ethers.utils.formatEther(rewardAmount), "MD 到 YieldFarm");

  // 输出所有合约地址
  console.log("\n=== 部署完成 ===");
  console.log("MyDeFiToken:", token.address);
  console.log("Mock USDC:", usdc.address);
  console.log("LendingPool:", lendingPool.address);
  console.log("LiquidityPool:", liquidityPool.address);
  console.log("YieldFarm:", yieldFarm.address);

  // 保存地址到文件
  const addresses = {
    MyDeFiToken: token.address,
    MockUSDC: usdc.address,
    LendingPool: lendingPool.address,
    LiquidityPool: liquidityPool.address,
    YieldFarm: yieldFarm.address,
    deployer: deployer.address,
    network: await ethers.provider.getNetwork(),
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\n合约地址已保存到 deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });