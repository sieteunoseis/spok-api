/**
 * Spok SmartSuite TCP API client.
 * Implements the proprietary binary+XML socket protocol.
 *
 * Protocol: 12-byte header (version(4) + refId(4) + bodySize(4), big-endian)
 * followed by a UTF-8 XML body padded to a minimum of 1000 bytes.
 */

import * as net from "node:net";
import * as tls from "node:tls";
import { AmcomHeader, SpokResponse } from "./types";
import { buildRequestXml, parseResponseXml } from "./xml";

/** Amcom API protocol version. */
export const API_VERSION = 2;

/** Reference ID sent with each request. */
export const REFERENCE_ID = 0;

/** Minimum body size in bytes (Amcom requires at least 1000 bytes). */
export const MIN_BODY_SIZE = 1000;

/** Binary header size in bytes. */
export const HEADER_SIZE = 12;

/** Default request timeout in milliseconds. */
export const DEFAULT_TIMEOUT = 60000;

/**
 * Build a 12-byte binary header: version(4) + refid(4) + size(4), big-endian.
 */
export function buildHeader(bodyLength: number): Buffer {
  const buf = Buffer.alloc(HEADER_SIZE);
  buf.writeUInt32BE(API_VERSION, 0);
  buf.writeUInt32BE(REFERENCE_ID, 4);
  buf.writeUInt32BE(bodyLength, 8);
  return buf;
}

/**
 * Parse a 12-byte binary header.
 */
export function parseHeader(buf: Buffer): AmcomHeader {
  return {
    version: buf.readUInt32BE(0),
    refId: buf.readUInt32BE(4),
    size: buf.readUInt32BE(8),
  };
}

/**
 * Send a request to a single Spok SmartSuite TCP API host and return the parsed response.
 */
export function amcomRequest(
  host: string,
  port: number,
  method: string,
  params?: Record<string, string | null | undefined>,
  useSsl?: boolean,
  insecure?: boolean,
  debug?: boolean,
  timeout?: number
): Promise<SpokResponse> {
  return new Promise((resolve, reject) => {
    const xmlBody = buildRequestXml(method, params);
    const requestTimeout = timeout || DEFAULT_TIMEOUT;

    // Pad XML body to minimum 1000 bytes
    let bodyStr = xmlBody;
    const bodyLen = Buffer.byteLength(bodyStr, "utf8");
    if (bodyLen < MIN_BODY_SIZE) {
      bodyStr += " ".repeat(MIN_BODY_SIZE - bodyLen);
    }

    const bodyBuf = Buffer.from(bodyStr, "utf8");
    const header = buildHeader(bodyBuf.length);

    if (debug) {
      process.stderr.write(`[debug] Connecting to ${host}:${port} (ssl=${!!useSsl})\n`);
      process.stderr.write(`[debug] Method: ${method}\n`);
      process.stderr.write(`[debug] Body size: ${bodyBuf.length} bytes\n`);
    }

    let socket: net.Socket | tls.TLSSocket;
    let timer: ReturnType<typeof setTimeout>;
    let responseBuf = Buffer.alloc(0);
    let headerParsed = false;
    let expectedSize = 0;
    let settled = false;

    const cleanup = (): void => {
      if (timer) clearTimeout(timer);
      if (socket && !socket.destroyed) socket.destroy();
    };

    const fail = (err: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const succeed = (data: SpokResponse): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data);
    };

    // Set up timeout
    timer = setTimeout(() => {
      fail(new Error(`Amcom request timed out for method ${method}`));
    }, requestTimeout);

    // Create socket
    const connectOpts: net.NetConnectOpts & tls.ConnectionOptions = { host, port };

    if (useSsl) {
      (connectOpts as tls.ConnectionOptions).rejectUnauthorized = !insecure;
      socket = tls.connect(connectOpts);
    } else {
      socket = net.createConnection(connectOpts);
    }

    socket.on("error", (err: Error) => {
      fail(new Error(`Failed to connect to ${host}:${port}: ${err.message}`));
    });

    const onConnected = (): void => {
      if (debug) {
        process.stderr.write(`[debug] Connected, sending ${bodyBuf.length + HEADER_SIZE} bytes\n`);
      }
      socket.write(Buffer.concat([header, bodyBuf]));
    };

    // TLS emits 'secureConnect' after handshake; plain TCP emits 'connect'
    socket.on(useSsl ? "secureConnect" : "connect", onConnected);

    socket.on("data", (chunk: Buffer) => {
      responseBuf = Buffer.concat([responseBuf, chunk]);

      // Parse header once we have enough bytes
      if (!headerParsed && responseBuf.length >= HEADER_SIZE) {
        const hdr = parseHeader(responseBuf.subarray(0, HEADER_SIZE));
        expectedSize = hdr.size;
        headerParsed = true;

        if (debug) {
          process.stderr.write(`[debug] Response header: version=${hdr.version} refId=${hdr.refId} size=${expectedSize}\n`);
        }
      }

      // Check if we have the full response
      if (headerParsed && responseBuf.length >= HEADER_SIZE + expectedSize) {
        const bodyBytes = responseBuf.subarray(HEADER_SIZE, HEADER_SIZE + expectedSize);
        const respXml = bodyBytes.toString("utf8").trimEnd();

        if (debug) {
          process.stderr.write(`[debug] Response body: ${respXml.length} chars\n`);
        }

        const parsed = parseResponseXml(respXml);
        succeed(parsed);
      }
    });

    socket.on("close", () => {
      if (!settled) {
        if (headerParsed && responseBuf.length < HEADER_SIZE + expectedSize) {
          fail(new Error(`Connection closed with ${HEADER_SIZE + expectedSize - responseBuf.length} bytes remaining`));
        } else if (!headerParsed) {
          fail(new Error(`Connection closed before response header received from ${host}:${port}`));
        }
      }
    });
  });
}

/**
 * Send a request trying failover hosts on connection failure.
 */
export async function amcomRequestWithFailover(
  hosts: string[],
  port: number,
  method: string,
  params?: Record<string, string | null | undefined>,
  useSsl?: boolean,
  insecure?: boolean,
  debug?: boolean,
  timeout?: number
): Promise<SpokResponse> {
  let lastError: Error | null = null;

  for (const host of hosts) {
    try {
      return await amcomRequest(host, port, method, params, useSsl, insecure, debug, timeout);
    } catch (err: any) {
      if (debug) {
        process.stderr.write(`[debug] Amcom ${method} failed on ${host}:${port}: ${err.message} — trying next host\n`);
      }
      lastError = err;
    }
  }

  throw lastError || new Error("No Amcom hosts configured");
}
