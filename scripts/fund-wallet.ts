import { ethers } from "hardhat";

async function main() {
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("部署者余额:", ethers.utils.formatEther(balance), "ETH");

  // 替换为你的新钱包地址
  const newWalletAddress = "0x98a4ED8a8BCCf75E0c3b8fA8749F4Fb7E8D80018"; // 请将这里替换为你从MetaMask复制的地址
  
  if (newWalletAddress === "YOUR_WALLET_ADDRESS_HERE") {
    console.log("请先在脚本中设置你的新钱包地址！");
    console.log("1. 打开MetaMask");
    console.log("2. 复制你的钱包地址");
    console.log("3. 在脚本第12行替换 '0x你的实际钱包地址'");
    return;
  }
  
  console.log("\n=== 开始为新钱包提供资金 ===");
  
  // 1. 转账ETH（用于gas费）
  console.log("1. 转账 10 ETH 到新钱包...");
  const ethTx = await deployer.sendTransaction({
    to: newWalletAddress,
    value: ethers.utils.parseEther("10")
  });
  await ethTx.wait();
  console.log("✅ ETH转账完成，交易哈希:", ethTx.hash);
  
  // 2. 获取代币合约
  const MyDeFiToken = await ethers.getContractAt("MyDeFiToken", "0x9E545E3C0baAB3E08CdfD552C960A1050f373042");
  const MockUSDC = await ethers.getContractAt("MyDeFiToken", "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8");
  
  // 3. 转账 MyDeFiToken
  console.log("2. 转账 1000 MyDeFiToken 到新钱包...");
  const tokenAmount = ethers.utils.parseEther("1000");
  const tokenTx = await MyDeFiToken.connect(deployer).transfer(newWalletAddress, tokenAmount);
  await tokenTx.wait();
  console.log("✅ MyDeFiToken转账完成，交易哈希:", tokenTx.hash);
  
  // 4. 转账第二个MD代币（用作模拟USDC）
  console.log("3. 转账 1000 MD代币（模拟USDC）到新钱包...");
  const usdcAmount = ethers.utils.parseEther("1000");
  const usdcTx = await MockUSDC.connect(deployer).transfer(newWalletAddress, usdcAmount);
  await usdcTx.wait();
  console.log("✅ MD代币（模拟USDC）转账完成，交易哈希:", usdcTx.hash);
  
  // 5. 检查新钱包余额
  console.log("\n=== 新钱包余额检查 ===");
  const newWalletEthBalance = await ethers.provider.getBalance(newWalletAddress);
  console.log("ETH余额:", ethers.utils.formatEther(newWalletEthBalance));
  
  const tokenBalance = await MyDeFiToken.balanceOf(newWalletAddress);
  console.log("MyDeFiToken余额:", ethers.utils.formatEther(tokenBalance));
  
  const usdcBalance = await MockUSDC.balanceOf(newWalletAddress);
  console.log("MD代币（模拟USDC）余额:", ethers.utils.formatEther(usdcBalance));
  
  console.log("\n🎉 资金转账完成！现在你可以使用新钱包进行测试了。");
  console.log("📝 注意：地址 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 的代币实际上是MD代币，只是在项目中用作模拟USDC。");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });