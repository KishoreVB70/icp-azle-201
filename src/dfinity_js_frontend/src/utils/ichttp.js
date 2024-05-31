import { logout } from "./auth";

// HTTP client to make request to the ICP canister and obtain responses back
class IcHttp {
    // # is an indication of private fields, these fields can only be accessed within the class
    #agent;
    #decoder;
    #encoder;

    // Only requires the agent as input
    // Agent could be a HTTP client or an API 
    // The agent is from the dfinity package
    constructor(agent) {
        this.#agent = agent;
        this.#decoder = new TextDecoder('utf-8');
        this.#encoder = new TextEncoder();
    }

    async GET(req) {
        return await this.#doRequest(req.path, "GET", req.params);
    }

    async POST(req) {
        return await this.#doRequest(req.path, "POST", req.params, req.data);
    }

    // Internal function of the class
    async #doRequest(path, method, params, data) {
        try {
            const queryParams = new URLSearchParams(params ? params : {});
            const url = params ? `${path}?${queryParams}` : path;
            let response;
            switch (method) {
                // Get method doesn't have a body and headers
                case "GET":
                    // Await the respone from the canister
                    response = await this.#agent.http_request({
                        // The URL would contain the required information
                        url,
                        method,
                        body: [],
                        headers: [],
                        certificate_version: [],
                    });
                    // Returns the result of the request( respone from the canister )
                    return this.#parseResponse(response);
                
                // Other methods have body and header
                case "POST":
                // PUT and DELTE not declared, but still
                case "PUT":
                case "DELETE":
                    // Convert the data into json format
                    const body = data ? this.#encoder.encode(JSON.stringify(data)) : [];
                    response = await this.#agent.http_request_update({
                        url,
                        method,
                        body,
                        // Basic header
                        headers: [['Content-Type', 'application/json; charset=utf-8'], ['Content-Length', `${body.length}`]],
                        certificate_version: [],
                    });
                    return this.#parseResponse(response);
                default:
                    throw new Error(`Unknown method: ${method}`);
            }
        } catch (err) {
            // If response error, then logout the user
            if (err.name === 'AgentHTTPResponseError') {
                logout();
            }
        }
    }

    #parseResponse(response) {
        try {
            // Checks for the status code, hence I need to set all the response to 200 in the canister
            const body = this.#decoder.decode(response.body);

            // If not succesful, throw the error
            if (response.status_code !== 200) {
                throw new Error(body);
            }
            const contentType = response.headers.filter(header => "content-type" === header[0].toLowerCase()).map(header => header[1]);
            
            // if everything is correct
            if (contentType && contentType.length === 1 && contentType[0].toLowerCase() === 'application/json; charset=utf-8') {
                return JSON.parse(body);
            }
            return body;
        } catch (err) {
            throw err;
        }
    }
}
export default IcHttp;