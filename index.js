const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Conexión con MongoDB
mongoose.connect('mongodb+srv://alexmorenoc3:cfpTQGHFH91rhPdH@cluster0.ho5zg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Esquema para almacenar la respuesta
const RespuestaSchema = new mongoose.Schema({
    
    question: String, // La pregunta en sí
    response: String, // La respuesta del usuario
    quantity: Number, // Cantidad, si aplica
});

// Modelo de Mongoose con el nombre de la colección 'empresarial'
const Respuesta = mongoose.model('Respuesta', RespuestaSchema, 'empresarial');

// Ruta para agregar una respuesta
app.post('/respuesta', async (req, res) => {
    const { question, response, quantity } = req.body;
  
    // Validar los datos recibidos
    if (!question || response === undefined || quantity === undefined) {
      return res.status(400).send({ message: 'Todos los campos son obligatorios' });
    }
  
    const nuevaRespuesta = new Respuesta({question, response, quantity });
    await nuevaRespuesta.save();
  
    res.status(201).send({ message: 'Respuesta guardada correctamente' });
});

// Ruta para obtener respuestas agrupadas por pregunta y empresa
app.get('/respuestas', async (req, res) => {
  try {
    const customOrder = ['Debilidades', 'Oportunidades', 'Fortalezas', 'Amenazas']; // Orden personalizado

    const respuestas = await Respuesta.aggregate([
      {
        $group: {
          _id: { question: '$question' }, // Agrupar por pregunta
          respuestas: {
            $push: {
              response: '$response',
              quantity: { $toInt: '$quantity' } // Aseguramos que quantity sea un número
            }
          }
        }
      },
      {
        $addFields: {
          customOrderIndex: {
            $indexOfArray: [customOrder, '$_id.question'] // Asignar un índice basado en el orden personalizado
          }
        }
      },
      {
        $sort: { customOrderIndex: 1 } // Ordenar por el índice personalizado
      },
      {
        $project: {
          customOrderIndex: 0 // Eliminar el campo de índice del resultado final
        }
      }
    ]);

    res.status(200).send(respuestas);
  } catch (error) {
    console.error("Error al obtener respuestas: ", error);
    res.status(500).send("Error al obtener las respuestas");
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


