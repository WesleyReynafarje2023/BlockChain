// Get the sha256 hash function.
const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const EC = require("elliptic").ec, ec = new EC("secp256k1");

const MINT_KEY_PAIR = ec.genKeyPair();
const MINT_PUBLIC_ADDRESS = MINT_KEY_PAIR.getPublic("hex");

const holderKeyPair = ec.genKeyPair();

class Block {
    constructor(timestamp = "", data = []) {
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.getHash();
        this.prevHash = ""; // previous block's hash
    }

    // Our hash function.
    getHash() {
        return SHA256(this.prevHash + this.timestamp + JSON.stringify(this.data));
    }

    mine(difficulty) {
        // Basically, it loops until our hash starts with 
        // the string 0...000 with length of <difficulty>.
        while (!this.hash.startsWith(Array(difficulty + 1).join("0"))) {
            // We increases our nonce so that we can get a whole different hash.
            this.nonce++;
            // Update our new hash with the new nonce value.
            this.hash = this.getHash();
        }
    }

    hasValidTransactions(chain) {
        let gas = 0, reward = 0;

        this.data.forEach(transaction => {
            if (transaction.from !== MINT_PUBLIC_ADDRESS) {
                gas += transaction.gas;
            } else {
                reward = transaction.amount;
            }
        });

        return (
            reward - gas === chain.reward &&
            this.data.every(transaction => transaction.isValid(transaction, chain)) && 
            this.data.filter(transaction => transaction.from === MINT_PUBLIC_ADDRESS).length === 1
        );
    }
}

class Blockchain {

    constructor() {
        // This property will contain all the blocks.

        this.chain = [new Block(Date.now().toString())];
        this.difficulty = 1;
        this.transactions = [];
        this.reward = 297;
        
        // We will release 100000 coin
        const initalCoinRelease = new Transaction(MINT_PUBLIC_ADDRESS, holderKeyPair.getPublic("hex"), 100000);
        this.chain = [new Block(Date.now().toString(), [initalCoinRelease])];
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(block) {
        block.prevHash = this.getLastBlock().hash;
        block.hash = block.getHash();
        block.mine(this.difficulty);
        this.chain.push(Object.freeze(block));
    }

    isValid(blockchain = this) {
        // Iterate over the chain, we need to set i to 1 because there are nothing before the genesis block, so we start at the second block.
        for (let i = 1; i < blockchain.chain.length; i++) {
            const currentBlock = blockchain.chain[i];
            const prevBlock = blockchain.chain[i-1];

            // Check validation
            if (
                currentBlock.hash !== currentBlock.getHash() || 
                prevBlock.hash !== currentBlock.prevHash || 
                !currentBlock.hasValidTransactions(blockchain)
            ) {
                return false;
            }
        }

        return true;
    }

    addTransaction(transaction) {
        if (transaction.isValid(transaction, this)) {
            this.transactions.push(transaction);
        }
    }

    mineTransactions() {
        this.addBlock(new Block(Date.now().toString(), this.transactions));

        this.transactions = [];
    }

    mineTransactions(rewardAddress) {
        let gas = 0;

        this.transactions.forEach(transaction => {
            gas += transaction.gas;
        });

        const rewardTransaction = new Transaction(MINT_PUBLIC_ADDRESS, rewardAddress, this.reward + gas);
        rewardTransaction.sign(MINT_KEY_PAIR);

        // Prevent people from minting coins and mine the minting transaction.
        if (this.transactions.length !== 0) this.addBlock(new Block(Date.now().toString(), [rewardTransaction, ...this.transactions]));

        this.transactions = [];
    }

    sign(keyPair) {
        // Check if the public key matches the "from" address of the transaction
        if (keyPair.getPublic("hex") === this.from) {
            // Sign the transaction
            this.signature = keyPair.sign(SHA256(this.from + this.to + this.amount), "base64").toDER("hex");
        }
    }

    getBalance(address) {
        let balance = 0;

        this.chain.forEach(block => {
            block.data.forEach(transaction => {
                if (transaction.from === address) {
                    balance -= transaction.amount;
                    balance -= transaction.gas
                }

                if (transaction.to === address) {
                    balance += transaction.amount;
                }
            })
        });

        return balance;
    }


}

class Transaction {
    // Gas will be set to 0 because we are making it optional
    constructor(from, to, amount, gas = 0) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.gas = gas;
    }

    sign(keyPair) {
        if (keyPair.getPublic("hex") === this.from) {
            // Add gas
            this.signature = keyPair.sign(SHA256(this.from + this.to + this.amount + this.gas), "base64").toDER("hex");
        }
    }

    isValid(tx, chain) {
        return (
            tx.from &&
            tx.to &&
            tx.amount &&
            // Add gas
            (chain.getBalance(tx.from) >= tx.amount + tx.gas || tx.from === MINT_PUBLIC_ADDRESS) &&
            ec.keyFromPublic(tx.from, "hex").verify(SHA256(tx.from + tx.to + tx.amount + tx.gas), tx.signature)
        );
    }
}

const WesChain = new Blockchain();

module.exports = { Block, Blockchain, WesChain, Transaction };
