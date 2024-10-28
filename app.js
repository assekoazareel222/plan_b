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
app.use(bodyParser.json());
app.use(express.json());

// Middleware pour traiter les données du formulaire
app.use(bodyParser.urlencoded({ extended: true }));
// Configuration de multer pour les fichiers
const upload = multer({ dest: "uploads/" });

// Route pour gérer l'envoi du formulaire
app.post("/send-email", upload.single("image"), (req, res) => {
  const { name, email, brand, model, year, mileage, message } = req.body;
  const imagePath = req.file ? req.file.path : null;

  // Configurer Nodemailer
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
      console.log(error);
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
app.use(cors()); // Autoriser toutes les origines

// Middleware de connexion à la base de données
app.use(myConnection(mysql, dbConfig, "pool"));

// Middleware CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// Route GET pour obtenir toutes les voitures
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
          res.status(200).json(resultat); // Envoie des résultats en format JSON
        }
      });
    }
  });
});
// Route GET pour obtenir toutes les voitures
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
          res.status(200).json(resultat); // Envoie des résultats en format JSON
        }
      });
    }
  });
});
// Routes
app.use("/voiture", voitureRoutes);

// Lancer le serveur
app.listen(3005, () => {
  console.log("Serveur lancé sur le port 3005");
});

// Middleware pour gérer les erreurs de JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Erreur JSON:", err);
    return res.status(400).json({ message: "Données JSON mal formées" });
  }
  next();
});

// Route de test
app.get("/park", (req, res) => {
  res.send("Bonjour les voitures");
});
