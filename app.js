const express = require('express')
const app = express()
require('dotenv').config()
const port = 3000
const request = require('request')
const parseString = require('xml2js').parseString
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
mongoose.set("useCreateIndex", true)
const Schema = mongoose.schema

mongoose.connect(process.env.DB_PATH, {useNewUrlParser: true})


app.use(bodyParser.urlencoded({extended:true}))


const filingSchema = new mongoose.Schema ({
	title: {
        type: String,
        required: true
    },
	textUrl: {
        type: String,
        required: true
    },
    htmUrl: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
})

const Filing = mongoose.model("Filing", filingSchema)

request('https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=s-1&company=&dateb=&owner=include&start=0&count=40&output=atom', function (err, response, body) {
    if (err) {
        console.log(err)
    }
  parseString(body, (err, result) => {
        if (err) {
            console.log(err)
        }
      result.feed.entry.forEach((entry) => {
        const title = entry.title[0]
        const htmUrl = entry.link[0].$.href
        const textUrl = htmUrl.replace('-index.htm','.txt')
        Filing.findOne({htmUrl: htmUrl}, (err, filing) => {
            if (!filing) {
                const filing = new Filing ({
                    title: title,
                    htmUrl: htmUrl,
                    textUrl: textUrl
                })
                filing.save()
            }

        })
      })
  })
});

app.listen(port, function(){
console.log(`listening on port ${port}`)
})