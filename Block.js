// Get the sha256 hash function.
const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");

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
}