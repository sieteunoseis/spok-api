/**
 * XML building and parsing utilities for the Spok SmartSuite TCP API.
 * Uses regex-based parsing to avoid external XML dependencies.
 */

import { SpokResponse } from "./types";

/** XML namespace for Amcom request elements. */
export const REQUEST_NS = "http://xml.amcomsoft.com/api/request";

/**
 * Escape special XML characters.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Unescape XML entities.
 */
export function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Build an Amcom XML request body.
 * @param method - Amcom API method name (e.g. "GetListingInfo").
 * @param params - Optional parameter name-value pairs.
 * @returns XML request string.
 */
export function buildRequestXml(method: string, params?: Record<string, string | null | undefined>): string {
  let xml = `<procedureCall xmlns="${REQUEST_NS}" name="${escapeXml(method)}">`;

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        xml += `<parameter xmlns="${REQUEST_NS}" name="${escapeXml(name)}" null="true"></parameter>`;
      } else {
        xml += `<parameter xmlns="${REQUEST_NS}" name="${escapeXml(name)}" null="false">${escapeXml(String(value))}</parameter>`;
      }
    }
  }

  xml += "</procedureCall>";
  return xml;
}

/**
 * Extract parameter name-value pairs from an XML fragment.
 */
function extractParameters(xml: string): Record<string, string> {
  const params: Record<string, string> = {};
  const re = /<parameter[^>]*\bname="([^"]*)"[^>]*>([\s\S]*?)<\/parameter>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    params[m[1]] = m[2].trim();
  }
  return params;
}

/**
 * Extract top-level child elements from an XML fragment using depth-aware scanning.
 * Handles same-named nested elements (e.g. <phtype><phtype>X</phtype></phtype>).
 */
function extractChildren(xml: string): { tag: string; xml: string }[] {
  const children: { tag: string; xml: string }[] = [];
  let pos = 0;

  while (pos < xml.length) {
    // Find next opening tag
    const openIdx = xml.indexOf("<", pos);
    if (openIdx < 0) break;

    // Skip comments, CDATA, processing instructions
    if (xml.startsWith("<!--", openIdx) || xml.startsWith("<!", openIdx) || xml.startsWith("<?", openIdx)) {
      pos = openIdx + 1;
      continue;
    }

    // Skip closing tags (shouldn't happen at top level, but be safe)
    if (xml[openIdx + 1] === "/") {
      pos = openIdx + 1;
      continue;
    }

    // Extract tag name
    const tagEnd = xml.slice(openIdx + 1).search(/[\s/>]/);
    if (tagEnd < 0) break;
    const tag = xml.slice(openIdx + 1, openIdx + 1 + tagEnd);

    // Self-closing tag?
    const closeAngle = xml.indexOf(">", openIdx);
    if (closeAngle < 0) break;
    if (xml[closeAngle - 1] === "/") {
      children.push({ tag, xml: xml.slice(openIdx, closeAngle + 1) });
      pos = closeAngle + 1;
      continue;
    }

    // Find matching close tag with depth tracking
    let depth = 1;
    let searchPos = closeAngle + 1;
    const openPattern = new RegExp(`<${tag}[\\s/>]`, "g");
    const closePattern = `</${tag}>`;

    while (depth > 0 && searchPos < xml.length) {
      const nextClose = xml.indexOf(closePattern, searchPos);
      if (nextClose < 0) break;

      // Count opens between searchPos and nextClose
      openPattern.lastIndex = searchPos;
      let m: RegExpExecArray | null;
      while ((m = openPattern.exec(xml)) !== null && m.index < nextClose) {
        // Make sure it's not a self-closing tag
        const ga = xml.indexOf(">", m.index);
        if (ga >= 0 && xml[ga - 1] !== "/") {
          depth++;
        }
      }

      depth--;
      if (depth === 0) {
        const endPos = nextClose + closePattern.length;
        children.push({ tag, xml: xml.slice(openIdx, endPos) });
        pos = endPos;
        break;
      }
      searchPos = nextClose + closePattern.length;
    }

    if (depth > 0) {
      // Couldn't find matching close, skip this tag
      pos = closeAngle + 1;
    }
  }

  return children;
}

/**
 * Parse child elements of an XML fragment into an object.
 */
export function parseChildrenToObject(xml: string): Record<string, any> {
  const result: Record<string, any> = {};
  const children = extractChildren(xml);

  const tagCounts: Record<string, number> = {};
  for (const { tag } of children) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }

  for (const { tag, xml: childXml } of children) {
    const innerMatch = childXml.match(/^<([^\s/>]+)([^>]*)>([\s\S]*)<\/\1>$/);
    let value: any;

    if (innerMatch) {
      const innerContent = innerMatch[3].trim();
      if (/<[^\s/>]+/.test(innerContent) && !innerContent.startsWith("&lt;")) {
        value = parseChildrenToObject(innerContent);
      } else {
        value = unescapeXml(innerContent);
      }
    } else {
      value = null;
    }

    if (tagCounts[tag] > 1) {
      if (!result[tag]) result[tag] = [];
      result[tag].push(value);
    } else {
      result[tag] = value;
    }
  }

  return result;
}

/**
 * Parse an XML string into a plain JS object.
 * Handles nested elements, repeating elements (converted to arrays), and text content.
 */
export function parseXmlToObject(xml: string): Record<string, any> | string | null {
  const trimmed = xml.trim();
  if (!trimmed || !trimmed.startsWith("<")) return trimmed || null;

  const rootMatch = trimmed.match(/^<([^\s/>]+)([^>]*)>([\s\S]*)<\/\1>$/);
  if (!rootMatch) {
    const selfClose = trimmed.match(/^<([^\s/>]+)([^>]*)\/>/);
    if (selfClose) return {};
    return trimmed;
  }

  const content = rootMatch[3].trim();

  const children = extractChildren(content);

  if (children.length === 0) {
    return { [rootMatch[1]]: unescapeXml(content) };
  }

  const result: Record<string, any> = {};
  const tagCounts: Record<string, number> = {};

  for (const { tag } of children) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }

  for (const { tag, xml: childXml } of children) {
    const innerMatch = childXml.match(/^<([^\s/>]+)([^>]*)>([\s\S]*)<\/\1>$/);
    let value: any;

    if (innerMatch) {
      const innerContent = innerMatch[3].trim();
      if (/<[^\s/>]+/.test(innerContent) && !innerContent.startsWith("&lt;")) {
        value = parseChildrenToObject(innerContent);
      } else {
        value = unescapeXml(innerContent);
      }
    } else {
      value = null;
    }

    if (tagCounts[tag] > 1) {
      if (!result[tag]) result[tag] = [];
      result[tag].push(value);
    } else {
      result[tag] = value;
    }
  }

  return result;
}

/**
 * Parse an Amcom procedureResult XML response.
 * Handles success/failure branches, embedded xml_result, and self-closing null parameters.
 */
export function parseResponseXml(xmlText: string): SpokResponse {
  const methodMatch = xmlText.match(/<procedureResult[^>]*\bname="([^"]*)"/) ||
    xmlText.match(/<procedureResult[^>]*\bname='([^']*)'/);
  const method = methodMatch ? methodMatch[1] : "";

  // Check for failure
  const failureMatch = xmlText.match(/<failure[^>]*>([\s\S]*?)<\/failure>/);
  if (failureMatch) {
    const failureContent = failureMatch[1];
    const params = extractParameters(failureContent);
    return {
      error: params.errorDescription || "Unknown error",
      errorCode: params.errorCode || null,
      method,
    };
  }

  // Check for success
  const successMatch = xmlText.match(/<success[^>]*>([\s\S]*?)<\/success>/);
  if (!successMatch) {
    return { error: "No success or failure element in response", method };
  }

  const successContent = successMatch[1];
  const result: SpokResponse = { method };

  // Handle self-closing null parameters
  const paramSelfClose = /<parameter[^>]*\bname="([^"]*)"[^>]*\bnull="true"[^>]*\/>/g;
  let match: RegExpExecArray | null;
  while ((match = paramSelfClose.exec(successContent)) !== null) {
    const name = match[1];
    if (name !== "retval") {
      result[name] = null;
    }
  }

  // Handle parameters with content
  const paramRegex = /<parameter[^>]*\bname="([^"]*)"[^>]*(?:\bnull="(true|false)")?[^>]*>([\s\S]*?)<\/parameter>/g;
  while ((match = paramRegex.exec(successContent)) !== null) {
    const name = match[1];
    const isNull = match[2] === "true";
    const content = match[3];

    if (name === "retval") continue;

    if (isNull) {
      result[name] = null;
      continue;
    }

    if (name === "xml_result") {
      const trimmedContent = content.trim();
      if (trimmedContent.startsWith("<")) {
        result.data = parseXmlToObject(trimmedContent);
      } else {
        result.data = trimmedContent;
      }
    } else {
      if (content.trim().startsWith("<")) {
        result[name] = parseXmlToObject(content.trim());
      } else {
        result[name] = content;
      }
    }
  }

  return result;
}
