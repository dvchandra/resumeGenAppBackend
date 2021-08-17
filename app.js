require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const app = express();
const cors = require('cors');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LocalStrategy = require("passport-json").Strategy;
app.use(session({
  secret: 'Dv App',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static("public"));
app.set("view engine","ejs");
const whitelist = ['http://localhost:3000', 'http://localhost:8080', 'https://resumegenapp.herokuapp.com','https://resume-genapp-bend.herokuapp.com']
const corsOptions = {
  origin: function (origin, callback) {
    console.log("** Origin of request " + origin)
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      console.log("Origin acceptable")
      callback(null, true)
    } else {
      console.log("Origin rejected")
      callback(new Error('Not allowed by CORS'))
    }
  }
}
app.use(cors(corsOptions))
app.use(express.json());
app.use(bodyParser.urlencoded({
  extended:true
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb+srv://admin-dv:Dv@atlas@cluster0.1lxq1.mongodb.net/resumeDatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex",true);
const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  facebookId:String,
  secret:String,
  fname:String,
  lname:String,
  age:String,
  gender:String,
  address:String,
  phoneno:String,
  userReqId:String,
  experience:[]

});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
app.get("/", function(req, res){
  res.send("welcome to backend");
});
app.get("/login", function(req, res){
  res.render("login");
});
app.get("/register", function(req, res){
  res.render("register");
});
app.get('/logout',function(req,res) {
  req.logout();
  res.redirect("/");
});
app.post("/sendResumeData", (req, res) => {
  console.log("In sendResumeData",req.body);
  User.findById(req.body.objId,function(err,foundUser) {
    if(err){
      console.log(err);
      console.log("not found");
    } else{
      if(foundUser){
        console.log("found");
        foundUser.fname=req.body.fname,
        foundUser.lname=req.body.lname,
        foundUser.age=req.body.age,
        foundUser.gender=req.body.gender,
        foundUser.email=req.body.email,
        foundUser.address=req.body.address,
        foundUser.phoneno=req.body.phoneno,
        foundUser.experience=req.body.experience
        foundUser.save(function(){
          res.send("user Data saved");
        })
      }
    }
  })
});
app.post("/signup",(req,res)=>{
  console.log("sign up");
  // User.register({username:req.body.email},req.body.password,function(err,user){
  //   if(err){
  //     console.log(err);
  //     res.send({err,flag:false});
  //   } else{
  //     passport.authenticate("local")(req,res,function(){
  //     const userId = user._id;
  //     res.send({userId,flag:true});
  //   });}
  // });
  // User.findOrCreate({ username: req.body.email }, function (err, user) {
  //   if(user){
  //     console.log("found");
  //   }
  //   else{
  //     console.log("not found");
  //   }
  // });
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      username:req.body.name,
      email:req.body.email,
      password:hash
    });
    newUser.save(function(err){
      if(err){
        res.send({signup:"User already exist",flag:false});
      } else{
        console.log("user saved");
        res.send({signup:"Sucessfully created User",flag:true});
      }
    });
});
});

app.post("/loginUser",function(req, res, next) {
  const  username=req.body.name;
  const  email=req.body.email;
  const  password=req.body.password;
  User.findOne({ email: email },function(err,foundUser){
    if(err){
      console.log(err);
    } else{
      if(foundUser){
        bcrypt.compare(password, foundUser.password, function(err, result) {
            if(result === true){
              const userId = foundUser._id;
              const username = foundUser.username;
              res.send({userId,username,flag:true});
              console.log("logged in");
            }
            else{
              res.send({err:"User not found",flag:false});
              console.log("logged in");
            }
        });
      }
      else if(!foundUser){
          res.send({err:"User not found",flag:false});
      }
    }
  })
});
//#login
// ,function(req,res){
//   const user = new User({
//     username:req.body.email,
//     password:req.body.password
//   });

  // req.login(user,function(err){
  //   if(err){
  //     console.log(err);
  //   } else{
  //     passport.authenticate("local")(req,res,function(){
  //     const userId = user._id;
  //     res.send({userId,flag:true});
  //     console.log("logged in");
  //   });
  //     console.log("logged out");
  // }
  // })
const PORT = process.env.PORT || 8080;
app.listen(PORT, function(){
  console.log("Server started on port 8080.");
});
//Extra Code
//###LocalStrategy
// const customFields={
//   usernameField:"email",
//   passwordField:"password"
// }
// const verifyCallback = (username,password,done)=>{
//   User.findOne({ username: username })
//   .then((user)=>{
//     if (!user) { return done(null, false); }
//
//     else return done(null, user);
    // const isValid = validPassword(password,user.hash,user.salt);
    // if(isValid){
    //   return done(null, user);
    // } else{
    //   return done(null, false);
    // }
//   }).catch((err)=>{
//     done(err);
//   });
// }
// const strategy = new LocalStrategy(customFields , verifyCallback);
// passport.use(strategy);
//##Facebook and GoogleStrategy
// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secrets"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));
// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: "http://localhost:3000/auth/facebook/secrets"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));
//##rendering secrets
// app.get("/secrets", function(req, res){
//   User.find({"secret":{$ne:null}},function(err,foundUsers) {
//     if(err){
//       console.log(err);
//     } else{
//       if(foundUsers){
//         res.render("secrets",{userWithSecrets:foundUsers});
//       }
//     }
//   });
// });
// app.get("/secrets", function(req, res){
//   if(req.isAuthenticated()){
//     res.render("secrets");
//   }else{
//     res.redirect("/login");
//   }
// });
// app.post("/register", function(req, res){
//   User.register({username:req.body.username},req.body.password,function(err,user){
//     if(err){
//       console.log(err);
//       req.redirect("/register");
//     } else{
//       passport.authenticate("local")(req,res,function(){
//         res.redirect("/secrets");
//       });
//     }
//   });
// });
//##google authenticate
// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile'] }));
//
// app.get('/auth/google/secrets',
//     passport.authenticate('google', { failureRedirect: '/login' }),
//     function(req, res) {
//       // Successful authentication, redirect home.
//       res.redirect('/secrets');
//     });
// app.get('/auth/facebook',
//       passport.authenticate('facebook'));
//
// app.get('/auth/facebook/secrets',
//       passport.authenticate('facebook', { failureRedirect: '/login' }),
//       function(req, res) {
//         // Successful authentication, redirect home.
//         res.redirect('/secrets');
//       });
// app.get("/submit",function(req,res) {
//   if(req.isAuthenticated()){
//     res.render("submit");
//   }else{
//     res.redirect("/login");
//   }
// });
// app.post("/submit",function(req,res) {
//   const submittedsecret = req.body.secret;
//   User.findById(req.user.id,function(err,foundUser) {
//     if(err){
//       console.log(err);
//     } else{
//       if(foundUser){
//         foundUser.secret=submittedsecret;
//         foundUser.save(function(){
//           res.redirect("/secrets");
//         })
//       }
//     }
//   })
// });
