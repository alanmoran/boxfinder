var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;

var BoxSchema = new Schema({
    lng: Number,
    lat: Number,
    phone: String,
    address: String,
    name: String
});

module.exports = mongoose.model('Box', BoxSchema);