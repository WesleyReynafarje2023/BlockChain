const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const EC = require("elliptic").ec, ec = new EC("secp256k1");
const MINT_KEY_PAIR = ec.genKeyPair();
const MINT_PUBLIC_ADDRESS = MINT_KEY_PAIR.getPublic("hex");
const holderKeyPair = ec.genKeyPair();


const { Block, Blockchain, Transaction } = require("./Blockchain.js");

const girlfriendWallet = ec.genKeyPair();

const JeChain = new Blockchain();

// Create a transaction
const transaction = new Transaction(holderKeyPair.getPublic("hex"), girlfriendWallet.getPublic("hex"), 100, 10);
// Sign the transaction
transaction.sign(holderKeyPair);
// Add transaction to pool
JeChain.addTransaction(transaction);
// Mine transaction
JeChain.mineTransactions(holderKeyPair.getPublic("hex"));

// Prints out balance of both address
console.log("Your balance:", JeChain.getBalance(holderKeyPair.getPublic("hex")));
console.log("Your girlfriend's balance:", JeChain.getBalance(girlfriendWallet.getPublic("hex")));