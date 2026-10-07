// Kullanım: npm run hash-password -- "sifren"
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Kullanım: npm run hash-password -- "en-az-10-karakterli-sifre"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log(hash);
console.log("\n.env için ($ işaretleri kaçışlı):");
console.log(`ADMIN_PASSWORD_HASH="${hash.replace(/\$/g, "\\$")}"`);
