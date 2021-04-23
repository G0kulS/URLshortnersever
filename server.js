const express = require('express')
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const EmailValidator = require('email-deep-validator');
const emailValidator = new EmailValidator();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
app.use(cors())
app.use(express.json())
app.listen(process.env.PORT || 4000);
const nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "unnamedbot2oo5@gmail.com", 
        pass: "Liverpool@2019" 
    }
});
const URL = "mongodb+srv://dbuser:error404@cluster0.coton.mongodb.net/shorterlink?retryWrites=true&w=majority";
const DB = "shorterlink"
app.post("/register",async(req,res)=>{
    console.log("register");
   try{  
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(req.body.email);
    if(wellFormed && validDomain && validMailbox)
    {
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
    } }
    else
    {
        res.json({
            "message":"Enter valid email id"
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
    console.log("login");
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
   // console.log(req.body.email);
    let user = await db.collection("link").find({email:req.body.email}).toArray() ;
    //console.log("user",user);
    if(user.length!=0)
    {
      console.log(req.body.password,user[0].password)
      let isPassword = await bcrypt.compare(req.body.password,user[0].password);
      console.log(isPassword);
      if(isPassword)
      {
             let token = jwt.sign({_id:user[0]._id},"ksdsfsdgsdgdfhdsabgdghsdlhgldsdsaf");
             res.json({
             "message" : "Allowed",
             token ,
             userid : user[0]._id
        })
      }else
      {
        res.json({
            "message" : "Login id or password is wrong"
        })
      }
    }
    else
    {
        res.json({
            "message" : "Login id or password is wrong"
        })
    }
})

app.post("/email",async (req,res)=>{
    console.log("email");
    try{  
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(req.body.email);
        if(wellFormed && validDomain && validMailbox)
        { 
            let user = await db.collection("link").find({email:req.body.email}).toArray();
            if(user!=0)
            {
                let mailOptions = {
                    from: 'unnamedbot2oo5@gmail.com', // TODO: email sender
                    to: req.body.email, // TODO: email receiver
                    subject: 'Password reset',
                    text: `Reset your password using the below link : http://localhost:3000/reset/${user[0]._id}`
                };
                
                // Step 3
                transporter.sendMail(mailOptions, (err, data) => {
                    if (err) {
                        console.log('Error occurs');
                    }
                    
                });
                res.json({"message":'Email sent!!!'});
            }
            else
            {
                res.json({
                    "message":"Please Register to access"
                })     
            }
        }
        else
        {
           res.json({
                "message":"Please enter valid email"
            })
        } 
    }
    catch(err)
    {
      console.log(err)
      res.json({
        "message":"Please enter valid email"
    })
    }
})


app.post("/:id",verification,async (req,res)=>{
    console.log("add");
    try{
    console.log("body :",req.body);
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
    console.log("getone");
    try{
    console.log(req.params.id);
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let link =  await db.collection("link").find({link:{$elemMatch:{shortid:req.params.id}}}).toArray();
    console.log(link);
    let result = []; 
    link[0].link.map((i)=>{
        if(i.shortid==req.params.id)
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

app.post("/cpass/:id",async (req,res)=>{
    console.log("changing password")
    try
    {
        let connection = await mongodb.connect(URL);
       let db = connection.db(DB);
       let salt = await bcrypt.genSalt(10);
       let hash = await bcrypt.hash(req.body.password,salt);
       await db.collection("link").updateOne({_id:mongodb.ObjectID(req.params.id)},{$set:{password:hash}});
       res.json({
           "message" : "Password changed"
       })
        
    }
    catch(err)
    {
        console.log("Error :",err)
    }
})



app.get("/full/:id",verification, async (req,res)=>{
    console.log("fulllink");
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
app.put("/:id",verification,async (req,res)=>{
    console.log("delete");
    try{
    console.log(req.body.shortid);
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let link =  await db.collection("link").find({_id:mongodb.ObjectID(req.params.id)}).toArray();
    console.log("link:",link);
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


function verification(req,res,next)
{ 
    console.log("hello",req.body)
      if(req.headers.authorization)
  {
      try
      {
          let check = jwt.verify(req.headers.authorization,"ksdsfsdgsdgdfhdsabgdghsdlhgldsdsaf");
          if(check)
          {
              next();
          }
          else
          {
              res.json({
                "message":"authorization failed"           
              })
          }
      }
      catch(err)
      {
        console.log(err)
        res.json({
            "message":"authorization failed"           
          })
      }
  }   
  else
  {
    res.json({
        "message":"authorization failed"           
      })  
  }
}
