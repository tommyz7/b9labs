module.exports = function isTxSuccessful(tx, gasUsed) {
    if (typeof tx.receipt.status !== "undefined") {
        // Byzantium
        return tx.receipt.status == 1;
    } else {
        // Pre Byzantium
        return tx.receipt.gasUsed != gasUsed;
    }
}