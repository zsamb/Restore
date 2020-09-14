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
  try {
    res.render("dash/home");
  } catch (error) {
    res.status(500).send({error: true, data: error.message});
  }
});

module.exports = router;
