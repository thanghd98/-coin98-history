import TonWeb from 'tonweb';
import formatAddress from './formatAddress';
import { AddressParse } from '../../../types/Address';

export default function convertToParsedAddress(address: string): AddressParse {
  const parseAddress = new TonWeb.utils.Address(address);
  return {
    raw_form: formatAddress(parseAddress, 'hex'),
    bounceable: {
      b64: formatAddress(parseAddress, 'bounceable'),
      b64url: formatAddress(parseAddress, 'bounceable'),
    },
    non_bounceable: {
      b64: formatAddress(parseAddress, 'non-bounceable'),
      b64url: formatAddress(parseAddress, 'non-bounceable'),
    },
  };
}
