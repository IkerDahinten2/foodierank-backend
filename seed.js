require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

const usersData = [
  { nombre: "Carlos Mendoza", username: "carlos_mendoza92", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400" },
  { nombre: "Valeria Gómez", username: "valeg_foodie", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" },
  { nombre: "Diego Arriola", username: "diego_gourmet", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" },
  { nombre: "Sofia Castillo", username: "sofi_bites", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400" },
  { nombre: "Javier Estrada", username: "javi_chef_reviews", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400" },
  { nombre: "Mariana Morales", username: "mariana_eats", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400" },
  { nombre: "Mateo Fuentes", username: "mateof_gt", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400" },
  { nombre: "Camila Roca", username: "cami_roca", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400" },
  { nombre: "Rodrigo Paiz", username: "rodrigo_p_gt", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400" },
  { nombre: "Lucía Alvarado", username: "lu_alvarado", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" },
  { nombre: "Andrés Sandoval", username: "andres_sandoval", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400" }
];

const catalog = [
  {
    nombre: "El Rincón Chapín",
    categoria: "Comida Tradicional",
    descripcion: "Auténtica gastronomía autóctona preparada en ollas de barro con ingredientes locales y sazón tradicional.",
    direccion: "6a Avenida 11-24, Zona 1, Centro Histórico, Guatemala",
    horario: "Lunes a Domingo: 07:00 AM - 09:00 PM",
    fachada1: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000",
    fachada2: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000",
    platos: [
      { nombre: "Kaq'ik de Cobán", descripcion: "Caldo de chunto con achiote y chile cobanero, acompañado de tamalitos.", precio: 85.00, img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800" },
      { nombre: "Pepián de Pollo", descripcion: "Receta tradicional a base de pepitoria y ajonjolí tostado con verduras.", precio: 65.00, img: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800" },
      { nombre: "Rellenitos de Plátano", descripcion: "Masa de plátano rellena de frijol dulce con crema y azúcar.", precio: 30.00, img: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800" }
    ],
    reviews: [
      { user: "carlos_mendoza92", rating: 5, comment: "El mejor Kak'ik de la Zona 1, la atención fue súper rápida y las tortillas bien calientes." },
      { user: "valeg_foodie", rating: 4, comment: "Sabor casero impecable. El lugar es muy acogedor pero a veces cuesta encontrar parqueo." },
      { user: "mariana_eats", rating: 5, comment: "Me recordó totalmente a la comida de mi abuela. El recado del Pepián tiene la densidad perfecta." },
      { user: "rodrigo_p_gt", rating: 3, comment: "Buena sazón pero la atención estuvo un poco lenta en hora de almuerzo." }
    ]
  },
  {
    nombre: "Pacifico Seafood & Grill",
    categoria: "Mariscos y Cocina Costera",
    descripcion: "Frescura del océano Pacífico en la capital con ceviches marinados al momento y pescados frescos a la parrilla.",
    direccion: "Boulevard Los Próceres 14-30, Zona 10, Guatemala",
    horario: "Miércoles a Domingo: 12:00 PM - 11:00 PM",
    fachada1: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=1000",
    fachada2: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1000",
    platos: [
      { nombre: "Ceviche Mixto Garífuna", descripcion: "Camarón y pulpo con limón criollo, cilantro y toque de leche de coco.", precio: 95.00, img: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800" },
      { nombre: "Pargo Rojo Crisp", descripcion: "Pargo frito al ajillo con patacones de plátano y ensalada verde.", precio: 120.00, img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800" },
      { nombre: "Tapado de Livingston", descripcion: "Sopa marinera en base de leche de coco con pescado y mariscos.", precio: 110.00, img: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800" }
    ],
    reviews: [
      { user: "carlos_mendoza92", rating: 4, comment: "Mariscos bastante frescos y la leche de coco le da un toque diferente muy bueno." },
      { user: "diego_gourmet", rating: 5, comment: "El pargo estaba crocante por fuera y suave por dentro. Excelente selección de bebidas." },
      { user: "mariana_eats", rating: 3, comment: "El Ceviche estaba rico pero la porción un poco reducida para el precio." },
      { user: "rodrigo_p_gt", rating: 4, comment: "Excelente ambiente costero en plena Zona 10. Muy buen servicio." }
    ]
  },
  {
    nombre: "Fuego & Selva Steakhouse",
    categoria: "Parrilla de Autor",
    descripcion: "Cortes de carne madurados asados a la leña de encino con guarniciones artesanales.",
    direccion: "Vía 5, 4-68, Zona 4 (Cuatro Grados Norte), Guatemala",
    horario: "Martes a Sábado: 01:00 PM - 11:00 PM / Domingo: 12:00 PM - 06:00 PM",
    fachada1: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1000",
    fachada2: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1000",
    platos: [
      { nombre: "Puyazo Importado (12 oz)", descripcion: "Corte asado con sal de Petén, guacamol, chirmol y papas asadas.", precio: 160.00, img: "https://images.unsplash.com/photo-1558030006-450675393462?w=800" },
      { nombre: "Hamburguesa Volcán", descripcion: "200g de res Angus, queso chancol fundido y tocineta ahumada.", precio: 85.00, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800" },
      { nombre: "Costillas BBQ Cardamomo", descripcion: "Costillas horneadas 8h bañadas en BBQ infusionada con cardamomo.", precio: 135.00, img: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800" }
    ],
    reviews: [
      { user: "carlos_mendoza92", rating: 5, comment: "El término del puyazo estuvo perfecto al término medio. Calidad de carne top." },
      { user: "diego_gourmet", rating: 4, comment: "Sabor de ahumado exquisito. La salsa BBQ con cardamomo es una innovación genial." },
      { user: "mateof_gt", rating: 5, comment: "La hamburguesa Volcán de Fuego es de las mejores que he probado en Guatemala." },
      { user: "lu_alvarado", rating: 4, comment: "Gran experiencia gastronómica en Zona 4, aunque hay que reservar fin de semana." }
    ]
  },
  {
    nombre: "Macadamia Matcha & Brunch",
    categoria: "Café & Comida Saludable",
    descripcion: "Espacio luminoso enfocado en brunch saludable, café de finca antigüeño y opciones veganas.",
    direccion: "Km 16.5 Carretera a El Salvador, Plaza Concepción, Fraijanes",
    horario: "Lunes a Domingo: 07:00 AM - 07:00 PM",
    fachada1: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000",
    fachada2: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000",
    platos: [
      { nombre: "Avocado Toast Antigüeño", descripcion: "Pan de masa madre, aguacate regional, huevo pochado y ajonjolí.", precio: 55.00, img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800" },
      { nombre: "Acai Bowl Tropical", descripcion: "Açaí orgánico, granola artesanal de macadamia, fresas y miel local.", precio: 60.00, img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800" },
      { nombre: "Pancakes de Avena", descripcion: "Torre de pancakes sin gluten con banano, frutos rojos y syrup.", precio: 50.00, img: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800" }
    ],
    reviews: [
      { user: "valeg_foodie", rating: 5, comment: "Mi lugar favorito para desayunar. El pan de masa madre es súper fresco." },
      { user: "sofi_bites", rating: 5, comment: "Ambiente súper tranquilo para trabajar con laptop y el matcha es delicioso." },
      { user: "mateof_gt", rating: 4, comment: "Buenas opciones saludables. Los pancakes son esponjosos pese a ser sin gluten." },
      { user: "lu_alvarado", rating: 3, comment: "Bonito lugar pero se llena demasiado los domingos por la mañana." }
    ]
  },
  {
    nombre: "Ramen & Nikkei Lab",
    categoria: "Fusión Asiática",
    descripcion: "Fusión contemporánea de técnicas japonesas y peruano-asiáticas con ramen artesanal.",
    direccion: "12 Calle 4-55, Zona 14, Ciudad de Guatemala",
    horario: "Lunes a Sábado: 12:00 PM - 10:00 PM",
    fachada1: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1000",
    fachada2: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1000",
    platos: [
      { nombre: "Tonkotsu Ramen Tradicional", descripcion: "Caldo concentrado de cerdo de 12 horas, fideos caseros, chashu y huevo.", precio: 80.00, img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800" },
      { nombre: "Roll Acevichado Nikkei", descripcion: "Relleno de camote salteado y camarón, cubierto de atún y salsa acevichada.", precio: 75.00, img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800" },
      { nombre: "Gyozas de Cerdo y Jengibre", descripcion: "Empanaditas japonesas doradas al sartén con salsa ponzu artesanal.", precio: 45.00, img: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800" }
    ],
    reviews: [
      { user: "valeg_foodie", rating: 4, comment: "El caldo Tonkotsu tiene una profundidad de sabor increíble." },
      { user: "sofi_bites", rating: 3, comment: "El ramen es bueno pero las gyozas llegaron un poco frías a la mesa." },
      { user: "cami_roca", rating: 5, comment: "El Roll Acevichado es una explosión de sabor. Mi asiático favorito en Zona 14." },
      { user: "rodrigo_p_gt", rating: 4, comment: "Gran presentación en todos los platos y coctelería inspirada en el Japón antiguo." }
    ]
  },
  {
    nombre: "La Trattoria del Vicolo",
    categoria: "Italiana Artesanal",
    descripcion: "Pastas hechas a mano diariamente, pizzas al horno de piedra y recetas rústicas italianas.",
    direccion: "5a Avenida Norte #12, Antigua Guatemala, Sacatepéquez",
    horario: "Martes a Domingo: 12:00 PM - 10:00 PM",
    fachada1: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=1000",
    fachada2: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000",
    platos: [
      { nombre: "Fettuccine Alfredo con Trufa", descripcion: "Pasta fresca de la casa con crema de parmesano reggiano y aceite de trufa.", precio: 95.00, img: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800" },
      { nombre: "Pizza Margherita a la Leña", descripcion: "Masa madre de 48h, salsa de tomate San Marzano, mozzarella fior di latte.", precio: 85.00, img: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800" },
      { nombre: "Tiramisú Tradicional", descripcion: "Postre de bizcochos soletilla bañados en café espresso y queso mascarpone.", precio: 40.00, img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800" }
    ],
    reviews: [
      { user: "diego_gourmet", rating: 5, comment: "Sentirse en Italia mientras estás en Antigua. La pasta Fettuccine es un espectáculo." },
      { user: "javi_chef_reviews", rating: 4, comment: "Masa de pizza excelente con los bordes inflados perfectos. Buen vino de la casa." },
      { user: "mateof_gt", rating: 3, comment: "La comida es deliciosa pero el espacio dentro del restaurante es un poco reducido." },
      { user: "lu_alvarado", rating: 5, comment: "El tiramisú es el broche de oro perfecto. Volveré sin duda." }
    ]
  },
  {
    nombre: "Santo Taco Taquería",
    categoria: "Street Food Mexicana",
    descripcion: "Tacos urbanos de pastor, birria y guisados servidos en tortillas artesanales recién hechas.",
    direccion: "Vía 4, 1-05, Zona 4, Ciudad de Guatemala",
    horario: "Lunes a Domingo: 11:30 AM - 11:00 PM",
    fachada1: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000",
    fachada2: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1000",
    platos: [
      { nombre: "Tacos de Birria con Consomé", descripcion: "3 tacos de res marinada en chiles secos con queso fundido y consomé para calpar.", precio: 60.00, img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800" },
      { nombre: "Tacos al Pastor Tradicional", descripcion: "Cerdo adobado al trompo con piña asada, cilantro y cebollita picada.", precio: 45.00, img: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800" },
      { nombre: "Nachos Supremos con Queso", descripcion: "Totopos crujientes con frijoles refritos, guacamole, crema y carne asada.", precio: 65.00, img: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800" }
    ],
    reviews: [
      { user: "sofi_bites", rating: 5, comment: "Los tacos de birria son de otro planeta. El consomé súper sabroso y nada grasoso." },
      { user: "javi_chef_reviews", rating: 4, comment: "Salsas picantes muy bien logradas. El ambiente de callejón le da mucho toque." },
      { user: "cami_roca", rating: 5, comment: "Porciones súper generosas y servicio ultrarrápido. Los nachos son para compartir." },
      { user: "andres_sandoval", rating: 4, comment: "Excelentes tacos de pastor con piña bien asadita. Muy buena relación precio-calidad." }
    ]
  },
  {
    nombre: "Verde Sagrado",
    categoria: "100% Basada en Plantas",
    descripcion: "Cocina vegana innovadora enfocada en ingredientes botánicos, locales y ultra nutritivos.",
    direccion: "10a Calle 5-22, Zona 14, Ciudad de Guatemala",
    horario: "Lunes a Sábado: 08:00 AM - 08:00 PM",
    fachada1: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1000",
    fachada2: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000",
    platos: [
      { nombre: "Bowl Buda de Quinoa", descripcion: "Quinoa real, camote asado, garbanzos crocantes, aguacate y aderezo tahini.", precio: 65.00, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800" },
      { nombre: "Burger de Lentejas & Camote", descripcion: "Torta de lenteja en pan artesanal de avena con queso vegano y alioli de ajo.", precio: 70.00, img: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800" },
      { nombre: "Tarta de Cacao y Avellana", descripcion: "Postre crudivegano sin azúcar refinada a base de dátiles y cacao guatemalteco.", precio: 38.00, img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800" }
    ],
    reviews: [
      { user: "javi_chef_reviews", rating: 3, comment: "Demuestra que la comida vegana puede tener buen sabor, aunque le faltaba un punto de sal." },
      { user: "mariana_eats", rating: 5, comment: "El Bowl Buda es completo y súper llenador. El aderezo de tahini es espectacular." },
      { user: "cami_roca", rating: 4, comment: "Me encantó la tarta de cacao sin remordimientos. El ambiente transmite mucha paz." },
      { user: "andres_sandoval", rating: 5, comment: "Sorprendido positivamente con la hamburguesa de lentejas. Volveré por más." }
    ]
  }
];

async function seed() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    console.log("Conectado a Mongo. Limpiando colecciones...");

    await db.collection('users').deleteMany({});
    await db.collection('categories').deleteMany({});
    await db.collection('restaurants').deleteMany({});
    await db.collection('dishes').deleteMany({});
    await db.collection('reviews').deleteMany({});

    // 1. Insertar Usuarios
    console.log("Insertando usuarios evaluadores...");
    const hashedPwd = await bcrypt.hash("Password123", 10);
    const userDocs = usersData.map(u => ({
      _id: new ObjectId(),
      nombre: u.nombre,
      email: `${u.username}@foodierank.com`,
      username: u.username,
      password: hashedPwd,
      avatar: u.avatar,
      rol: 'usuario',
      fechaCreacion: new Date()
    }));
    await db.collection('users').insertMany(userDocs);

    const userMap = {};
    userDocs.forEach(u => { userMap[u.username] = u._id; });

    // 2. Insertar Categorías únicas
    console.log("Insertando categorías...");
    const uniqueCats = [...new Set(catalog.map(c => c.categoria))];
    const catDocs = uniqueCats.map(catName => ({
      _id: new ObjectId(),
      nombre: catName,
      descripcion: `Especialidad culinaria: ${catName}`,
      fechaCreacion: new Date()
    }));
    await db.collection('categories').insertMany(catDocs);

    const catMap = {};
    catDocs.forEach(c => { catMap[c.nombre] = c._id; });

    // 3. Insertar Restaurantes, Platos y Reseñas
    for (const item of catalog) {
      const restaurantId = new ObjectId();
      const avgRating = item.reviews.reduce((acc, r) => acc + r.rating, 0) / item.reviews.length;

      const restDoc = {
        _id: restaurantId,
        nombre: item.nombre,
        descripcion: item.descripcion,
        categoriaId: catMap[item.categoria],
        ubicacion: item.direccion,
        horario: item.horario,
        imagenUrl: item.fachada1,
        imagenFachada2: item.fachada2,
        estado: 'aprobado',
        ranking: Math.round(avgRating * 10) / 10,
        totalResenas: item.reviews.length,
        fechaCreacion: new Date()
      };
      await db.collection('restaurants').insertOne(restDoc);

      // Platos vinculados
      const dishDocs = item.platos.map(p => ({
        _id: new ObjectId(),
        restauranteId: restaurantId,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        imagenUrl: p.img,
        estado: 'aprobado',
        fechaCreacion: new Date()
      }));
      await db.collection('dishes').insertMany(dishDocs);

      // Reseñas vinculadas
      const reviewDocs = item.reviews.map(r => ({
        _id: new ObjectId(),
        restauranteId: restaurantId,
        usuarioId: userMap[r.user],
        calificacion: r.rating,
        comentario: r.comment,
        likes: [],
        dislikes: [],
        fechaCreacion: new Date()
      }));
      await db.collection('reviews').insertMany(reviewDocs);
    }

    console.log("¡Base de datos de FoodieRank poblada con éxito con los 8 restaurantes!");
  } catch (err) {
    console.error("Error al poblar base de datos:", err);
  } finally {
    await client.close();
  }
}

seed();