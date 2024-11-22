const voitureModel = require("../models/voitureModel");

exports.updateVoiture = (req, res) => {
  const id = req.params.id;
  const { nom, boiteDeVitesse, prix, consommation, condition, image } = req.body;
  	 
  if (!nom || !boiteDeVitesse || !prix || !consommation || !condition) {
    return res
      .status(400)
      .json({ error: "Toutes les données doivent être fournies" });
  }

  req.getConnection((error, connection) => {
    if (error) {
      return res
        .status(500)
        .json({ error: "Erreur de connexion à la base de données" });
    }

    const checkSql = "SELECT * FROM voiture WHERE id = ?";
    connection.query(checkSql, [id], (checkError, result) => {
      if (checkError) {
        return res
          .status(500)
          .json({ error: "Erreur lors de la vérification de l'ID" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Voiture non trouvée" });
      }

      const updateSql =
        "UPDATE voiture SET nom = ?, prix = ?, boiteDeVitesse = ?, consommation = ?, condition = ?, image = ? WHERE id = ?";
      connection.query(
        updateSql,
        [nom, prix, boiteDeVitesse, consommation, image, condition, id],
        (updateError) => {
          if (updateError) {
            return res
              .status(500)
              .json({ error: "Erreur lors de la mise à jour" });
          }

          res.status(200).json({ message: "Voiture mise à jour avec succès" });
        }
      );
    });
  });
};

exports.deleteVoiture = (req, res) => {
  const id = req.params.id;

  req.getConnection((error, connection) => {
    if (error) {
      return res
        .status(500)
        .json({ error: "Erreur de connexion à la base de données" });
    }

    const sql = "DELETE FROM voiture WHERE id = ?";
    connection.query(sql, [id], (error) => {
      if (error) {
        return res.status(500).json({ error: "Erreur lors de la suppression" });
      }
      res.status(200).json({ message: "Voiture supprimée avec succès" });
    });
  });
};

exports.addVoiture = (req, res) => {
  const { nom, boiteDeVitesse, prix, consommation, condition, image } = req.body;
  	 
  if (!nom || !boiteDeVitesse || !prix || !consommation || !condition) {
    return res
      .status(400)
      .json({ error: "Toutes les données doivent être fournies" });
  }

  req.getConnection((error, connection) => {
    if (error) {
      return res
        .status(500)
        .json({ error: "Erreur de connexion à la base de données" });
    }

    const sql =
      "INSERT INTO voiture (nom, prix, boiteDeVitesse, consommation, condition, image) VALUES (?, ?, ?, ?, ?, ?)";
    connection.query(
      sql,
      [nom, prix, boiteDeVitesse, consommation, condition, image],
      (insertError, insertResult) => {
        if (insertError) {
          return res
            .status(500)
            .json({ error: "Erreur lors de l'ajout de la voiture" });
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
};
