use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    program_error::ProgramError,
    msg,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct MintNftInstruction {
    pub ipfs_link: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct NftRecord {
    pub minter: Pubkey,
    pub ipfs_link: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct NftMintingRecords {
    pub records: Vec<NftRecord>,
}

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Mint NFT instruction called");

    let accounts_iter = &mut accounts.iter();
    let minter_account = next_account_info(accounts_iter)?;
    let state_account = next_account_info(accounts_iter)?;

    let instruction: MintNftInstruction = MintNftInstruction::try_from_slice(instruction_data)?;
    msg!("IPFS Link: {}", instruction.ipfs_link);

    let mut minting_records: NftMintingRecords = match NftMintingRecords::try_from_slice(&state_account.data.borrow()) {
        Ok(data) => {
            msg!("Successfully deserialized NftMintingRecords.");
            data
        },
        Err(_) => {
            msg!("Failed to deserialize NftMintingRecords or account is empty, initializing new.");
            NftMintingRecords::default()
        }
    };

    // Create a new NFT record for the current minting operation
    let new_record = NftRecord {
        minter: *minter_account.key,
        ipfs_link: instruction.ipfs_link.clone(),
    };
    minting_records.records.push(new_record);

    let serialized_data = match minting_records.try_to_vec() {
        Ok(data) => data,
        Err(e) => {
            msg!("Failed to serialize NftMintingRecords: {:?}", e);
            return Err(ProgramError::from(e));
        }
    };

    if serialized_data.len() > state_account.data.borrow().len() {
        msg!("Error: Serialized data size exceeds the account's allocated space.");
        return Err(ProgramError::AccountDataTooSmall);
    }

    let mut data = state_account.data.borrow_mut();
    if serialized_data.len() > data.len() {
        msg!("Error: Serialized data size exceeds the account's allocated space.");
        return Err(ProgramError::AccountDataTooSmall);
    }

    // Safely copy serialized data into the state account
    for (i, byte) in serialized_data.iter().enumerate() {
        data[i] = *byte;
    }

    msg!("NftMintingRecords successfully saved to state account.");

    Ok(())
}
