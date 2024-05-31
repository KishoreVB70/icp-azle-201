import { createCanisterActor } from "./canisterFactory";
import { getPrincipalText, isAuthenticated, logout } from "./auth"; 
import { getAddressFromPrincipal } from "./marketplace";
import { idlFactory as ledgerIDL } from "../../../declarations/ledger_canister/ledger_canister.did.js";
 
const LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";

// Obtain the balance of the user
export async function icpBalance() {
    // Check if he is logged in
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        //Isn't it misleading, it should send an error that the user is not authenticated
        // Rather than sending 0 which is very misleading
        return "0";
    }

    // Access the ICP token canister
    // Create canister instance of the ledger canister
    const canister = await getLedgerCanister();
    // Principal of the user
    const principal = await getPrincipalText();
    try {
        const account = await getAddressFromPrincipal(principal);
        const balance = await canister.account_balance_dfx(account);
        return (balance.e8s / BigInt(10 ** 8)).toString();
    } catch(err) {
        if (err.name === 'AgentHTTPResponseError') {
            logout();
        }
    }
}

// Create canister instance of the ledger canister
async function getLedgerCanister() {
    return createCanisterActor(LEDGER_CANISTER_ID, ledgerIDL);
}