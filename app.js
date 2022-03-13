const express=require("express")
const app=express()
const crypto=require("crypto")
const DatabaseMongo=require("./database")
const databaseUser=new DatabaseMongo("mongodb://localhost:27017/secretUser","users",{username:String,password:String})

app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.set("view engine","ejs")

app.use(express.static("public"))

app.get('/', (req, res) => {
    res.render("home")
});

app.get("/register",(req,res)=>{
    res.render("register")
})

app.get("/login",(req,res)=>{
    res.render("login")
})

app.post("/login",async (req,res)=>{
    let username=req.body.username
    let password=req.body.password

    let query={
        "username":username
    }

    try{
        data=await databaseUser.fetchDatabase(query)
    }
    catch(err){
        data=false
    }

    if (data){
        if(data.data.password==password){
            res.render("secrets")
        }
        else{
            res.status(403).send("Username or password not matched")
        }
    }
    else{
        res.status(403).send("Username or password not matched")
    }
    
})

app.post("/register",async (req,res)=>{
    let username=req.body.username
    let password=req.body.password
    let query={
        "username":username,
        "password":password
    }
    try{
        data=await databaseUser.saveToDataBase(query)
        res.render("login")
    }
    catch(err){
        res.status(403).send(err)
    }
    
})

app.listen(process.env.PORT || 6500,()=>{
    console.log(`Port open in ${process.env.PORT || 6500}`)
})