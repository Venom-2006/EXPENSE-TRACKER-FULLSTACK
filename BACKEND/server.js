const express=require("express");
const cors=require("cors");
const connectDB=require("./config/db");
require("dotenv").config();
const app = express();

connectDB();

const PORT = process.env.PORT||5000;
const userRoutes=require("./routes/userRoutes");
const transactionRoutes=require("./routes/transactionRoutes");
app.use(cors());
app.use(express.json());
app.use("/api/users",userRoutes);
app.use("/api/transactions",transactionRoutes);


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})

