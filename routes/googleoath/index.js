const express=require("express")
const router=express.Router()
const querystring=require("querystring")
const main=require("../../app")
const axios=require("axios")

/*
    Makes post request to google to get Token
    Use axios to make request with client_id client_secret
    code("From user") and returns a promise
*/
function getToken(code){
    return axios.post("https://oauth2.googleapis.com/token",({
        client_id:process.env.CLIENT_ID,
        client_secret:process.env.CLIENT_SECRET,
        code,
        redirect_uri:"http://localhost:6500/auth/google/config",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        grant_type: "authorization_code",
        })
    )
}



/*
    Makes a get request with axios to google to get 
    profile information from accesstoken and returns a promise
*/
function getProfile(access_token,id_token){
    return axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    )
}



/*
    Finds the data related to google Id if not found creates
    a account in database
*/
function findOrCreate(id,email,req,res){
    main.database.fetchDatabase({username:id},{"secrets":0,"password":0}).then(data=>{
        if(data.data[0]!==undefined){
            req.session.user=data.data[0].username
            res.redirect("/secrets")
        }
        else{
            main.database.saveToDataBase({"username":id}).then(data=>{
                res.redirect("/login")

            })
        }
    })
}



/*
    Async function that calls the getToken with code got from auth/google path
    funciton for access_token and id_token and uses those value
    to get profile of user with the help of getProfile funciton
*/
router.get("/config",async (req,res)=>{
    try{
        let data=await getToken(req.query.code)
        // console.log(data.data.access_token)
        let profileData=await getProfile(data.data.access_token,data.data.id_token)
        let {id,email}=profileData.data
        findOrCreate(id,email,req,res)
    }
    catch (err){
        res.redirect("/")
    }
})



/*
    Get request handler for /auth/google path and redirect
    user to google account sign in and then get redirected to auth/google/config 
    with the code for getToken function
*/
router.get("/",async (req,res)=>{

    const options = {
        redirect_uri:"http://localhost:6500/auth/google/config",
        client_id: process.env.CLIENT_ID,
        // client_secret:process.env.CLIENT_SECRET,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email"
        ].join(" "),
      };
    
      res.redirect(`${"https://accounts.google.com/o/oauth2/v2/auth"}?${querystring.stringify(options)}`)
})

module.exports=router