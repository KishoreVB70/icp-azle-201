// To buy the product, need ot approve spending from buyer to seller
import { approve } from "./icrc2_ledger";

// Create instance of the canister
import { createCanisterActor } from "./canisterFactory";

// Not yet known, IDL is probably the address of some kind
import { idlFactory as marketPlaceIDL } from "../../../declarations/dfinity_js_backend/dfinity_js_backend.did.js";

// The HTTP agent to make requests
import IcHttp from "./ichttp";

// Create instance of the marketplace canister
const marketplaceAgentCanister = await createCanisterActor(process.env.BACKEND_CANISTER_ID, marketPlaceIDL);
const httpClient = new IcHttp(marketplaceAgentCanister);

// Every function in my canistery needs to be implemented here separately

// Obtains data from the app and sends the request through the http client
export async function createProduct(data) {
    return httpClient.POST({path: "/products", data});
}

export async function getAddressFromPrincipal(principalHex) {
    return httpClient.GET({path: `/principal-to-address/${principalHex}`});
}

export async function getProducts() {
    return httpClient.GET({path: "/products"});
}

export async function buyProduct(product) {
    const { id, price } = { ...product };
    // The buying functions must be approved first
    await approve(process.env.BACKEND_CANISTER_ID, price);
    return await httpClient.POST({path: "/orders", data: {productId: id}});
}