if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");

const knex = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : '12345',
    database : 'nms'
  }
});
const initializePassport = require("./pwd-config");
initializePassport(passport);

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));




app.get("/", checkAuthenticated, (req, res) => {
  const user=req.user;
  res.render("index.ejs",{name:user});
});

app.get('/user/:id',checkAuthenticated,(req,res)=>{

  const userid=req.params.id;
  knex('notebook').where('uid',userid).then(data=>{
    res.render("notebook.ejs",{users:data,userid:userid})
  })
})
app.get('/createnb/:id',checkAuthenticated,(req,res)=>{
  res.render("createnb.ejs",{id:req.params.id});
})

app.post('/createnb/:id',checkAuthenticated,(req,res)=>{
  try {
    knex('notebook').insert(
      {sem: req.body.sem,
        bookname: req.body.bookname.toUpperCase(),
        year: req.body.year,
        uid: req.params.id,
    }).then(data=>{
      res.render('succesnb.ejs',{cont:'Notebook',id:req.params.id})
    })
  } catch (e){
    res.send(e);
  }
})
app.get('/notebook/:bid',checkAuthenticated,(req,res)=>{
  const bid=req.params.bid;
  knex('note').where('bid',bid).then(data=>{
    res.render("note.ejs",{users:data,bid:bid})
  })
})

app.get('/createnote/:bid',checkAuthenticated,(req,res)=>{
  res.render('createnote.ejs',{bid:req.params.bid})
})


app.post('/createnote/:bid',checkAuthenticated,(req,res)=>{
  try {
    knex('note').insert(
      {info: req.body.info,
        subname: req.body.subname.toUpperCase(),
        category: req.body.category,
        bid: req.params.bid,
        link:req.body.link
    }).then(data=>{
      res.render('succesnb.ejs',{cont:'Note',id:req.params.bid})
    })
  } catch (e){
    res.send(e);
  }
})




app.get("/signin", checkNotAuthenticated, (req, res) => {
  res.render("signin.ejs");
});

app.post(
  "/signin",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/signin",
    failureFlash: true,
  })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    knex('users').insert(
      {id: Date.now().toString(),
        username: req.body.name,
        email: req.body.email,
        password: hashedPassword,
    
    }).then(console.log)


    res.redirect("/signin");
  } catch {
    res.redirect("/register");
  }
});

app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/signin");
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/signin");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.listen(3000,()=>{
  console.log("Server Started");
});
