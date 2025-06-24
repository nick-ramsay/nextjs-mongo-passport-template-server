const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserCreationRequestsSchema = new Schema({
    email: { type: String },
    emailVerificationToken: {type: String}
})

const UserCreationRequests = mongoose.model("UserCreationRequests", UserCreationRequestsSchema);

module.exports = UserCreationRequests;