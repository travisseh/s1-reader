const express = require('express')
const app = express()
require('dotenv').config()
const port = 3000
const request = require('request')
const parseString = require('xml2js').parseString
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const lineReader = require('line-reader');
const fs = require('fs')	
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

// lineReader.eachLine('test.txt', function(line) {
//     console.log(line);
//     if (line.includes('<SEC')) {
//         return false
//     }
// });

// const byline = require('byline');
 
// var stream = fs.createReadStream('test.txt', { encoding: 'utf8' });
// stream = byline.createStream(stream);
 
// stream.on('data', function(line) {
//   console.log(line)
// });

const readline = require('readline')

const outputFile = fs.createWriteStream('./output-file.txt')
const rl = readline.createInterface({
    input: fs.createReadStream('test.txt')
})

// Handle any error that occurs on the write stream
outputFile.on('err', err => {
    // handle error
    console.log(err)
})

// Once done writing, rename the output to be the input file name
outputFile.on('close', () => { 
    fs.copyFile('output-file.txt', 'output.html', (err) => {
        if (err) throw err;
        console.log('source.txt was copied to destination.txt');
      });
    console.log('done writing')

    fs.rename('./output-file.txt', './input-file.txt', err => {
        if (err) {
          // handle error
          console.log(err)
        } else {
          console.log('renamed file')
        }
    }) 
})

// Read the file and replace any text that matches
rl.on('line', line => {
    let text = line
    // Do some evaluation to determine if the text matches 
    if (text.includes('TIMES NEW ROMAN')) {
        text = text.replace('TIMES NEW ROMAN', 'ARIAL')
        console.log("TIMES NEW ROMAN")
        outputFile.write(`${text}\n`)

    }
    if (text.includes('Times New Roman')) {
        text = text.replace('Times New Roman', 'ARIAL')
        console.log("Times New Roman")
        outputFile.write(`${text}\n`)

    }
    if (text.includes('style="MARGIN: 0px"')) {
        text = text.replace('style="MARGIN: 0px"', '')
        outputFile.write(`${text}\n`)

    }
    if (text.includes('align="justify"')) {
        text = text.replace('align="justify"', '')
        console.log("align=justify")
        outputFile.write(`${text}\n`)

    }
    if (text.includes('vertical-algin: bottom;')) {
        text = text.replace('vertical-algin: bottom;', '')
        outputFile.write(`${text}\n`)

    }
    if (text.includes('text-align: justify')) {
        text = text.replace('text-align: justify', '')
        outputFile.write(`${text}\n`)

    }
    // write text to the output file stream with new line character
    outputFile.write(`${text}\n`)
})

// Done reading the input, call end() on the write stream
rl.on('close', () => {
    outputFile.end()
})

app.listen(port, function(){
console.log(`listening on port ${port}`)
})