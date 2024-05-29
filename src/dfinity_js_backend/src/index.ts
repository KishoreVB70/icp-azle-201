
//Generate unique identifier
import { v4 as uuidv4 } from 'uuid';
// Data structures and functions
import { Server, StableBTreeMap, ic, Principal, serialize, Result } from 'azle';
//Web server
import express from 'express';
// Web server -> cross origin resource sharing
import cors from 'cors';
// Convert principal to hex code
import { hexAddressFromPrincipal } from "azle/canisters/ledger";

// Data type 
class Product {
    id: string;
    title: string;
    description: string;
    location: string;
    price: number;
    seller: string;
    attachmentURL: string;
    soldAmount: number
}

class ProductPayload {
    title: string;
    description: string;
    location: string;
    price: number;
    attachmentURL: string
}

enum OrderStatus {
    PaymentPending,
    Completed
}

class Order {
    productId: string;
    price: number;
    status: string;
    seller: string;
}

const productsStorage = StableBTreeMap<string, Product>(0);
const orders = StableBTreeMap<string, Order>(1);

/* 
    Address initialization of the ICRC Ledger canister. The principal text value is hardcoded because 
    we set it in the `dfx.json`
*/
const ICRC_CANISTER_PRINCIPAL = "mxzaz-hqaaa-aaaar-qaada-cai";

// Create express server
export default Server(() => {
    const app = express();
    // Allows to get request from the front end app
    app.use(cors());
    app.use(express.json());

    // Retreival functions
    // All products
    app.get("/products", (_req, res) => {
        res.json(productsStorage.values());
    });

    // Single product
    app.get("/products/:id", (req, res) => {
        const productId = req.params.id;
        const productOpt = productsStorage.get(productId);
        if ("None" in productOpt) {
            res.status(404).send(`the product with id=${productId} not found`);
        } else {
            res.json(productOpt.Some);
        }
    });

    // Retrieve all orders
    app.get("/orders", (_req, res) => {
        res.json(orders.values());
    });

    // Convert principal to hex
    app.get("/principal-to-address/:principalHex", (req, res) => {
        const principal = Principal.fromText(req.params.principalHex);
        res.json({ account: hexAddressFromPrincipal(principal, 0) });
    });

    // Add a product
    app.post("/products", (req, res) => {
        const payload = req.body as ProductPayload;
        const product = { id: uuidv4(), soldAmount: 0, seller: ic.caller().toText(), ...payload };
        productsStorage.insert(product.id, product);
        return res.json(product);
    });

    // Update product
    app.put("/products/:id", (req, res) => {
        const productId = req.params.id;
        const payload = req.body as ProductPayload;
        const productOpt = productsStorage.get(productId);
        if ("None" in productOpt) {
            res.status(400).send(`couldn't update a product with id=${productId}. product not found`);
        } else {
            const product = productOpt.Some;
            const updatedProduct = { ...product, ...payload, updatedAt: getCurrentDate() };
            productsStorage.insert(product.id, updatedProduct);
            res.json(updatedProduct);
        }
    });

    // Remove product from storage
    app.delete("/products/:id", (req, res) => {
        const productId = req.params.id;
        const deletedProductOpt = productsStorage.remove(productId);
        if ("None" in deletedProductOpt) {
            res.status(400).send(`couldn't delete a product with id=${productId}. product not found`);
        } else {
            res.json(deletedProductOpt.Some);
        }
    });

    /*
        Before the order is received, the icrc2_approve is called - that's where we create
        an allowance entry for the canister to make a transfer of an ICRC token on behalf of the sender to the seller of the product.
        Here, we make an allowance transfer by calling icrc2_transfer_from.
    */
    app.post("/orders", async (req, res) => {
        const productOpt = productsStorage.get(req.body.productId);
        if ("None" in productOpt) {
            return res.send(`cannot create the order: product=${req.body.productId} not found`);
        }
        const product = productOpt.Some;

        // Create allowance to transfer ICP from the user
        const allowanceResponse = await allowanceTransfer(product.seller, BigInt(product.price));
        if (allowanceResponse.Err) {
            res.send(allowanceResponse.Err);
            return;
        }

        // Create an order
        const order: Order = {
            productId: product.id,
            price: product.price,
            status: OrderStatus[OrderStatus.Completed],
            seller: product.seller
        };
        orders.insert(uuidv4(), order);
        product.soldAmount += 1;
        productsStorage.insert(product.id, product);
        res.json(order);
    });
    
    return app.listen();
});

function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}

async function allowanceTransfer(to: string, amount: bigint): Promise<Result<any, string>> {
    try {
        const response = await fetch(`icp://${ICRC_CANISTER_PRINCIPAL}/icrc2_transfer_from`, {
            body: serialize({
                candidPath: "/src/icrc1-ledger.did",
                args: [{
                    // for optional values use an empty array notation [] instead of None is they should remain empty
                    spender_subaccount: [],
                    created_at_time: [],
                    memo: [],
                    amount,
                    fee: [],
                    from: { owner: ic.caller(), subaccount: [] },
                    to: { owner: Principal.fromText(to), subaccount: [] }
                }]
            })
        });
        return Result.Ok(response);
    } catch (err) {
        let errorMessage = "an error occurred on approval";
        if (err instanceof Error) {
            errorMessage = err.message;
        }
        return Result.Err(errorMessage);
    }
}
