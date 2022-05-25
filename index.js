const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6t7o3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function run() {
  try {
    client.connect()
    const productCollection = client.db("Intel").collection("productCollection");
    const reviewCollection = client.db("Intel").collection("reviewCollection");
    const orderCollection = client.db("Intel").collection("orderCollection");
    const userCollection = client.db("Intel").collection("userCollection");

    //get all the products for home page 
    app.get('/products', async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result)
    });

    //get review
    app.get('/review', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result)
    })

    //get a product by id 
    app.get('/purchase/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result)
    })
    //post an order
    app.post('/order', async (req, res) => {
      const data = req.body;
      const result = await orderCollection.insertOne(data)
      res.send(result)
    })

    //get my orders
    app.get('/myOrder/:email', async (req, res) => {
      const email = req.params.email;

      const filter = { 'buyerEmail': email }
      const result = await orderCollection.find(filter).toArray();
      res.send(result)
    })

    //post an user
    app.put('/user', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      }
      const result = await userCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    });

    //update user info
    app.put('/userInfo', async (req, res) => {
      const { email, name, education, location, number } = req.body;

      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: `${name}`, education: `${education}`, location: `${location}`, number: `${number}`
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    });

    //get user information
    app.get('/userInfo/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result)
    });

    //post a review
    app.post('/addReview', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result)
    });

    //add a new product
    app.post('/addProduct', async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result)
    });

    //get all users
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    });

    //make admin
    app.put('/makeAdmin/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: { role: 'admin' }
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result)
    });

    //get an user by email 
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result)
    });

    //get all orders for admin
    app.get('/orders', async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result)
    });

    //delete an order
    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) }
      const result = await orderCollection.deleteOne(query);
      res.send(result)
    })


  }
  finally {
    // client.close()
  }
}


run()





app.get('/', (req, res) => {
  res.send('Server running !');
})

app.listen(port, () => {
  console.log(`server running on the port- ${port}`)
})