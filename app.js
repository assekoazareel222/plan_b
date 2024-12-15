const express = require("express");
const bodyParser = require("body-parser");
const myConnection = require("express-myconnection");
const mysql = require('mysql2/promise');
const voitureRoutes = require("./routes/voitureRoutes");
const dbConfig = require("./config/db");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const session = require('express-session');

const dotenv = require('dotenv');
dotenv.config();


const app = express();
// 1. Configuration de CORS - à mettre en premier pour intercepter toutes les requêtes
app.use(
  cors({
    origin: ["http://localhost:3000" , "http://localhost:5502" ,"https://adminbiabiamotor.onrender.com", "https://biabia-motor.onrender.com"], // Autoriser les deux origines
    methods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    allowedHeaders:
      "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization",
  })
);



// Middleware pour analyser les requêtes JSON
app.use(express.json());






app.use('/images', express.static(path.join(__dirname, 'public/images')));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE, // Si pas de port spécifié, utiliser le port par défaut
});





// Configuration de la session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',  // Clé secrète pour signer les cookies de session
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true }  // Utilisez `secure: true` si vous utilisez HTTPS
}));


app.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;

  try {
    // Utiliser directement le pool de connexions avec async/await
    const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    // Vérifier si l'utilisateur existe déjà
    if (results.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ajouter l'utilisateur à la base de données
    await pool.query('INSERT INTO users (email, username, password) VALUES (?, ?, ?)', [email, username, hashedPassword]);

    return res.status(201).json({ message: 'Utilisateur créé avec succès' });

  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err);
    res.status(500).json({ message: 'Erreur interne lors de l\'inscription' });
  }
});


app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Utiliser pool.promise() pour gérer les promesses
    const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    const user = results[0];

    if (!user.password) {
      return res.status(400).json({ message: 'Utilisateur trouvé sans mot de passe' });
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    // Stocker l'ID de l'utilisateur dans la session
    req.session.userId = user.id;

    return res.json({ message: 'Connexion réussie' });

  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ message: 'Erreur interne lors de la connexion' });
  }
});

// Déconnexion
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
    }
    return res.json({ message: 'Déconnexion réussie' });
  });
});

// Middleware d'authentification
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  next();
};




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

app.get("/users", (req, res) => {
  req.getConnection((erreur, connection) => {
    if (erreur) {
      res
        .status(500)
        .json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      connection.query("SELECT * FROM users", [], (erreur, resultat) => {
        if (erreur) {
          res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
        } else {
          res.status(200).json(resultat);
        }
      });
    }
  });
});



app.get("/users", (req, res) => {
  req.getConnection((erreur, connection) => {
    if (erreur) {
      res
        .status(500)
        .json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      connection.query("SELECT * FROM users", [], (erreur, resultat) => {
        if (erreur) {
          res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
        } else {
          res.status(200).json(resultat);
        }
      });
    }
  });
});


app.get("/vente",(req, res) => {
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

app.post("/vente", (req, res) => {
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
app.put("/vente/:id", (req, res) => {
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

app.delete("/vente/:id", (req, res) => {
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

app.get("/commande",isAuthenticated, (req, res) => {
  req.getConnection((erreur, connection) => {
    if (erreur) {
      res
        .status(500)
        .json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      connection.query("SELECT * FROM commande", [], (erreur, resultat) => {
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

app.post("/commande", (req, res) => {
  const { nomVoiture , nomClient, numeroTelephone , numeroWhatsapp ,  	adresseMail , adresse  } = req.body;

  req.getConnection((erreur, connection) => {
    if (erreur) {
      res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      const query = `
        INSERT INTO commande (nomVoiture, nomClient, numeroTelephone, numeroWhatsapp, adresseMail, adresse) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      connection.query(query, [nomVoiture, nomClient, numeroTelephone, numeroWhatsapp, adresseMail, adresse], (erreur, resultat) => {
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


app.get("/commandevente", (req, res) => {
  req.getConnection((erreur, connection) => {
    if (erreur) {
      res
        .status(500)
        .json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      connection.query("SELECT * FROM commandeVente", [], (erreur, resultat) => {
        if (erreur) {
          res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
        } else {
          res.status(200).json(resultat);
        }
      });
    }
  });
});

app.get("/gestion", (req, res) => {
  req.getConnection((erreur, connection) => {
    if (erreur) {
      res
        .status(500)
        .json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      connection.query("SELECT * FROM gestion", [], (erreur, resultat) => {
        if (erreur) {
          res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
        } else {
          res.status(200).json(resultat);
        }
      });
    }
  });
});
// Configuration de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images'); // Le dossier où les fichiers seront stockés
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Nom du fichier avec un timestamp pour l'unicité
  }
});

const stock = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de taille à 5MB
  fileFilter: (req, file, cb) => {
    // Vérifier l'extension du fichier
    const allowedTypes = /jpeg|jpg|png/;
    if (!allowedTypes.test(file.mimetype)) {
      return cb(new Error('Le fichier doit être une image JPEG, PNG ou JPG'));
    }
    cb(null, true);
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route POST avec Multer pour traiter le fichier et les autres champs
app.post("/gestion", stock.single("image"), (req, res) => {
  // Afficher les données envoyées en console
  console.log("Données reçues:");
  console.log("Fichier:", req.file);  // Affiche les détails du fichier téléchargé
  console.log("Autres champs:", req.body);  // Affiche les autres données du formulaire

  // Vérifier si un fichier est téléchargé
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier téléchargé" });
  }

  // Extraire les autres données du formulaire
  const { nom, marque, model, annes, kilometrage, message } = req.body;
  const image = req.file ? `/images/${req.file.filename}` : null;  // URL de l'image

  // Traitement de la requête et insertion dans la base de données
  req.getConnection((erreur, connection) => {
    if (erreur) {
      return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      const query = `
        INSERT INTO gestion (nom, marque, model, annes, kilometrage, image, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      connection.query(query, [nom, marque, model, annes, kilometrage, image, message], (erreur, resultat) => {
        if (erreur) {
          console.error("Erreur SQL:", erreur); // Afficher l'erreur SQL
          return res.status(500).json({ erreur: "Erreur lors de la requête SQL", details: erreur });
        } else {
          console.log("Réponse de l'API:", { message: "Voiture ajoutée avec succès", id: resultat.insertId });
          return res.status(201).json({ message: "Voiture ajoutée avec succès", id: resultat.insertId });
        }
      });
    }
  });
});




//routes post voiture

app.post("/commandevente", (req, res) => {
  const { nomVoiture , nomClient, numeroTelephone , numeroWhatsapp ,  	adresseMail , adresse  } = req.body;

  req.getConnection((erreur, connection) => {
    if (erreur) {
      res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      const query = `
        INSERT INTO commandeVente (nomVoiture, nomClient, numeroTelephone, numeroWhatsapp, adresseMail, adresse) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      connection.query(query, [nomVoiture, nomClient, numeroTelephone, numeroWhatsapp, adresseMail, adresse], (erreur, resultat) => {
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

app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  // Vérification de l'existence de l'utilisateur
  req.getConnection((erreur, connection) => {
    if (erreur) {
      return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      const checkUserQuery = "SELECT * FROM users WHERE email = ?";
      connection.query(checkUserQuery, [email], (erreur, resultat) => {
        if (erreur) {
          return res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
        }
        if (resultat.length > 0) {
          return res.status(400).json({ erreur: "L'email est déjà utilisé" });
        }

        // Hash du mot de passe avant de le sauvegarder
        bcrypt.hash(password, 10, (erreur, hash) => {
          if (erreur) {
            return res.status(500).json({ erreur: "Erreur lors du hashage du mot de passe" });
          }

          // Enregistrement de l'utilisateur
          const query = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
          connection.query(query, [username, email, hash], (erreur, resultat) => {
            if (erreur) {
              return res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
            }
            return res.status(201).json({ message: "Compte créé avec succès" });
          });
        });
      });
    }
  });
});



app.post("/login", (req, res) => {
  const { email, password } = req.body;

  req.getConnection((erreur, connection) => {
    if (erreur) {
      return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
    } else {
      const query = "SELECT * FROM users WHERE email = ?";
      connection.query(query, [email], (erreur, resultat) => {
        if (erreur) {
          return res.status(500).json({ erreur: "Erreur lors de la requête SQL" });
        }

        if (resultat.length === 0) {
          return res.status(404).json({ erreur: "Utilisateur non trouvé" });
        }

        // Vérification du mot de passe
        bcrypt.compare(password, resultat[0].password, (erreur, isMatch) => {
          if (erreur) {
            return res.status(500).json({ erreur: "Erreur lors de la comparaison du mot de passe" });
          }

          if (!isMatch) {
            return res.status(400).json({ erreur: "Mot de passe incorrect" });
          }

          // Création du token JWT
          const token = jwt.sign(
            { userId: resultat[0].id, username: resultat[0].username },
            'votre-clé-secrète', // Utilisez une clé secrète forte
            { expiresIn: '1h' }  // Le token expire après 1 heure
          );

          // Retourner le token au client
          return res.status(200).json({ message: "Connexion réussie", token: token });
        });
      });
    }
  });
});




// Démarrage du serveur
app.listen(3005, () => {
  console.log("Serveur lancé sur le port 3005");
});
