const Lightwallet = require('eth-lightwallet');
const Promise = require('bluebird');
const Prompt = require('prompt');
const fs = require('fs');
const colors = require('colors/safe');
const Transaction = require('ethereumjs-tx');
const Wallet = require('ethereumjs-wallet');
const Web3 = require('web3');
const web3 = new Web3();
const HookedWeb3Provider = require('hooked-web3-provider');

const HOST = 'https://testnet.infura.io'
//var HOST = 'http://localhost:8545'
var keystore, to, value;
var privkey, address;

var schema = {
    properties: {
        option: {
            description: colors.yellow('Use light wallet file, seed or privkey? [0, 1, 2]'),
            required: true
        }
    }
}

var transferSchema = {
    properties: {
        to: {
            description: colors.yellow('Destination address'),
            required: true
        },
        value: {
            description: colors.yellow('Value (in Ethers)'),
            required: true
        }
    }
}

var schemas = [{
    properties: {
        filename: {
            description: colors.yellow('Your lightwallet filename'),
            required: true
        },
        password: {
            description: colors.yellow('Your lightwallet password'),
            hidden: true,
            required: true
        }
    }}, {
    properties: {
        seed: {
            description: colors.yellow('Your lightwallet seed'),
        }
    }}, {
    properties: {
        privkey: {
            description: colors.yellow('Your privkey'),
        }
    }},
];


const getGasPrice = () => {
  return new Promise((resolve, reject) => {
    Promise.promisify(web3.eth.getGasPrice)()
    .then((gasPrice) => {
      resolve('0x' + gasPrice.toString(16));
    })
    .catch((err) => {
      reject(err);
    })
  });
}

const signTransaction = (tx_params, callback) => {
  getGasPrice()
  .then((gasPrice) => {
    tx_params.gasPrice = gasPrice;
    tx_params.gasLimit = 22000;
    console.log(tx_params, 'tx_params');
    var tx = new Transaction(tx_params);
    tx.sign(privkey);
    var rawTx = tx.serialize().toString('hex');
    callback(null, '0x'+rawTx);
  });
}

var provider = new HookedWeb3Provider({
  host: HOST,
  transaction_signer: {
    hasAddress: (addr, cb) => cb(null, true),
    signTransaction
  }
});
web3.setProvider(provider);

var promptget = Promise.promisify(Prompt.get);
var deriveKey = Promise.promisify(Lightwallet.keystore.deriveKeyFromPassword);
var writeFile = Promise.promisify(fs.writeFile);
var readFile  = Promise.promisify(fs.readFile);

const privkeyFromSerialized = (filename, pwd) => {
    return new Promise((resolve, reject) => {
        readFile(filename)
        .then((serialized) => {
            keystore = Lightwallet.keystore.deserialize(serialized);
            return deriveKey(pwd);
        })
        .then((derivedKey) => {
            var address = keystore.getAddresses()[0];
            var privkey = keystore.exportPrivateKey(address, derivedKey);
            resolve(privkey);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

const privkeyFromSeed = (seed) => {
    return new Promise((resolve, reject) => {
        deriveKey('test').then((derivedKey) => {
            keystore = new Lightwallet.keystore(seed, derivedKey);
            keystore.generateNewAddress(derivedKey, 1);
            var address = keystore.getAddresses()[0];
            var privkey = keystore.exportPrivateKey(address, derivedKey);
            resolve(privkey);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

Prompt.start();
promptget(schema)
.then((result) => {
    return new Promise((resolve, reject) => {
      promptget(schemas[result.option])
      .then((res) => {
          res.option = result.option
          resolve(res);
      })
    });
})
.then((result) => {
    return new Promise((resolve, reject) => {
        promptget(transferSchema)
        .then((res) => {
            for (var n in result) { res[n] = result[n]; }
            resolve(res);
        });
    });
})
.then((result) => {
    to = result.to;
    value = result.value;
    if (result.option == 0) {
        return privkeyFromSerialized(result.filename, result.password);
    } else if (result.option == 1) {
        return privkeyFromSeed(result.seed);
    } else {
        return Promise.resolve(result.privkey);
    }
})
.then((pk) => {
    privkey = new Buffer(pk, 'hex');
    var wallet = Wallet.fromPrivateKey(privkey);
    var from = wallet.getAddress().toString('hex');
    var tx = {
      from,
      value: web3.toWei(value, 'ether'),
      to,
    }
    return Promise.promisify(web3.eth.sendTransaction)(tx);
})
.then((tx) => {
    console.log('Tx sent: ' + tx);
});

