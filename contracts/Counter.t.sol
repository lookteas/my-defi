// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MyDeFiToken.sol";

/**
 * @title MyDeFiTokenTest
 * @dev MyDeFiToken合约的测试合约
 * @notice 用于测试MyDeFiToken合约的各种功能
 */
contract MyDeFiTokenTest {
    /// @dev 被测试的MyDeFiToken合约实例
    MyDeFiToken token;
    /// @dev 测试用的所有者地址
    address owner = address(0x1);
    /// @dev 测试用的普通用户地址
    address user = address(0x2);

    /**
     * @dev 测试设置函数，在每个测试前执行
     * @notice 部署新的MyDeFiToken合约实例
     */
    function setUp() public {
        token = new MyDeFiToken();
    }

    /**
     * @dev 测试初始供应量
     * @notice 验证代币的初始总供应量和所有者余额是否正确
     */
    function testInitialSupply() public view {
        require(token.totalSupply() == 10_000_000 * 10**18, "Initial supply should be 10M");
        require(token.balanceOf(address(this)) == 10_000_000 * 10**18, "Owner should have all tokens");
    }

    /**
     * @dev 测试铸造功能
     * @notice 验证mint函数是否能正确为用户铸造代币
     */
    function testMint() public {
        uint256 mintAmount = 1000 * 10**18;
        token.mint(user, mintAmount);
        require(token.balanceOf(user) == mintAmount, "User should receive minted tokens");
    }

    /**
     * @dev 测试销毁功能
     * @notice 验证burn函数是否能正确销毁代币并减少总供应量
     */
    function testBurn() public {
        uint256 burnAmount = 1000 * 10**18;
        token.burn(burnAmount);
        require(token.totalSupply() == (10_000_000 * 10**18) - burnAmount, "Total supply should decrease");
    }
}
