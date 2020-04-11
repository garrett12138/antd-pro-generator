const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const { ApiObjectBuilder, generate } = require("antd-generator-core");

app.get("/info", async function(req, res) {
  let result;
  if (req.query.type === "url") {
    result = await ApiObjectBuilder.create()
      .url(req.query.value)
      .build();
  } else {
    result = await ApiObjectBuilder.create()
      .jsonFile(req.query.value)
      .build();
  }

  if (result.body) {
    res.send({ code: 0, message: "success!!", body: result.body });
  } else {
    res.send({ code: 500, message: result.error });
  }
});
app.post("/generate", async function(req, res) {
  try {
    let result = await generate(req.body.data);
    res.send(result);
  } catch (e) {
    res.send({ code: 500, message: e.message });
  }
});

app.get("/folder", (req, res) => {
  res.send({ code: 0, message: "", body: [path.join(__dirname, "generate")] });
});

app.listen(8081, function() {
  console.log("访问地址为 http://localhost:%s", 8081);
});
