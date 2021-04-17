const express = require('express')
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
//const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
app.use(cors())
app.use(express.json())
app.listen(process.env.PORT || 4000);

const URL = "mongodb+srv://dbuser:error404@cluster0.coton.mongodb.net/shorterlink?retryWrites=true&w=majority";
const DB = "shorterlink"
app.post("/register",async(req,res)=>{
   try{  
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    
    if((await db.collection("link").find({email:req.body.email}).toArray()).length==0)
    {
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(req.body.password,salt);
    req.body.password = hash;
    req.body.link = [];
    await db.collection("link").insertOne(req.body);
    res.json({
        "message":"added"
    })
    }
    else
    {
        res.json({
            "message":"user already exist"
        })    
    }
    connection.close();
   }
    catch(error)
    {
        console.log(error);
    }
   
})
app.post("/login",async(req,res)=>{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
   // console.log(req.body.email);
    let user = await db.collection("link").find({email:req.body.email}).toArray() ;
    //console.log("user",user);
    if(user.length!=0)
    {
      console.log(req.body.password,user[0].password)
      let isPassword = await bcrypt.compare(req.body.password,user[0].password);
      if(isPassword)
      {
          let token = jwt.sign({_id:user[0]._id},"ksdsfsdgsdgdfhdsabgdghsdlhgldsdsaf");
        res.json({
            message : "Allowed",
             token ,
             userid : user[0]._id
        })
      }else
      {
        res.status(404).json({
            message : "Login id or password is wrong"
        })
      }
    }
    else
    {
        res.status(404).json({
            message : "Login id or password is wrong"
        })
    }
})


app.post("/:id",async (req,res)=>{
    try{
        console.log(req.body);
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
     await db.collection("link").updateOne({_id:mongodb.ObjectID(req.params.id)},{$push:{link:req.body}});
    connection.close();
    res.json({
        "message":"added"
    })}
    catch(error)
    {
        console.log(error);
    }
})

app.post("/single/:id",async(req,res)=>{
    try{
    console.log(req.body);
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let link =  await db.collection("link").find({_id:mongodb.ObjectID(req.params.id)}).toArray();
    //console.log(link);
    let result = []; 
    link[0].link.map((i)=>{
        if(i.shortid==req.body.shortid)
        {
            result = i;
            
        }
    })
    connection.close();
    res.json(result);
 }
    catch(error)
    {
        console.log(error);
    }
})
app.get("/full/:id", async (req,res)=>{
    try{
        console.log(req.body);
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let link =  await db.collection("link").find({_id:mongodb.ObjectID(req.params.id)}).toArray();
    connection.close();
    res.send(link[0].link);}
    catch(error)
    {
        console.log(error);
    }
})
app.put("/:id",async (req,res)=>{
    try{
    console.log(req.body.shortid);
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let link =  await db.collection("link").find({_id:mongodb.ObjectID(req.params.id)}).toArray();
    let ind = 0 ; 
    link[0].link.map((i,index)=>{
        if(i.shortid==req.body.shortid)
        {
          ind = index ; 
        }
    })
    link[0].link.splice(ind,1);
    console.log(link[0].link);
    await db.collection("link").updateOne({_id:mongodb.ObjectID(req.params.id)},{$set:{link:link[0].link}});
    connection.close();
    res.json({
        "Link":"removed"
    })}
    catch(error)
    {
        console.log(error);
    }  
})