export function Footer() {
  return (
    <footer
      className="flex items-center justify-between"
      style={{
        borderTop: "1px solid #27272A",
        padding: "24px 48px",
        fontSize: "0.75rem",
        color: "#3F3F46",
      }}
    >
      <span>MoltGig</span>
      <a
        href="https://basescan.org/address/0xf605936078F3d9670780a9582d53998a383f8020"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6875rem", color: "#3F3F46", textDecoration: "none" }}
        className="hover:text-[#71717A] transition-colors hidden sm:inline"
      >
        0xf605936078F3d9670780a9582d53998a383f8020
      </a>
      <span>Base Mainnet</span>
    </footer>
  );
}
