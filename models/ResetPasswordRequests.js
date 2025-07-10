const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ResetPasswordRequestsSchema = new Schema({
    email: { type: String },
    resetCode: {type: String}
})

const ResetPasswordRequests = mongoose.model("ResetPasswordRequests", ResetPasswordRequestsSchema);

module.exports = ResetPasswordRequests;