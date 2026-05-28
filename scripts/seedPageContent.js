import nextEnv from "@next/env";
import mongoose from "mongoose";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function getMongoDbUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define MONGODB_URI in .env.local before running seedPageContent.");
  }

  return uri;
}

const pageContentSectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      default: "",
    },
  },
  { _id: false },
);

const pageContentSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      enum: ["home", "about", "contact"],
    },
    sections: {
      type: [pageContentSectionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const PageContent =
  mongoose.models.PageContent ||
  mongoose.model("PageContent", pageContentSchema);

const defaultContent = [
  {
    slug: "home",
    sections: [
      { key: "hero_headline", value: "See the World Differently" },
      {
        key: "hero_subheadline",
        value: "Architectural precision in every detail",
      },
      { key: "hero_cta_text", value: "Shop Collection" },
      { key: "featured_section_title", value: "Featured Collections" },
      { key: "bestsellers_section_title", value: "Best Sellers" },
      { key: "brand_story_headline", value: "Crafted With Intention" },
      {
        key: "brand_story_body",
        value:
          "Wave & Co. creates architectural eyewear defined by precision, material clarity, and enduring form.",
      },
      { key: "newsletter_headline", value: "Join The Collective" },
      {
        key: "newsletter_subtext",
        value:
          "Receive exclusive access to new releases and curated content from the studio.",
      },
    ],
  },
  {
    slug: "about",
    sections: [
      { key: "headline", value: "We Are Wave & Co." },
      {
        key: "subheadline",
        value: "Architectural precision in every detail",
      },
      {
        key: "story",
        value:
          "Wave & Co. was born from a belief that eyewear should reflect the rigor, proportion, and restraint of architecture.",
      },
      {
        key: "mission",
        value:
          "We design modern heirlooms that balance structural discipline, quiet luxury, and lasting utility.",
      },
    ],
  },
  {
    slug: "contact",
    sections: [
      { key: "headline", value: "Get In Touch" },
      { key: "email", value: "hello@waveandco.com" },
      { key: "phone", value: "+1 (000) 000-0000" },
      {
        key: "address",
        value: "742 Avenue of Architecture, Antwerp, Belgium 2000",
      },
      { key: "hours", value: "Mon–Fri, 10:00 AM – 6:00 PM" },
    ],
  },
];

async function seedPageContent() {
  await mongoose.connect(getMongoDbUri(), {
    bufferCommands: false,
  });

  try {
    for (const entry of defaultContent) {
      await PageContent.findOneAndUpdate(
        { slug: entry.slug },
        {
          $setOnInsert: {
            slug: entry.slug,
            sections: entry.sections,
          },
        },
        {
          new: true,
          upsert: true,
        },
      );
    }

    console.log("Page content seeded successfully.");
  } finally {
    await mongoose.disconnect();
  }
}

seedPageContent().catch((error) => {
  console.error("Failed to seed page content.");
  console.error(error);
  process.exit(1);
});
