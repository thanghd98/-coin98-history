
import TonWeb, { AddressType } from "tonweb";

export function formatAddress(
  address: AddressType | undefined,
  type: "hex" | "bounceable" | "non-bounceable" = "non-bounceable",
  isTestNet: boolean = false
) {
  if (typeof address === "undefined" || !TonWeb.utils.Address.isValid(address))
    return "--";
  const sourceAddress = new TonWeb.utils.Address(address);
  if (type === "hex") return sourceAddress.toString(false);

  if (type === "bounceable")
    return sourceAddress.toString(true, true, true, isTestNet);

  if (type === "non-bounceable")
    return sourceAddress.toString(true, true, false, isTestNet);

  return sourceAddress.toString(true, true, false, false);
}


export function returnParsedAddress(address: AddressType) {
  return {
    raw_form: formatAddress(address, "hex"),
    bounceable: {
      b64: formatAddress(address, "bounceable"),
      b64url: formatAddress(address, "bounceable"),
    },
    non_bounceable: {
      b64: formatAddress(address, "non-bounceable"),
      b64url: formatAddress(address, "non-bounceable"),
    },
  };
}
