const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
// const MongoStore = require('connect-mongo')(session);

// create express app
const app = express();

// 
app.use(cors());
app.use(express.json());

async function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if (!authHeader) return res.status(401).send({ message: 'unauthorized access' })
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
        if (err) return res.status(403).send({ message: 'forbidden access' });
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.bsiaqva.mongodb.net/?retryWrites=true&w=majority`;
// const dbOptions = {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }
// const connection = mongoose.createConnection(uri, dbOptions)

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db('inventory').collection('users');
        const categoriesCollection = client.db('inventory').collection('categories');

        // jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.headers.email;
            const filter = { email: email }
            const user = await usersCollection.findOne(filter);
            if (user) {
                const token = jwt.sign(email, process.env.JWT_SECRET);
                return res.send({ token });
            }
            res.status(403).send({ token: '' })

        })

        app.post('/users', async (req, res) => {
            const userInfo = {
                ...req.body,
                displayName: req.body.name
            }
            const query = { email: req.body.email }
            const isFound = await usersCollection.findOne(query);
            if (isFound) return res.send({ message: 'User Already Exist' });
            const result = await usersCollection.insertOne(userInfo);
            res.send(result);
        })

        // app.get('/users')

    } catch (error) {
        console.log(error)
    }
}
run().catch(err => console.log('run or catch error:', err))


app.listen(port, () => {
    console.log('listening on', port);
})
