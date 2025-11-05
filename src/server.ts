import express from 'express';
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import bcrypt from 'bcrypt';
const saltRounds = 10;

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4080;


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    }
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    let ime=null
    if (req.session.ime){
        ime=req.session.ime
    }else if(req.query.ime){
        ime=req.query.ime
    }
    const ranjivost = req.session.ranjivost === 1 ? 1 : 0
    res.render('index', {ime:ime, ranjivost:ranjivost})
});

app.post('/ukljuci-ranjivost', async (req, res) => {
    req.session.ranjivost = 1
    res.redirect('/')
});

app.post('/iskljuci-ranjivost', async (req, res) => {
    req.session.ranjivost = 0
    res.redirect('/')
});

app.post('/input', async (req, res) => {
  let {ime, lozinka } = req.body
  if (req.session.ranjivost){
    req.session.ime=null
    req.session.lozinka=null
    res.redirect('/?ime=' + encodeURIComponent(ime) + '&lozinka=' + encodeURIComponent(lozinka))
  }else{
    ime=ime.replace(/[^a-zA-Z0-9 ]/g, '')
    lozinka=lozinka.replace(/[^a-zA-Z0-9 ]/g, '')
    try {
        const hash = await bcrypt.hash(lozinka, saltRounds);
        req.session.lozinka = hash;
        req.session.ime = ime;
        res.redirect('/');
    } catch (err) {
        res.status(500).send('error hashing');
    }
  }
});

if (externalUrl) {
    const hostname = '0.0.0.0';
    app.listen(port, hostname, () => {
        console.log(`Server locally running at http://${hostname}:${port}/ and from
  outside on ${externalUrl}`);
    });
}
else {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/`);
    });
}