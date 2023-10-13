"use strict";

import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;
const path = require('path');

app.use('/', express.static('public'));
app.use('/static', express.static(path.join(__dirname, 'public/static')));

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
