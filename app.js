const express = require("express");
const bodyParser = require("body-parser");
const myConnection = require("express-myconnection");
const mysql = require("mysql");
const voitureRoutes = require("./routes/voitureRoutes");
const dbConfig = require("./config/db");

const app = express();
app.use(bodyParser.json());
app.use(express.json());

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
