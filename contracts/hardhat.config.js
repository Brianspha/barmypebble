console.clear()
require("dotenv").config();
require("hardhat-hethers");
module.exports = {
  defaultNetwork: 'testnet', 
  solidity: {
    version: "0.6.2",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000
      }
    }
  }, // The selected default network. It has to match the name of one of the configured networks.
  hedera: {
    gasLimit: 600000, // Default gas limit. It is added to every contract transaction, but can be overwritten if required.
    networks: {
      hardhat:{},
      testnet: {      // The name of the network, e.g. mainnet, testnet, previewnet, customNetwork
        accounts: [   // An array of predefined Externally Owned Accounts
          {
            "account": process.env.OPERATOR_ID,
            "privateKey": process.env.OPERATOR_PVKEY
          },
        ]
      },
      previewnet: {
        accounts: [
          {
            "account": process.env.OPERATOR_ID,
            "privateKey": process.env.OPERATOR_PVKEY
          },

        ]
      },

    },
    // Custom networks require additional configuration - for conesensusNodes and mirrorNodeUrl
    // The following is an integration example for the local-hedera package
    customNetwork: {
      consensusNodes: [
        {
          url: '127.0.0.1:50211',
          nodeId: '0.0.3'
        }
      ],
      mirrorNodeUrl: 'http://127.0.0.1:5551',
      chainId: 0,
      accounts: [
        {
          "account": process.env.OPERATOR_ID,
          "privateKey": process.env.OPERATOR_PVKEY
        },
      ]
    }
  }
};