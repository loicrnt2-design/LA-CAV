import Database from "better-sqlite3";

const [rawId, confirmation, ...extra] = process.argv.slice(2);
const id = Number(rawId);
if (process.env.NODE_ENV === "production" || !/^[1-9]\d*$/.test(rawId ?? "") ||
    !Number.isSafeInteger(id) || confirmation !== "--confirm" || extra.length > 0) {
  console.error("Usage local uniquement : npm run admin:grant -- <identifiant-utilisateur> --confirm");
  process.exitCode = 1;
} else {
  const file = process.env.DATABASE_FILE ?? "data/lacav.db";
  const database = new Database(file, { fileMustExist: true });
  try {
    const result = database.prepare("UPDATE users SET role = 'admin' WHERE id = ? AND is_demo = 0").run(id);
    if (result.changes !== 1) {
      console.error("Utilisateur introuvable ou compte de démonstration : aucun rôle modifié.");
      process.exitCode = 1;
    } else {
      console.log(`Rôle administrateur attribué à l'utilisateur ${id} dans la base locale.`);
    }
  } finally {
    database.close();
  }
}
