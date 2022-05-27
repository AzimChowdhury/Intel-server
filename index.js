const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6t7o3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//verify jwt token 

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
    if (err) {
      return res.send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}





function run() {
  try {
    client.connect()
    const productCollection = client.db("Intel").collection("productCollection");
    const reviewCollection = client.db("Intel").collection("reviewCollection");
    const orderCollection = client.db("Intel").collection("orderCollection");
    const userCollection = client.db("Intel").collection("userCollection");



    const verifyAdmin = async (req, res, next) => {
      const requesterEmail = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requesterEmail });
      if (requesterAccount?.role === 'admin') {
        next();
      }
      else {
        res.send({ message: 'forbidden' });
      }
    }




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
    app.post('/order', verifyToken, async (req, res) => {
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
      const token = jwt.sign({ email: user.email }, process.env.JWT_TOKEN, { expiresIn: '3h' })
      res.send({ result, token })
    });

    //update user info
    app.put('/userInfo', verifyToken, async (req, res) => {
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
    app.post('/addReview', verifyToken, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result)
    });

    //add a new product
    app.post('/addProduct', verifyToken, verifyAdmin, async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result)
    });

    //get all users
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    });

    //make admin
    app.put('/makeAdmin/:email', verifyToken, verifyAdmin, async (req, res) => {
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
    app.get('/orders', verifyToken, verifyAdmin, async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result)
    });

    //delete an order
    app.delete('/order/:id', verifyToken, async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) }
      const result = await orderCollection.deleteOne(query);
      res.send(result)
    })

    //delete a product
    app.delete('/product/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) }
      const result = await productCollection.deleteOne(query);
      res.send(result)
    })

    //get a product for payment
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result)
    });

    app.post('/createPaymentIntent', async (req, res) => {
      const { cost } = req.body;
      console.log(cost)
      const amount = cost * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({ clientSecret: paymentIntent.client_secret })
    })

    //update after payment
    app.put('/payment/:id', async (req, res) => {
      const id = req.params.id;
      const stripeReturn = req.body;

      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          transactionId: `${stripeReturn.id}`, status: `paid`, delivery: `pending`
        }
      }
      const result = await orderCollection.updateOne(filter, updateDoc, options);
      res.send(result)
    })

    //deliver a product
    app.put('/deliver/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          delivery: 'shipped'
        }
      }
      const result = await orderCollection.updateOne(filter, updateDoc, options)
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