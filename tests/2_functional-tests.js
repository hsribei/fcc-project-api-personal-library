/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*
*/

const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const ObjectId = require("mongodb").ObjectID;

chai.use(chaiHttp);

suite("Functional Tests", function() {
  suite("Routing tests", function() {
    suite(
      "POST /api/books with title => create book object/expect book object",
      function() {
        test("Test POST /api/books with title", function(done) {
          chai
            .request(server)
            .post("/api/books")
            .send({ title: "test title" })
            .end(function(err, res) {
              assert.strictEqual(res.status, 200);
              assert.isObject(res.body);
              assert.property(res.body, "title");
              assert.strictEqual(res.body.title, "test title");
              assert.property(res.body, "_id");

              done();
            });
        });

        test("Test POST /api/books with no title given", function(done) {
          chai
            .request(server)
            .post("/api/books")
            .send({})
            .end(function(err, res) {
              assert.isAtLeast(res.status, 400);
              assert.isBelow(res.status, 500);

              done();
            });
        });
      }
    );

    suite("GET /api/books => array of books", function() {
      test("Test GET /api/books", function(done) {
        chai
          .request(server)
          .post("/api/books")
          .send({ title: "test title" })
          .end(function(err, res) {
            assert.strictEqual(res.status, 200);

            const postedBook = res.body;

            chai
              .request(server)
              .get("/api/books")
              .end(function(err, res) {
                assert.strictEqual(res.status, 200);
                assert.isArray(res.body);

                const books = res.body;

                books.forEach(book => {
                  assert.property(book, "_id");
                  assert.property(book, "title");
                  assert.property(book, "commentcount");
                  assert.isNotEmpty(book._id);
                  assert.isNotEmpty(book.title);
                  assert.isNumber(book.commentcount);
                });

                assert(
                  books.some(book => book._id === postedBook._id),
                  "POSTed book should be present in GET"
                );

                done();
              });
          });
      });
    });

    suite("GET /api/books/[id] => book object with [id]", function() {
      test("Test GET /api/books/[id] with id not in db", function(done) {
        const idNotinDb = new ObjectId();
        chai
          .request(server)
          .get("/api/books/" + idNotinDb.toString())
          .end(function(err, res) {
            assert.isAtLeast(res.status, 400);
            assert.isBelow(res.status, 500);
            assert.strictEqual(res.error.text, "no book exists");

            done();
          });
      });

      test("Test GET /api/books/[id] with valid id in db", function(done) {
        chai
          .request(server)
          .post("/api/books")
          .send({ title: "test title" })
          .end(function(err, res) {
            assert.strictEqual(res.status, 200);

            const postResponseBook = res.body;

            chai
              .request(server)
              .get("/api/books/" + postResponseBook._id)
              .end(function(err, res) {
                assert.strictEqual(res.status, 200);
                assert.isObject(res.body);

                const getIdResponseBook = res.body;

                assert.strictEqual(postResponseBook._id, getIdResponseBook._id);
                assert.strictEqual(
                  postResponseBook.title,
                  getIdResponseBook.title
                );
                assert.isArray(getIdResponseBook.comments);
                assert.isEmpty(getIdResponseBook.comments);

                done();
              });
          });
      });
    });

    suite(
      "POST /api/books/[id] => add comment/expect book object with id",
      function() {
        test("Test POST /api/books/[id] with comment", function(done) {
          chai
            .request(server)
            .post("/api/books")
            .send({ title: "test title" })
            .end(function(err, res) {
              assert.strictEqual(res.status, 200);

              const savedBook = res.body;

              chai
                .request(server)
                .post("/api/books/" + savedBook._id)
                .send({ comment: "test comment" })
                .end(function(err2, res2) {
                  assert.strictEqual(res2.status, 200);
                  assert.isObject(res2.body);

                  const commentedBook = res2.body;

                  assert.strictEqual(savedBook._id, commentedBook._id);
                  assert.strictEqual(savedBook.title, commentedBook.title);
                  assert.isArray(commentedBook.comments);
                  assert.isNotEmpty(commentedBook.comments);
                  assert.strictEqual(commentedBook.comments[0], "test comment");

                  done();
                });
            });
        });
      }
    );

    suite("DELETE methods", function() {
      test("Test DELETE /api/books/:id => delete book from collection", function(done) {
        chai
          .request(server)
          .post("/api/books")
          .send({ title: "test title" })
          .end(function(err, res) {
            assert.strictEqual(res.status, 200);

            const savedBook = res.body;

            chai
              .request(server)
              .delete(`/api/books/${savedBook._id}`)
              .end(function(err, res) {
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.text, "delete successful");

                chai
                  .request(server)
                  .get(`/api/books/${savedBook._id}`)
                  .end(function(err, res) {
                    assert.isAtLeast(res.status, 400);
                    assert.isBelow(res.status, 500);
                    assert.strictEqual(res.error.text, "no book exists");

                    done();
                  });
              });
          });
      });

      test("Test DELETE /api/books => delete all books", function(done) {
        chai
          .request(server)
          .post("/api/books")
          .send({ title: "test title" })
          .end(function(err, res) {
            assert.strictEqual(res.status, 200);

            chai
              .request(server)
              .delete("/api/books")
              .end(function(err, res) {
                assert.strictEqual(res.status, 200);

                chai
                  .request(server)
                  .get("/api/books")
                  .end(function(err, res) {
                    assert.strictEqual(res.status, 200);
                    assert.isArray(res.body);
                    assert.isEmpty(res.body);

                    done();
                  });
              });
          });
      });
    });
  });
});
