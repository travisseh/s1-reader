const mongoose = require("mongoose")

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
    },
    type: {
        type: String,
        required: true
    }
})

const Filing = mongoose.model("Filing", filingSchema)

module.exports = {Filing}