require('dotenv').config()
const alert = require('alert');

const models = require("./models/Collections.js");
console.log(models);
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require('ejs');
const app = express();
const PORT = 3000;

const session = require('express-session')
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
        maxAge: 24 * 60 * 60 * 1000
    }

}));
app.use(passport.initialize());
app.use(passport.session());





app.get("/", function(req, res) {

    res.render("credentials");
})
app.listen(PORT, function(req, res) {
    console.log("listening to PORT 3000");
});
app.post("/register", function(req, res) {
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
                    console.log("jedjcwd");
                    passport.authenticate("local")(req, res, function() {
                        res.redirect("/todolist");
                    });
                }
            });
        }
    });



});

app.get("/todolist", function(req, res) {
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
        req.user.lists.push({
            document_no: req.user.lists[req.user.lists.length - 1].document_no + 1,
            list: req.body.newtodo
        });
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
    passport.authenticate('local', {
        successRedirect: '/todolist',
        failureRedirect: '/failuremediate',

    })
);
app.get("/failuremediate", function(req, res) {

    res.redirect("/");
})

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});
app.get("/termsandpolicy", function(req, res) {
    res.render("termsandpolicy");
});
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"], prompt: 'select_account' })
);
app.get("/auth/google/todolist",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {

        // Successful authentication, redirect home.
        res.redirect("/todolist");
    });