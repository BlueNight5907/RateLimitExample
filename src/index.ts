import cors from "cors";
import dotenv from "dotenv";
import express, { Application, NextFunction, Request, Response } from "express";
import { v4 } from "uuid";
import { rateLimit } from "express-rate-limit";
import abc from "./test-routes";

//For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8080;

//
const helperFunction = (value: number) => () =>
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: value, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Use an external store for consistency across multiple server instances.
  });

const helperMiddleWareWithValue100 = helperFunction(100);
const helperMiddleWareWithValue10 = helperFunction(10);

app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Express & TypeScript Server ");
});

app.get("/hello", (req: Request, res: Response) => {
  res.send("Hello " + __dirname);
});

app.get("/hello/:id", (req: Request, res: Response) => {
  res.send("Hello " + __dirname);
});

app.use("/abc", abc);

app.listen(port, () => {
  // We get a layer sample so we can instantiate one after
  const layerSample = app._router.stack[0];

  // get constructors
  const Layer = layerSample.constructor;
  const cache: Record<string, any> = {};

  function split(thing: any) {
    if (typeof thing === "string") {
      return thing.split("/");
    } else if (thing.fast_slash) {
      return "";
    } else {
      var match = thing
        .toString()
        .replace("\\/?", "")
        .replace("(?=\\/|$)", "$")
        .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
      return match
        ? match[1].replace(/\\(.)/g, "$1").split("/")
        : "<complex:" + thing.toString() + ">";
    }
  }

  function testAddNewLayerPerRoute(path: string[], prevLayer: any, layer: any) {
    if (layer.route) {
      layer.route.stack.forEach(
        testAddNewLayerPerRoute.bind(
          null,
          path.concat(split(layer.route.path)),
          layer
        )
      );
    } else if (layer.name === "router" && layer.handle.stack) {
      layer.handle.stack.forEach(
        testAddNewLayerPerRoute.bind(
          null,
          path.concat(split(layer.regexp)),
          layer
        )
      );
    } else if (layer.method) {
      const key = `${layer.method.toUpperCase()}_${path
        .concat(split(layer.regexp))
        .filter(Boolean)
        .join("/")}`;
      cache[key] = prevLayer;
    }
  }

  app._router.stack.forEach(testAddNewLayerPerRoute.bind(null, [], null));
  Object.values(cache).forEach((layer) => {
    const middlewareLayer = new Layer("", {}, helperMiddleWareWithValue10());
    layer.route.stack.unshift(middlewareLayer);
  });
  console.log(`Server is Fire at http://localhost:${port}`);
});
