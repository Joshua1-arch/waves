import mongoose from "mongoose";
import { sanitizeNoSql } from "./utils";

// Global Request.json() override to automatically sanitize all parsed request JSON bodies.
// This prevents NoSQL injection at the request entry point for every API route.
if (typeof Request !== "undefined" && Request.prototype && !(Request.prototype as any).__sanitized) {
  const originalJson = Request.prototype.json;
  Request.prototype.json = async function (this: Request) {
    const data = await originalJson.apply(this);
    return sanitizeNoSql(data);
  };
  (Request.prototype as any).__sanitized = true;
}

// Global Mongoose plugin to sanitize query filters and prevent NoSQL injection at the DB query layer.
const sanitizeQueryPlugin = (schema: mongoose.Schema) => {
  const sanitizeQueryObject = (query: any) => {
    if (!query) return;
    for (const key in query) {
      if (Object.prototype.hasOwnProperty.call(query, key)) {
        // Strip keys that start with '$' unless they are approved Mongoose operators
        if (key.startsWith("$") && !["$and", "$or", "$in", "$ne", "$gt", "$gte", "$lt", "$lte", "$elemMatch", "$regex", "$options"].includes(key)) {
          delete query[key];
        } else if (typeof query[key] === "object" && query[key] !== null) {
          sanitizeQueryObject(query[key]);
        }
      }
    }
  };

  const hooks = [
    "find",
    "findOne",
    "findOneAndUpdate",
    "findOneAndReplace",
    "findOneAndDelete",
    "updateOne",
    "updateMany",
    "deleteOne",
    "deleteMany",
    "countDocuments",
  ];

  hooks.forEach((hook) => {
    schema.pre(hook as any, function (this: any, next: any) {
      const query = this.getQuery();
      sanitizeQueryObject(query);
      next();
    });
  });
};

// Register the global plugin
mongoose.plugin(sanitizeQueryPlugin);

function getMongoDbUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in .env.local");
  }

  return uri;
}

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    const maxPoolSize = process.env.MONGODB_MAX_POOL_SIZE
      ? parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10)
      : 10;
    const minPoolSize = process.env.MONGODB_MIN_POOL_SIZE
      ? parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10)
      : 2;

    cache.promise = mongoose.connect(getMongoDbUri(), {
      bufferCommands: false,
      maxPoolSize: isNaN(maxPoolSize) ? 10 : maxPoolSize,
      minPoolSize: isNaN(minPoolSize) ? 2 : minPoolSize,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
