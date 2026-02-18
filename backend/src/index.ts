import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { env } from 'process';
import fs from "node:fs";
import swaggerUi from "swagger-ui-express";
import yaml from "yaml";
import http from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./sockets/socketHandlers";
import playerRouter from './player/playerRouter';
import gameRouter from './game/gameRouter';
import tournamentRouter from './tournament/tournamentRouter';
import specialGameRouter from './specialGame/specialGameRouter';


config();

const app = express();
const port = env.API_PORT || 4000;


const swaggerYaml = fs.readFileSync("./api-documentation/openapi.yaml", "utf8");
const swaggerDocument = yaml.parse(swaggerYaml);


if (env.NODE_ENV !== "production") {
    const openapiEndpoint = "/api-documentation/";
    app.use(openapiEndpoint, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log(
        `[${new Date().toISOString()}]`,
        `openAPI UI is available at http://localhost:${port}${openapiEndpoint}`
    );
}

const corsOptions = {
  origin: env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // enables cookies/authorization headers
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/players', playerRouter);
app.use('/games', gameRouter);
app.use('/tournaments', tournamentRouter);
app.use('/specialGames', specialGameRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: env.FRONTEND_URL },
});
registerSocketHandlers(io);

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.sendStatus(200);
});

app.use((_req: Request, res: Response) => {
    res.status(404).send('Not found');
  });

server.listen(port, () => {
    console.log(
    `[${new Date().toISOString()}] RESTful API for chess is listening on port ${port}`,
    );
});
