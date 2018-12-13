module.exports = app => {
  const axios = require("axios");
  const cheerio = require("cheerio");
  const express = require("express");
  const mongoose = require("mongoose");
  const Status = require("../models/status");
  const cityURL = "http://www.ci.eau-claire.wi.us/";

  axios.get(cityURL).then(response => {
    var success = false;

    if (response.status === 200) {
      // reads, loads, and parses html into readable form
      // current version scrapes for top navigation bar
      // final implementation will scrape for alternate parking banner and it's details
      const html = response.data;
      const $ = cheerio.load(html);
      let newsItems = [];

      var latestNews = $("li", ".home_news").each((i, elm) => {
        newsItems.push({
          title: $(elm)
            .children()
            .eq(1)
            .first()
            .text(),
          description: $(elm)
            .children()
            .eq(2)
            .first()
            .text()
        });
      });

      //checking if html contains alternate parking listing
      var altParkingInEffect = checkForAlternateParking(newsItems);

      //creating entry date
      var date = new Date();

      //creating new status document
      let newStatus;

      //checks if alternate parking banner exists
      if (altParkingInEffect) {
        newStatus = {
          alternateParking: true,
          timestamp: getStartDate(date).toLocaleString("en-US", {
            timeZone: "America/Chicago"
          }),
          streetSide: getStreetSide(date),
          expirationDate: getExpirationDate(date).toLocaleString("en-US", {
            timeZone: "America/Chicago"
          })
        };
      }


        new Status(newStatus)
          .save()
          .then(console.log("Status save successful"))
          .catch(err => console.log(err));

        //send out the twillio messsage
        //call the notify.js methods
      }
    }
  });

  //pulls the date given to status.timestamp and determines the parking for the day
  getStreetSide = date => {
    //finds local time, and parses string for date
    //date format in system [month/day/year time]
    var local = date.toLocaleString();
    var day = local.match(/.*\/(.*)\/.*/);

    if (day[1] % 2 === 0) {
      return "Even";
    } else {
      return "Odd";
    }
  };

  //sets the date to the next day from the starting date.
  getStartDate = date => {
    var startDate = new Date();
    startDate.setDate(date.getDate() + 1);
    startDate.setHours(0, 1, 0, 0);
    return startDate;
  };

  //adds 72 hours to the starting date

  getExpirationDate = date => {
    var expirationDate = new Date();
    expirationDate.setDate(date.getDate() + 3);
    expirationDate.setHours(expirationDate.getHours() + 1);
    return expirationDate;
  };

  checkForAlternateParking = newsItems => {
    newsItems.forEach(element => {
      if (element.title.includes("Alternate Side Parking in Effect")) {
        var postDate = element.description.match(/(\d*\/\d*\/\d*)/); //regular expression search for a date
        postDate = postDate[1]; //sets to the first instance
        return getIsNewPost(postDate); //Alternate Side Parking listed in latest news. Checking if it is brand new.
      }
    });
    return false; //Alternate Side Parking not listed in latest news
  };

  getIsNewPost = dayPosted => {
    var todayDate = new Date();
    var today = todayDate.getDate();
    var posted = dayPosted.substring(
      dayPosted.indexOf("/") + 1,
      dayPosted.lastIndexOf("/")
    );
    var difference = today + 1 - posted; //checks if the the posting date matches todays date + 1

    if (difference == 0) {
      return true; //the post is new and a text should be sent out
    }
    return false;
  };
};
