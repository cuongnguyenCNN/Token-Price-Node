const request = require('request')
const axios = require('axios');

/**
 * Binance REST API wrapper.
 */
module.exports = class Binance {
    /**
     * Current exchange trading rules and symbol information.
     * @returns {Promise} Response promise.
     */
    exchangeInfo() {
        return this.request('/api/v1/exchangeInfo')
    }

    /**
     * Kline/candlestick bars for a symbol. Klines are uniquely identified by their open time.
     * @param {string} symbol - Trading symbol.
     * @param {string} interval - Klines interval.
     * @param {number} startTime - Start time in miliseconds.
     * @param {number} endTime - End time in miliseconds.
     * @param {number} limit - Klines limit.
     * @returns {Promise} Resopnse promise.
     */
    klines(symbol, interval, startTime, endTime, limit) {
        return this.request('/api/v1/klines', { qs: { symbol, interval, startTime, endTime, limit } })
    }

    /**
     * Common request.
     * @param {string} path - API path.
     * @param {object} options - request options.
     * @returns {Promise} Response promise.
     */
    request(path, options) {
        return new Promise(async(resolve, reject) => {
            // request('https://api.binance.com' + path, options, (err, res, body) => {
            //     if (err) {
            //         return reject(err)
            //     }
            //     if (!body) {
            //         return reject(new Error('No body'))
            //     }

            //     try {
            //         const json = JSON.parse(body)
            //         if (json.code && json.msg) {
            //             const err = new Error(json.msg)
            //             err.code = json.code
            //             return reject(err)
            //         }
            //         return resolve(json)
            //     } catch (err) {
            //         return reject(err)
            //     }
            // })
            try {
                // Build the full URL
                const url = `https://api.binance.com${path}`;
    
                // Make the HTTP request with axios
                const response = await axios({ url, ...options });
    
                // Check for Binance-specific error structure
                if (response.data.code && response.data.msg) {
                    const err = new Error(response.data.msg);
                    err.code = response.data.code;
                    return reject(err);
                }
    
                // Resolve the Promise with parsed JSON data
                resolve(response.data);
            } catch (error) {
                // Handle network errors or HTTP errors
                if (error.response && error.response.data) {
                    const err = new Error(error.response.data.msg || 'Request failed');
                    err.code = error.response.data.code || error.response.status;
                    return reject(err);
                }
                reject(error);
            }
        })
    }
}
