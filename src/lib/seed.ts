import { db } from "./db";
import bcrypt from "bcryptjs";

const ITEMS: [string, string, string, string, string, number, number | null, number, string, boolean][] = [
  ["Dracaufeu holo Set de Base (démo)", "cards", "Pokémon", "good", "Carte fictive de démonstration. Légères traces de manipulation.", 12000, 150, 8, "Lyon", false],
  ["Montre automatique vintage 1970 (démo)", "watches", "Atelier démo", "fair", "Exemple de fiche montre. Mouvement à réviser, bracelet cuir neuf.", 24000, 590, 215, "Paris", false],
  ["Bague or 18 carats (démo)", "jewelry", "", "excellent", "Exemple de fiche bijou. Poinçon visible. Aucune authenticité n'est garantie sur cette démo.", 31000, null, 45, "Bordeaux", false],
  ["Veste en laine années 80 (démo)", "clothing", "Maison démo", "good", "Veste structurée, taille 40, doublure intacte.", 4500, 490, 340, "Lille", false],
  ["Fauteuil scandinave teck (démo)", "furniture", "", "fair", "Structure saine, assise à regarnir. Retrait possible sur place.", 18000, null, 25, "Nantes", true],
  ["Lampe de bureau industrielle (démo)", "vintage", "", "good", "Lampe articulée, câble refait.", 6500, 890, 190, "Toulouse", true],
  ["Lot de 5 cartes à jouer anciennes (démo)", "collectibles", "", "good", "Lot fictif pour la démonstration.", 2900, 120, 300, "Rennes", false],
  ["Collier perles et argent (démo)", "jewelry", "", "excellent", "Fermoir argent 925 poinçonné, longueur 45 cm.", 8900, 120, 160, "Strasbourg", false],
];

export function seedDemoIfEmpty() {
  const d = db();
  if ((d.prepare("SELECT COUNT(*) c FROM listings").get() as { c: number }).c > 0) return;
  const pw = bcrypt.hashSync(Math.random().toString(36) + Date.now(), 4); // compte démo non connectable
  const u = d
    .prepare("INSERT INTO users (email, password_hash, display_name, is_demo) VALUES (?,?,?,1)")
    .run("demo@la-cav.invalid", pw, "Boutique Démo").lastInsertRowid;
  const s = d
    .prepare("INSERT INTO shops (owner_id, slug, name, description, is_demo) VALUES (?,?,?,?,1)")
    .run(u, "boutique-demo", "Boutique Démo", "Boutique fictive pour la démonstration. Les articles ne sont pas réels.").lastInsertRowid;
  const ins = d.prepare(
    `INSERT INTO listings (shop_id,title,description,category,brand,condition,price_cents,shipping_cents,status,image_hue,location,hand_delivery,is_demo)
     VALUES (?,?,?,?,?,?,?,?, 'published', ?, ?, ?, 1)`,
  );
  for (const [t, c, b, cond, desc, p, ship, hue, loc, hand] of ITEMS) ins.run(s, t, desc, c, b, cond, p, ship, hue, loc, hand ? 1 : 0);
}
