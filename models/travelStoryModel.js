
const mongoose=require("moongoose");
const Schema=mongoose.Schema;


const travelStorySchema=new Schema({
    title:{type:String,required:true},
    story:{type:String,required:true},
    visitedLocation:{type:[String],default:[]},
    isFavourite:{type:Boolean,default:false},
    userId:{type:Schema.Types.ObjectId,ref:"User",required:true},
    createdOn:{type:Date,default:Date.now},
    imageUrl:{type:String,required:true},
    visitedDate:{type:Date,default:Date.now},
})

module.exports=mongoose.model("TravelStory",travelStorySchema);