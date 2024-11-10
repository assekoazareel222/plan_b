const express = require("express");
const bodyParser = require("body-parser");
const myConnection = require("express-myconnection");
const mysql = require("mysql");
const voitureRoutes = require("./routes/voitureRoutes");
const dbConfig = require("./config/db");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// 1. Configuration de CORS - à mettre en premier pour intercepter toutes les requêtes
app.use(
  cors({
    origin: ["http://127.0.0.1:5502", "http://localhost:5502"], // Autoriser les deux origines
    methods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    allowedHeaders:
      "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization",
  })
);


// 2. Configuration de body-parser et multer pour gérer les données de requête et les fichiers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const upload = multer({ dest: "uploads/" });

// Middleware de connexion à la base de données
app.use(myConnection(mysql, dbConfig, "pool"));

// Route pour gérer l'envoi d'email avec fichier
app.post("/send-email", upload.single("image"), (req, res) => {
  const { name, email, brand, model, year, mileage, message } = req.body;
  const imagePath = req.file ? req.file.path : null;

  // Configuration de Nodemailer (utilisez des variables d'environnement pour les informations sensibles)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "assekoazareel222@gmail.com",
      pass: "asseko1999",
    },
  });

  // Contenu de l'email
  const mailOptions = {
    from: email,
    to: "mikolodarselcarl@gmail.com",
    subject: `Nouveau message de ${name}`,
    text: `Nom: ${name}\nEmail: ${email}\nMarque: ${brand}\nModèle: ${model}\nAnnée: ${year}\nKilométrage: ${mileage}\nMessage:\n${message}`,
    attachments: imagePath ? [{ path: imagePath }] : [],
  };

  // Envoi de l'email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Erreur d'envoi d'email:", error);
      res.status(500).send("Erreur lors de l'envoi de l'email");
    } else {
      console.log("Email envoyé: " + info.response);
      res.send("Email envoyé avec succès !");
    }

    // Supprimer le fichier temporaire après envoi
    if (imagePath) {
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Erreur de suppression du fichier:", err);
      });
    }
  });
});

// Routes pour obtenir les données des voitures et des ventes
app.get("/", (req, res) => {
  req.getConnection((erreur, connection) => {
    if (erreur) {
      res
        .status(500)
        .json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      connection.query("SELECT * FROM voiture", [], (erreur, resultat) => {
        if (erreur) {
          res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
        } else {
          res.status(200).json(resultat);
        }
      });
    }
  });
});

app.get("/vente", (req, res) => {
  req.getConnection((erreur, connection) => {
    if (erreur) {
      res
        .status(500)
        .json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      connection.query("SELECT * FROM vente", [], (erreur, resultat) => {
        if (erreur) {
          res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
        } else {
          res.status(200).json(resultat);
        }
      });
    }
  });
});

// Routes supplémentaires
app.use("/voiture", voitureRoutes);

// Middleware pour les erreurs JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Erreur JSON:", err);
    return res.status(400).json({ message: "Données JSON mal formées" });
  }
  next();
});

// Démarrage du serveur
app.listen(3005, () => {
  console.log("Serveur lancé sur le port 3005");
});
