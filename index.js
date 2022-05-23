const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://Intel-admin:O2kXYBdQVLuvq0Cz@cluster0.6t7o3.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function run() {
  try {
    client.connect()
    const productCollection = client.db("Intel").collection("productCollection");
    
    app.get('/products', async(req,res)=>{
      const result = await productCollection.find().toArray();
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