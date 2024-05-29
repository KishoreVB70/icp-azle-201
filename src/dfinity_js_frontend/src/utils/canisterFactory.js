// Used to obtain the canister instance

// ICP stuff
import { HttpAgent, Actor } from "@dfinity/agent";
import { getAuthClient } from "./auth.js"

// Obtain the whole url of the client -> https://localhost80/products
const HOST = window.location.origin;

// IDL -> interface definition language of the canister.
// Similar to creating an interface
export async function createCanisterActor(canisterId, idl) {
    const authClient = await getAuthClient();
    const agent = new HttpAgent({
        host: HOST,
        identity: authClient.getIdentity()
    });
    await agent.fetchRootKey(); // this line is needed for the local env only
    return Actor.createActor(idl, {
        agent,
        canisterId,
    });
}