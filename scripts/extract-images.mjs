import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";

const root = path.join(process.cwd(), "public", "images");
const brandDir = path.join(root, "brand");

function clamp(meta, region) {
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const left = Math.max(0, Math.min(region.left, w - 1));
  const top = Math.max(0, Math.min(region.top, h - 1));
  const width = Math.max(1, Math.min(region.width, w - left));
  const height = Math.max(1, Math.min(region.height, h - top));
  return { left, top, width, height };
}

async function crop(src, out, region) {
  const meta = await sharp(src).metadata();
  await sharp(src)
    .extract(clamp(meta, region))
    .jpeg({ quality: 90 })
    .toFile(out);
}

const home = path.join(
  brandDir,
  "c__Users_Joshua_AppData_Roaming_Cursor_User_workspaceStorage_e3a6189a83ac692403c4d92847ed7051_images_screen5-ab859c0b-2a0e-448f-8a93-9a819c9a43fd.png",
);
const shop = path.join(
  brandDir,
  "c__Users_Joshua_AppData_Roaming_Cursor_User_workspaceStorage_e3a6189a83ac692403c4d92847ed7051_images_screen10-fc68b6f1-b963-4532-9dd1-6024867fd912.png",
);
const about = path.join(
  brandDir,
  "c__Users_Joshua_AppData_Roaming_Cursor_User_workspaceStorage_e3a6189a83ac692403c4d92847ed7051_images_screen7-5054477e-57dd-497d-a91e-012e59246649.png",
);
const contact = path.join(
  brandDir,
  "c__Users_Joshua_AppData_Roaming_Cursor_User_workspaceStorage_e3a6189a83ac692403c4d92847ed7051_images_screen4-0a1c4470-4e21-43e6-8880-eeda2e738547.png",
);
const checkout = path.join(
  brandDir,
  "c__Users_Joshua_AppData_Roaming_Cursor_User_workspaceStorage_e3a6189a83ac692403c4d92847ed7051_images_screen3-b02b2a1c-b6a0-4a85-b83f-4a7282541c25.png",
);

async function main() {
  for (const dir of ["hero", "products", "lifestyle"]) {
    await mkdir(path.join(root, dir), { recursive: true });
  }

  await crop(home, path.join(root, "hero", "hero-main.jpg"), {
    left: 0,
    top: 40,
    width: 266,
    height: 220,
  });

  await crop(home, path.join(root, "products", "linear-series.jpg"), {
    left: 8,
    top: 300,
    width: 250,
    height: 110,
  });

  await crop(home, path.join(root, "products", "monolith-acetate.jpg"), {
    left: 8,
    top: 420,
    width: 250,
    height: 110,
  });

  await crop(home, path.join(root, "products", "heritage-core.jpg"), {
    left: 8,
    top: 540,
    width: 250,
    height: 110,
  });

  await crop(home, path.join(root, "lifestyle", "crafting-perspective.jpg"), {
    left: 0,
    top: 660,
    width: 266,
    height: 90,
  });

  await crop(home, path.join(root, "products", "rare-matte-black.jpg"), {
    left: 8,
    top: 780,
    width: 120,
    height: 100,
  });

  await crop(home, path.join(root, "products", "lumina-tortoise.jpg"), {
    left: 138,
    top: 780,
    width: 120,
    height: 100,
  });

  const products = [
    "aeterna-01",
    "modulus-arc",
    "monolith-slim",
    "oxide-rigid",
    "golden-ratio",
    "biome-04",
    "shadow-cast",
    "fusion-core",
  ];

  const grid = [
    { left: 188, top: 118 },
    { left: 310, top: 118 },
    { left: 432, top: 118 },
    { left: 554, top: 118 },
    { left: 188, top: 360 },
    { left: 310, top: 360 },
    { left: 432, top: 360 },
    { left: 554, top: 360 },
  ];

  for (let i = 0; i < products.length; i++) {
    await crop(shop, path.join(root, "products", `${products[i]}.jpg`), {
      left: grid[i].left,
      top: grid[i].top,
      width: 115,
      height: 115,
    });
  }

  await crop(about, path.join(root, "lifestyle", "founder-julian-wave.jpg"), {
    left: 0,
    top: 95,
    width: 252,
    height: 140,
  });

  await crop(about, path.join(root, "lifestyle", "timeline-workshop.jpg"), {
    left: 0,
    top: 340,
    width: 252,
    height: 80,
  });

  await crop(about, path.join(root, "products", "hinge-detail.jpg"), {
    left: 0,
    top: 450,
    width: 252,
    height: 80,
  });

  await crop(about, path.join(root, "lifestyle", "flagship-gallery.jpg"), {
    left: 0,
    top: 560,
    width: 252,
    height: 80,
  });

  await crop(about, path.join(root, "lifestyle", "aesthetic-portrait.jpg"), {
    left: 0,
    top: 700,
    width: 120,
    height: 140,
  });

  await crop(about, path.join(root, "products", "aesthetic-tortoise.jpg"), {
    left: 130,
    top: 700,
    width: 120,
    height: 140,
  });

  await crop(contact, path.join(root, "lifestyle", "atelier-courtyard.jpg"), {
    left: 0,
    top: 420,
    width: 522,
    height: 200,
  });

  await crop(checkout, path.join(root, "products", "monolith-01-checkout.jpg"), {
    left: 430,
    top: 155,
    width: 70,
    height: 70,
  });

  await crop(checkout, path.join(root, "products", "arc-shield-checkout.jpg"), {
    left: 430,
    top: 250,
    width: 70,
    height: 70,
  });

  console.log("Image extraction complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
