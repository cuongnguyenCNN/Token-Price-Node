const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors({ origin: '*' }))

const morgan = require('morgan')
app.use(morgan('tiny'))

const UDF = require('./src/udf')
const udf = new UDF()


const fetch = (...args) => import('node-fetch').then(module => module.default(...args))  // Change to dynamic import

// Common

const query = require('./src/query')

function handlePromise(res, next, promise) {
    promise.then(result => {
        res.send(result)
    }).catch(err => {
        next(err)
    })
}

// Endpoints
app.all('/', (req, res) => {
    res.json({
        message: 'Welcome to the Binance UDF Adapter for TradingView.',
        documentation: './config',
        status: 'success'
    })
})

app.get('/time', (req, res) => {
    const time = Math.floor(Date.now() / 1000)  // In seconds
    res.set('Content-Type', 'text/plain').send(time.toString())
})

app.get('/config', (req, res, next) => {
    const tradingviewConfigApi = "https://api.bscexchange.com/api/v1/tradingview/config"
    fetch(tradingviewConfigApi)
    .then(response => response.json())
    .then(data => {
        res.json(data)
    })
    .catch(error => {
        next(error)
    })
})

app.get('/symbol_info', (req, res, next) => {
    handlePromise(res, next, udf.symbolInfo())
})

app.get('/symbols', [query.symbol], (req, res, next) => {
    handlePromise(res, next, udf.symbol(req.query.symbol))
})

app.get('/search', [query.query, query.limit], (req, res, next) => {
    if (req.query.type === '') {
        req.query.type = null
    }
    if (req.query.exchange === '') {
        req.query.exchange = null
    }

    handlePromise(res, next, udf.search(
        req.query.query,
        req.query.type,
        req.query.exchange,
        req.query.limit
    ))
})

app.get('/history', [
    query.symbol,
    query.from,
    query.to,
    query.resolution
], (req, res, next) => {
    handlePromise(res, next, udf.history(
        req.query.symbol,
        req.query.from,
        req.query.to,
        req.query.resolution
    ))
})

// Handle errors

app.use((err, req, res, next) => {
    if (err instanceof query.Error) {
        return res.status(err.status).send({
            s: 'error',
            errmsg: err.message
        })
    }

    if (err instanceof UDF.SymbolNotFound) {
        return res.status(404).send({
            s: 'error',
            errmsg: 'Symbol Not Found'
        })
    }
    if (err instanceof UDF.InvalidResolution) {
        return res.status(400).send({
            s: 'error',
            errmsg: 'Invalid Resolution'
        })
    }

    console.error(err)
    res.status(500).send({
        s: 'error',
        errmsg: 'Internal Error'
    })
})

// Listen

// const port = process.env.PORT || 80
const port = 3002
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
