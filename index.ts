"use strict";

import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;
const path = require('path');
const projectRoot = process.cwd();

app.use('/public', express.static('public'));
app.use('/public/static', express.static(path.join(projectRoot, 'public/static')));

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
