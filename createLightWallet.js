var Lightwallet = require('eth-lightwallet');
var Promise = require('bluebird');
var Prompt = require('prompt');
var fs = require('fs');
var colors = require('colors/safe');

var schema = {
    properties: {
        entropy: {
            description: colors.yellow('Enter some random characters for entropy'),
            hidden: true,
            required: true,
        },
        walletName: {
            description: colors.yellow('Filename to save your wallet'),
            //validator: /^[a-zA-Z0-9\-]+$/,
            //warning: 'Wallet name must be only letters, numbers or dashes',
            required: true,
        },
        password: {
            description: colors.yellow('Password to encrypt your wallet'),
            hidden: true,
            required: true,
        },
    }
};

var prompt = Promise.promisify(Prompt.get);
var deriveKey  = Promise.promisify(Lightwallet.keystore.deriveKeyFromPassword);
var writeFile = Promise.promisify(fs.writeFile);

var walletName;
var entropy;

Prompt.start();
prompt(schema)
.then((result) => {
    walletName = result.walletName;
    entropy = result.entropy;
    return deriveKey(result.password);
})
.then((pwDerivedKey) => {
    var seed = Lightwallet.keystore.generateRandomSeed(entropy);
    keystore = new Lightwallet.keystore(seed, pwDerivedKey);
    keystore.generateNewAddress(pwDerivedKey, 1);
    var serialized = keystore.serialize();
    console.log('----------------------------------');
    console.log('Wallet seed: ' + keystore.getSeed(pwDerivedKey));
    console.log('Address: ' + keystore.getAddresses()[0]);
    return writeFile('./' + walletName, serialized);
})
.then(() => {
    console.log('File "' + walletName + '" written.');
});
