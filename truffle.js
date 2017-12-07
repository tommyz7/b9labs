// const HDWalletProvider = require('truffle-hdwallet-provider');
// const fs = require('fs');

// const mnemonic = process.env.MNEMONIC;

module.exports = {
  migrations_directory: "./migrations",
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 6000000
    },
    // rinkeby: {
    //   provider: new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io'),
    //   network_id: '*',
    //   gas: 4500000,
    //   gasPrice: 25000000000
    // },
  }
};
