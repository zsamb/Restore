const express = require('express');
const router = new express.Router();
const mongoose = require("mongoose");

router.get("/auth/login", async(req, res) => {
  try {
    res.render("auth/login");
  } catch (error) {
    res.status(500).send({error: true, data: error.message});
  }
});

router.get("/dashboard", async(req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    res.status(500).send({error: true, data: error.message});
  }
});

module.exports = router;
