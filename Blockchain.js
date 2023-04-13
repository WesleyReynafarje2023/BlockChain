class Blockchain {
    constructor() {
        // This property will contain all the blocks.
        this.chain = [new Block(Date.now().toString())];
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }
}