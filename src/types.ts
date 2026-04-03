/**
 * TypeScript interfaces for the Spok SmartSuite TCP API client.
 */

/** Options for constructing a SpokService instance. */
export interface SpokServiceOptions {
  /** Primary Spok server hostname or IP. */
  host: string;
  /** TCP port for the Spok server. */
  port: number;
  /** Whether to use SSL/TLS for the connection. */
  ssl?: boolean;
  /** Whether to skip TLS certificate verification. */
  insecure?: boolean;
  /** Failover hostname — tried if primary host fails. */
  hostFailover?: string;
  /** Request timeout in milliseconds (default: 60000). */
  timeout?: number;
  /** Enable debug logging to stderr. */
  debug?: boolean;
}

/** Parsed response from the Spok SmartSuite TCP API. */
export interface SpokResponse {
  /** The Amcom API method name (e.g. "GetListingInfo"). */
  method?: string;
  /** Error message, if the request failed. */
  error?: string;
  /** Error code from the Amcom server. */
  errorCode?: string | null;
  /** Parsed data from the xml_result parameter. */
  data?: Record<string, any> | string | null;
  /** Additional fields extracted from the response. */
  [key: string]: any;
}

/** Parsed 12-byte binary header from an Amcom response. */
export interface AmcomHeader {
  version: number;
  refId: number;
  size: number;
}
