import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import * as dotenv from "dotenv";
import {TransactionConfig} from "web3-core";
import {TransactionReceipt} from "web3-eth";
import {IApproveDataModel} from "../Model/approveDataModel";

//Configuring the directory path to access .env file
dotenv.config();

//Accessing UniswapV3Router contract's ABI
const UniswapV3ERC20ABI = require('../../../../../../abi/Uniswap/V3/UniswapERC20ABI.json');
let receiptPromise: Promise<TransactionReceipt>;

export const ApproveAsync = async(approveDataModel:IApproveDataModel) : Promise<any>=> {

  // Setting up Ethereum blockchain Node through Infura
  const web3 = new Web3(process.env.infuraUrlRinkeby!);

  //Variable for to return
  let encoded_tx: string;

  //Providing Private Key
  const activeAccount = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY!);
  
  // Initialising the Uniswap Erc20 Contract
  const erc20Contract = new web3.eth.Contract(UniswapV3ERC20ABI as AbiItem[], process.env.UniswapV3RinkebyRouterAddress);
  const erc20Asset = new web3.eth.Contract(UniswapV3ERC20ABI as AbiItem[], approveDataModel.TokenIn);

  const currentAllowance = await erc20Asset.methods.allowance(activeAccount.address, process.env.UniswapV3RinkebyRouterAddress).call();
  //console.log("Current Allownace: ",currentAllowance);
  if(currentAllowance>0)
  {
    console.log("Already Approve");
  }else{
    const txCount = await web3.eth.getTransactionCount(activeAccount.address);
    let tx_builder = erc20Contract.methods.approve(process.env.UniswapV3RinkebyRouterAddress, web3.utils.toBN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'));
    //console.log("Return Data",tx_builder);
    encoded_tx = tx_builder.encodeABI();

    // Creating transaction object to pass it through "signTransaction"
    let transactionObject: TransactionConfig = {
      nonce: txCount,
      gas:  4300000, // gas fee needs updating?
      gasPrice: 4200000000,
      data: encoded_tx,
      from: activeAccount.address,
      to: approveDataModel.TokenIn,
    };

  //Returning receipt for "signTransaction"

  receiptPromise = new Promise<TransactionReceipt>((resolve,reject)=>{

    try {

        let receiptObj:TransactionReceipt;
        web3.eth.accounts.signTransaction(transactionObject, activeAccount.privateKey, (error, signedTx) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            web3.eth.sendSignedTransaction(signedTx.rawTransaction!).on('receipt', (receipt) => {
              console.log("Receipt : ",receipt);
              receiptObj=receipt;

                  });
                }
                resolve(receiptObj ?? null);
              });

          } catch (error) {
            reject(error);
            throw(error);
          }

    });

  return receiptPromise;

  }


  
}