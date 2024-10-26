import { AuthPayload } from "./helpers/authHelper.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}