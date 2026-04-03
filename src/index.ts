/**
 * SpokService — main library class for the Spok SmartSuite TCP API.
 *
 * Usage:
 *   const SpokService = require("spok-api");
 *   const service = new SpokService({ host: "spok.example.com", port: 5000, ssl: true });
 *   const listing = await service.getListingInfo("308787");
 */

import { SpokServiceOptions, SpokResponse } from "./types";
import { amcomRequestWithFailover } from "./client";

// Re-export everything consumers might need
export { SpokServiceOptions, SpokResponse, AmcomHeader } from "./types";
export {
  buildRequestXml, parseResponseXml, parseXmlToObject,
  parseChildrenToObject, escapeXml, unescapeXml, REQUEST_NS,
} from "./xml";
export {
  amcomRequest, amcomRequestWithFailover,
  buildHeader, parseHeader,
  API_VERSION, REFERENCE_ID, MIN_BODY_SIZE, HEADER_SIZE, DEFAULT_TIMEOUT,
} from "./client";

/**
 * Custom error class for Spok API errors.
 */
class SpokError extends Error {
  code: string | null;
  method: string;

  constructor(message: string, method: string, code?: string | null) {
    super(message);
    this.name = "SpokError";
    this.method = method;
    this.code = code || null;
  }
}

/**
 * Main service class for the Spok SmartSuite TCP API.
 * Wraps the low-level TCP protocol with typed, named methods.
 */
class SpokService {
  private hosts: string[];
  private port: number;
  private ssl: boolean;
  private insecure: boolean;
  private debug: boolean;
  private timeout: number;

  constructor(opts: SpokServiceOptions) {
    this.hosts = [opts.host];
    if (opts.hostFailover) this.hosts.push(opts.hostFailover);
    this.port = opts.port;
    this.ssl = opts.ssl || false;
    this.insecure = opts.insecure || false;
    this.debug = opts.debug || false;
    this.timeout = opts.timeout || 60000;
  }

  /**
   * Execute an arbitrary Amcom API method.
   * This is the foundation — all named methods delegate to this.
   */
  async execute(method: string, params?: Record<string, string>): Promise<SpokResponse> {
    return amcomRequestWithFailover(
      this.hosts, this.port, method, params,
      this.ssl, this.insecure, this.debug, this.timeout
    );
  }

  // ─── Listings ──────────────────────────────────────────────────────────────

  /** Get listing info by listing ID. */
  async getListingInfo(lid: string): Promise<SpokResponse> {
    return this.execute("GetListingInfo", { lid });
  }

  /** Get listing info by messaging ID. */
  async getListingInfoByMid(mid: string): Promise<SpokResponse> {
    return this.execute("GetListingInfoByMid", { mid });
  }

  /** Search listings by name. */
  async getListingsByName(name: string, searchType?: string, midFlag?: string): Promise<SpokResponse> {
    const params: Record<string, string> = { name };
    if (searchType) params.search_type = searchType;
    if (midFlag) params.mid_flag = midFlag;
    return this.execute("GetListingsByName", params);
  }

  /** Get listings by employee ID. */
  async getListingsByEid(eid: string, midFlag?: string): Promise<SpokResponse> {
    const params: Record<string, string> = { eid };
    if (midFlag) params.mid_flag = midFlag;
    return this.execute("GetListingsByEid", params);
  }

  /** Get listings by SSN. */
  async getListingsBySsn(ssn: string, midFlag?: string): Promise<SpokResponse> {
    const params: Record<string, string> = { ssn };
    if (midFlag) params.mid_flag = midFlag;
    return this.execute("GetListingsBySsn", params);
  }

  /** Get listings by user-defined field. */
  async getListingsByUdf(udfCol: string, udf: string, midFlag?: string): Promise<SpokResponse> {
    const params: Record<string, string> = { udf_col: udfCol, udf };
    if (midFlag) params.mid_flag = midFlag;
    return this.execute("GetListingsByUdf", params);
  }

  // ─── SSO / Messaging ID ───────────────────────────────────────────────────

  /** Get SSO username by messaging ID. */
  async getSSOUsername(mid: string): Promise<SpokResponse> {
    return this.execute("GetSSOUsername", { mid });
  }

  /** Get messaging ID by SSO username. */
  async getMessagingID(ssoUsername: string): Promise<SpokResponse> {
    return this.execute("GetMessagingID", { sso_username: ssoUsername });
  }

  /** Assign a messaging ID to a listing. */
  async assignMessagingId(lid: string): Promise<SpokResponse> {
    return this.execute("AssignMessagingId", { lid });
  }

  // ─── Pagers ────────────────────────────────────────────────────────────────

  /** Get pager ID(s) by messaging ID. */
  async getPagerId(mid: string): Promise<SpokResponse> {
    return this.execute("GetPagerId", { mid });
  }

  /** Get pager info by pager ID. */
  async getPagerInfo(pid: string): Promise<SpokResponse> {
    return this.execute("GetPagerInfo", { pid });
  }

  /** Get pager info by messaging ID. */
  async getPagerInfoByMid(mid: string): Promise<SpokResponse> {
    return this.execute("GetPagerInfoByMID", { mid });
  }

  /** Add a new pager. */
  async addPager(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddPager", params);
  }

  /** Assign a pager to a messaging ID. */
  async assignPager(mid: string, pagerId: string, displayOrder: string): Promise<SpokResponse> {
    return this.execute("AssignPager", { mid, pager_id: pagerId, display_order: displayOrder });
  }

  /** Delete a pager by pager ID. */
  async deletePager(pid: string): Promise<SpokResponse> {
    return this.execute("DeletePager", { pid });
  }

  // ─── Email ─────────────────────────────────────────────────────────────────

  /** Get email address by messaging ID. */
  async getEmailAddress(mid: string): Promise<SpokResponse> {
    return this.execute("GetEmailAddress", { mid });
  }

  /** Add email address by messaging ID. */
  async addEmailAddress(mid: string, emailAddress: string, displayOrder: string): Promise<SpokResponse> {
    return this.execute("AddEmailAddress", { mid, email_address: emailAddress, display_order: displayOrder });
  }

  /** Add email address by listing ID. */
  async addEmailAddressByLid(lid: string, emaddr: string, dorder?: string): Promise<SpokResponse> {
    const params: Record<string, string> = { lid, emaddr };
    if (dorder) params.dorder = dorder;
    return this.execute("AddEmailAddressByLid", params);
  }

  // ─── Directories ───────────────────────────────────────────────────────────

  /** Get listing directories by listing ID. */
  async getListingDirectories(lid: string, phtype?: string): Promise<SpokResponse> {
    const params: Record<string, string> = { lid };
    if (phtype) params.phtype = phtype;
    return this.execute("GetListingDirectories", params);
  }

  /** Get directory info by directory sequence number. */
  async getDirectoryInfo(dirseq: string): Promise<SpokResponse> {
    return this.execute("GetDirectoryInfo", { dirseq });
  }

  /** Add a listing directory entry. */
  async addListingDirectory(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddListingDirectory", params);
  }

  /** Update a directory entry. */
  async updateDirectory(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdateDirectory", params);
  }

  /** Delete a listing directory entry. */
  async deleteListingDirectory(lid: string, dirseq: string): Promise<SpokResponse> {
    return this.execute("DeleteListingDirectory", { lid, dirseq });
  }

  /** Set directory enabled flag. */
  async setDirectoryEnabled(dirseq: string, module: string, eflag: string): Promise<SpokResponse> {
    return this.execute("SetDirectoryEnabled", { dirseq, module, eflag });
  }

  /** Set directory published flag. */
  async setDirectoryPublished(dirseq: string, module: string, pflag: string): Promise<SpokResponse> {
    return this.execute("SetDirectoryPublished", { dirseq, module, pflag });
  }

  /** Set directory transfer-allowed flag. */
  async setDirectoryTransferAllowed(dirseq: string, module: string, taflag: string): Promise<SpokResponse> {
    return this.execute("SetDirectoryTransferAllowed", { dirseq, module, taflag });
  }

  // ─── Persons ───────────────────────────────────────────────────────────────

  /** Add a new person listing. */
  async addPerson(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddPerson", params);
  }

  /** Update an existing person listing. */
  async updatePerson(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdatePerson", params);
  }

  // ─── Status & Paging ───────────────────────────────────────────────────────

  /** Change a listing's status code and text. */
  async changeStatus(mid: string, statusCode: string, statusText: string): Promise<SpokResponse> {
    return this.execute("ChangeStatus", { mid, status_code: statusCode, status_text: statusText });
  }

  /** Send a page to a messaging ID. */
  async sendPage(mid: string, pagedText: string, priority?: string): Promise<SpokResponse> {
    const params: Record<string, string> = { mid, paged_text: pagedText };
    if (priority) params.priority = priority;
    return this.execute("SendPage", params);
  }

  // ─── Groups ────────────────────────────────────────────────────────────────

  /** Get message group members. */
  async getMessageGroupMembers(reqlid: string, grpnum: string): Promise<SpokResponse> {
    return this.execute("GetMessageGroupMembers", { reqlid, grpnum });
  }

  /** Add a member to an on-call group. */
  async addOncallGroupMember(oncallMid: string, mid: string): Promise<SpokResponse> {
    return this.execute("AddOncallGroupMember", { oncall_mid: oncallMid, mid });
  }

  /** Add a member to a static message group. */
  async addStaticMessageGroupMember(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddStaticMessageGroupMember", params);
  }

  // ─── On-call Assignments ───────────────────────────────────────────────────

  /** Get current on-call assignments by group. */
  async getGroupsCurrentAssignments(groupMid: string): Promise<SpokResponse> {
    return this.execute("GetGroupsCurrentAssignments", { group_mid: groupMid });
  }

  /** Get all on-call assignments by group. */
  async getGroupsAssignments(groupMid: string): Promise<SpokResponse> {
    return this.execute("GetGroupsAssignments", { group_mid: groupMid });
  }

  /** Get current on-call assignments by messaging ID. */
  async getIdsCurrentAssignments(mid: string): Promise<SpokResponse> {
    return this.execute("GetIdsCurrentAssignments", { mid });
  }

  /** Get all on-call assignments by messaging ID. */
  async getIdsAssignments(mid: string): Promise<SpokResponse> {
    return this.execute("GetIdsAssignments", { mid });
  }

  /** Get current on-call assignment with exceptions by group name. */
  async getCurrentAssignmentWithExceptions(name: string): Promise<SpokResponse> {
    return this.execute("GetCurrentAssignmentWithExceptions", { name });
  }

  /** Get current assignment listing IDs by group name. */
  async getCurrentAssignmentLids(name: string): Promise<SpokResponse> {
    return this.execute("GetCurrentAssignmentLids", { name });
  }

  /** Get on-call group roles. */
  async getOncallGroupRoles(): Promise<SpokResponse> {
    return this.execute("GetOncallGroupRoles");
  }

  /** Get current group assignments as XML (with timezone). */
  async getGroupsCurrAssignXml(ocmid: string, tz: string): Promise<SpokResponse> {
    return this.execute("GetGroupsCurrAssignXml", { ocmid, tz });
  }

  /** Get group assignments XML for a date range. */
  async getGroupsAssignmentsXml(ocmid: string, ocastart: string, ocaend: string, tz: string): Promise<SpokResponse> {
    return this.execute("GetGroupsAssignmentsXml", { ocmid, ocastart, ocaend, tz });
  }

  // ─── Exceptions & Coverage ─────────────────────────────────────────────────

  /** Get current exception by messaging ID. */
  async getCurrentException(mid: string): Promise<SpokResponse> {
    return this.execute("GetCurrentException", { mid });
  }

  /** Get all exceptions by messaging ID. */
  async getExceptions(mid: string): Promise<SpokResponse> {
    return this.execute("GetExceptions", { mid });
  }

  /** Get exception list by messaging ID. */
  async getExceptionList(mid: string): Promise<SpokResponse> {
    return this.execute("GetExceptionList", { mid });
  }

  /** Get coverage path by messaging ID. */
  async getCoveragePath(mid: string): Promise<SpokResponse> {
    return this.execute("GetCoveragePath", { mid });
  }

  /** Get final covering messaging ID. */
  async getFinalCoveringId(mid: string): Promise<SpokResponse> {
    return this.execute("GetFinalCoveringId", { mid });
  }

  /** Get final covering person details. */
  async getFinalCoveringPerson(mid: string): Promise<SpokResponse> {
    return this.execute("GetFinalCoveringPerson", { mid });
  }

  // ─── Reference Data ────────────────────────────────────────────────────────

  /** Get all organization codes. */
  async getOrgCodes(): Promise<SpokResponse> {
    return this.execute("GetOrgCodes");
  }

  /** Get all phone number types. */
  async getPhoneNumberTypes(): Promise<SpokResponse> {
    return this.execute("GetPhoneNumberTypes");
  }

  /** Get all buildings. */
  async getAllBuildings(): Promise<SpokResponse> {
    return this.execute("GetAllBuildings");
  }

  /** Get all titles. */
  async getTitles(): Promise<SpokResponse> {
    return this.execute("GetTitles");
  }

  // ─── Data Feed ─────────────────────────────────────────────────────────────

  /** Add a person via the data feed API. */
  async dataFeedAddPerson(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("DataFeedAddPerson", params);
  }

  /** Update a person via the data feed API. */
  async dataFeedUpdatePerson(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("DataFeedUpdatePerson", params);
  }
}

// Export as both default and named for CJS/ESM compatibility
export { SpokService, SpokError };
export default SpokService;

// CommonJS compatibility: make `require("spok-api")` return the class directly
// with named exports attached (matching cisco-axl pattern)
const exportObj = Object.assign(SpokService, { SpokService, SpokError });
module.exports = exportObj;
