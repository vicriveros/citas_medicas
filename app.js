require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const { PrismaClient } = require('./generated/prisma/');
const prisma = new PrismaClient();

const LoggerMiddleware = require('./src/middlewares/logger');
const errorHandler = require('./src/middlewares/errorHandler');
const authenticateToken = require('./src/middlewares/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(LoggerMiddleware);
app.use(errorHandler);

const fs = require('fs');
const path = require('path');
const { error } = require('console');
const usersFilePath = path.join(__dirname, 'users.json');

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`Esto puede ser un html si queres`)
});

app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    res.send(`Mostrar info del usuario con id: ${userId}`)
});

app.get('/search', (req, res) => {
    const terms = req.query.termino || 'no hay termino';
    const category = req.query.categoria || 'Todas';

    res.send(`
        <h2>Resultado de busqueda</h2>
        <p>Termino: ${terms}</p>
        <p>Categoria: ${category}</p>
        `);
});

app.post('/form', (req, res) => {
    const name = req.body.nombre || 'Sin nombre';
    const email = req.body.email || 'Sin email';

    res.json({
        message: 'Datos Recibidos',
        data: {
            name,
            email
        }
    });
});

app.post('/api/data', (req, res) => {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'No se recibieron datos.' })
    }

    res.status(201).json({
        message: 'Datos JSON recibidos',
        data
    });
});

app.get('/users', (req, res) => {
    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con conexion de datos' })
        }
        const users = JSON.parse(data);
        res.json(users);
    });
});

app.post('/users', (req, res) => {
    const newUser = req.body;
    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con conexion de datos' })
        }
        const users = JSON.parse(data);
        users.push(newUser);
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error guardarndo usuario' })
            }
            res.status(201).json(newUser);
        });
    });
});

app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const updatedUser = req.body;

    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con conexion de datos' })
        }
        let users = JSON.parse(data);
        users = users.map(user =>
            user.id === userId ? { ...user, ...updatedUser } : user
        );
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
            if (err) {
                return res.status(500).json({ error: 'Error con conexion de datos' })
            }
            res.json(updatedUser);
        })
    });
});

app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    fs.readFile(usersFilePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con conexion de datos.' });
        }
        let users = JSON.parse(data);
        users = users.filter(user => user.id !== userId);
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
            if (err) {
                return res.status(500).json({ error: 'Error con conexion de datos' })
            }
            res.status(204).send();
        });
    })
});

app.get('/db-users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        res
            .status(500)
            .json({ error: 'Error en conexion a BD' })
    }
});

app.get('/protegida', authenticateToken, (req, res) => {
    res.send('esta es una ruta protegida.');
});

app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role: 'USER'
        }
    });

    res.status(201).json({ message: 'Usuario registrado.' })
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
    res.json({ token });
});

app.listen(PORT, () => {
    console.log(`la app corre en puerto: ${PORT}`)
});