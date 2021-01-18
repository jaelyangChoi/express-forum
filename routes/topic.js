const express = require("express");
const router = express.Router();
const fs = require("fs");
const template = require("../lib/template.js");
const auth = require("../lib/auth.js");
const path = require("path");
const sanitizeHtml = require("sanitize-html");

//router 객체에 미들웨어 설치
router.get("/create", (req, res) => {
  if (!auth.isOwner(req, res)) {
    res.redirect("/");
    return false; //더 진행되지 않도록 리턴.
  }
  let title = "WEB - create";
  let list = template.list(req.list);
  let html = template.HTML(
    title,
    list,
    `
     <form action="/topic/create_process" method="post">
      <p><input type="text" name="title" placeholder="title"></p>
      <p><textarea name="description" placeholder="description"></textarea></p>
      <p><input type="submit"></p>
     </form>
    `,
    "",
    auth.statusUI(req, res)
  );
  res.send(html);
});

router.post("/create_process", (req, res) => {
  /*
    let body = "";
    req.on("data", function (data) { //data 이벤트
      body = body + data; // 패킷
    });
    req.on("end", function () { //end 이벤트
      let post = qs.parse(body);
      let title = post.title;
      let description = post.description;
      fs.writeFile(`data/${title}`, description, "utf8", function (err) {
        res.redirect(`/page/${title}`);
      });
    });*/
  let post = req.body;
  let title = post.title;
  let description = post.description;
  fs.writeFile(`data/${title}`, description, "utf8", function (err) {
    // res.writeHead(302, { Location: `/page/${title}` });
    // res.end();
    res.redirect(`/topic/${title}`);
  });
});

router.get("/update/:pageId", (req, res) => {
  if (!auth.isOwner(req, res)) {
    res.redirect("/");
    return false; //더 진행되지 않도록 리턴.
  }
  let title = req.params.pageId;
  fs.readFile(`data/${title}`, "utf8", function (err, description) {
    let list = template.list(req.list);
    let html = template.HTML(
      title,
      list,
      `
        <form action="/topic/update_process" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
      `<a href="/topic/create">create</a> <a href="/topic/update/${title}">update</a>`,
      auth.statusUI(req, res)
    );
    res.send(html);
  });
});

router.post("/update_process", (req, res) => {
  let post = req.body;
  let id = post.id;
  let title = post.title;
  let description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, "utf8", function (err) {
      res.redirect(`/topic/${title}`);
    });
  });
});

router.post("/delete_process", (req, res) => {
  if (!auth.isOwner(req, res)) {
    res.redirect("/");
    return false; //더 진행되지 않도록 리턴.
  }
  let post = req.body;
  let id = post.id;
  let filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function (error) {
    res.redirect("/");
  });
});

router.get("/:pageId", (req, res, next) => {
  let filteredId = path.parse(req.params.pageId).base;
  fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
    if (err) next(err);
    else {
      let sanitizedTitle = sanitizeHtml(filteredId);
      let sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ["h1"],
      });
      let list = template.list(req.list);
      let html = template.HTML(
        sanitizedTitle,
        list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/topic/create">create</a>
          <a href="/topic/update/${sanitizedTitle}">update</a>
          <form action="/topic/delete_process" method="post">
            <input type="hidden" name="id" value="${sanitizedTitle}">
            <input type="submit" value="delete">
          </form>`,
        auth.statusUI(req, res)
      );
      res.send(html);
    }
  });
});

module.exports = router;
