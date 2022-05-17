import Vue from "vue";
import Vuex from "vuex";
import swal from "sweetalert2";
import createPersistedState from "vuex-persistedstate";
import { SkynetClient, genKeyPairFromSeed } from "skynet-js";
import detectEthereumProvider from "@metamask/detect-provider";
import Web3 from 'web3'
import { HashConnect, HashConnectTypes } from 'hashconnect';


require("dotenv").config();


const {
  TransferTransaction,
  TokenAssociateTransaction,
  TokenMintTransaction,
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  TokenUpdateTransaction,
  ContractExecuteTransaction,
  TokenInfoQuery,
  AccountBalanceQuery,
  Hbar,
  TokenType,
  TokenSupplyType,
} = require("@hashgraph/sdk");
import {
  createNewClient,
  getAllPebbles,
  getThread,
  updatePebble,
  createEntity,
  setup
} from "../textile/textile"
const bigNumber = require("bignumber.js");
const { publicKey, privateKey } = genKeyPairFromSeed(
  process.env.VUE_APP_APP_SECRET
);
Vue.use(Vuex);
const ApolloClient = require("apollo-client").ApolloClient;
const createHttpLink = require("apollo-link-http").createHttpLink;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;
const crossFetch = require("cross-fetch").default;
const skyClient = new SkynetClient("https://siasky.net/");
const operatorId = AccountId.fromString(process.env.VUE_APP_OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.VUE_APP_OPERATOR_PVKEY);
const treasuryId = AccountId.fromString(process.env.VUE_APP_TREASURY_ID);
const treasuryKey = PrivateKey.fromString(process.env.VUE_APP_TREASURY_PVKEY);
const aliceId = AccountId.fromString(process.env.VUE_APP_ALICE_ID);
const aliceKey = PrivateKey.fromString(process.env.VUE_APP_ALICE_PVKEY);
const hederaClient = Client.forTestnet().setOperator(operatorId, operatorKey)
  .setMirrorNetwork("hcs.testnet.mirrornode.hedera.com:5600");

/* eslint-disable no-new */
const store = new Vuex.Store({
  state: {
    hashConnect: new HashConnect(),
    saveData: {
      topic: "",
      pairingString: "",
      privateKey: "",
      pairedWalletData: {},
      pairedAccounts: []
    },
    appMetadata: {
      name: "dApp Example",
      description: "An example hedera dApp",
      icon: "https://absolute.url/to/icon.png"
    },
    //sampleLocationData: require("../data/location.json"),
    showMyLocationsOnly: false,
    totalStaked: 0,
    loadinZIndex: 500,
    mintNFTDialog: false,
    testIMEI: process.env.VUE_APP_DEVICE_IMEI,
    userData: {
      imeis: [],
      data: [],
    },
    graphClient: new ApolloClient({
      link: createHttpLink({
        uri: process.env.VUE_APP_TRUSTREAM_SUBGRAPH,
        fetch: crossFetch,
        cache: new InMemoryCache(),
      }),
      cache: new InMemoryCache(),
    }),
    true_stream_sub_graph: process.env.VUE_APP_TRUSTREAM_SUBGRAPH,
    appSecret: process.env.VUE_APP_APP_SECRET,
    skyClient: skyClient,
    privateKey: privateKey,
    publicKey: publicKey,
    etherConverter: require("ether-converter"),
    utils: require("web3-utils"),
    showNFTDetailsDialog: false,
    selectedDataPoint: {},
    data: [],
    isLoading: false,
    userAddressHedera: "",
    userAddressEth: "",
    primaryColor: "green darken-1",
    secondaryColor: "#699c79",
    selectedNFT: {},
    streamId: process.env.VUE_APP_CEREMIC_SECRET,
    tile: {},
    dappNFTs: [],
    deviceDetailsDialog: false,
    selectedDevice: {},
    revision: 1,
    connected: false,
    allDAppNFTs: [],
    deviceData: [],
  },
  plugins: [createPersistedState()],
  modules: {},
  actions: {
    getUserDevices: async function () {
      store.state.isLoading = true;
      const axios = require("axios").default;
      var data = JSON.stringify({
        operationName: "getDevices",
        variables: {},
        query: `query getDevices {\n  pebble_device(limit: 10, where: {owner: {_eq: "${store.state.userAddressEth}"}}) {\n    id\n    owner\n  }\n}\n`,
      });
      axios({
        method: "post",
        url: process.env.VUE_APP_APP_GRAPHQL_URL_DEV,
        data: data,
      })
        .then(async (devices) => {
          console.log("devices: ", devices);
          if (
            Object.prototype.hasOwnProperty.call(devices.data, "error") ||
            devices.data.data.pebble_device.length === 0
          ) {
            console.log("no devices found for this user");
            //  this.$store.state.userData.imeis=["100000000000225", "100000000000211"]
          } else {
            console.log("found user device: ", devices.data.data.pebble_device);
            store.state.userData.imeis = devices.data.data.pebble_device.map(
              (device) => {
                return device.id;
              }
            );
          }
        })
        .catch((error) => {
          console.log("error getting user registred devices: ", error);
          store.state.isLoading = false;
        });
    },
    getTextileData: async function () {
      var pebbles = await getAllPebbles()
      return pebbles
    },
    saveTextileData: async function (context, data) {
      console.log("saving textile data: ", data);
      await updatePebble([data])
    },
    loadData: async function () {
      console.log("fetching data");
      store.state.dappNFTs = [];
      store.state.isLoading = true;
      var content = await store.dispatch("getTextileData");
      /*   console.log("contentcontentcontentcontentcontent: ",content)
         content.data = [];
         content.leaderboard = [];
         content._id = content.data._id
         await store.dispatch("saveTextileData", content);
          */
      console.log("foundData: ", content.data);
      for (var index in content.data) {
        var data = content.data[index];
        if (
          data.userAddressEth.toUpperCase() ===
          store.state.userAddressEth.toUpperCase()
        ) {
          store.state.userData = data;
        }
        data.data.map((nft) => {
          nft.nfts.map((minted) => {
            console.log("dappNFTs: ", minted);
            store.state.dappNFTs.push(minted);
          });
        });
      }


      /*  if (store.state.dappNFTs.length === 0) {
        store.dispatch("warning", {
          warning: "Seems like arent any listed IONFTs",
          onTap: function() {},
        });
      }*/
      console.log("dappNFTs: ", store.state.dappNFTs);
      store.state.deviceData = store.state.dappNFTs;
      store.state.allDAppNFTs = store.state.dappNFTs;
      store.state.isLoading = false;
    },
    getSkyData: async function () {
      var test = await this.state.skyClient.db.getJSON(
        this.state.publicKey,
        this.state.appSecret
      );
      if (test.data === null) {
        test = {
          data: [],
          leaderboard: [],
        };
      }
      return test;
    },
    saveSkyData: async function (context, data) {
      const results = await skyClient.db.setJSON(
        this.state.privateKey,
        this.state.appSecret,
        data
      );
    },
    saveDataInLocalstorage: function () {
      let data = JSON.stringify(saveData);

      localStorage.setItem("hashconnectData", data);
    },
    loadLocalData: function () {
      let foundData = localStorage.getItem("hashconnectData");
      console.log("localDataFound: ", foundData);
      if (foundData) {
        store.state.saveData = JSON.parse(foundData);
        console.log("Found local data", saveData)
        return true;
      }
      else
        return false;
    },
    connectHashConnectWallet: async function () {
      this.state.hashConnect = new HashConnect(true);
      var loadData= await store.dispatch("loadLocalData")
      console.log("loadData: ",loadData)
      if (!loadData ) {
        console.log("not found data")
        //first init, store the private key in localstorage
        let initData = await this.state.hashConnect.init(this.state.appMetadata);
        this.state.saveData.privateKey = initData.privKey;
        //then connect, storing the new topic in localstorage
        const state = await this.state.hashConnect.connect();
        console.log("Received state", state);
        this.state.saveData.topic = state.topic;
        //generate a pairing string, which you can display and generate a QR code from
        this.state.saveData.pairingString = this.state.hashConnect.generatePairingString(state, "testnet", true);
        //find any supported local wallets
        this.state.hashConnect.findLocalWallets();
        console.log("Connected hashpack")
        store.dispatch("success", "HashPack Connected")
      }
      else {
        await this.state.hashConnect.init(this.state.appMetadata, this.state.saveData.privateKey);
        await this.state.hashConnect.connect(this.state.saveData.topic, this.state.saveData.pairedWalletData);
        console.log("Paired hashpack: ", this)
        store.dispatch("success",  "HashPack Paired")


      }
    },
    makeBytes: async function (context, transactionDetails) {
      let transactionId = TransactionId.generate(transactionDetails.signingAccountId)
      transactionDetails.transaction.setTransactionId(transactionDetails.transactionId);
      transactionDetails.transaction.setNodeAccountIds([new AccountId(3)]);

      await transactionDetails.transaction.freeze();

      let transBytes = transactionDetails.transaction.toBytes();

      return transBytes;
    }
    ,
    mintToken: async function (context, tokenInformation) {
      try {
        // Mint new NFT
        let mintTx = await new TokenMintTransaction()
          .setTokenId(process.env.VUE_APP_TOKEN_ID)
          .setMetadata([Buffer.from(tokenInformation.information)])
        var transactionBytes = store.dispatch("makeBytes", {
          transaction: transaction, signingAccountId:this.state.userAddressHedera
        })
          var transactionResults = await store.state.dispatch("sendHashConnectTransaction",{
            transaction:transactionBytes
          })
        //Log the serial number
        console.log(`- Results of sending transaction: ${transactionResults} \n`);

      }
      catch (error) {
        console.log("error: ", error)
      }
    },
    transferToken: async function (context, tokenInformation) {
      try {
        let associateTokenTransaction = await new TokenAssociateTransaction()
        .setAccountId(tokenInformation.receipientId)
        .setTokenIds([process.env.VUE_APP_TOKEN_ID])
        var transactionBytes = store.dispatch("makeBytes", {
          transaction: associateTokenTransaction, signingAccountId:this.state.userAddressHedera
        })
          var transactionResults = await store.state.dispatch("sendHashConnectTransaction",{
            transaction:transactionBytes
          })
      }
      catch (error) {
        console.log("error: ", error)
      }
    },
    sendHashConnectTransaction: async function (context, transaction) {
      try {
        var transactionReponse = await this.hashconnect.sendTransaction(store.state.saveData.topic, transaction.transaction)
        console.log("transactionReponse: ", transactionReponse)
        return transactionReponse
      }
      catch (error) {
        console.log("error: ", error)
        return {}
      }
    },
    connectWallet: async function () {
      store.state.isLoading = true;
      const provider = await detectEthereumProvider();
      console.log("provider: ", provider);
      if (provider) {
        try {
          var web3Instance = new Web3(window.web3.currentProvider);
          window.web3 = web3Instance;
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          console.log("window.web3.eth.getDefaultAccount: ", web3Instance);
          window.web3.eth.defaultAccount = accounts[0];
          store.state.userAddressEth = window.web3.eth.defaultAccount;
          store.state.isConnected = true;
          console.log("found default account: ", store.state.userAddressEth);
          store.state.isLoading = false;
          store.state.connected = true;
          await store.dispatch("connectHashConnectWallet")
          await store.dispatch("getUserDevices");
        } catch (error) {
          console.log("error connectin wallet: ", error);
          store.state.isLoading = false;
          store.dispatch("error", {
            error: "There was an error enabling metamask",
          });
        }
      } else {
        store.state.isLoading = false;
        store.dispatch(
          "errorWithFooterMetamask",
          "Seems like you dont have metamask installed please use the below link to download"
        );
      }
    },
    success(context, message) {
      swal.fire({
        position: "top-end",
        icon: "success",
        title: "Success",
        showConfirmButton: true,
        timer: 25000,
        text: message,
      });
    },
    warning(context, message) {
      swal.fire({
        icon: "info",
        title: "Info",
        text: message.warning,
        denyButtonText: `Close`,
      });
    },
    error(context, message) {
      swal.fire("Error!", message.error, "error").then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
        }
      });
    },
    successWithFooter(context, message) {
      swal.fire({
        icon: "success",
        title: "Success",
        text: message.message,
        footer: `<a href= https://testnet.iotexscan.io/tx/${message.txHash}> View on iotex Explorer</a>`,
      });
    },
    errorWithFooterMetamask(context, message) {
      swal.fire({
        icon: "error",
        title: "Error!",
        text: message,
        footer: `<a href= https://metamask.io> Download Metamask</a>`,
      });
    },
  },
});

export default store;
