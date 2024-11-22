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
    origin: ["*"], // Autoriser les deux origines
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

//routes post voiture

app.post("/", (req, res) => {
  const { nom, boiteDeVitesse, prix, consommation, condition, image } = req.body;

  req.getConnection((erreur, connection) => {
    if (erreur) {
      res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      const query = `
        INSERT INTO voiture (nom, boiteDeVitesse, prix, consommation, \`condition\`, image) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      connection.query(query, [nom, boiteDeVitesse, prix, consommation, condition, image], (erreur, resultat) => {
        if (erreur) {
          console.error("Erreur SQL:", erreur);
          res.status(500).json({ erreur: "Erreur lors de la requête SQL", details: erreur });
        } else {
          res.status(201).json({ message: "Voiture ajoutée avec succès", id: resultat.insertId });
        }
      });
    }
  });
});



//route put oiture
app.put("/:id", (req, res) => {
  const { nom, boiteDeVitesse, prix, consommation, condition, image } = req.body;
  const { id } = req.params;  // Id de la voiture à mettre à jour

  req.getConnection((erreur, connection) => {
    if (erreur) {
      res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      const query = `
        UPDATE voiture 
        SET nom = ?, boiteDeVitesse = ?, prix = ?, consommation = ?, \`condition\` = ?, image = ? 
        WHERE id = ?
      `;
      connection.query(query, [nom, boiteDeVitesse, prix, consommation, condition, image, id], (erreur, resultat) => {
        if (erreur) {
          res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
        } else if (resultat.affectedRows === 0) {
          res.status(404).json({ message: "Voiture non trouvée" });
        } else {
          res.status(200).json({ message: "Voiture mise à jour avec succès" });
        }
      });
    }
  });
});

//route delete

app.delete("/:id", (req, res) => {
  const { id } = req.params;  // Id de la voiture à supprimer

  req.getConnection((erreur, connection) => {
    if (erreur) {
      res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      const query = "DELETE FROM voiture WHERE id = ?";
      connection.query(query, [id], (erreur, resultat) => {
        if (erreur) {
          res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
        } else if (resultat.affectedRows === 0) {
          res.status(404).json({ message: "Voiture non trouvée" });
        } else {
          res.status(200).json({ message: "Voiture supprimée avec succès" });
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
