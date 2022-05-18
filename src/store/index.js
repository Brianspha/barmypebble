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
  TransactionId,
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
  AccountBalanceQuery,
  Hbar,
  TokenType,
  TokenSupplyType,
  TokenInfoQuery,
  Status,
  TokenUnfreezeTransaction
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
    showAccountDialog: false,
    selectedAccounts: [],
    pairingData: {},
    decodedAccounts: [],
    hashConnect: new HashConnect(),
    saveData: {
      topic: "",
      pairingString: "",
      privateKey: "",
      pairedWalletData: {},
      pairedAccounts: []
    },
    appMetadata: {
      network: "testnetwork",
      name: "BarMyPebble",
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
    createNewTextTileData: async function (context, data) {
      var createdData = await createEntity(data)
      return true
    },
    loadData: async function () {
      console.log("fetching data");
      store.state.dappNFTs = [];
      store.state.isLoading = true;
      var content = await this.dispatch("getTextileData");
      /*   console.log("contentcontentcontentcontentcontent: ",content)
         content.data = [];
         content.leaderboard = [];
         content._id = content.data._id
         await store.dispatch("saveTextileData", content);
          */
      content = content[0]
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
      let data = JSON.stringify(this.state.saveData);

      localStorage.setItem("hashconnectData", data);
    },
    getDataInLocalstorage: function () {
      var data = localStorage.getItem("hashconnectData");
      if (data) {
        return {
          data: JSON.parse(data),
          found: true
        }
      }
      else {
        return {
          data: {},
          found: false
        }
      }
    },
    loadLocalData: function () {
      let foundData = localStorage.getItem("hashconnectData");
      console.log("localDataFound: ", foundData);
      if (foundData) {
        store.state.saveData = JSON.parse(foundData);
        console.log("Found local data", this.state.saveData)
        return true;
      }
      else
        return false;
    },
    clearDataInLocalStorage() {
      localStorage.clear()
    },
    connectHashConnectWallet: async function () {
      try {
        this.state.hashConnect = new HashConnect(true);
        var loadData = await store.dispatch("loadLocalData")
        console.log("loadData: ", loadData)
        if (!loadData) {
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
          await store.dispatch("parsePairingString")
          await store.dispatch("setUpEvents")
          console.log("Connected hashpack")
          console.log("Paring String: ", this.state.saveData.pairingString)
          console.log("Paired Accounts: ", this.state.saveData.pairedAccounts)
          if (this.state.saveData.pairedAccounts.length === 0) {
            this.state.showAccountDialog = true;
          }
          else {
            var saveData = await this.dispatch("getDataInLocalstorage")
            if (saveData.found) {
              this.state.saveData = saveData.data
              this.state.userAddressHedera = this.state.saveData.pairedAccounts[0]
            }
          }
        }
        else {
          console.log("Paring String: ", this.state.saveData.pairingString)
          console.log("Paired Accounts: ", this.state.saveData.pairedAccounts)

          await this.state.hashConnect.init(this.state.appMetadata, this.state.saveData.privateKey);
          await this.state.hashConnect.connect(this.state.saveData.topic, this.state.saveData.pairedWalletData);
          await store.dispatch("parsePairingString")
          await store.dispatch("setUpEvents")
          console.log("Paired hashpack: ")
          if (this.state.saveData.pairedAccounts.length === 0) {
            this.state.showAccountDialog = true;
          }
          else {
            saveData = await this.dispatch("getDataInLocalstorage")
            if (saveData.found) {
              this.state.saveData = saveData.data
              this.state.userAddressHedera = this.state.saveData.pairedAccounts[0]
            }
          }


        }
      } catch (error) {
        console.log("error connecting  hash connect wallet: ", error)
        store.dispatch(
          "errorWithFooterExtension", {
            errorTitle:"Mising Extension",
          message: "Seems like you dont have HashConnect installed please use the below link to download",
          footer: `<a href= https://www.hashpack.app/hashconnect> Download HashPack</a>`
        }
        )
      }
    },
    setUpEvents: async function () {

      this.state.hashConnect.foundExtensionEvent.on((data) => {
        // this.availableExtensions.push(data);
        console.log("Found extension", data);
      })


      // this.hashconnect.additionalAccountResponseEvent.on((data) => {
      //     console.log("Received account info", data);

      //     data.accountIds.forEach(id => {
      //         if(this.saveData.pairedAccounts.indexOf(id) == -1)
      //             this.saveData.pairedAccounts.push(id);
      //     })
      // })

      this.state.hashConnect.pairingEvent.on((data) => {
        console.log("Paired with wallet", data);

        this.state.saveData.pairedWalletData = data.metadata;

        data.accountIds.forEach(id => {
          if (this.state.saveData.pairedAccounts.indexOf(id) == -1)
            this.state.saveData.pairedAccounts.push(id);
        })
        this.state.userAddressHedera = this.state.saveData.pairedAccounts[0]
        store.dispatch("saveDataInLocalstorage");
      });


      this.state.hashConnect.transactionEvent.on((data) => {
        //this will not be common to be used in a dapp
        console.log("transaction event callback: ", data);
      });
    },
    makeBytes: async function (context, transactionDetails) {
      let transactionId = TransactionId.generate(transactionDetails.signingAccountId)
      transactionDetails.transaction.setTransactionId(transactionId);
      transactionDetails.transaction.setNodeAccountIds([new AccountId(3)]);

      await transactionDetails.transaction.freeze();

      let transBytes = transactionDetails.transaction.toBytes();
      console.log("transBytes: ", transBytes)
      return transBytes;
    }
    ,
    mintToken: async function (context, tokenInformation) {
      try {
        console.log("buffer: ", Buffer.from([tokenInformation.information]))
        // Mint new NFT
        let mintTx = await new TokenMintTransaction()
          .setTokenId(process.env.VUE_APP_TOKEN_ID)
          .setMetadata([Buffer.from([tokenInformation.information])])
          .freezeWith(hederaClient)
        //Sign the transaction with the supply key
        let mintTxSign = await mintTx.sign(treasuryKey);

        //Submit the transaction to a Hedera network
        let mintTxSubmit = await mintTxSign.execute(hederaClient);

        //Get the transaction receipt
        let mintRx = await mintTxSubmit.getReceipt(hederaClient);
        console.log(`- Created NFT ${process.env.VUE_APP_TOKEN_ID} with serial: ${mintRx.serials[0].low} \n`);
        let associateTokenTransaction = await new TokenAssociateTransaction()
          .setAccountId(this.state.userAddressHedera)
          .setTokenIds([process.env.VUE_APP_TOKEN_ID])
        console.log("associateTokenTransaction: ", associateTokenTransaction, "process.env.VUE_APP_TOKEN_ID: ", process.env.VUE_APP_TOKEN_ID)
        var associateTransactionBytes = await store.dispatch("makeBytes", {
          transaction: associateTokenTransaction, signingAccountId: this.state.userAddressHedera
        })
        console.log("associateTransactionBytes: ", associateTransactionBytes)
        try {
          var transactionTransferResults = await store.dispatch("sendHashConnectTransaction", {
            transaction: associateTransactionBytes
          })
        }
        catch (error) {
          console.log("error associating token: ", error)
        }
        console.log("transactionTransferResults: ", transactionTransferResults)
        let tokenTransferTx = await new TransferTransaction()
          .addNftTransfer(process.env.VUE_APP_TOKEN_ID, mintRx.serials[0].low, treasuryId, this.state.userAddressHedera)
          .freezeWith(hederaClient)
          .sign(treasuryKey);

        let tokenTransferSubmit = await tokenTransferTx.execute(hederaClient);
        let tokenTransferRx = await tokenTransferSubmit.getReceipt(hederaClient);
        if (tokenTransferRx.status) {
          console.log(`\n- NFT transfer from Treasury: ${tokenTransferRx.status} \n`);
          return {
            success: true,
            tokenId: mintRx.serials[0].low
          }
        }
        else {
          return {
            success: false,
            tokenId: -1
          }
        }

      }
      catch (error) {
        console.log("error minting token: ", error)
        return {
          success: false,
          tokenId: -1
        }
      }
    },
    transferToken: async function (context, tokenInformation) {
      try {
        let associateTokenTransaction = await new TokenAssociateTransaction()
          .setAccountId(tokenInformation.receipientId)
          .setTokenIds([process.env.VUE_APP_TOKEN_ID])
        var transactionBytes = store.dispatch("makeBytes", {
          transaction: associateTokenTransaction, signingAccountId: this.state.userAddressHedera
        })
        var transactionAssociationResults = await store.dispatch("sendHashConnectTransaction", {
          transaction: transactionBytes
        })
        console.log("transactionResults: ", transactionAssociationResults)
        let tokenTransferTx = await new TransferTransaction()
          .addNftTransfer(tokenInformation.tokenId, 1, this.state.userAddressHedera, tokenInformation.receipientId)
        transactionBytes = store.dispatch("makeBytes", {
          transaction: tokenTransferTx, signingAccountId: this.state.userAddressHedera
        })
        var transactionTransferResults = await store.dispatch("sendHashConnectTransaction", {
          transaction: transactionBytes
        })
        console.log("transactionTransferResults: ", transactionTransferResults)
        return true
      }
      catch (error) {
        console.log("error: ", error)
        return false
      }
    },
    connectToExtension: async function () {
      this.state.hashConnect.connectToLocalWallet(this.state.saveData.pairingString);
    },
    approvePairing: async function () {
      await this.HashconnectService.approvePairing(this.state.pairingData.topic, this.state.selectedAccounts, this.state.pairingData);
      this.dialogBelonging.EventsController.close();
    },
    sendHashConnectTransaction: async function (context, transaction) {
      try {
        transaction = {
          topic: this.state.saveData.topic,
          byteArray: transaction.transaction,

          metadata: {
            accountToSign: this.state.userAddressHedera,
            returnTransaction: false
          }
        }
        console.log("transaction: ", transaction.transaction)
        var transactionReponse = await this.state.hashConnect.sendTransaction(this.state.saveData.topic, transaction)
        console.log("sending hashConnect transactionReponse: ", transactionReponse)
        return transactionReponse
      }
      catch (error) {
        console.log("error sending hashConnect transaction: ", error)
        return {}
      }
    },
    clearParing() {
      this.state.saveData.pairedAccounts = []
      this.dispatch("clearDataInLocalStorage")
      window.location.reload()
    },
    parsePairingString: function () {
      this.state.pairingData = this.state.hashConnect.decodePairingString(this.state.saveData.pairingString);
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
          await store.dispatch("connectToExtension")
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
          "errorWithFooterExtension", {
            errorTitle:"Mising Extension",

          message: "Seems like you dont have metamask installed please use the below link to download",
          footer: `<a href= https://metamask.io> Download Metamask</a>`
        }
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
    warningWithFooter(context, message) {
      swal.fire({
        icon: "info",
        title: message.errorTitle,
        text: message.message,
        footer: message.footer,
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
    errorWithFooterExtension(context, message) {
      swal.fire({
        icon: "error",
        title: message.errorTitle,
        text: message.message,
        footer: message.footer,
      }).then((result) => {
        window.location.reload()
      });
    },
  },
});

export default store;
