import fs from "node:fs/promises";
export const astraLicense = await fs.readFile(
  new URL("./public/icons/LICENSE.txt", import.meta.url),
  "utf8",
);
export const iconNames = [
  "ai",
  "target",
  "group",
  "chart",
  "shield",
  "document",
  "clock",
  "microphone",
  "lamp",
  "check-circle",
  "search",
  "apis",
];
const icons = Object.fromEntries(
  await Promise.all(
    iconNames.map(async (name) => [
      name,
      await fs.readFile(
        new URL(`./public/icons/${name}.svg`, import.meta.url),
        "utf8",
      ),
    ]),
  ),
);
export function iconData(name, color) {
  if (!icons[name]) throw Error("Nieznana ikona.");
  return (
    "image/svg+xml;base64," +
    Buffer.from(icons[name].replace(/#4E5964/gi, "#" + color)).toString(
      "base64",
    )
  );
}
