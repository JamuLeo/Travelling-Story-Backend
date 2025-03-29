require("dotenv").config();
const config = require("./config.json");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const { authenticateToken } = require("./utilities"); // Fixed spelling of 'authenticateToken'
const upload = require("./multer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const User = require("./models/userModel");
const TravelStory = require("./models/travelStoryModel");

mongoose.connect(config.connectionString);





const app=express();
app.use(express.json());
app.use(cors({origin:"*"}));


//create Account
app.post("/create-account",async(req,res) =>{
    const{fullName,email,password}=req.body;

    if(!fullname || !email || !password){
        return res
        .status(400)
        .json({error:true,message:"All fields are required"});

    } 
    const isUser=await User.findOne({email});
    if(isUser){
      return res 
      .status(400)
      .json({error:true,message:"user already exists"});  
    }
    
    const hashedPassword=await bcrypt.hash(password,10);
    const user=new User({
      fullName,
      email,
      password:hashedPassword,
    });
    await user.save();
    const accessToken=jwt.sign(
  
    {userId:user.id},
    process.env.ACESS_TOKEN_SECRET,
    {
      expiresIn:"72h",
    }
    );

    return res.status(201).json({
      error:false,
      user:{fullname:user.fullName,email:user.email},
      accessToken,
      message:"Registration successful",
      
});






});

//Login
app.post("/login",async(req,res) =>{
  const{email,password}=req.body;

  if(!email || !password){
    return res.status(400).json({message:"Email and password are required"});

  }
  const user=await User.findOne({email});
  if(!user){
    return res.status(400).json({message:"User not found"});
  }

  const isPasswordValid=await bcrypt.compare(password,user.password);

  if(!isPasswordValid){
    return res.status(400).json({message:"invalid credentials"});

  }

  const accessToken=jwt.sign(
  
    {userId:user.id},
    process.env.ACESS_TOKEN_SECRET,
    {
      expiresIn:"72h",
    }
    );

    return res.json({
      error:false,
      message:"Registration successful",
      user:{fullname:user.fullName,email:user.email},
      accessToken,     
});

});


// Get User
app.get("/get-user", authenticateToken, async (req, res) => {
	const { userId } = req.user;
	const isUser = await User.findOne({ _id: userId });
  
	if (!isUser) {
	  return res.sendStatus(401);
	}
  
	return res.json({
	  user: isUser,
	  message: "",
	});
  });
  




//Route to handle image upload
//install multer, npm i multer
app.post("/image-upload",upload.single("image"),async(req,res) =>{
 
  try{
    if(!req.file){
      return res
      .status(400)
      .json({error:true,message:"No image uploaded"});
    }
    const imageUrl='http://localhost:8000/uploads/${req.file.filename}';
    res.status(200).json({imageUrl});

  }catch(error){
    res.status(500).json({error:true,message:error.message});

  }
});

//Delete an image from uploads folder
app.delete("/delete-image",async(req,res)=>{
 const{imageUrl}=req.query;
 if(!imageUrl){
  return res.status(400).json({error:true,message:"imageUrl parameter is required"});

 }

 try{
  //extract the file name from the image url
  const filename=path.basename(imageUrl);

  //Define the file path
  const filePath=path.join(_dirname,"uploads",filename);

  //check if the file exists
  if(fs.existsSync(filePath)){
    //delete the file from the upload folder
    fs.unlinkSync(filePath);
    res.status(200).json({message:"image deleted successfully"});
  }else{
    res.status(200).json({error:true,message:"image not found"});

  }
 }catch(error){
  res.status(500).json({error:true,message:error.message});
 }
});

//serve a static file from the uploads and assets directory
 app.use("/uploads",express.static(path.join(__dirname,"uploads")));
 app.use("/assets",express.static(path.join(__dirname,"assets")));

 //Add travel story
app.post("/add-travel-story",authenticateToken,async(req,res) =>{

  const{title,story,visitedLocation,imageUrl,visitedDate}=req.body;

  const{userId}=req.user
  //validate required field
  if(!title || !story || !visitedLocation || !imageUrl || !visitedDate){
    return res.status(400).json({
      error:true,message:"All fields are required"
    });
  }
  //convert visitedDate from milliseconds to Date object
 const parsedVisitedDate=new Date (parseInt(visitedDate) );
  try{
    const TravelStory=new TravelStory({
  title,
  story,
  visitedLocation,
  userId,
  imageUrl,
  visitedDate:parsedVisitedDate,
    });
    await TravelStory.save();
    res.status(201).json({story:TravelStory,message:"added successfully"});
    
  }catch(error){
    res.status(400).json({error:true,message:error.message});
  }

});

//Get All Travel Story
app.get("/get-all-stories",authenticateToken,async(req,res) =>{
 const{userId}=req.user;

 try{
  const TravelStories=await travelStory.find({userId:userId}).sort({isFavourite:-1});
res.status(200).json({stories:TravelStories});
 }catch(error){
  res.status(500).json({error:true,message:error.nessage});

 }

});

//update travel story
app.put("/edit-story/:id",authenticateToken,async(req,res) =>{
const{id}=req.params;
const{title,story,visitedLocation,imageUrl,visitedDate}=req.body;
const{userId}=req.user;

  //validate required field
  if(!title || !story || !visitedLocation|| !visitedDate){
    return res.status(400).json({
      error:true,message:"All fields are required"
    });
  }
  //convert visitedDate from milliseconds to Date object
 const parsedVisitedDate=new Date (parseInt(visitedDate) );

 try{
  //find the travel story by ID and ensure it belongs to the authenticated user
  const travelStory=await TravelStory.findOne({_id:id,userId:userId});

  if(!travelStory){
    return res.status(404).json({error:true,message:"Travel story not found"});

  }
  //make sure to have image in that folder by this name in ones assets folder,REMEMBER LEO!
  const placeholderImgUrl='http://localhost:8000/assets/placeholder.png';
  travelStory.title=title;
  travelStory.story=story;
  travelStory.visitedLocation=visitedLocation;
  travelStory.imageUrl=imageUrl||placeholderImgUrl;
  travelStory.visitedDate=parsedVisitedDate;
  await travelStory.save();
  res.status(200).json({story:travelStory,message:"Updated successfully"});
 }
 catch(error){
  res.status(500).json({error:true,message:error.message});
    
 }


});
 

//delete travel story
app.delete("/delete-story/:id",authenticateToken,async(req,res) =>{
const{id}=req.params;
const{userId}=req.user;

try{
  //find the travel story by ID and ensure it belongs to the authenticated user
  const travelStory=await TravelStory.findOne({_id:id,userId:userId});

  if(!travelStory){
    return res.status(404).json({error:true,message:"Travel story not found"});

  }
  //delete the travel story the database
  await travelStory.deleteOne({_id:id,userId:userId});

  //extract the file name from the imageUrl
  const imageUrl=travelStory.imageUrl;
  const filename=path.basename(imageUrl);

  //define the file path
  const filePath=path.join(__dirname,"uploads",filename);

  //delete the image file from the upload folder
  fs.unlink(filePath,(err)=>{
    if(!err){
      console.error("failed to delete image file:",err);
     //optionally you could still respond with a success message
      //if you dont want to treat with a critical error
    }
  });
  res.status(200).json({message:"travel story deleted successfully"});
  
}
catch(error){
  res.status(500).json({error:true,message:error.message});
    
 }


});

//update is favourite
app.put("/update-is-favouritey/:id",authenticateToken,async(req,res) =>{
const{is}=req.params;
const{isFavourite}=req.body;
const{userId}=req.user;

try{
  const travelStory=await TravelStory.findOne({_id:id,userId:userId});
  if(!travelStory){
    return res.status(400).json({error:true,message:"Travel story not found"});

  }
  travelStory.isFavourite=isFavourite;
  await travelStory.save();
  res.status(200).json({story:travelStory,message:"update successful"});

}catch(error){
  res.status(500).json({error:true,message:error.message});
    
 }
});

//search trvael stories,need to fix error in this endpoint remember Leo!
/*app.get("/search",autheticateToken,async(req,res) =>{
const{Query}=req.query;
const{userId}=req.user;

if(!query){
  return res.status(404).json({error:true,message:"query is required"});

}

try{

  const searchResults=await TravelStory.find({
    userId:userId,
    $or:{
      {title:{$regex:query,$options:"i")},
      {story:{$regex:query,$options:"i"}},
      {visitedLocation:{$regex:query,$options:"i"}},
},
  }).sort(isFavourite: -1);
  res.status(200).json({stories:searchResults});
}catch(error){
  res.status(500).json({error:true,message:error.message});
    
 }
});
*/

//filter travel stories by date range
app.get("/travel-stories/filter",authenticateToken,async(req,res) =>{
 const {startDate,endDate}=req.query;
 const{userId}=req.user;

 try{
  //convert startDate and endDate from milliseconds to Date objects
  const start= new Date(parseInt(startDate));
  const end=new Date(parseInt(endDate));

  // find travel stories that belong to the authenticated user and fall within the date range
  const filteredStories=await TravelStory.find({
    userId:userId,
    visitedDate:{$gtex:start,$ltex:end}
  }).sort({isFavourite: -1});
  res.status(200).json({stories:filteredStories});

 }catch(error){
  res.status(500).json({error:true,message:error.message});
    
 }
});
app.listen(8000);
module.exports=app;