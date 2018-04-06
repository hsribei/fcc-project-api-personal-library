/*
*
*
*       Complete the API routing below
*
*
*/

"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const ObjectId = require("mongodb").ObjectId;

const Schema = mongoose.Schema;

const bookSchema = new Schema({
  title: { type: String, required: true },
  comments: [String]
});

const Book = mongoose.model("Book", bookSchema);

mongoose.connect(process.env.MONGO_URI);

module.exports = function(app) {
  app
    .route("/api/books")
    .get(function(req, res) {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      Book.aggregate([
        { $project: { title: true, commentcount: { $size: "$comments" } } }
      ]).exec((err, results) => {
        if (err) {
          res.sendStatus(500);
        } else {
          res.json(results);
        }
      });
    })

    .post(function(req, res) {
      const title = req.body.title;
      if (!title) {
        res.status(400).send("No title given");
      } else {
        //response will contain new book object including atleast _id and title
        new Book({ title }).save((err, book) => {
          if (err) {
            res.status(500).send(`${err.name}: ${err.message}`);
          } else if (book) {
            res.json(book);
          } else {
            res.sendStatus(500);
          }
        });
      }
    })

    .delete(function(req, res) {
      //if successful response will be 'complete delete successful'
    });

  app
    .route("/api/books/:id")
    .get(function(req, res) {
      const bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      Book.findById(new ObjectId(bookid), (err, book) => {
        if (err) {
          res.status(500).send(`${err.name}: ${err.message}`);
        } else if (!book) {
          res.status(404).send("no book exists");
        } else {
          res.json(book);
        }
      });
    })

    .post(function(req, res) {
      const bookid = req.params.id;
      const comment = req.body.comment;
      //json res format same as .get
      Book.findById(new ObjectId(bookid), (err, book) => {
        if (err) {
          res.status(500).send(`${err.name}: ${err.message}`);
        } else if (!book) {
          res.status(404).send("no book exists");
        } else {
          book.comments.push(comment);
          book.save(err => {
            if (err) {
              res.status(500).send(`${err.name}: ${err.message}`);
            } else {
              res.json(book);
            }
          });
        }
      });
    })

    .delete(function(req, res) {
      const bookid = req.params.id;
      //if successful response will be 'delete successful'
    });
};
