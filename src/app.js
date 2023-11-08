import express from 'express';
import CategoriesRouter from './routes/categories.router.js';
import MenusRouter from './routes/menus.router.js'


const app = express();
const PORT = 3006;


app.use(express.json());
app.use('/api', [CategoriesRouter, MenusRouter]);


app.get('/', (req, res) => {
    return res.status(200).json({message : "ok"});
})

app.listen(PORT, () => {
    console.log(PORT, "번 연결");
})