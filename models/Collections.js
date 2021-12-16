const mongoose = require("mongoose");

const passportlocalmongoose = require("passport-local-mongoose");

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const findOrCreate = require('mongoose-findorcreate');

const passport = require("passport");

const session = require('express-session');

mongoose.connect("mongodb://localhost:27017/DB");




const userschema = new mongoose.Schema({
    username: String,
    password: String,
    otp: String,
    lists: [{ document_no: Number, list: String }]
});

userschema.plugin(passportlocalmongoose); //automatically do hash+salt our passwords

userschema.plugin(findOrCreate);

const usermodel = mongoose.model("user", userschema);

passport.use(usermodel.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    usermodel.findById(id, function(err, user) {
        done(err, user);
    });
});
passport.use(new GoogleStrategy({

        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/todolist",


    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        let flag = 0;
        usermodel.find({ username: profile.displayName }, function(err, docs) {
            if (docs.length > 0) {
                flag = 1;
            }
            usermodel.findOrCreate({ username: profile.displayName }, function(err, user) {
                if (flag == 0) {
                    let list_one = {
                        document_no: 1,
                        list: "Use '+' to add and '-' to delete "
                    };

                    user.lists.push(list_one);
                    user.save(function(e) {

                        return cb(err, user);
                    });
                } else {
                    return cb(err, user);
                }

            });


        });
    }
));
module.exports = {
    User: usermodel,

}