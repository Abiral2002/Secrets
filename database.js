const mongoose=require("mongoose")

class DatabaseMongo extends mongoose.Mongoose{
    constructor(url,collectionName,schemaModel){
        super()
        this.connect(url)
        this.schemaModel(schemaModel,collectionName)
    }

    schemaModel(schemaModel,collectionName){
        this.databaseSchema=new mongoose.Schema(schemaModel)
        this.databaseModel=this.model(collectionName,this.databaseSchema)
    }

    saveToDataBase(data){
        return new Promise((resolve,reject)=>{
            let insertTo=new this.databaseModel(data)
            insertTo.save((error)=>{
                if(error){
                reject(error)
                }
                else{
                    resolve("Success")
                }
        })
        })
        
    }

    fetchDatabase(query){
        return new Promise((resolve,reject)=>{
            this.databaseModel.findOne(query,(err,result)=>{
                if(result){
                    resolve({message:"Success",data:result})
                }
                else{
                    reject({message:"Error",data:err})
                }
            })    
        })    
    }
}

module.exports=DatabaseMongo