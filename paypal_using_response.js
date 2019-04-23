const request = require('request');

class paypalConnection {
    constructor() {
        this.base_url = "https://api.sandbox.paypal.com";
        const client_id = "AVX_6t8YvMshTubbzstnkRzmht_t36OZebb3YsMonTjPTORyx87SdEWgyI10k3y6WGLdJpW1UkuxDwFW";
        const secret_key = "EOLQBtCw_PkNFjPISk3SHCaTqCWJpX7RWVwZzD2Z65NBSXvV4-nSfAqAyJ0fidShOf6WcmF4I5tQYeD1";
        const auth = client_id + ":" + secret_key;
        this.authb = "Basic " + new Buffer(auth).toString("base64");

        this.return_url = "https://example.com/returnUrl";
        this.cancel_url = "https://example.com/cancelUrl";
        this.pp_plan_id = "P-5U7277737T038073FLS66IUI";

    }

    createProduct(self, auth, cbcreateProductSubscription) {
        const p_name = "Mocklet Monthly Subscription";
        const p_desc = "Mocklet Monthly Subscription";
        const p_image_url = "https://example.com/streaming.jpg";
        const p_home_url = "https://example.com/home";
        const p_type = "SERVICE";
        const p_category = "SOFTWARE";

        var options = {
            uri: self.base_url + "/v1/catalogs/products",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + auth
            },
            json: {
                "name": p_name,
                "description": p_desc,
                "type": p_type,
                "category": p_category,
                "image_url": p_image_url,
                "home_url": p_home_url
            }
        }

        request(options, function (error, response, body) {
            if (error) {
                console.log("error", error);
                return;
            }

            if (response.statusCode === 200) {
                cbcreateProductSubscription(self, auth, body['id'])
            } else {
                console.log("createProduct response is not 200 : ", response.statusCode);
                console.log(body);
            }
        });
    }

    createProductSubscription(self, auth, product_id) {
        const pp_request_id = "PLAN-18062019-001";
        const p_name = "Basic Plan";
        const p_desc = "Basic plan";
        const p_amount = 10;

        var options = {
            uri: self.base_url + "/v1/billing/plans",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "PayPal-Request-Id": pp_request_id,
                "Prefer": "return=representation",
                "Authorization": "Bearer " + auth
            },
            json: {
                "product_id": product_id,
                "name": p_name,
                "description": p_desc,
                "billing_cycles": [
                    // {
                    //     "frequency": {
                    //         "interval_unit": "MONTH",
                    //         "interval_count": 1
                    //     },
                    //     "tenure_type": "TRIAL",
                    //     "sequence": 1,
                    //     "total_cycles": 1
                    // },
                    {
                        "frequency": {
                            "interval_unit": "MONTH",
                            "interval_count": 1
                        },
                        "tenure_type": "REGULAR",
                        "sequence": 1,
                        "total_cycles": 12,
                        "pricing_scheme": {
                            "fixed_price": {
                                "value": p_amount,
                                "currency_code": "USD"
                            }
                        }
                    }
                ],
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
        }

        request(options, function (error, response, body) {
            if (error) {
                console.log("error", error);
                return;
            }

            if (response.statusCode === 201) {
                // for (const key in body) {
                //     if (body.hasOwnProperty(key)) {
                //         const element = body[key];
                //         console.log(key, element)
                //     }
                // }

                console.log("Product ID : ", body['id'])

            } else {
                console.log("createProductSubscription response is not 200 : ", response.statusCode);
            }
        });
    }

    subscriptionPlan(self, auth, user_info) {
        Date.prototype.addHours = function (h) {
            this.setTime(this.getTime() + (h * 60 * 60 * 1000));
            return this;
        }

        let getUniqueRequestID = function () {
            var today = new Date();
            var date = today.getFullYear() + (today.getMonth() + 1) + today.getDate();

            return "SUBSCRIPTION-" + date + "-" + today.getTime();
        }


        const pp_request_id = getUniqueRequestID();

        const p_given_name = user_info['given_name']; // "John";
        const p_sir_name = user_info['sir_name']; //"Doe";
        const p_email = user_info['email']; //"customer@example.com";

        let p_time_date = new Date();
        p_time_date.addHours(1);
        const p_time = p_time_date.toISOString();

        var options = {
            uri: self.base_url + "/v1/billing/subscriptions",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "PayPal-Request-Id": pp_request_id,
                "Prefer": "return=representation",
                "Authorization": "Bearer " + auth
            },
            json: {
                "plan_id": self.pp_plan_id,
                "start_time": p_time,
                "subscriber": {
                    "name": {
                        "given_name": p_given_name,
                        "surname": p_sir_name
                    },
                    "email_address": p_email,
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
                    "return_url": self.return_url,
                    "cancel_url": self.cancel_url
                }
            }
        }

        request(options, function (error, response, body) {
            if (error) {
                console.log("error", error);
                return;
            }

            if (response.statusCode === 201) {
                // for (const key in body) {
                //     if (body.hasOwnProperty(key)) {
                //         const element = body[key];
                //         console.log(key, element)
                //     }
                // }

                const urls = body['links'];
                for (const url of urls) {
                    if (url.rel === 'approve') {
                        console.log(url.href);
                    }
                }

            } else {
                console.log("subscriptionPlan response is not 200 : ", response.statusCode);
                console.log(body);
            }
        });
    }

    doJob() {
        const self = this;

        //enable or disable this flag to create product or use subsciption
        const create_product = false;

        var options = {
            uri: self.base_url + "/v1/oauth2/token",
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                "Accept": "application/json",
                "Accept-Language": "en_US",
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": self.authb
            }
        };

        let cbMethod = null;
        let cbMethod2 = null;

        if (create_product) {
            cbMethod = this.createProduct;
            cbMethod2 = this.createProductSubscription;
        } else {
            cbMethod = this.subscriptionPlan;
        }

        request(options, function (error, response, body) {
            if (error) {
                console.log("error", error);
                alert(error);
                return;
            }

            if (response.statusCode === 200) {
                let jb = JSON.parse(body);
                self.access_token = jb["access_token"];
                if (create_product) {
                    cbMethod(self, jb["access_token"], cbMethod2);
                } else {
                    let user_info = {
                        "given_name": "John",
                        "sir_name": "Doe",
                        "email": "customer@example.com"
                    };

                    cbMethod(self, jb["access_token"], user_info);
                }

            } else {
                console.log("doSomeJob response is not 200 : ", response.statusCode);
                console.log(body);
            }
        });
    }
}

module.exports = new paypalConnection();