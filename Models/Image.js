const mongoose = require("mongoose");
const imgSchema = mongoose.Schema({
  link: {
    type: String,
    required: true,
  },
  img_key:{
    type:String,
    required:true
  },
  
},{ timestamps: true });
module.exports = mongoose.model("Image", imgSchema);
