const express = require('express');
const bodyParser = require('body-parser');
const cookie=require("cookie-parser")
const cors=require("cors");
const path=require("path");
const uep=bodyParser.urlencoded({extended:false});
const MongoClient = require('mongodb').MongoClient;   // using mongodb client to connect to the database
const url = "mongodb://localhost:27017/Mymail";
const flash= require("connect-flash")
const session=require("express-session")
var mongoose = require('mongoose');
var upload=require("express-fileupload")
var nodemailer = require('nodemailer');
var csvParser = require('csv-parse');
var fs = require('fs'); 
var validator = require("email-validator");
const { parse } = require('json2csv');
var transporter

//DB
mongoose.Promise=global.Promise
mongoose.connect(url)

//modal creation
var userschema = mongoose.Schema({
    uname      : String,
    pwd        : String,
    email      : String,
  });

const user=mongoose.model("user",userschema)


/////###### EJS and Usage setup ######//////
const app = express();
app.use(upload({useTempFiles: true}))
app.use(cookie())
app.use(session({ secret: 'abcd' })); // session secret
app.use(bodyParser());
app.use(flash());
app.use(cors());
app.use(express.static(__dirname + '/public'));
app.set('views',path.join(__dirname,'views'));
app.set("view engine","ejs");

///////#### Rendering Login ######//////
app.get("/",(req,res)=>{
    res.render('login',{
        link0: "signup"
    })
})


//## Posting Login ##//
app.post("/",uep,(req,res)=>{
    const uname1=req.body.uname
    const pwd1=req.body.pwd

    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("Mymail");
    var query={uname:uname1,pwd:pwd1}
    dbo.collection("users").find(query).toArray(function(err, result) {
    if (err) console.log(err);
    if(result.length>0)
    {
        user.find({uname:uname1},function(err,uzr){
            me=uzr
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: me[0].email,
                  pass: me[0].pwd
                }
              });
            if (err) return err;
        })
        if(result[0].uname==uname1 && result[0].pwd==pwd1)
        {
            priv=0
            pass=1
            res.redirect("Email")  
            if(result[0].uname=="Admin")
            {
                priv=100
            }
        }
    }
    else
    {
        req.flash("msg", "Your Are Not Registered");
        res.locals.messages = req.flash();
        res.render('login', { 
            link0: "signup"
        });
    }
    db.close();
  })
});
})


///////#### Rendering Email Dashboard ######//////
app.get("/Email",(req,res)=>{
    MongoClient.connect(url,(err, db)=>{
        if (err) throw err;
        var dbo = db.db("Mymail");
        dbo.collection("contacts").find({user:me[0].uname}).toArray(function(err,ct_result) {
            ct=ct_result
        })
        dbo.collection("template").find({}).toArray(function(err,result) {
            if(pass==1){tp=result}
            res.render("Email",{
                link3:"view_user_contact",
                ck:0,
                cntct:ct,
                content: tp,
                sentmails:"sentmail",
                contacts:"contacts",
                update:"update",
                template:"template",
                logout:"logout",
                link1: "Email",
                link4:"requests"
            })
        })
    })
    
})


app.get("/requests",(req,res)=>{
    MongoClient.connect(url,(err,db)=>{
        if (err) throw err;
        var dbo=db.db("Mymail")
        dbo.collection("temp_users").find({}).toArray(function(err,result) {
            
        res.render("requests",{
        link4:"requests",
        link3:"view_user_contact",
        maildata:result,
        sentmails:"sentmail",
        contacts:"contacts",
        update:"update",
        template:"template",
        logout:"logout",
        link1: "Email",
        })
    })
})
})

app.post("/requests",(req,res)=>{
    const reqidd=req.body.reqid
    const a=(reqidd.length-1)
    const id=reqidd.substring(0,(a))
    console.log(id)
    if(reqidd.charAt(a)==1)
    {
        MongoClient.connect(url,(err,db)=>{
            if (err) throw err;
            var dbo=db.db("Mymail")
            dbo.collection("temp_users").find({}).toArray(function(err,result) {
                for(var i=0;i<result.length;i++)
            {
                if(result[i]._id==id)
                {
                    var a=result[i]
                }
                else{continue}
            }
            dbo.collection("users").insertOne(a, (err, res)=>{})
            dbo.collection("temp_users").deleteOne(a, function(err, res) {})
            res.redirect("requests")
    })
    })
    }
    else
    {
        MongoClient.connect(url,(err,db)=>{
            if (err) throw err;
            var dbo=db.db("Mymail")
            dbo.collection("temp_users").find({}).toArray(function(err,result) {
                for(var i=0;i<result.length;i++)
            {
                if(result[i]._id==id)
                {
                    var a=result[i]
                }
                else{continue}
            }
        dbo.collection("temp_users").deleteOne(a, function(err, res) {})
            })
        })
        res.redirect("requests")
    }
    /*MongoClient.connect(url,(err,db)=>{
        if (err) throw err;
        var dbo=db.db("Mymail")
        dbo.collection("temp_users").find({}).toArray(function(err,result) {
            console.log(result)
    res.render("requests",{
        link4:"requests",
        link3:"view_user_contact",
        maildata:result,
        sentmails:"sentmail",
        contacts:"contacts",
        update:"update",
        template:"template",
        logout:"logout",
        link1: "Email",
        })
    })
})*/
})

///### POSTING Email ###///
app.post("/Email",uep,(req,res)=>{
    const ctt=req.body.ct
    const tmp=req.body.tplte
    const em=req.body.toaddress
    const sj=req.body.sbj
    const by=req.body.editordata
    const id=req.body.custId
    const f_nam=req.files.foo.name
    MongoClient.connect(url,(err, db)=>{
        if (err) throw err;
        var dbo = db.db("Mymail");
        dbo.collection("contacts").find({Contact_name:ctt}).toArray(function(err,result) {
            if(result.length>0)
            {
                res.render("with_cont",{
                    link3:"view_user_contact",
                ck:0,
                tpem:em,
                ctcontent:result,
                content: tp,
                cntct:ct,
                sentmails:"sentmail",
                contacts:"contacts",
                update:"update",
                template:"template",
                logout:"logout",
                link1: "Email",
                link4:"requests",
                })
            }
            else
            {
                
            }
        })
        dbo.collection("template").find({subject:tmp}).toArray(function(err,result) {

            if(result.length>0)
            {
                res.render("with_temp",{
                    link3:"view_user_contact",
                ck:0,
                tpem:em,
                tpcontent:result,
                content: tp,
                cntct:ct,
                sentmails:"sentmail",
                contacts:"contacts",
                update:"update",
                template:"template",
                logout:"logout",
                link1: "Email",
                link4:"requests",
                })
            }
            else if(by!="<p><br></p>" && id==1){
                if(f_nam==""){
                var mailOptions = {
                    from: me[0].email,
                    to: em,
                    subject: sj,
                    html: by
                  };
                  var add_db = {
                    name:me[0].uname,
                    from: me[0].email,
                    to: em,
                    subject: sj,
                    html: by
                  }
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                        var dbo = db.db("Mymail");
                        dbo.collection("sentmails").insertOne(add_db,(err,res)=>{
                            if (err) throw err;
                            console.log("added to sent")
                        })
                      console.log('Email sent: ' + info.response);
                      req.flash("msg", "Mail Sent Successfully");
                      res.locals.messages = req.flash();
                      var dbo = db.db("Mymail");
                      dbo.collection("template").find({}).toArray(function(err,result) {
                      tp=result
                      res.render("Email",{
                        link3:"view_user_contact",
                        ck:0,
                        cntct:ct,
                        content: tp,
                        sentmails:"sentmail",
                        contacts:"contacts",
                        update:"update",
                        template:"template",
                        logout:"logout",
                        link1: "Email",
                        link4:"requests",
                        })
                    })
                    }
                  });
            }
            else
            {   
                var attac=[]
                for(var i=0;i<(req.files.foo.length);i++)
                {
                    req.files.foo[i].mv(__dirname+"/attachments/"+(req.files.foo[i].name))
                    const f_loc=__dirname+"/attachments/"+(req.files.foo[i].name)
                    attac.push({filename:req.files.foo[i].name,
                        path:f_loc})
                }
                
                    var mailOptions = {
                        from: me[0].email,
                        to: em,
                        subject: sj,
                        html: by,
                        attachments:attac
                      };
                      var add_db={
                        name:me[0].uname,
                        from: me[0].email,
                        to: em,
                        subject: sj,
                        html: by,
                        attachments:attac
                      }
                      transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                          
                        } else {
                            var dbo = db.db("Mymail");
                          dbo.collection("sentmails").insertOne(add_db,(err,res)=>{
                              if (err) throw err;
                              console.log("added to sent")
                          })
                          console.log('Email sent: ' + info.response);
                          req.flash("msg", "Mail Sent Successfully");
                          res.locals.messages = req.flash();
                          var dbo = db.db("Mymail");
                          dbo.collection("template").find({}).toArray(function(err,result) {
                          tp=result
                          res.render("Email",{
                            link3:"view_user_contact",
                            ck:0,
                            cntct:ct,
                            content: tp,
                            sentmails:"sentmail",
                            contacts:"contacts",
                            update:"update",
                            template:"template",
                            logout:"logout",
                            link1: "Email",
                            link4:"requests",
                            })
                        })
                        }
                      });


                
                
                /*req.files.foo.mv(__dirname+"/attachments/"+f_nam)
                const f_loc=__dirname+"/attachments/"+f_nam
                fs.readFile(f_loc,function(err,data){
                    var mailOptions = {
                        from: me[0].email,
                        to: em,
                        subject: sj,
                        html: by,
                        attachments: [{
                            filename:f_nam,
                            path:f_loc
                          }]
                      };
                      var add_db={
                        name:me[0].uname,
                        from: me[0].email,
                        to: em,
                        subject: sj,
                        html: by,
                        attachments: [{
                            filename:f_nam,
                            path:f_loc
                          }]
                      }
                      transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                          
                        } else {
                            var dbo = db.db("Mymail");
                          dbo.collection("sentmails").insertOne(add_db,(err,res)=>{
                              if (err) throw err;
                              console.log("added to sent")
                          })
                          console.log('Email sent: ' + info.response);
                          req.flash("msg", "Mail Sent Successfully");
                          res.locals.messages = req.flash();
                          var dbo = db.db("Mymail");
                          dbo.collection("template").find({}).toArray(function(err,result) {
                          tp=result
                          res.render("Email",{
                            link3:"view_user_contact",
                            ck:0,
                            cntct:ct,
                            content: tp,
                            sentmails:"sentmail",
                            contacts:"contacts",
                            update:"update",
                            template:"template",
                            logout:"logout",
                            link1: "Email",
                            link4:"requests",
                            })
                        })
                        }
                      });


                })
                */
            }
            }
            else{
                if(by=="<p><br></p>")
                {
                req.flash("msg", "Mail Body or Subject is Empty");
                res.locals.messages = req.flash();
                }
                var dbo = db.db("Mymail");
                dbo.collection("template").find({}).toArray(function(err,result) {
                tp=result
                res.render("Email",{
                    link3:"view_user_contact",
                        ck:0,
                        cntct:ct,
                        content: tp,
                        sentmails:"sentmail",
                        contacts:"contacts",
                        update:"update",
                        template:"template",
                        logout:"logout",
                        link1: "Email",
                        link4:"requests",
                        })
                    })
            }
            })
        })
})

///////#### Rendering Sent mails ######//////
app.get("/sentmail",(req,res)=>{
    MongoClient.connect(url,(err,db)=>{
        if (err) throw err;
        var dbo=db.db("Mymail")
        dbo.collection("sentmails").find({name:me[0].uname}).toArray(function(err,result) {
            res.render("sentmail.ejs",{
                link3:"view_user_contact",
                maildata:result,
                sentmails:"sentmail",
                contacts:"contacts",
                update:"update",
                template:"template",
                logout:"logout",
                link1: "Email",
                link4:"requests",
                })
        })
    })
    
})

///////#### Viewing Sent mails ######//////
app.post("/viewsent",(req,res)=>{
    const stid=req.body.sentid
    MongoClient.connect(url,(err,db)=>{
        if (err) throw err;
        var dbo=db.db("Mymail")
        dbo.collection("sentmails").find({}).toArray(function(err,result) {
            if (err) throw err;
            for(var i=0;i<result.length;i++)
            {
                if(result[i]._id==stid)
                {
                    var a=result[i]
                }
                else{continue}
            }
            res.render("viewsent.ejs",{
                link3:"view_user_contact",
                maildata:a,
                sentmails:"sentmail",
                contacts:"contacts",
                update:"update",
                template:"template",
                logout:"logout",
                link1: "Email",
                link4:"requests",
                })
        })
    })
    
})


///////#### Rendering Signup ######//////
app.get("/signup",(req,res)=>{
    res.render('signup',{
        link1: "/",
    })
})


//## Posting Signup ##//
app.post("/signup",uep,(req,res)=>{
    const uname=req.body.Username
    const pwd=req.body.password
    const email=req.body.email
    const cpwd=req.body.cpassword
    if(pwd==cpwd){
    MongoClient.connect(url,(err, db)=>{
    if (err) throw err;
    var dbo = db.db("Mymail");
    dbo.collection("users").find({'uname':uname}).toArray(function(err,result) {
        if (err) console.log(err);
        if(result.length>0)
        {
            req.flash("msg1", "Username Already Exists");
            res.locals.messages = req.flash();
            res.render('signup',{
                link1:"/"
            })
        }
        if(result.length==0)
        {
            var myobj = {uname,pwd,email};
            if(uname=="Admin")
            {
                dbo.collection("users").insertOne(myobj, (err, res)=>{     //inserting the object into the database
                if (err) throw err;
                console.log("1 User Registered");
                db.close();
                })
                req.flash("msg1", "Admin Registered Successfully");
                res.locals.messages = req.flash();
                res.render('signup',{
                    link1:"/"
                })
            }
            else
            {
                dbo.collection("temp_users").insertOne(myobj, (err, res)=>{     //inserting the object into the database
                if (err) throw err;
                console.log("1 User Registered");
                db.close();
                })
                req.flash("msg1", "User Registered Successfully, Please Await Admin Confirmation");
                res.locals.messages = req.flash();
                res.render('signup',{
                    link1:"/"
                })
            }
        }
    })
    });
}
else
{
    req.flash("msg1", "Password and Confirm Don't Match");
            res.locals.messages = req.flash();
            res.render('signup',{
                link1:"/"
            })
}
})

///////#### Rendering template ######//////
app.get("/template",(req,res)=>{
    res.render('template',{
        link3:"view_user_contact",
        sentmails:"sentmail",
        contacts:"contacts",
        update:"update",
        template:"template",
        logout:"logout",
        link1: "Email",
        link4:"requests",
    })
})

///### Posting Template ###///
app.post("/template",uep,(req,res)=>{
        const tempsub=req.body.tsub
        const tempbdy=req.body.editordata
        MongoClient.connect(url,(err, db)=>{
            if (err) throw err;
            var dbo = db.db("Mymail");
            myobj={
                subject:tempsub,
                body:tempbdy
            }
            dbo.collection("template").insertOne(myobj, (err, res)=>{
                if (err) throw err;
                console.log("1 Template Added");
                db.close();
            })
            req.flash("msg", "Template Added Successfully");
            res.locals.messages = req.flash();
            res.render('template',{
                link3:"view_user_contact",
                sentmails:"sentmail",
                contacts:"contacts",
                update:"update",
                template:"template",
                logout:"logout",
                link1: "Email"
                ,link4:"requests",
            })
        })
}
)

///////#### Rendering Update ######//////
app.get("/update",(req,res)=>{
    res.render('update',{
        link3:"view_user_contact",
        name:me[0].uname,
        email:me[0].email,
        sentmails:"sentmail",
        contacts:"contacts",
        update:"update",
        template:"template",
        logout:"logout",
        link1: "Email",
        link4:"requests",
    })
})

///### Posting Update ###///
app.post("/update",uep,(req,res)=>{
    const name=req.body.one
    const upmail=req.body.two
    const password=req.body.three
    const Confirm_pwd=req.body.four

    ////### Updating User Details ###////
    if(password==Confirm_pwd)
    {
    user.remove({ uname:name }, function(err) {
    });
    var newUser=new user({uname:name,email:upmail,pwd:password})
    newUser.save(function(err,uzr){
        if (err) return console.error(err); 
        console.log(uzr.uname + ", Your Profile has been Updated"); 
    })
    req.flash("msg", "Profile Updated Successfully, Please Login in Again");
    res.locals.messages = req.flash();
    res.render('login',{
        link0: "signup"
    })
    }
    else
    {
        req.flash("msg", "Password and Confirm Do not Match");
        res.locals.messages = req.flash();
        res.render('update',{
            link3:"view_user_contact",
            name:me[0].uname,
            email:me[0].email,
            sentmails:"sentmail",
            contacts:"contacts",
            update:"update",
            template:"template",
            logout:"logout",
            link1: "Email",
            link4:"requests",
        })
    }
})

///////#### Rendering Contacts ######//////
app.get("/contacts",(req,res)=>{
    MongoClient.connect(url,(err, db)=>{
        if (err) throw err;
        var dbo = db.db("Mymail");
    
        dbo.collection("contacts").find({user:me[0].uname}).sort({Contact_name:1}).toArray(function(err,ct_result) {
            res.render("contacts",{
                link3:"view_user_contact",
                link2:"updatecontact",
                contct:ct_result,
                sentmails:"sentmail",
                contacts:"contacts",
                update:"update",
                template:"template",
                logout:"logout",
                link1: "Email",
                link4:"requests",
            })
        })
        
})
})

///### Posting Contacts ###///
app.post("/contacts",uep,(req,res)=>{
    const cnam=req.body.cname
    const cml=req.body.cmail
    MongoClient.connect(url,(err, db)=>{
        if (err) throw err;
        var dbo = db.db("Mymail");
        myobj={
            Contact_name:cnam,
            Contact_mail:cml,
            user:me[0].uname
        }
        dbo.collection("contacts").insertOne(myobj, (err, res)=>{
            if (err) throw err;
            console.log("1 Contact Added");
        })
        dbo.collection("contacts").find({user:me[0].uname}).sort({Contact_name:1}).toArray(function(err,ct_result) {
            req.flash("msg", "Contact Added Successfully");
        res.locals.messages = req.flash();
        res.render("contacts",{
            link3:"view_user_contact",
            contct:ct_result,
            sentmails:"sentmail",
            contacts:"contacts",
            update:"update",
            template:"template",
            logout:"logout",
            link1: "Email",
            link4:"requests",
        })
        })
    })
})

/////####  Excel Contacts Upload  ####/////
app.post('/upload',(req, res)=>{
    const f_nam=req.files.foo.name
    if(f_nam=="")
    {
        MongoClient.connect(url,(err, db)=>{
            if (err) throw err;
            var dbo = db.db("Mymail");
            dbo.collection("contacts").find({user:me[0].uname}).sort({Contact_name:1}).toArray(function(err,ct_result) {
                    req.flash("msg", "No File Selected");
                    res.locals.messages = req.flash();
                    res.render("contacts",{
                        link3:"view_user_contact",
                    contct:ct_result,
                    sentmails:"sentmail",
                    contacts:"contacts",
                    update:"update",
                    template:"template",
                    logout:"logout",
                    link1: "Email",
                    link4:"requests",
                    })
                })
                })
    }
    else
    {
    const f_loc=req.files.foo.tempFilePath
    console.log(f_loc)
    console.log(req.files.foo); // the uploaded file object
    MongoClient.connect(url,(err, db)=>{
        if (err) throw err;
        var dbo = db.db("Mymail");
    fs.readFile(f_loc, {
        encoding: 'utf-8'
    }, function(err, csvData) {
        if (err) {
            console.log(err);
        }
        csvParser(csvData, {
            delimiter: ',' 
        }, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                for(var i=1;i<data.length;i++)
                {
                    myobj={
                        Contact_name:data[i][0],
                        Contact_mail:data[i][1],
                        user:me[0].uname
                    }
                    dbo.collection("contacts").insertOne(myobj, (err, res)=>{
                        if (err) throw err;
                        console.log("1 Contact Added");
                    })
                }
    
                dbo.collection("contacts").find({user:me[0].uname}).sort({Contact_name:1}).toArray(function(err,ct_result) {
                req.flash("msg", "Contacts Imported Successfully");
                res.locals.messages = req.flash();
                res.render("contacts",{
                    link3:"view_user_contact",
                contct:ct_result,
                sentmails:"sentmail",
                contacts:"contacts",
                update:"update",
                template:"template",
                logout:"logout",
                link1: "Email",
                link4:"requests",
                })
                })
            
            }
        });
    })
})
}
});

/////####  Excel Contacts Download  ####/////
app.post('/download',(req, res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Mymail");
        dbo.collection("contacts").find({user:me[0].uname}).sort({Contact_name:1}).toArray(function(err,ct_result) {
            var stripresult=[]
            for(var i=0;i<(ct_result.length);i++)
            {
                stripresult.push({Contact_name:ct_result[i].Contact_name,
                Contact_mail:ct_result[i].Contact_mail})
            }
            var fields=["Contact_name","Contact_mail"]
            var opts={fields}
            try {
                const csv = parse(stripresult, opts);
                fs.writeFile('file.csv', csv, function(err) { //currently saves file to app's root directory
                  if (err) throw err;
                  console.log('file saved');
                  res.download(__dirname+"/file.csv")
                });
              } catch (err) {
                console.error(err);
              }
        })
        
    })

})

/////####  attactment Contacts Download  ####/////
app.post('/download_attachments',(req, res)=>{
    const att_name=req.body.att_nam
    const att_path=req.body.att_pat
    res.download(att_path)
})

///## Rendering Priviledge section ##///
app.get("/view_user_contact",(req,res)=>{
    MongoClient.connect(url,(err, db)=>{
        if (err) throw err;
        var dbo = db.db("Mymail");
        dbo.collection("users").find({}).sort({uname:1}).toArray(function(err,ct_result) {
            res.render("view_user_contact",{
                link3:"view_user_contact",
                link2:"updatecontact",
                contct:ct_result,
                sentmails:"sentmail",
                contacts:"contacts",
                update:"update",
                template:"template",
                logout:"logout",
                link1: "Email",
                link4:"requests",
            })
        })   
})
})


///### DELETE Contacts ###///
app.delete("/api/delete/:id",(req,res)=>{
    const id=req.params.id
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Mymail");
        dbo.collection("contacts").find({}).toArray(function(err, result) {
            if (err) throw err;
            for(var i=0;i<result.length;i++)
            {
                if(result[i]._id==id)
                {
                    var a=result[i]
                }
                else{continue}
            }
            dbo.collection("contacts").deleteOne(a, function(err, obj) {
                if (err) throw err;
                console.log("1 document deleted");
                db.close();
              })

        })

        res.send(200)
      })
})


///### Rendering and Post update Contacts ###///
app.post("/update_ctc",uep,(req,res)=>{
    const id=req.body.ctid
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Mymail");
        dbo.collection("contacts").find({}).toArray(function(err, result) {
          if (err) throw err;
          for(var i=0;i<result.length;i++)
          {
              if(result[i]._id==id)
              {
                  var a=result[i]
              }
              else{continue}
          }
          res.render("updatecontact",{
            link3:"view_user_contact",
                ct_detail:a,
                sentmails:"sentmail",
                contacts:"contacts",
                update:"update",
                template:"template",
                logout:"logout",
                link1: "Email",
                link4:"requests",
        })
          
        });
      }); 
    
})

app.post("/update_contact",(req,res)=>{
    const id=req.body.ctid
    const upname=req.body.cname
    const upmail=req.body.cmail
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Mymail");
        var newvalues = { $set: {Contact_name: upname, Contact_mail: upmail,user:me[0].uname} };
        dbo.collection("contacts").find({}).toArray(function(err, result) {
            if (err) throw err;
            for(var i=0;i<result.length;i++)
            {
                if(result[i]._id==id)
                {
                    var a=result[i]
                }
                else{continue}
            }
            dbo.collection("contacts").updateOne(a, newvalues, function(err, res) {
            if (err) throw err;
            console.log("1 document updated");
            
            db.close();
        })
        });
      });
      res.redirect("contacts") 
})

///////#### Rendering Logout ######//////
app.get("/logout",(req,res)=>{
    me=null
    tp=null
    pass=0
    res.render('logout',{
        link1: "/",
    })
})

////### Ajax Display ###////
app.post('/jquery/submitData',(req,res)=>{
    var x=req.body.myData
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Mymail");
        dbo.collection("contacts").find({user:x}).toArray(function(err, result) {
            res.send(result)
        })
    })
})

app.post('/jquery/emailvalid',(req,res)=>{
    var x=req.body.myData
    console.log(x)
    res.send(validator.validate(x))
    
})

////### Listining Port ###////
const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log('Server is up on port',port)
})
