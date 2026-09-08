const fs = require("fs");
const path = require("path");

const dir = path.join(process.cwd(), "src/app/api");
const files = [];

function findTsFiles(d) {
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, entry.name);
    if (entry.isDirectory()) findTsFiles(full);
    else if (entry.name === "route.ts") files.push(full);
  }
}

findTsFiles(dir);

for (const file of files) {
  let content = fs.readFileSync(file, "utf-8");
  let changed = false;

  // Replace import
  if (content.includes('import getDb, { esBeneficiario } from "@/lib/db"') && !content.includes('getDbAsync')) {
    content = content.replace(
      'import getDb, { esBeneficiario } from "@/lib/db"',
      'import getDb, { esBeneficiario, getDbAsync } from "@/lib/db"'
    );
    changed = true;
  } else if (content.includes('import getDb from "@/lib/db"') && !content.includes('getDbAsync')) {
    content = content.replace(
      'import getDb from "@/lib/db"',
      'import getDb, { getDbAsync } from "@/lib/db"'
    );
    changed = true;
  }

  // Replace getDb() calls
  const newContent = content.replace(/const db = getDb\(\)/g, "const db = await getDbAsync()");
  if (newContent !== content) {
    content = newContent;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, "utf-8");
    console.log("OK " + path.relative(process.cwd(), file));
  }
}

console.log("Total: " + files.length + " archivos revisados");
