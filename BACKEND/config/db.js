const mongoose = require("mongoose");

const connectDB=async()=>{
    try{
        const conn= await mongoose.connect(process.env.MONGO_URI);
        console.log("MogoDB connected Succesfully")
    
}
    catch(error){
        console.log("Not connected to database: ",error.message);
        process.exit(1)
    }

}

module.exports=connectDB;