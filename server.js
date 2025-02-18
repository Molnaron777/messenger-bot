const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.use(bodyParser.json());

// ✅ Alapértelmezett route (ellenőrzéshez)
app.get("/", (req, res) => {
    res.send("✅ Server is running!");
});

// ✅ Facebook Webhook hitelesítés
app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("✅ Webhook verified successfully.");
            res.status(200).send(challenge);
        } else {
            console.log("❌ Webhook verification failed!");
            res.status(403).send("Verification failed!");
        }
    } else {
        res.status(400).send("Bad Request");
    }
});

// ✅ Üzenetek fogadása és kezelése
app.post("/webhook", (req, res) => {
    let body = req.body;

    if (body.object === "page") {
        body.entry.forEach(entry => {
            let webhook_event = entry.messaging[0];
            console.log("Üzenet érkezett:", webhook_event);

            let sender_psid = webhook_event.sender.id;
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            }
        });

        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
});

// ✅ Üzenet küldése a Messengerbe
function sendMessage(psid, response) {
    let request_body = {
        recipient: { id: psid },
        message: { text: response }
    };

    axios.post(`https://graph.facebook.com/v12.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, request_body)
        .then(res => console.log("✅ Üzenet elküldve"))
        .catch(err => console.log("❌ Hiba az üzenet küldésekor:", err));
}

// ✅ Alap válasz az üzenetekre
function handleMessage(sender_psid, received_message) {
    let response = { text: `Szia! Az üzeneted: "${received_message.text}"` };
    sendMessage(sender_psid, response);
}

// ✅ Szerver indítása
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
