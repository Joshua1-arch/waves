import nextEnv from "@next/env";
import mongoose from "mongoose";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function getMongoDbUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define MONGODB_URI in .env.local before running seedTaxonomies.");
  }

  return uri;
}

function slugifyTaxonomyName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const taxonomySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["category", "material"],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

taxonomySchema.index({ type: 1, name: 1 }, { unique: true });
taxonomySchema.index({ type: 1, slug: 1 }, { unique: true });

taxonomySchema.pre("validate", function (next) {
  if ((!this.slug || !this.slug.trim()) && this.name) {
    this.slug = slugifyTaxonomyName(this.name);
  }

  next();
});

const Taxonomy = mongoose.models.Taxonomy || mongoose.model("Taxonomy", taxonomySchema);

const DEFAULT_TAXONOMIES = [
  { type: "category", name: "Aviator" },
  { type: "category", name: "Rectangular" },
  { type: "category", name: "Round" },
  { type: "category", name: "Cat Eye" },
  { type: "material", name: "Titanium" },
  { type: "material", name: "Bio-Acetate" },
  { type: "material", name: "Gold-Plated" },
];

async function seedTaxonomies() {
  const mongoDbUri = getMongoDbUri();

  await mongoose.connect(mongoDbUri, {
    bufferCommands: false,
  });

  try {
    for (const taxonomy of DEFAULT_TAXONOMIES) {
      await Taxonomy.updateOne(
        { type: taxonomy.type, name: taxonomy.name },
        {
          $setOnInsert: {
            slug: slugifyTaxonomyName(taxonomy.name),
          },
        },
        { upsert: true },
      );
    }

    console.log("Taxonomies seeded successfully.");
  } finally {
    await mongoose.disconnect();
  }
}

seedTaxonomies().catch((error) => {
  console.error("Failed to seed taxonomies.");
  console.error(error);
  process.exit(1);
});
