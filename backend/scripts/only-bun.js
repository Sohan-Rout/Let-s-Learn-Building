// Blocks installs from any package manager other than Bun.
// Runs as the `preinstall` lifecycle script.
const userAgent = process.env.npm_config_user_agent || "";

if (!userAgent.startsWith("bun/")) {
  const used = userAgent.split("/")[0] || "an unknown package manager";
  console.error(
    `\n\x1b[31m✖ This project uses Bun only. You ran: ${used}\x1b[0m\n` +
      "  Install Bun: https://bun.com/docs/installation\n" +
      "  Then run:    bun install\n",
  );
  process.exit(1);
}
