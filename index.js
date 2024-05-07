const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors())
app.use(express.json())

// console.log(process.env.DB_USER);

// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yopbrdd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const servicesCollection = client.db("carDoctor").collection("services");
        const bookingsCollection = client.db("carDoctor").collection("bookings");

        //auth related api
        app.post("/jwt", async(req, res)=> {
            const user = req.body;
            console.log(user);
            const token = jwt.sign( user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
            res.send(token)
        })


        // services related api
        // get all services
        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        // get one service dynamically from all services
        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const options = {
                // Include only the `title` and `imdb` fields in each returned document
                projection: { title: 1, price: 1, service_id:1, img: 1 },
            };

            const result = await servicesCollection.findOne(query, options);
            res.send(result)
        })

        // bookings related api
        app.get("/book", async(req, res)=> {
            console.log("email",req.query.email)
            let query = {};
            if (req.query?.email) {
                query = {
                    email: req.query.email,
                }
            }
            const result = await bookingsCollection.find(query).toArray();
            res.send(result)
        })

        app.post("/book", async(req, res)=> {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result)
        })

        app.delete("/book/:id", async(req, res)=> {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query);
            res.send(result)
        })

        app.patch("/book/:id", async(req, res)=> {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id)};
            const updatedBooking = req.body;
            const updatedDoc = {
                $set: {
                    status: updatedBooking.status
                }
            }
            const result = await bookingsCollection.updateOne(filter, updatedDoc);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("car doctor server is running.")
})

app.listen(port, () => {
    console.log(`car doctor is running on port no. ${port}`)
})