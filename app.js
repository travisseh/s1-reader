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
const cheerio = require('cheerio')
const readline = require('readline')
const Filing = require('./models/Filing').Filing

mongoose.set("useCreateIndex", true)
mongoose.connect(process.env.DB_PATH, {useNewUrlParser: true})
app.use(bodyParser.urlencoded({extended:true}))

app.get('/filings', (req, res, next) => {
    Filing
        .find({})
        .then(foundFilings => res.json(foundFilings))
        .catch(err => console.log(err))
})

function checkForNewS1s(){
    request('https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=s-1&company=&dateb=&owner=include&start=0&count=40&output=atom', function (err, response, body) {
        if (err) {
            console.log(err)
        }
        parseString(body, (err, result) => {
            if (err) {
                console.log(err)
            }
        result.feed.entry.forEach((entry) => {
            const htmUrl = entry.link[0].$.href
            Filing.findOne({htmUrl: htmUrl}, (err, filing) => {
                
                if (err) {
                    console.log(err)
                }
                if (!filing) {
                    const title = entry.title[0]
                    const htmIdString = entry.id[0]
                    function getHtmId(htmIdString){
                        const word = 'accession-number='
                        const htmId = htmIdString.substr(htmIdString.indexOf(word) + word.length)
                        return htmId
                    }
                    const htmId = getHtmId(htmIdString)
                    let textUrl
    
                    request(htmUrl, function(err, resp, body){
                        const $ = cheerio.load(body);
                        let s1Text
                        let s1TextLength = $('td').filter(function(el) {
                            return $(this).html() === "S-1" || $(this).html() === "S-1/A"
                        }).prev().length
    
                        if (s1TextLength > 1) {
                            s1Text = $('td').filter(function(el) {
                                return $(this).html() === "S-1" || $(this).html() === "S-1/A"
                            }).prev().eq(1).text()
                        } else {
                            s1Text = $('td').filter(function(el) {
                                return $(this).html() === "S-1" || $(this).html() === "S-1/A"
                            }).prev().text()
                        }
                        let replaceText = htmId + '-index.htm'
                        textUrl = htmUrl.replace(replaceText, s1Text)
                        
                        const filing = new Filing ({
                            title: title,
                            htmUrl: htmUrl,
                            textUrl: textUrl
                        })
                        filing.save()
                    })
                }
    
            })
        })
    })
    });
}

// checkForNewS1s()
// setInterval(checkForNewS1s,86400000)


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

// const outputFile = fs.createWriteStream('./output-file.txt')
// const rl = readline.createInterface({
//     input: fs.createReadStream('test.txt')
// })

// // Handle any error that occurs on the write stream
// outputFile.on('err', err => {
//     // handle error
//     console.log(err)
// })

// // Once done writing, rename the output to be the input file name
// outputFile.on('close', () => { 
//     fs.copyFile('output-file.txt', 'output.html', (err) => {
//         if (err) throw err;
//         console.log('source.txt was copied to destination.txt');
//       });
//     console.log('done writing')

//     fs.rename('./output-file.txt', './input-file.txt', err => {
//         if (err) {
//           // handle error
//           console.log(err)
//         } else {
//           console.log('renamed file')
//         }
//     }) 
// })

// // Read the file and replace any text that matches
// rl.on('line', line => {
//     let text = line
//     // Do some evaluation to determine if the text matches 
//     if (text.includes('TIMES NEW ROMAN')) {
//         text = text.replace('TIMES NEW ROMAN', 'ARIAL')
//         console.log("TIMES NEW ROMAN")
//         outputFile.write(`${text}\n`)

//     }
//     if (text.includes('Times New Roman')) {
//         text = text.replace('Times New Roman', 'ARIAL')
//         console.log("Times New Roman")
//         outputFile.write(`${text}\n`)

//     }
//     if (text.includes('style="MARGIN: 0px"')) {
//         text = text.replace('style="MARGIN: 0px"', '')
//         outputFile.write(`${text}\n`)

//     }
//     if (text.includes('align="justify"')) {
//         text = text.replace('align="justify"', '')
//         console.log("align=justify")
//         outputFile.write(`${text}\n`)

//     }
//     if (text.includes('vertical-algin: bottom;')) {
//         text = text.replace('vertical-algin: bottom;', '')
//         outputFile.write(`${text}\n`)

//     }
//     if (text.includes('text-align: justify')) {
//         text = text.replace('text-align: justify', '')
//         outputFile.write(`${text}\n`)

//     }
//     // write text to the output file stream with new line character
//     outputFile.write(`${text}\n`)
// })

// // Done reading the input, call end() on the write stream
// rl.on('close', () => {
//     outputFile.end()
// })  

app.listen(port, function(){
console.log(`listening on port ${port}`)
})