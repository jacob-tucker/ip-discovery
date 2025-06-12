import bs58 from "bs58";
import { CID } from "multiformats/cid";
import { base58btc } from "multiformats/bases/base58";

type Hex = string;

// v0 prefix for IPFS CIDv0
const v0Prefix = "1220";

export const convertHashIPFStoCID = (
  hash: Hex,
  version: "v0" | "v1" = "v0"
): string => {
  if (!hash) return "";

  // Ensure hash has 0x prefix
  const normalizedHash = hash.startsWith("0x") ? hash : `0x${hash}`;

  try {
    const base16CID = v0Prefix + normalizedHash.slice(2);
    const bytes = new Uint8Array(
      base16CID.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    const base58CID = bs58.encode(Buffer.from(bytes));

    if (version === "v0") {
      return base58CID;
    } else {
      return CID.parse(base58CID, base58btc).toV1().toString();
    }
  } catch (e) {
    console.error("Error converting hash to CID:", e);
    return "";
  }
};
