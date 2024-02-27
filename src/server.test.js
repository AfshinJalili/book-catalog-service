const { expect } = import("chai");
const sinon = require("sinon");
const grpc = require("@grpc/grpc-js");
const { getBookDetails } = require("./server");


describe("getBookDetails", () => {
  it("should return book details when retrieval is successful", (done) => {
    const call = { request: { id: 1 } };
    const bookDetails = { id: 1, title: "Book Title", author: "Author Name" };
    const callback = (error, response) => {
      expect(error).to.be.null;
      expect(response).to.deep.equal(bookDetails);
      done();
    };

    const retrieveBookDetailsFromFileStub = sinon
      .stub()
      .callsFake((id, callback) => {
        callback(null, bookDetails);
      });

    getBookDetails(call, callback, retrieveBookDetailsFromFileStub);
  });

  it("should return an error when retrieval fails", (done) => {
    const call = { request: { id: 1 } };
    const error = new Error("Error getting book details");
    const callback = (error, response) => {
      expect(error).to.deep.equal({
        code: grpc.status.INTERNAL,
        details: "Error getting book details",
      });
      expect(response).to.be.undefined;
      done();
    };

    const retrieveBookDetailsFromFileStub = sinon
      .stub()
      .callsFake((id, callback) => {
        callback(error);
      });

    getBookDetails(call, callback, retrieveBookDetailsFromFileStub);
  });
});

describe("listBooks", () => {
  it("should return the list of books when retrieval is successful", (done) => {
    const books = [
      { id: 1, title: "Book 1", author: "Author 1", publication_year: 2021 },
      { id: 2, title: "Book 2", author: "Author 2", publication_year: 2022 },
    ];
    const retrieveBooksFromFileStub = sinon
      .stub()
      .callsFake((callback) => {
        callback(null, books);
      });

    const expectedResponse = {
      total_books: "2",
      book_info: [
        { id: 1, title: "Book 1", author: "Author 1", publication_year: 2021 },
        { id: 2, title: "Book 2", author: "Author 2", publication_year: 2022 },
      ],
    };

    listBooks(null, (error, response) => {
      expect(error).to.be.null;
      expect(response).to.deep.equal(expectedResponse);
      done();
    }, retrieveBooksFromFileStub);
  });

  it("should return an error when retrieval fails", (done) => {
    const error = new Error("Error listing books");
    const retrieveBooksFromFileStub = sinon
      .stub()
      .callsFake((callback) => {
        callback(error);
      });

    listBooks(null, (error, response) => {
      expect(error).to.deep.equal({
        code: grpc.status.INTERNAL,
        details: "Error listing books",
      });
      expect(response).to.be.undefined;
      done();
    }, retrieveBooksFromFileStub);
  });
});

describe("deleteBook", () => {
  it("should delete the book and return success message", (done) => {
    const call = { request: { id: 1 } };
    const booksData = JSON.stringify([
      { id: 1, title: "Book 1", author: "Author 1" },
      { id: 2, title: "Book 2", author: "Author 2" },
    ]);
    const fsReadFileSyncStub = sinon.stub(fs, "readFileSync").returns(booksData);
    const fsWriteFileSyncStub = sinon.stub(fs, "writeFileSync");
    const redisClientDelStub = sinon.stub(redisClient, "del").resolves();
    const redisClientKeysStub = sinon.stub(redisClient, "keys").resolves(["bookDetails:1", "bookDetails:2"]);
    const redisClientDelMultiStub = sinon.stub(redisClient, "del").resolves();

    deleteBook(call, (error, response) => {
      expect(error).to.be.null;
      expect(response).to.deep.equal({ message: "Book deleted successfully" });

      expect(fsReadFileSyncStub.calledOnceWithExactly(BOOKS_JSON_PATH, "utf-8")).to.be.true;
      expect(fsWriteFileSyncStub.calledOnceWithExactly(BOOKS_JSON_PATH, JSON.stringify([
        { id: 2, title: "Book 2", author: "Author 2" },
      ], null, 2))).to.be.true;
      expect(redisClientDelStub.calledOnceWithExactly("books")).to.be.true;
      expect(redisClientKeysStub.calledOnceWithExactly("bookDetails:*")).to.be.true;
      expect(redisClientDelMultiStub.calledTwice).to.be.true;
      expect(redisClientDelMultiStub.firstCall.calledWithExactly("bookDetails:1")).to.be.true;
      expect(redisClientDelMultiStub.secondCall.calledWithExactly("bookDetails:2")).to.be.true;

      fsReadFileSyncStub.restore();
      fsWriteFileSyncStub.restore();
      redisClientDelStub.restore();
      redisClientKeysStub.restore();
      redisClientDelMultiStub.restore();

      done();
    });
  });

  it("should return an error when book is not found", (done) => {
    const call = { request: { id: 3 } };
    const booksData = JSON.stringify([
      { id: 1, title: "Book 1", author: "Author 1" },
      { id: 2, title: "Book 2", author: "Author 2" },
    ]);
    const fsReadFileSyncStub = sinon.stub(fs, "readFileSync").returns(booksData);

    deleteBook(call, (error, response) => {
      expect(error).to.deep.equal({
        code: grpc.status.NOT_FOUND,
        details: "Book not found",
      });
      expect(response).to.be.undefined;

      expect(fsReadFileSyncStub.calledOnceWithExactly(BOOKS_JSON_PATH, "utf-8")).to.be.true;

      fsReadFileSyncStub.restore();

      done();
    });
  });

  it("should return an error when an error occurs during deletion", (done) => {
    const call = { request: { id: 1 } };
    const booksData = JSON.stringify([
      { id: 1, title: "Book 1", author: "Author 1" },
      { id: 2, title: "Book 2", author: "Author 2" },
    ]);
    const fsReadFileSyncStub = sinon.stub(fs, "readFileSync").returns(booksData);
    const fsWriteFileSyncStub = sinon.stub(fs, "writeFileSync").throws(new Error("Write file error"));

    deleteBook(call, (error, response) => {
      expect(error).to.deep.equal({
        code: grpc.status.INTERNAL,
        details: "Failed to delete the book",
      });
      expect(response).to.be.undefined;

      expect(fsReadFileSyncStub.calledOnceWithExactly(BOOKS_JSON_PATH, "utf-8")).to.be.true;
      expect(fsWriteFileSyncStub.calledOnceWithExactly(BOOKS_JSON_PATH, JSON.stringify([
        { id: 2, title: "Book 2", author: "Author 2" },
      ], null, 2))).to.be.true;

      fsReadFileSyncStub.restore();
      fsWriteFileSyncStub.restore();

      done();
    });
  });
});