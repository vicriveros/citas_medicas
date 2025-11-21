// Utilizamos el cliente de Prisma para interactuar con la base de datos
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function main() {

  console.log(" Eliminando todos los usuarios previos...");

  // 1️ Limpia la tabla antes de empezar

  await prisma.user.deleteMany();

  // 2️ Crear usuarios iniciales (datos de prueba)

  const users = [

    { name: "Juan Perez", email: "juan@gmail.com", password: "password123", role: "USER" },

    { name: "Maria Gomez", email: "maria@gmail.com", password: "password123", role: "ADMIN" },

    { name: "Carlos Sanchez", email: "carlos@gmail.com", password: "password123", role: "USER" }

  ];

  for (const user of users) {

    await prisma.user.create({ data: user });

  }

  console.log(" Usuarios de demostración creados correctamente.");

  // 3️ Leer (READ): Obtener todos los usuarios

  const todosUsuarios = await prisma.user.findMany();

  console.log("\n Lista completa de usuarios:");

  console.table(todosUsuarios);

  // 4️ Leer uno (READ específico)

  const primerUsuario = todosUsuarios[0];

  console.log("\n Usuario específico por ID:");

  const usuarioUnico = await prisma.user.findUnique({

    where: { id: primerUsuario.id }

  });

  console.log(usuarioUnico);

  // 5️ Crear (CREATE): Añadir un nuevo usuario

  const nuevoUsuario = await prisma.user.create({

    data: {

      name: "Ana Torres",

      email: "ana@gmail.com",

      password: "password123",

      role: "USER"

    }

  });

  console.log(`Usuario nuevo creado: ${nuevoUsuario.name} (ID: ${nuevoUsuario.id})`);

  // 6️ Actualizar (UPDATE): Cambiar datos del usuario creado

  const usuarioActualizado = await prisma.user.update({

    where: { id: nuevoUsuario.id },

    data: { name: "Ana Torres Actualizada", role: "ADMIN" }

  });

  console.log(`Usuario actualizado: ${usuarioActualizado.name}, rol: ${usuarioActualizado.role}`);

  // 7️ Eliminar (DELETE): Eliminar un usuario específico

  const usuarioEliminado = await prisma.user.delete({

    where: { id: usuarioActualizado.id }

  });

  console.log(`Usuario eliminado: ${usuarioEliminado.name}`);

  // 8️ Confirmar lista final

  const usuariosFinales = await prisma.user.findMany();

  console.log("\n Usuarios restantes en la base de datos:");

  console.table(usuariosFinales);

  console.log("\n CRUD ejecutado con éxito. Base de datos limpia y sincronizada."); 

}

main()

  .catch(e => {

    console.error(" Error en el proceso:", e);

    process.exit(1);

  })

  .finally(async () => {

    await prisma.$disconnect();

  });