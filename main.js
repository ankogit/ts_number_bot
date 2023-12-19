const { default: axios } = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const token = "6904385657:AAEHNQpoqHwucwjO2IwZcOtjPoloTpNJ9Og";
// Load the binding
const tf = require("@tensorflow/tfjs-node");

const { createCanvas, Image } = require("canvas");
const fetch = require("node-fetch");

// Create a new bot
const bot = new TelegramBot(token, { polling: true });

const https = require("https");

const puppeteer = require("puppeteer");

async function getImageDataFromURL(url) {
  const response = await fetch(url);
  const buffer = await response.buffer();

  const image = new Image();
  image.src = buffer;

  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}
async function getImageBufferFromURL(url) {
  const response = await fetch(url);
  return await response.buffer();
}
async function getImageBitmapFromURL(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`data:text/html,<img src="${url}" id="image" />`);

  const imageElement = await page.$("#image");
  const imageBitmap = await imageElement.screenshot();

  await browser.close();

  return imageBitmap;
}

async function getPixelDataFromURL(url) {
  const response = await fetch(url);
  const buffer = await response.buffer();

  const image = new Image();
  image.src = buffer;

  return image;
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}

async function loadModel() {
  model = await tf.loadLayersModel(
    "https://raw.githubusercontent.com/ankogit/mnst/main/mnst.json"
  );

  model.predict(tf.zeros([1, 28, 28, 1]));
  //   console.log(model);
  return model;
}

async function predictModel(model, image) {
  image = tf.image
    .resizeBilinear(image, [28, 28])
    .sum(2)
    .expandDims(0)
    .expandDims(-1);
  y = model.predict(image);

  return y.argMax(1).dataSync();
}

async function main() {
  const model = await loadModel();

  bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    if (msg.photo) {
      bot.getFileLink(msg.photo[3].file_id).then(async (fileUri) => {
        getImageBufferFromURL(fileUri).then((buffer) => {
          predictModel(model, tf.node.decodeImage(buffer, 1)).then((res) =>
            bot.sendMessage(chatId, "Это цифра: " + res)
          );
        });
      });
    } else {
      bot.sendMessage(chatId, "Отправте фото!");
    }
  });
}

main();
