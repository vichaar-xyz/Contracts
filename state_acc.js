const web3 = require('@solana/web3.js');

async function createStateAccount() {
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');

    // Use your wallet to pay for the transaction
    const payer = web3.Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(require('fs').readFileSync('/usr/local/bin/sol-key.json', 'utf-8')))
    );

    console.log(`payer: ${payer.publicKey}`);


    // Generate a new keypair for the state account
    const stateAccount = web3.Keypair.generate();

    const rentExemption = await connection.getMinimumBalanceForRentExemption(50000); // 10000 bytes of space

    const transaction = new web3.Transaction().add(
        // Create account and transfer lamports to cover its rent exemption
        web3.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: stateAccount.publicKey,
            lamports: rentExemption,
            space: 50000, // Allocate space for data
            programId: new web3.PublicKey("h4mYCs4zJaDqCZ3eVBF7kT2fJ4Z2dDqN649X75tMxF2"), // Your program's ID
        })
    );

    const confirmation = await web3.sendAndConfirmTransaction(connection, transaction, [payer, stateAccount]);
    console.log("State account created with public key:", stateAccount.publicKey.toString());
    console.log("Transaction confirmation:", confirmation);
}

createStateAccount().catch(console.error);
