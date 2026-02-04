import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "viem/chains";

export const config = getDefaultConfig({
  appName: "MoltGig",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "moltgig-placeholder",
  chains: [base],
  ssr: true,
});
