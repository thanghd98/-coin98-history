import TonWeb, { AddressType } from "tonweb";

export default function formatAddress(
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
