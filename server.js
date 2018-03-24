const express = require('express')
const app = express()
const isURL = require('is-url-superb')
const shortId = require('shortid')
const mongodb = require('mongodb')
const { MongoClient, ObjectId } = mongodb

MongoClient.connect(process.env.MONGODB_URL).then(client => {
  
  app.use(express.static('public'))
  
  app.get("/:url", async (req, res, next) => {
    try {
      const urlsCollection = client.db("url-shortener").collection('urls')
      const result = await urlsCollection.findOne({ short: req.params.url })
    
      if (result) {
        res.redirect(result.url)
      } else {
        client.close()
        res.json({"error": "This url is not on the database."})
      }
      
    } catch(e) {
      next(e)
    }
  })
  
  app.get("/new/:url(*)", async (req, res, next) => {
    if (!isURL(req.params.url)) {
      return res.json({
        error: "Wrong url format, make sure you have a valid protocol and real site."
      })
    }

    try {
      const { url:newURL } = req.params
      const urlsCollection = client.db("url-shortener").collection('urls')
      const doc = await urlsCollection.findOne({ url: newURL })

      if (!doc) {
        const insertResult = await urlsCollection.insert({ url: newURL, short: shortId.generate() })
        console.log(insertResult)
        return res.json({
          original_url: newURL,
          short_url: "https://wool-cousin.glitch.me/" + insertResult.ops[0].short
        })
      }

      res.json({
        original_url: req.params.url,
        short_url: "https://wool-cousin.glitch.me/" + doc.short
      })
    } catch (e) {
      next(e)
    }  
  })
  
  app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({error: "Something wrong on the server side"})
  })
  
  const listener = app.listen(process.env.PORT, () => {
    console.log(`Your app is listening on port ${listener.address().port}`)
  })
})





