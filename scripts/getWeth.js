const { getNamedAccounts, ethers } = require("hardhat")

const AMOUNT = ethers.parseEther("0.02")
async function getWeth() {
    const { deployer } = await getNamedAccounts()
    //0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    const signer = await ethers.provider.getSigner()
    const iweth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        signer,
    )
    const txResponse = await iweth.deposit({
        value: AMOUNT,
    })
    await txResponse.wait(1)
    const wethbalance = await iweth.balanceOf(deployer)
    console.log(`Got ${wethbalance.toString()} WETH`)
}

module.exports = { getWeth ,AMOUNT}
