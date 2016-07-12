# Wallet Creator

This is a very simple NodeJS script to create an Ethereum lightwallet. The script
will ask you three information to proceed:

* Entropy: you should type in some random characters to provide entropy for the
random number generator. This step is VERY important so, please, do provide
some good entropy for the system.

* Filename: the filename to save the wallet.

* Password: password that will be used to encrypt your wallet. BE WARNED: if you
loose/forget this password, your wallet will be useless and you will lost any 
funds on it. Provide a VERY strong password so that others can brute force attack
your wallet.

# Building

Just run

```
npm install
```

and you should be good to go ;)

# Running

Run the script with this command:

```
nodejs createWallet.js
```

Pretty simple, ah?!
