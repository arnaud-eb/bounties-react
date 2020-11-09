const path = require("path");

const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

const infuraURL = "https://rinkeby.infura.io/v3/689a80839dc4495882ff93fc6c94a481";
const provider = new HDWalletProvider(mnemonic, infuraURL);

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    rinkeby: {
      provider: () => provider,
      network_id: "4"
    }
  }
};
