const express = require("express");

const app = express();
const myConnection = require("express-myconnection");
const mysql = require("mysql");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// Middleware pour parser le corps des requêtes en JSON
app.use(express.json());

// Lancer le serveur
app.listen(3002, () => {
  console.log("Serveur lancé sur le port 3002");
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Erreur JSON:", err);
    return res.status(400).json({ message: "Données JSON mal formées" });
  }
  next();
});

// Options de la base de données
const optionBd = {
  host: "mysql-asseko999.alwaysdata.net",
  user: "asseko999",
  password: "asseko1999",
  database: "asseko999_inviter",
};

// Middleware de connexion à la base de données
app.use(myConnection(mysql, optionBd, "pool"));

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

// Route PUT pour modifier une voiture
// Route PUT pour modifier une voiture
app.put("/voiture/:id", (req, res) => {
  const id = req.params.id; // Récupère l'ID de la voiture à modifier
  const { image, marque, model, annees, couleur, numero_de_serie } = req.body; // Données envoyées pour mise à jour

  // Validation des données
  if (!marque || !model || !annees || !couleur || !numero_de_serie) {
    return res.status(400).json({ erreur: "Toutes les données doivent être fournies" });
  }

  req.getConnection((erreur, connection) => {
    if (erreur) {
      return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
    }

    // Vérifier si la voiture avec cet ID existe
    const checkSql = "SELECT * FROM voiture WHERE id = ?";
    connection.query(checkSql, [id], (checkError, result) => {
      if (checkError) {
        return res.status(500).json({ erreur: "Erreur lors de la vérification de l'ID" });
      }

      if (result.length === 0) {
        return res.status(404).json({ erreur: "Voiture non trouvée" });
      }

      // Si la voiture existe, procéder à la mise à jour
      const updateSql =
        "UPDATE voiture SET image = ?, marque = ?, model = ?, annees = ?, couleur = ?, numero_de_serie = ? WHERE id = ?";
      connection.query(
        updateSql,
        [image, marque, model, annees, couleur, numero_de_serie, id],
        (updateError, updateResult) => {
          if (updateError) {
            return res.status(500).json({ erreur: "Erreur lors de la mise à jour" });
          }

          res.status(200).json({ message: "Voiture mise à jour avec succès" });
        }
      );
    });
  });
});

// Route DELETE pour supprimer une voiture
app.delete("/voiture/:id", (req, res) => {
  const id = req.params.id;

  req.getConnection((erreur, connection) => {
    if (erreur) {
      res
        .status(500)
        .json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      const sql = "DELETE FROM voiture WHERE id = ?";
      connection.query(sql, [id], (erreur, resultat) => {
        if (erreur) {
          res.status(500).json({ erreur: "Erreur lors de la suppression" });
        } else {
          res.status(200).json({ message: "Voiture supprimée avec succès" });
        }
      });
    }
  });
});

// Route de test
app.get("/park", (req, res) => {
  res.send("Bonjour les voitures");
});
// Route POST pour ajouter une nouvelle voiture
app.post("/voiture", (req, res) => {
  const { image, marque, model, annees, couleur, numero_de_serie } = req.body; // Données envoyées pour ajouter une nouvelle voiture

  // Validation des données
  if (!marque || !model || !annees || !couleur || !numero_de_serie) {
    return res
      .status(400)
      .json({ erreur: "Toutes les données doivent être fournies" });
  }

  req.getConnection((erreur, connection) => {
    if (erreur) {
      return res
        .status(500)
        .json({ erreur: "Erreur de connexion à la base de données" });
    }

    // Requête d'insertion
    const sql =
      "INSERT INTO voiture (image, marque, model, annees, couleur, numero_de_serie) VALUES (?, ?, ?, ?, ?, ?)";
    connection.query(
      sql,
      [image, marque, model, annees, couleur, numero_de_serie],
      (insertError, insertResult) => {
        if (insertError) {
          return res
            .status(500)
            .json({ erreur: "Erreur lors de l'ajout de la voiture" });
        }

        res
          .status(201)
          .json({
            message: "Voiture ajoutée avec succès",
            id: insertResult.insertId,
          });
      }
    );
  });
});
