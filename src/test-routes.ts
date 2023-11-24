import express, {
  Express,
  Request,
  Response,
  Application,
  NextFunction,
} from "express";

function test2(req: Request, res: Response, next: NextFunction) {
  console.log("hello 2");
  next();
}

const Router = express.Router({});

Router.get("/hello", test2, (req: Request, res: Response) => {
  res.send("abcd");
});

Router.get("/hello/:id", test2, (req: Request, res: Response) => {
  res.send("abcd");
});

export default Router;
