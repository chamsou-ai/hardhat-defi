const { ethers, getNamedAccounts } = require("hardhat")
const { getWeth, AMOUNT } = require("../scripts/getWeth")
async function main() {
    await getWeth()

    const { deployer } = await getNamedAccounts()

    //abi , contract address
    //Lending poo address : 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    const signer = await ethers.provider.getSigner()
    const lendingPool = await getLendingAddress(signer)
    console.log(`LendingPool Address ${lendingPool.target}`)

    //deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    //approve
    await approveErc20(wethTokenAddress, lendingPool.target, AMOUNT, signer)
    console.log("Depositing...")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, signer, 0)
    console.log("Deposited!")
    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, signer)

    const daiPrice = await getDaiPrice()
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / Number(daiPrice))
    console.log(`You can borrow ${amountDaiToBorrow} DAI`)
    const amountDaiToBrrowWei = ethers.parseEther(amountDaiToBorrow.toString())

    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    await borrowDai(daiTokenAddress,lendingPool,amountDaiToBrrowWei,signer)
    await getBorrowUserData(lendingPool, signer)
    await repay(amountDaiToBrrowWei,daiTokenAddress,lendingPool,signer)
    await getBorrowUserData(lendingPool, signer)
}
async function repay(amount , daiAddress,lendingPoll,account){
    await approveErc20(daiAddress,lendingPoll.target,amount,account)
    const repayTx = await lendingPoll.repay(daiAddress,amount,2,account)
    await repayTx.wait(1)
    console.log("Repay!")
}
async function borrowDai(daiAddress, lendingPool, amountDaiToBrrowWei, account) {
    const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBrrowWei, 2, 0, account)
    await borrowTx.wait(1)
    console.log("You've borrowed!")
}
async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4",
    )
    // Reading from a contract need signer || Sending need a signer
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`The DAI/ETH price is ${price.toString()}`)
    return price
}
async function getBorrowUserData(lendingPoll, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPoll.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} worth of ETH deposited.`)
    console.log(`You have ${totalDebtETH} worth of ETH borrowed.`)
    console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`)
    return { availableBorrowsETH, totalDebtETH }
}
async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log("Approved!")
}

async function getLendingAddress(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account,
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPoll = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
    return lendingPoll
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
