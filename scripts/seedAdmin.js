import bcrypt from "bcryptjs";
import nextEnv from "@next/env";
import mongoose from "mongoose";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function getMongoDbUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define MONGODB_URI in .env.local before running seedAdmin.");
  }

  return uri;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seedAdmin() {
  const mongoDbUri = getMongoDbUri();

  await mongoose.connect(mongoDbUri, {
    bufferCommands: false,
  });

  try {
    const existingAdmin = await User.findOne({ email: "admin@waveandco.com" })
      .select("_id email role")
      .lean();

    if (existingAdmin) {
      if (existingAdmin.role === "admin") {
        console.log("Admin user already exists. Skipping seed.");
        return;
      }

      await User.updateOne(
        { _id: existingAdmin._id },
        {
          $set: {
            name: "Admin User",
            role: "admin",
          },
        },
      );

      console.log("Existing user upgraded to admin successfully.");
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin1234!", 12);

    await User.create({
      name: "Admin User",
      email: "admin@waveandco.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin user seeded successfully.");
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin user.");
  console.error(error);
  process.exit(1);
});
