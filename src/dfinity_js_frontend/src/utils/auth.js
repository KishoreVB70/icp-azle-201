// Allows users to log in and out using the internet identity

import { AuthClient } from "@dfinity/auth-client";

// that is the url of the webapp for the internet identity. 
const IDENTITY_PROVIDER = `http://${process.env.IDENTITY_CANISTER_ID}.${window.location.hostname}:4943`;

// Maximum time of the authentication session in nano seconds -> looks like a week -> 7 * 24
const MAX_TTL = 7 * 24 * 60 * 60 * 1000 * 1000 * 1000;

export async function getAuthClient() {
    return await AuthClient.create();
}

// Obtains the users principal
export async function getPrincipal() {
    const authClient = await getAuthClient();
    return authClient.getIdentity()?.getPrincipal();
}

// Converts principal to a string
export async function getPrincipalText() {
    return (await getPrincipal()).toText();
}

// Checks if the user is authenticated
export async function isAuthenticated() {
    try {
        const authClient = await getAuthClient();
        return await authClient.isAuthenticated();
    } catch (err) {
        logout();
    }
}

// If the user is not authenticated, login to authenticate them
export async function login() {
    const authClient = await getAuthClient();
    const isAuthenticated = await authClient.isAuthenticated();

    if (!isAuthenticated) {
        await authClient?.login({
            identityProvider: IDENTITY_PROVIDER,
            onSuccess: async () => {
                window.location.reload();
            },
            maxTimeToLive: MAX_TTL,
        });
    }
}

// Log the client out, they will become unauthenticated
export async function logout() {
    const authClient = await getAuthClient();
    authClient.logout();
    window.location.reload();
}