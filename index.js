require('dotenv').config()

const nodemailer = require('nodemailer');

const md5 = require('md5');
const models = require("./models/Collections.js");



const flash = require('connect-flash');

const express = require("express");

const bodyparser = require("body-parser");

const ejs = require('ejs');

const app = express();

app.use(flash());

const PORT = 3000;

const session = require('express-session');

const passport = require("passport");


app.use(bodyparser.urlencoded({
    extended: true
}));

app.use(bodyparser.json());

app.use(express.static('public'));

app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000
    }




}));

app.use(passport.initialize());

app.use(passport.session());


app.get("/", function(req, res) {

    let message = req.flash("error");
    let success_msg = req.flash("success");
    console.log(req.session);

    res.render("credentials", { messages: message, successmessages: success_msg });
});

app.listen(PORT, function(req, res) {
    console.log("listening to PORT 3000");
});

app.post("/register", function(req, res) {
    console.log(req.body);
    console.log(req.flash("error"));
    models.User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            let list_one = {
                document_no: 1,
                list: "Use '+' to add and '-' to delete "
            };

            user.lists.push(list_one);
            user.save(function(e) {
                if (e) {
                    res.redirect("/");
                } else {

                    passport.authenticate("local")(req, res, function() {
                        console.log(req.body.signupremember.length + " " + req.body.signupremember);
                        if (req.body.signupremember.length === 13) {

                            req.session.cookie.expires = false; //4 weeks
                        } else {
                            var hour = 3600000;
                            req.session.cookie.maxAge = 2 * 14 * 24 * hour;

                        }
                        console.log(req.session.cookie);


                        res.redirect("/todolist");
                    });
                }
            });
        }
    });



});

app.get("/todolist", function(req, res) {
    console.log(req.session.cookie);
    if (req.isAuthenticated()) {
        const date = new Date();
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        let month = months[date.getMonth()];

        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

        let day = days[date.getDay()];

        let dates = date.getDate();

        res.render("index", { thisday: day, thismonth: month, thisdate: dates, array: req.user.lists, user: req.user });
    } else {
        res.render("nonauthenticated");
    }
});
app.post("/addlist", function(req, res) {
    if (req.isAuthenticated()) {
        if (req.user.lists.length >= 1) {
            req.user.lists.push({
                document_no: req.user.lists[req.user.lists.length - 1].document_no + 1,
                list: req.body.newtodo
            });
        } else {
            req.user.lists.push({
                document_no: 1,
                list: req.body.newtodo
            });
        }
        req.user.save(function(e) {
            res.redirect("/todolist");
        });

    } else {
        res.render("nonauthenticated");
    }




});
app.post("/deletelists", function(req, res) {
    let arr = req.body.listtodelete;
    console.log(arr);
    let i = 0;
    for (; i < arr.length; i++) {
        let no = Number(arr[i]);
        let j = 0;
        for (; j < req.user.lists.length; j++) {
            if (no === req.user.lists[j].document_no) {
                break;
            } else {
                continue;
            }
        }
        req.user.lists.splice(j, 1);

    }
    req.user.save(function(e) {
        res.redirect("/todolist");
    });




});
app.post("/checkuser", function(req, res) {
    models.User.find({ username: req.body.username }, function(err, docs) {
        if (err) {
            res.json({ found: "error" });
        } else {
            if (docs.length === 0) {
                res.json({ found: false });
            } else {
                res.json({ found: true });
            }
        }
    });

});
app.post('/login',
    passport.authenticate('local', { failureRedirect: '/failuremediate' }),
    function(req, res) {


        if (req.body.remember.length === 13) {
            req.session.cookie.expires = false;

        } else {
            var hour = 3600000;
            req.session.cookie.maxAge = 2 * 14 * 24 * hour;
        }
        console.log(req.session.cookie);

        res.redirect('/todolist');
    });
app.get("/failuremediate", function(req, res) {
    req.flash("error", "Invalid user name or password");

    res.redirect("/");
});


app.get("/logout", function(req, res) {

    req.logout();
    req.session.destroy(function(err) {
        res.redirect("/");
    });

});
app.get("/termsandpolicy", function(req, res) {
    res.render("termsandpolicy");
});
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"], prompt: 'select_account' })
);
app.get("/auth/google/todolist",
    passport.authenticate('google', { failureRedirect: "/intermediate" }),
    function(req, res) {
        req.session.cookie.maxAge = 86400000;
        // Successful authentication, redirect home.

        res.redirect("/todolist");
    });
app.get("/intermediate", function(req, res) {
    req.flash("error", "google authentication failed");
    res.redirect("/");
});

app.get("/forgotpassword", function(req, res) {
    let message = req.flash("error");
    res.render("forgotpassword", { messages: message });
});

function generateOTP() {

    // Declare a digits variable 
    // which stores all digits
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}
app.post("/forgotpassword", function(req, res) {
    models.User.find({ username: req.body.username }, function(err, docs) {
        if (err) {
            req.flash("error", "Got an error try again");
            res.redirect("/forgotpassword");
        } else {
            if (docs.length === 1) {
                let a = generateOTP();
                docs[0].otp = md5(a);
                docs[0].save();
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD
                    }
                });

                var mailOptions = {
                    from: process.env.EMAIL,
                    to: "" + req.body.email,
                    subject: 'OTP FOR TODOLIST',
                    text: "YOUR OTP TO SET NEW PASSWORD" + " " + a
                };

                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        req.flash("error", "Got an error try again");
                        res.redirect("/forgotpassword");
                    } else {
                        res.redirect("/changepassword/" + req.body.username);
                    }
                });
            } else {
                req.flash("error", "User not found");
                res.redirect("/forgotpassword");

            }
        }


    });

});
app.get("/changepassword/:username", function(req, res) {
    let message = req.flash("error");
    console.log(req.params["username"]);
    res.render("changepassword", { messages: message });
});
app.post("/changepassword/:username", function(req, res) {
    console.log(req.params["username"]);
    models.User.find({ username: req.params["username"] }, function(err, docs) {
        if (err) {
            req.flash("error", "Got an error try again");
            res.redirect("/changepassword/" + req.params["username"]);
        } else {
            if (docs.length == 1) {
                if (md5(req.body.otp) === docs[0].otp) {
                    docs[0].setPassword(req.body.password, function(error, user) {
                        if (error) {
                            req.flash("error", "Got an error try again");
                            res.redirect("/changepassword/" + req.params["username"]);
                        } else {
                            req.flash("success", "Password changed successfully");
                            docs.otp = md5(generateOTP());
                            docs[0].save();

                            res.redirect("/");
                        }
                    });

                } else {
                    req.flash("error", "OTP is wrong");
                    res.redirect("/changepassword/" + req.params["username"]);
                }
            } else {
                req.flash("error", "User not found");
                res.redirect("/changepassword/" + req.params["username"]);
            }

        }
    });

});