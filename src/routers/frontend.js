const express = require('express');
const router = new express.Router();
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');

const Config = require("../../config.json");
const Auth = require("../middleware/auth");
const User = require("../db/models/user");

router.get("/auth/login", async(req, res) => {
  try {
    //Get token from cookie
    const token = req.cookies.token || undefined;
    if (!token) { res.render("auth/login") }
    else {
      //Validate and get user
      const decodedToken = jwt.verify(token, Config.web.token_secret);
      const user = await User.findOne({_id: decodedToken._id, 'tokens.token': token });
      if (!user) { res.render("auth/login") }
      else { res.redirect("/dashboard") }
    }
  } catch (error) {
    res.status(500).send({error: true, data: error.message});
  }
});

router.get("/dash", Auth.cookie, async(req, res) => {
  try {
    res.redirect("/dash/home");
  } catch (error) {
    res.status(500).send({error: true, data: error.message});
  }
});

router.get("/dash/home", Auth.cookie, async(req, res) => {
  try {decodeURI
    res.render("dash/home", {
      user_first_name: "Jacob",
      user_last_name: "Goddard",
      user_email: "jake@jigglything.com",
      user_role: "Restore Developer",
      user_profile_url: "https://scontent-lhr8-1.cdninstagram.com/v/t51.2885-19/s150x150/117223801_153040139702908_6023617690552705718_n.jpg?_nc_ht=scontent-lhr8-1.cdninstagram.com&_nc_ohc=gVGvY4uJ6gAAX_ULLpg&oh=f4a22197b93e6aa74b80dc679564bd97&oe=5F89E95B"
    });
  } catch (error) {
    res.status(500).send({error: true, data: error.message});
  }
});

module.exports = router;
