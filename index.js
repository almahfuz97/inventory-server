const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const productsCollection = client.db('inventory').collection('products');

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

        app.post('/categories', async (req, res) => {
            const categoryInfo = req.body;
            const result = await categoriesCollection.insertOne(categoryInfo);
            res.send(result);
        })
        app.get('/categories', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email }
            const categories = await categoriesCollection.find(query).toArray();
            console.log(categories)
            res.send(categories);
        })
        // app.get('/allCategories', async (req, res) => {
        //     const query = {}
        //     const categories = await categoriesCollection.find(query).toArray();
        //     console.log(categories)
        //     res.send(categories);
        // })
        app.delete('/categories/:id/:email', async (req, res) => {
            const email = req.params.email;
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await categoriesCollection.deleteOne(query);

            // delete all products
            const filter = { categoryId: id };
            const result2 = await productsCollection.deleteMany(filter);
            console.log(result2)
            console.log(result)
            res.send(result);
        })

        // products
        app.get('/products', async (req, res) => {
            const email = req.query.email;
            const query = { sellerEmail: email }
            const products = await productsCollection.find(query).toArray();
            console.log(products)
            res.send(products);
        })
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(query);
            console.log(result);
            res.send(result);
        })
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const options = { upsert: true };
            const body = req.body;
            console.log(body)
            const updatedDoc = {
                $set: {
                    product_name: body.product_name,
                    price: body.price,
                    availability: body.availability
                }
            }
            const result = await productsCollection.updateOne(query, updatedDoc, options);
            console.log(result);
            res.send(result);
        })
        app.post('/addproduct', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            console.log(result)
            res.send(result);
        })

    } catch (error) {
        console.log(error)
    }
}
run().catch(err => console.log('run or catch error:', err))


app.listen(port, () => {
    console.log('listening on', port);
})
