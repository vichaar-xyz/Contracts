const fs = require('fs');
const web3 = require('@solana/web3.js');
const borsh = require('borsh');

// Define the schema for your instruction data
class MintNftInstruction {
  ipfs_link = '';
  constructor(fields) {
    if (fields) {
      this.ipfs_link = fields.ipfs_link;
    }
  }
}

const schema = new Map([
  [MintNftInstruction, { kind: 'struct', fields: [['ipfs_link', 'string']] }],
]);

const PROGRAM_ID = 'h4mYCs4zJaDqCZ3eVBF7kT2fJ4Z2dDqN649X75tMxF2';

// Replace 'path/to/your/keypair.json' with the actual path to your keypair file
const payerKeypairPath = '/usr/local/bin/sol-key2.json';

// Load the payer's keypair
const payerSecretKey = Uint8Array.from(JSON.parse(fs.readFileSync(payerKeypairPath, 'utf-8')));
const payerKeypair = web3.Keypair.fromSecretKey(payerSecretKey);

// Your IPFS link here
const ipfsLink = 'https://ipfs.io/ipfs/QmVbCbGE39kSpgwX33j3s5XiidgFaY8SdE23VBqtbf8rgc/1436222879532.jpg';

const instructionData = new MintNftInstruction({ ipfs_link: ipfsLink });
const serializedData = borsh.serialize(schema, instructionData);
const instructionDataBuffer = Buffer.from(serializedData);

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
  const programId = new web3.PublicKey(PROGRAM_ID);
  const stateAccountPubKey = new web3.PublicKey('HR9bJ3XMR8GHB7XERZUXwuWD9TusaF3qQPUYPRY6iWAJ');

  // Create the instruction to send to your program
  const instruction = new web3.TransactionInstruction({
    keys: [
        { pubkey: payerKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: stateAccountPubKey, isSigner: false, isWritable: true }, // The state account must be writable to update the minter list
    ], // Populate with required accounts for your program
    programId,
    data: instructionDataBuffer, // Your serialized instruction data
  });

  const transaction = new web3.Transaction().add(instruction);

  console.log("Sending transaction...");
  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [payerKeypair], // Signers
  );

  console.log(`Transaction signature: ${signature}`);
}

main().catch(err => {
  console.error(err);
});
