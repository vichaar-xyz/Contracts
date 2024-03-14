use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::declare_id;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
    program_error::ProgramError,
    system_instruction,
};

// Using a dummy Program ID for now;
declare_id!("C7zRsz9L1FYfqf6AcFnQGgLHDCp1E5inkfR9xMZFqZsz");

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct NftMetadata {
    pub ipfs_link: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct UserAddresses {
    pub addresses: Vec<Pubkey>,
}

// Program entrypoint
entrypoint!(process_instruction);
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let mint_account = next_account_info(account_info_iter)?;
    let payer_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let user_addresses_account = next_account_info(account_info_iter)?;

    if !user_addresses_account.is_writable {
        return Err(ProgramError::InvalidAccountData);
    }

    // Deserialize the instruction data to NftMetadata
    let ipfs_link = NftMetadata::try_from_slice(instruction_data)?;

    // Determine a fixed size for the NftMetadata storage; adjust as needed
    let metadata_storage_size: usize = 1024; // Example fixed size

    // Calculate the required lamports to make the mint_account rent-exempt for the fixed size
    let rent = Rent::get()?;
    let required_lamports = rent.minimum_balance(metadata_storage_size);

    let create_account_instruction = system_instruction::create_account(
        payer_account.key,
        mint_account.key,
        required_lamports,
        metadata_storage_size as u64,
        program_id,
    );

    solana_program::program::invoke_signed(
        &create_account_instruction,
        &[payer_account.clone(), mint_account.clone(), system_program.clone()],
        &[],
    )?;

    // Serialize and store the IPFS link in the newly created account
    ipfs_link.serialize(&mut *mint_account.data.borrow_mut())?;

    // Attempt to deserialize user addresses, append the new address, and serialize again
    let mut user_addresses: UserAddresses = match UserAddresses::try_from_slice(&user_addresses_account.data.borrow()) {
        Ok(data) => data,
        Err(_) => UserAddresses { addresses: Vec::new() }, // Initialize if not already set up
    };

    if !user_addresses.addresses.contains(payer_account.key) {
        user_addresses.addresses.push(*payer_account.key);
        user_addresses.serialize(&mut *user_addresses_account.data.borrow_mut())?;
    }

    Ok(())
}

