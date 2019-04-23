const axios = require('axios');
const querystring = require('querystring');

class paypalConnectionWithAxios {
    constructor() {
        this.base_url = "https://api.sandbox.paypal.com";
        const client_id = "AVX_6t8YvMshTubbzstnkRzmht_t36OZebb3YsMonTjPTORyx87SdEWgyI10k3y6WGLdJpW1UkuxDwFW";
        const secret_key = "EOLQBtCw_PkNFjPISk3SHCaTqCWJpX7RWVwZzD2Z65NBSXvV4-nSfAqAyJ0fidShOf6WcmF4I5tQYeD1";
        const auth = client_id + ":" + secret_key;
        this.authb = "Basic " + new Buffer(auth).toString("base64");

        this.return_url = "https://example.com/returnUrl";
        this.cancel_url = "https://example.com/cancelUrl";
        this.auth_token = "A21AAHIqN1muuteQ4C67B79xp_29o9wkwHEUYw9sgeZ8B9IlomW3FTyvC5lDfuyRWCevkaJOoy5fdTTX1Ib6S4gg8ljQXLdwA";
        this.auth_expiry_time = null;
        this.product_id = "PROD-1G352723XU284602E";
        this.product_subs_id = "P-6W897267CT6065421LS7N2AA";
    }

    getUniqueRequestID(prefix_id) {
        var today = new Date();
        var date = today.getFullYear() + (today.getMonth() + 1) + today.getDate();

        return prefix_id + "-" + date + "-" + today.getTime();
    }

    handleError(fn, error) {
        console.log(fn + " error")
        console.log(error['code'])
        console.log(error['response'].status)
        console.log(error['response'].data)
        for (const key in error) {
            if (error.hasOwnProperty(key)) {
                const element = error[key];
                console.log(key)
            }
        }
    }

    async getAuthencticationToken() {
        if (Date() < this.auth_expiry_time) {
            return this.auth_token;
        }

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Accept-Language": "en_US",
            "Authorization": this.authb
        }

        const data = {
            "grant_type": "client_credentials"
        }
        const url = this.base_url + "/v1/oauth2/token";

        let access_token = null;
        try {
            const result = await axios.post(url, querystring.stringify(data), {
                headers: headers
            });

            if (result['status'] === 200) {
                const res_data = result['data'];
                access_token = res_data["access_token"];
                this.auth_token = access_token;
                this.auth_expiry_time = Date() + res_data["expires_in"];
                return access_token;
            } else {
                console.log("doAuthencticationToken response is not 200 : ", result['status']);
                console.log(result['data']);

                return access_token;
            }

        } catch (error) {
            handleError("getAuthencticationToken", error);
            return null;
        }
    }

    async getProductID(p_auth, product_info) {
        if (this.product_id) {
            return this.product_id;
        }

        const pp_request_id = this.getUniqueRequestID("PROD");

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Accept-Language": "en_US",
            "PayPal-Request-Id": pp_request_id,
            "Authorization": "Bearer " + p_auth
        }

        const url = this.base_url + "/v1/catalogs/products";

        let product_id = null;
        try {
            const result = await axios.post(url, product_info, {
                headers: headers
            });

            if (result['status'] === 201) {
                const res_data = result['data'];
                product_id = res_data["id"];
                this.product_id = product_id;
                return product_id;
            } else {
                console.log("getProductID response is not 201 : ", result['status']);
                console.log(result['data']);

                return product_id;
            }

        } catch (error) {
            handleError("getProductID", error);
            return null;
        }
    }

    async getProductSubscriptionID(p_auth, product_id, subsciption_info) {
        if (this.product_subs_id) {
            return this.product_subs_id;
        }

        const pp_request_id = this.getUniqueRequestID("PLAN");

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Accept-Language": "en_US",
            "Authorization": "Bearer " + p_auth,
            "PayPal-Request-Id": pp_request_id,
            "Prefer": "return=representation",
        }

        const data = {
            "product_id": product_id,
            "name": subsciption_info["p_name"],
            "description": subsciption_info["p_desc"],
            "billing_cycles": [{
                "frequency": {
                    "interval_unit": "MONTH",
                    "interval_count": 1
                },
                "tenure_type": "REGULAR",
                "sequence": 1,
                "total_cycles": subsciption_info["total_cycles"],
                "pricing_scheme": {
                    "fixed_price": {
                        "value": subsciption_info["p_amount"],
                        "currency_code": "USD"
                    }
                }
            }],
            "payment_preferences": {
                "auto_bill_outstanding": true,
                "setup_fee": {
                    "value": "0",
                    "currency_code": "USD"
                },
                "setup_fee_failure_action": "CONTINUE",
                "payment_failure_threshold": 3
            },
            "taxes": {
                "percentage": "18",
                "inclusive": true
            }
        }
        const url = this.base_url + "/v1/billing/plans";

        let product_subs_id = null;
        try {
            const result = await axios.post(url, data, {
                headers: headers
            });

            if (result['status'] === 201) {
                const res_data = result['data'];
                product_subs_id = res_data["id"];
                this.product_subs_id = product_subs_id;
                return product_subs_id;
            } else {
                console.log("getProductSubscriptionID response is not 201 : ", result['status']);
                console.log(result['data']);

                return product_subs_id;
            }

        } catch (error) {
            handleError("getProductSubscriptionID", error);
            return null;
        }
    }

    async getSubscriptionPlanURL(p_auth, pp_plan_id, user_info) {
        const pp_request_id = this.getUniqueRequestID("SUBSCRIPTION");
        let p_current_time = new Date();
        p_current_time.setTime(p_current_time.getTime() + (1 * 60 * 60 * 1000))
        const p_time = p_current_time.toISOString();

        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Language": "en_US",
            "Prefer": "return=representation",
            "PayPal-Request-Id": pp_request_id,
            "Authorization": "Bearer " + p_auth
        }

        const data = {
            "plan_id": pp_plan_id,
            "start_time": p_time,
            "subscriber": {
                "name": {
                    "given_name": user_info['given_name'],
                    "surname": user_info['sur_name']
                },
                "email_address": user_info['email'],
            },
            "auto_renewal": true,
            "application_context": {
                "brand_name": "example",
                "locale": "en-US",
                "shipping_preference": "SET_PROVIDED_ADDRESS",
                "user_action": "SUBSCRIBE_NOW",
                "payment_method": {
                    "payer_selected": "PAYPAL",
                    "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
                },
                "return_url": this.return_url,
                "cancel_url": this.cancel_url
            }
        }
        const url = this.base_url + "/v1/billing/subscriptions";

        let product_subs_id = null;
        try {
            const result = await axios.post(url, data, {
                headers: headers
            });

            if (result['status'] === 201) {
                const res_data = result['data'];
                const urls = res_data['links'];
                for (const url of urls) {
                    if (url.rel === 'approve') {
                        product_subs_id = url.href;
                    }
                }

                return product_subs_id;
            } else {
                console.log("getSubscriptionPlanURL response is not 201 : ", result['status']);
                console.log(result['data']);

                return product_subs_id;
            }

        } catch (error) {
            handleError("getSubscriptionPlanURL", error);
            return null;
        }
    }


    async doPaymentJob() {
        try {
            const auth_token = await this.getAuthencticationToken();
            if (auth_token != null) {
                console.log(auth_token);
                const product_info = {
                    name: "Mocklet Subscription",
                    description: "Mocklet Subscription",
                    image_url: "https://example.com/streaming.jpg",
                    home_url: "https://example.com/home",
                    type: "SERVICE",
                    category: "SOFTWARE",
                }

                const prod_id = await this.getProductID(auth_token, product_info);
                if (prod_id != null) {
                    console.log(prod_id);
                    const subsciption_info = {
                        "p_name": "Mocklet Monthly Subscription",
                        "p_desc": "Mocklet Monthly Subscription",
                        "p_amount": 10,
                        "total_cycles": 12 * 10,
                    }

                    const prod_subs_id = await this.getProductSubscriptionID(auth_token, prod_id, subsciption_info);
                    if (prod_subs_id != null) {
                        console.log(prod_subs_id);
                        let user_info = {
                            "given_name": "John",
                            "sur_name": "Doe",
                            "email": "customer@example.com"
                        };

                        const prod_subs_url = await this.getSubscriptionPlanURL(auth_token, prod_subs_id, user_info);
                        console.log(prod_subs_url);
                    } else {
                        console.log("Failed getProductSubscriptionID, prod_subs_id is null : ", prod_subs_id);
                    }
                } else {
                    console.log("Failed getProductID, prod_id is null : ", prod_id);
                }
            } else {
                console.log("Failed getAuthencticationToken, auth_token is null : ", auth_token);
            }
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = new paypalConnectionWithAxios();