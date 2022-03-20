/*
    Requireing all packages
*/
const express=require("express")
require("dotenv").config()
const app=express()
const DatabaseMongo=require("./database")
const session=require("express-session")
const bcrypt=require("bcrypt")
const saltRound=10
const googleapis=require("googleapis")
const { default: mongoose } = require("mongoose")
const MongoDBStore = require('connect-mongodb-session')(session);



/*
    Connecting to mongo database
*/
const databaseUser=new DatabaseMongo("mongodb://localhost:27017/secretUser","users",{
    username:String,
    password:String,
    secrets:[{
        date:Date,
        secret:String}]
})



/*
    Database configuration for session sore
*/
var store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/connect_mongodb_session_test',
    collection: 'mySessions'
  });



/*
  Middle ware for url parser
*/
app.use(express.urlencoded({extended:true}))



/*
  Middle ware for json parser
*/
app.use(express.json())



/*
  Middle ware for session
*/
app.use(session({
    secret:process.env.SESSION_SECRET,
    saveUninitialized:false,
    store:store,
    resave:true,
}))



/*
    Setting view engine with ejs
*/
app.set("view engine","ejs")



/*
    Middle ware for static page like .css and .js
*/
app.use(express.static("public"))



/*
    Get Request handler for request in / path
*/
app.get('/', (req, res) => {
    res.render("home")
});


/*
    Get Request handler for request in /register path.
    Render register.ejs page to client  
*/
app.get("/register",(req,res)=>{
    res.render("register")
})


/*
    Get Request handler for request in /login path.
    Render login.ejs to client

*/
app.get("/login",(req,res)=>{
    res.render("login")
})



/* 
    Get Request handler for requet in /secrets path/
    Renders secrets.ejs to user if logged in 
*/
app.get("/secrets",(req,res)=>{
    //Checks if the user is logged in or not
    if(!req.session.user){
        res.redirect("/login")
    }
    else {
        databaseUser.fetchDatabase({},{"username":0,"password":0,"_id":0}).then(retrieveData=>{ //Fetches all secrets data from data base 
            let sendData=retrieveData.data.map(secrets=>{   //Stores all secrets data in a list
                return secrets.secrets
            })
            res.render("secrets",{      //Renders sercret page with secrets data
                data:sendData
            })
        }).catch(err=>{
            res.redirect("/secrets")    //If error redirect user to /secret path and the process starts from beginning
        })
    }
})



/*
    Post Request handler for /submit path.
    Adds the data user sent to the database if logged in 
*/
app.post("/submit",(req,res)=>{
    if(!req.session.user){      //Check if the user is logged in or not
        res.redirect("/login")
        return
    }
    /*
        If logged in stores the data user sent
        to the database with the date in {date:Date(),secret:data} format 
    */
    databaseUser.addSecret({"username":req.session.user},{$push:{"secrets":{"date":Date(),"secret":req.body.secret}}}).then(data=>{  
        res.redirect("secrets")
    }).catch(err=>{
        res.redirect("secrets")
    })
})



/*
    Get Request handler for /logout path
    Logout the user by destroying their session
*/
app.get("/logout",(req,res)=>{
    if(!req.session.user)res.redirect("login") //Checks if the user is logged in 
    else {
        req.session.destroy()   //Destroys user session and redirects them to login page
        res.redirect("login")
    }
})



/*
    Post Request handler for /login path
    Authenticate user by comparing their username and password 
*/
app.post("/login",async (req,res)=>{
    if (req.session.username){      //Checks if the user is already logged in
        res.redirect("/secrets")
    }
    let {username,password}=req.body  
    try{
        /*
            Gets data related tousername sent by the user
            and stores it into userCredentials veriable
        */
        userCredentials=await databaseUser.fetchDatabase({username:username},{"secrets":0}) 
    }
    catch(err){
        /*
            If user not found sets userCredentials 
            to false 
        */
        userCredentials=false
    }

    if (userCredentials){
        /*
            Compare the users password to the related hash
            stored in database if not found sends 403 error
            with "Username or password not found message"
        */
        if(userCredentials.data[0]!==undefined && bcrypt.compareSync(password,userCredentials.data[0].password)){
            req.session.user=userCredentials.data[0].username
            res.redirect("/secrets")
        }
        else{
            console.log("Not Success")
            res.status(403).send("Username or password not matched")
        }
    }
    /*
        If username not found in database then 
        sends 403 error with "Username or password not found message"
    */
    else{
        res.status(403).send("Username or password not matched")
    }  
})



/*
    Get Request handler for /submit path
    Renders submit page if user logged in
*/
app.get("/submit",(req,res)=>{
    if(!req.session.user)res.redirect("/login")
    else res.render("submit")
})



/*
    Post Request Handler for /register path
    Register user by storing username and password
    in the database by hashing users password
*/
app.post("/register",async (req,res)=>{
    let username=req.body.username
    let password=req.body.password
    let query={
        "username":username,
        "password":bcrypt.hashSync(password, saltRound) //Hash password send from user with bcrypt
    }
    try{
        data=await databaseUser.saveToDataBase(query)   //Saves username and hashed password to database
        res.render("login")
    }
    catch(err){
        res.status(403).send(err)
    }
    
})



/*
    Get request handler for /auth/google path
    Uses OAUTH protocol to register and login user
*/
// app.get("/auth/google",async (req,res)=>{
//     const {google} = require('googleapis');

//     const oauth2Client = new google.auth.OAuth2(
//         CLIENT_ID,
//         CLIENT_SECRET,
//         YOUR_REDIRECT_URL 
//     );

//     // generate a url that asks permissions for Blogger and Google Calendar scopes
//     const scopes = [
//     'https://www.googleapis.com/auth/userinfo.email',
//     'https://www.googleapis.com/auth/userinfo.profile',

//     ];

//     const url = oauth2Client.generateAuthUrl({
//         // 'online' (default) or 'offline' (gets refresh_token)
//         access_type: 'offline',

//         // If you only need one scope you can pass it as a string
//         scope: scopes
//     });

//     const tokens= oauth2Client.getToken()
//     oauth2Client.setCredentials(tokens);

// })

app.listen(process.env.PORT || 6500,()=>{
    console.log(`Port open in ${process.env.PORT || 6500}`)
})