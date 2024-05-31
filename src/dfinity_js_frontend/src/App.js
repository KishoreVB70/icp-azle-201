// Core react hooks
import React, { useEffect, useCallback, useState } from "react";

// UI elements
import { Container, Nav } from "react-bootstrap";
import "./App.css";
import coverImg from "./assets/img/sandwich.jpg";

// React component
import Products from "./components/marketplace/Products";
import Wallet from "./components/Wallet";
import { Notification } from "./components/utils/Notifications";
import Cover from "./components/utils/Cover";

// Utils to interact with the ICP blockchain
import { login, logout as destroy } from "./utils/auth";
import { isAuthenticated, getPrincipalText } from "./utils/auth";
import { tokenBalance, tokenSymbol } from "./utils/icrc2_ledger";
import { icpBalance } from "./utils/ledger";
import { getAddressFromPrincipal } from "./utils/marketplace";

const App = function AppWrapper() {
    const [authenticated, setAuthenticated] = useState(false);
    const [principal, setPrincipal] = useState('');
    // Custom token balance
    const [icrcBalance, setICRCBalance] = useState('');
    // ICP token balance
    const [balance, setICPBalance] = useState('');
    const [symbol, setSymbol] = useState('');
    const [address, setAddress] = useState('');

    const getICRCBalance = useCallback(async () => {
        if (authenticated) {
            setICRCBalance(await tokenBalance());
        }
    });

    const getICPBalance = useCallback(async () => {
        if (authenticated) {
            setICPBalance(await icpBalance());
        }
    });

    // Effects to set states
    useEffect(async () => {
        setSymbol(await tokenSymbol());
    }, [setSymbol]);

    useEffect(async () => {
        setAuthenticated(await isAuthenticated());
    }, [setAuthenticated]);

    useEffect(async () => {
        const principal = await getPrincipalText();
        setPrincipal(principal);
    }, [setPrincipal]);

    useEffect(async () => {
        const principal = await getPrincipalText();
        const account = await getAddressFromPrincipal(principal);
        setAddress(account.account);
    }, [setAddress]);

    useEffect(() => {
        getICRCBalance();
    }, [getICRCBalance]);

    useEffect(() => {
        getICPBalance();
    }, [getICPBalance]);

    // Return only if the user is authenticated
    return (
        <>
            <Notification />
            {authenticated ? (
                <Container fluid="md">
                    <Nav className="justify-content-end pt-3 pb-5">
                        <Nav.Item>
                            <Wallet
                                address={address}
                                principal={principal}
                                icpBalance={balance}
                                icrcBalance={icrcBalance}
                                symbol={symbol}
                                isAuthenticated={authenticated}
                                destroy={destroy}
                            />
                        </Nav.Item>
                    </Nav>
                    <main>
                        <Products tokenSymbol={symbol} />
                    </main>
                </Container>
            ) : (
                <Cover name="Street Food" login={login} coverImg={coverImg} />
            )}
        </>
    );
};

export default App;