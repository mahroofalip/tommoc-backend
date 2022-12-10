const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./Models/User");
const Image = require("./Models/Image");
const Place = require("./Models/Place");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
require("./passport");
const passport = require("passport");
const morgan = require("morgan");
const cors = require("cors");
const app = express();

dotenv.config();
const { uploadImages, deleteImages } = require("./awsConfig/manage_aws_images");
const { OAuth2Client } = require("google-auth-library");
const clientgoogle = new OAuth2Client(process.env.GGL_CLIENT_KEY);
genToken = (user) => {
  return jwt.sign(
    {
      iss: process.env.JWT_SECRET,
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1),
    },
    process.env.JWT_SECRET
  );
};
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "100mb", extended: true }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "100mb",
  })
);

app.use(bodyParser.json());

app.post(
  "/upload",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { ext, image } = req.body;
    const data = await uploadImages(image, "tommoc/images", ext);
    if (data) {
      const newImage = new Image({ img_key: data.img_key, link: data.img_url });
      await newImage.save();

      res.status(200).json({ status: true });
    } else {
      res.status(200).json({ status: false });
    }
  }
);

app.post("/googe-o-auth", async function (req, res, next) {
  const { tokenId } = req.body;

  clientgoogle
    .verifyIdToken({
      idToken: tokenId,
      audience: process.env.GGL_CLIENT_KEY,
    })
    .then(async (response) => {
      const { email_verified, email } = response.payload;
      if (email_verified) {
        let foundUser = await User.findOne({ userName: email });
        if (foundUser) {
          const token = genToken(foundUser);
          return res.json({
            userName: foundUser.userName,
            token,
            status: true,
          });
        } else {
          const newUser = new User({ userName: email, password: email });
          await newUser.save();
          // Generate JWT token
          const token = genToken(newUser);

          res.status(200).json({ status: true, token, userName: email });
        }
      } else {
        res.status(200).json({ status: false });
      }
    });
});
app.get("/users/:place", async (req, res) => {
  Place.aggregate([{ $match: { place: req.params.place } }]).exec(
    async function (err, places) {
      if (err) console.log(err);
      let users = await User.populate(places, {
        path: "users",
      });
      res.status(200).json({ data: users[0] });
    }
  );
});
app.get("/places", async (req, res) => {
  let places = await Place.find().sort({ createdAt: -1 }).exec();
  res.status(200).json({ places });
});

app.post("/login", async function (req, res, next) {
  const { email, password } = req.body;
  let foundUser = await User.findOne({ userName: email });
  if (foundUser && (await foundUser.matchPassword(password))) {
    const token = genToken(foundUser);

    return res.json({ userName: foundUser.userName, token, status: true });
  } else {
    return res.json({ status: false });
  }
});
app.delete("/delete-img", async (req, res, next) => {
  let { imgKey, id } = req.query;
  const deleteImg = await deleteImages(imgKey);
  if (deleteImg) {
    await Image.deleteOne({ _id: id });
    res.status(200).json({ status: true });
  } else {
    await Image.deleteOne({ _id: id });
    res.status(200).json({ status: true });
  }
});
app.post("/register", async function (req, res, next) {
  const { email, password, place } = req.body;
  //Check If User Exists
  let foundUser = await User.findOne({ userName: email });

  if (foundUser) {
    return res.json({
      status: true,
      exist: true,
      error: "Email is already in use",
    });
  }

  const newUser = new User({ userName: email, password });
  await newUser.save();
  // Generate JWT token
  const token = genToken(newUser);
  const doc = await Place.findOne({ place });
  doc.users.addToSet(newUser._id);
  await doc.save();
  res.status(200).json({ status: true, exist: false, token, userName: email });
});

app.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let imgs = await Image.find().sort({ createdAt: -1 }).exec();
    res.status(200).json({ images: imgs });
  }
);

// add places with postman after uncomment this route
// app.post(
//   "/add-place",
//   async (req, res) => {
//     const newPlace = new Place({ place: req.body.place });
//     await newPlace.save();
//     res.status(200).json({ status: true });
//   }
// );

const userName = encodeURIComponent(process.env.MONGODBATLAS_USERNAME);
const password = encodeURIComponent(process.env.MONGODBATLAS_PASSWORD);
let db = "Tummoc";

mongoose.connect(
  `mongodb+srv://${userName}:${password}@cluster0.omtn0.mongodb.net/${db}?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
mongoose.connection
  .once("open", function () {
    console.log("Connected to MongoDB");
  })
  .on("error", function (err) {
    console.log("Mongo Error", err);
  });
app.listen(8000, () => {
  console.log("Serve is up and running at the port 8000");
});
