const express = require("express");
const router = express.Router();
const voitureController = require("../controllers/voitureControllers");

// Route POST pour ajouter une nouvelle voiture
router.post("/", voitureController.addVoiture);

// Route PUT pour modifier une voiture
router.put("/:id", voitureController.updateVoiture);

// Route DELETE pour supprimer une voiture
router.delete("/:id", voitureController.deleteVoiture);

module.exports = router;
