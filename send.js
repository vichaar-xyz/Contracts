const solanaWeb3 = require('@solana/web3.js');
const {
    Connection,
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction,
    PublicKey,
    AccountInfo,
    Rent, // Import the Rent class
    Keypair,
    web3,
    TransactionInstruction,
    sendAndConfirmTransaction,
} = require("@solana/web3.js");

async function sendSOL(senderKeypair, receiverPublicKeyString, amountSOL) {
    // Connect to the cluster (Devnet in this example)
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed');

    // The receiver's public key
    const receiverPublicKey = new solanaWeb3.PublicKey(receiverPublicKeyString);

    // Convert SOL amount to lamports (the smallest unit of SOL)
    const lamports = amountSOL * solanaWeb3.LAMPORTS_PER_SOL;

    // Create the instruction to send SOL
    const transferInstruction = solanaWeb3.SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: receiverPublicKey,
        lamports: lamports,
    });

    // Create a transaction and add the transfer instruction
    const transaction = new solanaWeb3.Transaction().add(transferInstruction);

    // Sign the transaction with the sender's keypair
    const signature = await solanaWeb3.sendAndConfirmTransaction(
        connection,
        transaction,
        [senderKeypair], // An array of signers, in this case, only the sender
    );

    console.log('Transaction successful with signature:', signature);
}

// Example usage:

// Sender's Keypair (this should be securely stored and retrieved)
// In this example, we're generating a new one for demonstration purposes,
// but you should use `Keypair.fromSecretKey` with your stored secret key.
const senderKeypair = Keypair.fromSecretKey(Uint8Array.from([106,48,24,143,68,184,245,197,71,170,46,178,87,26,44,141,74,128,50,187,111,15,126,152,235,143,130,119,212,19,120,15,127,164,27,225,254,223,115,53,131,27,55,79,94,120,127,134,95,65,39,105,37,208,225,153,45,151,54,157,24,78,76,74]));

// Receiver's public key as a base58 encoded string
const receiverPublicKeyString = '9cWY5LWjWkkxwm43VzCD6VsnbSpDR1x4ne2KzsYpg351';

// Amount of SOL to send
const amountSOL = 2;

// Sending 2 SOL from sender to receiver
sendSOL(senderKeypair, receiverPublicKeyString, amountSOL).catch(console.error);
