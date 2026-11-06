export function parseIPv4(input: string): number | null {
  const m = input.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return parts[0] * 2 ** 24 + parts[1] * 2 ** 16 + parts[2] * 2 ** 8 + parts[3];
}

export function intToIPv4(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export function toBinaryDotted(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
    .map((o) => o.toString(2).padStart(8, '0'))
    .join('.');
}

export function maskFromPrefix(prefix: number): number {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

export type SubnetInfo = {
  ip: string;
  prefix: number;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  mask: string;
  wildcard: string;
  totalAddresses: number;
  usableHosts: number;
  binary: { ip: string; mask: string; network: string; broadcast: string };
};

export function subnetInfo(ip: string, prefix: number): SubnetInfo | null {
  const addr = parseIPv4(ip);
  if (addr === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;
  const mask = maskFromPrefix(prefix);
  const wildcard = ~mask >>> 0;
  const network = (addr & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = 2 ** (32 - prefix);
  let first = network;
  let last = broadcast;
  let usable = total;
  if (prefix <= 30) {
    first = network + 1;
    last = broadcast - 1;
    usable = total - 2;
  }
  return {
    ip: intToIPv4(addr),
    prefix,
    network: intToIPv4(network),
    broadcast: intToIPv4(broadcast),
    firstHost: intToIPv4(first),
    lastHost: intToIPv4(last),
    mask: intToIPv4(mask),
    wildcard: intToIPv4(wildcard),
    totalAddresses: total,
    usableHosts: usable,
    binary: {
      ip: toBinaryDotted(addr),
      mask: toBinaryDotted(mask),
      network: toBinaryDotted(network),
      broadcast: toBinaryDotted(broadcast),
    },
  };
}

export type SubnetRow = { index: number; network: string; firstHost: string; lastHost: string; broadcast: string };

export type SplitResult =
  | { ok: true; newPrefix: number; count: number; requested: number; hostsEach: number; rows: SubnetRow[]; truncated: boolean }
  | { ok: false; error: string };

const MAX_SPLIT_ROWS = 256;

export function splitSubnets(ip: string, prefix: number, parts: number): SplitResult {
  const addr = parseIPv4(ip);
  if (addr === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return { ok: false, error: 'Enter a valid IPv4 address and a prefix from 0 to 32.' };
  }
  if (!Number.isInteger(parts) || parts < 1) {
    return { ok: false, error: 'The number of subnets must be a whole number of at least 1.' };
  }
  const bits = Math.ceil(Math.log2(parts));
  const newPrefix = prefix + bits;
  if (newPrefix > 32) {
    return { ok: false, error: `A /${prefix} cannot be split into ${parts} subnets: it would need a /${newPrefix}.` };
  }
  const size = 2 ** (32 - newPrefix);
  const count = 2 ** bits;
  const base = (addr & maskFromPrefix(prefix)) >>> 0;
  const rows: SubnetRow[] = [];
  for (let i = 0; i < Math.min(count, MAX_SPLIT_ROWS); i++) {
    const info = subnetInfo(intToIPv4(base + i * size), newPrefix);
    if (info) {
      rows.push({
        index: i + 1,
        network: `${info.network}/${newPrefix}`,
        firstHost: info.firstHost,
        lastHost: info.lastHost,
        broadcast: info.broadcast,
      });
    }
  }
  const hostsEach = newPrefix <= 30 ? size - 2 : size;
  return { ok: true, newPrefix, count, requested: parts, hostsEach, rows, truncated: count > MAX_SPLIT_ROWS };
}

export type IpDetails = {
  dotted: string;
  binary: string;
  decimal: number;
  hex: string;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
  defaultMask: string;
  scope: string;
  isPrivate: boolean;
};

function inRange(addr: number, base: string, prefix: number): boolean {
  const b = parseIPv4(base);
  if (b === null) return false;
  const mask = maskFromPrefix(prefix);
  return (addr & mask) >>> 0 === (b & mask) >>> 0;
}

export function ipDetails(addr: number): IpDetails {
  const first = (addr >>> 24) & 255;
  let ipClass: IpDetails['ipClass'] = 'E';
  let defaultMask = 'None (class E is reserved)';
  if (first < 128) {
    ipClass = 'A';
    defaultMask = '255.0.0.0 (/8)';
  } else if (first < 192) {
    ipClass = 'B';
    defaultMask = '255.255.0.0 (/16)';
  } else if (first < 224) {
    ipClass = 'C';
    defaultMask = '255.255.255.0 (/24)';
  } else if (first < 240) {
    ipClass = 'D';
    defaultMask = 'None (class D is multicast)';
  }
  let scope = 'Public (globally routable)';
  let isPrivate = false;
  if (addr === 0xffffffff) scope = 'Limited broadcast';
  else if (inRange(addr, '10.0.0.0', 8) || inRange(addr, '172.16.0.0', 12) || inRange(addr, '192.168.0.0', 16)) {
    scope = 'Private (RFC 1918)';
    isPrivate = true;
  } else if (inRange(addr, '127.0.0.0', 8)) scope = 'Loopback';
  else if (inRange(addr, '169.254.0.0', 16)) scope = 'Link-local (APIPA)';
  else if (inRange(addr, '100.64.0.0', 10)) scope = 'Shared address space (CGNAT)';
  else if (inRange(addr, '224.0.0.0', 4)) scope = 'Multicast';
  else if (inRange(addr, '240.0.0.0', 4)) scope = 'Reserved';
  else if (inRange(addr, '0.0.0.0', 8)) scope = 'This network';
  return {
    dotted: intToIPv4(addr),
    binary: toBinaryDotted(addr),
    decimal: addr,
    hex: `0x${addr.toString(16).toUpperCase().padStart(8, '0')}`,
    ipClass,
    defaultMask,
    scope,
    isPrivate,
  };
}

export function parseBinaryIPv4(input: string): number | null {
  const bits = input.replace(/[.\s]/g, '');
  if (!/^[01]{32}$/.test(bits)) return null;
  return parseInt(bits, 2);
}

export type CrcStep = { position: number; before: string; divisor: string; after: string };

export type CrcResult = {
  data: string;
  generator: string;
  degree: number;
  augmented: string;
  quotient: string;
  remainder: string;
  frame: string;
  steps: CrcStep[];
  receiverRemainder: string;
};

export function parseGenerator(input: string): string | null {
  const s = input.replace(/\s+/g, '').toLowerCase();
  if (!s) return null;
  if (/^[01]+$/.test(s)) {
    const trimmed = s.replace(/^0+/, '');
    return trimmed.length >= 2 ? trimmed : null;
  }
  const powers: number[] = [];
  for (const term of s.split('+')) {
    if (term === '1') powers.push(0);
    else if (term === 'x') powers.push(1);
    else {
      const m = term.match(/^x\^(\d+)$/);
      if (!m) return null;
      powers.push(Number(m[1]));
    }
  }
  const degree = Math.max(...powers);
  if (degree < 1 || degree > 64) return null;
  const bits: string[] = new Array<string>(degree + 1).fill('0');
  for (const p of powers) bits[degree - p] = '1';
  return bits.join('');
}

function mod2Divide(dividend: string, generator: string) {
  const bits = dividend.split('').map(Number);
  const gen = generator.split('').map(Number);
  const steps: CrcStep[] = [];
  let quotient = '';
  for (let i = 0; i <= bits.length - gen.length; i++) {
    if (bits[i] === 1) {
      const before = bits.slice(i, i + gen.length).join('');
      for (let j = 0; j < gen.length; j++) bits[i + j] ^= gen[j];
      steps.push({ position: i, before, divisor: generator, after: bits.slice(i, i + gen.length).join('') });
      quotient += '1';
    } else {
      quotient += '0';
    }
  }
  return { steps, quotient, remainder: bits.slice(bits.length - (gen.length - 1)).join('') };
}

export function computeCrc(dataInput: string, generatorInput: string): CrcResult | { error: string } {
  const data = dataInput.replace(/\s+/g, '');
  if (!/^[01]+$/.test(data)) return { error: 'Data must contain only 0 and 1.' };
  const generator = parseGenerator(generatorInput);
  if (!generator) return { error: 'Enter the generator as bits (10011) or as a polynomial (x^4+x+1).' };
  const degree = generator.length - 1;
  const augmented = data + '0'.repeat(degree);
  const { steps, quotient, remainder } = mod2Divide(augmented, generator);
  const frame = data + remainder;
  return {
    data,
    generator,
    degree,
    augmented,
    quotient,
    remainder,
    frame,
    steps,
    receiverRemainder: mod2Divide(frame, generator).remainder,
  };
}

export type LinkInput = {
  frameBytes: number;
  bandwidthMbps: number;
  distanceKm: number;
  speedMps: number;
  windowSize: number;
};

export type LinkResult = {
  frameBits: number;
  bandwidthBps: number;
  transmission: number;
  propagation: number;
  rtt: number;
  totalDelay: number;
  bdpBits: number;
  bdpRttBits: number;
  a: number;
  stopWaitUtil: number;
  slidingUtil: number;
  stopWaitThroughput: number;
  slidingThroughput: number;
  windowForFullUtil: number;
};

export function linkMetrics(input: LinkInput): LinkResult | null {
  const { frameBytes, bandwidthMbps, distanceKm, speedMps, windowSize } = input;
  const values = [frameBytes, bandwidthMbps, speedMps, windowSize];
  if (values.some((v) => !Number.isFinite(v) || v <= 0) || !Number.isFinite(distanceKm) || distanceKm < 0) return null;
  const frameBits = frameBytes * 8;
  const bandwidthBps = bandwidthMbps * 1e6;
  const transmission = frameBits / bandwidthBps;
  const propagation = (distanceKm * 1000) / speedMps;
  const a = propagation / transmission;
  const stopWaitUtil = 1 / (1 + 2 * a);
  const slidingUtil = Math.min(1, windowSize / (1 + 2 * a));
  return {
    frameBits,
    bandwidthBps,
    transmission,
    propagation,
    rtt: 2 * propagation,
    totalDelay: transmission + propagation,
    bdpBits: bandwidthBps * propagation,
    bdpRttBits: bandwidthBps * 2 * propagation,
    a,
    stopWaitUtil,
    slidingUtil,
    stopWaitThroughput: stopWaitUtil * bandwidthBps,
    slidingThroughput: slidingUtil * bandwidthBps,
    windowForFullUtil: Math.ceil(1 + 2 * a),
  };
}

function trimNumber(n: number): string {
  return Number(n.toPrecision(5)).toString();
}

export function formatTime(sec: number): string {
  if (sec === 0) return '0 s';
  if (sec < 1e-3) return `${trimNumber(sec * 1e6)} µs`;
  if (sec < 1) return `${trimNumber(sec * 1e3)} ms`;
  return `${trimNumber(sec)} s`;
}

export function formatBits(bits: number): string {
  if (bits < 1e3) return `${trimNumber(bits)} bits`;
  if (bits < 1e6) return `${trimNumber(bits / 1e3)} kb`;
  if (bits < 1e9) return `${trimNumber(bits / 1e6)} Mb`;
  return `${trimNumber(bits / 1e9)} Gb`;
}

export function formatRate(bps: number): string {
  if (bps < 1e3) return `${trimNumber(bps)} bps`;
  if (bps < 1e6) return `${trimNumber(bps / 1e3)} kbps`;
  if (bps < 1e9) return `${trimNumber(bps / 1e6)} Mbps`;
  return `${trimNumber(bps / 1e9)} Gbps`;
}

export function formatPercent(fraction: number): string {
  return `${trimNumber(fraction * 100)} %`;
}
