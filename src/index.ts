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

  // ─── High-priority CLOB reads ──────────────────────────────────────────────

  /**
   * Search listings by last name (CLOB output — bulk-safe).
   * @param searchType required by the server — one of EXACT, BEGINS WITH, ENDS WITH, CONTAINS.
   */
  async getListingsByLastName(lname: string, searchType: string, midFlag?: string): Promise<SpokResponse> {
    const params: Record<string, string> = { lname, search_type: searchType };
    if (midFlag) params.mid_flag = midFlag;
    return this.execute("GetListingsByLastName", params);
  }

  /** Get directories by UDF column with search type (CLOB output — bulk-safe). */
  async getDirectoriesByUdf(udfCol: string, udf: string, searchType?: string): Promise<SpokResponse> {
    const params: Record<string, string> = { udf_col: udfCol, udf };
    if (searchType) params.search_type = searchType;
    return this.execute("GetDirectoriesByUdf", params);
  }

  /** Get full department list. */
  async getAllDepartments(): Promise<SpokResponse> {
    return this.execute("GetAllDepartments");
  }

  /** Get hierarchical department tree by directory sequence number. */
  async getDepartmentHierarchy(dirseq: string): Promise<SpokResponse> {
    return this.execute("GetDepartmentHierarchy", { dirseq });
  }

  /** Get full address list. */
  async getAllAddresses(): Promise<SpokResponse> {
    return this.execute("GetAllAddresses");
  }

  /**
   * Get message groups visible to a requesting listing.
   * @param reqlid required — the requesting operator's listing ID.
   */
  async getMessageGroups(reqlid: string): Promise<SpokResponse> {
    return this.execute("GetMessageGroups", { reqlid });
  }

  /** Get pager info keyed by listing ID. */
  async getPagerInfoByLid(lid: string): Promise<SpokResponse> {
    return this.execute("GetPagerInfoByLid", { lid });
  }

  /** Get record name by listing ID. */
  async getRecordNameByLid(lid: string): Promise<SpokResponse> {
    return this.execute("GetRecordNameByLid", { lid });
  }

  /** Get record name by messaging ID. */
  async getRecordNameByMid(mid: string): Promise<SpokResponse> {
    return this.execute("GetRecordNameByMid", { mid });
  }

  /** Get record name by pager ID. */
  async getRecordNameByPid(pid: string): Promise<SpokResponse> {
    return this.execute("GetRecordNameByPid", { pid });
  }

  /** Get record name only by messaging ID (fastest name-only lookup). */
  async getRecordNameOnlyByMid(mid: string): Promise<SpokResponse> {
    return this.execute("GetRecordNameOnlyByMid", { mid });
  }

  /** Get listing instruction notes by listing ID. */
  async getListingInstructions(lid: string): Promise<SpokResponse> {
    return this.execute("GetListingInstructions", { lid });
  }

  /** Get instruction info by instruction sequence number. */
  async getInstructionInfo(seqnum: string): Promise<SpokResponse> {
    return this.execute("GetInstructionInfo", { seqnum });
  }

  /** Get a shared listing instruction by instruction sequence number. */
  async getSharedListingInstruction(seqnum: string): Promise<SpokResponse> {
    return this.execute("GetSharedListingInstruction", { seqnum });
  }

  /** Get status code reference table. */
  async getStatusCodes(): Promise<SpokResponse> {
    return this.execute("GetStatusCodes");
  }

  /** Get paging info for a messaging ID. */
  async getPagingInfo(mid: string): Promise<SpokResponse> {
    return this.execute("GetPagingInfo", { mid });
  }

  /** Get pager carrier/COS list. */
  async getPagerCoses(): Promise<SpokResponse> {
    return this.execute("GetPagerCoses");
  }

  /** Get pager model list. */
  async getPagerModels(): Promise<SpokResponse> {
    return this.execute("GetPagerModels");
  }

  /**
   * Get currently-active notifications visible to a requesting listing.
   * @param rlid required — the requesting operator's listing ID.
   */
  async getActiveNotifications(rlid: string): Promise<SpokResponse> {
    return this.execute("GetActiveNotifications", { rlid });
  }

  /**
   * Get all event templates visible to a requesting listing.
   * @param reqlid required — the requesting operator's listing ID.
   */
  async getAllEventTemplates(reqlid: string): Promise<SpokResponse> {
    return this.execute("GetAllEventTemplates", { reqlid });
  }

  /** Get event template detail by template ID. */
  async getEventTemplateDetail(etid: string): Promise<SpokResponse> {
    return this.execute("GetEventTemplateDetail", { etid });
  }

  /** Get event activations for a template. */
  async getEventActivations(etid: string): Promise<SpokResponse> {
    return this.execute("GetEventActivations", { etid });
  }

  /** Get event activation detail by activation ID. */
  async getEventActivationDetail(eaid: string): Promise<SpokResponse> {
    return this.execute("GetEventActivationDetail", { eaid });
  }

  /** Get on-call assignments for a messaging ID as XML. */
  async getIdsAssignmentsXml(mid: string, tz: string): Promise<SpokResponse> {
    return this.execute("GetIdsAssignmentsXml", { mid, tz });
  }

  /** Get current on-call assignment for a messaging ID as XML. */
  async getIdsCurrAssignXml(mid: string, tz: string): Promise<SpokResponse> {
    return this.execute("GetIdsCurrAssignXml", { mid, tz });
  }

  // ─── Additional reads (contacts, devices, status) ──────────────────────────

  /** Get all email addresses by listing ID. */
  async getEmailAddresses(lid: string): Promise<SpokResponse> {
    return this.execute("GetEmailAddresses", { lid });
  }

  /** Get email address by listing ID. */
  async getEmailAddressByLid(lid: string): Promise<SpokResponse> {
    return this.execute("GetEmailAddressByLid", { lid });
  }

  /** Get email address by messaging ID and display order. */
  async getEmailAddressByOrder(mid: string, dorder: string): Promise<SpokResponse> {
    return this.execute("GetEmailAddressByOrder", { mid, dorder });
  }

  /** Get caller email address by messaging ID. */
  async getCallerEmailAddress(mid: string): Promise<SpokResponse> {
    return this.execute("GetCallerEmailAddress", { mid });
  }

  /** Get alternate phone by messaging ID. */
  async getAlternatePhone(mid: string): Promise<SpokResponse> {
    return this.execute("GetAlternatePhone", { mid });
  }

  /** Get phone number by messaging ID. */
  async getPhoneNumber(mid: string): Promise<SpokResponse> {
    return this.execute("GetPhoneNumber", { mid });
  }

  /** Get phone number by listing ID. */
  async getPhoneNumberByLid(lid: string): Promise<SpokResponse> {
    return this.execute("GetPhoneNumberByLid", { lid });
  }

  /** Get address type reference list. */
  async getAddressTypes(): Promise<SpokResponse> {
    return this.execute("GetAddressTypes");
  }

  /** Get directory type reference list. */
  async getDirectoryTypes(): Promise<SpokResponse> {
    return this.execute("GetDirectoryTypes");
  }

  /**
   * Get profile specialties for a listing.
   * @param irFid required — the listing/feed ID to look up specialties for.
   */
  async getProfileSpecialties(irFid: string): Promise<SpokResponse> {
    return this.execute("GetProfileSpecialties", { ir_fid: irFid });
  }

  /**
   * Get assigned contact devices for a listing.
   * @param lid required — the listing ID.
   * @param cltype required — the contact list type: "ON HOURS" or "OFF HOURS".
   */
  async getAssignedContactDevices(lid: string, cltype: string): Promise<SpokResponse> {
    return this.execute("GetAssignedContactDevices", { lid, cltype });
  }

  /**
   * Get unassigned contact devices for a listing.
   * @param lid required — the listing ID.
   * @param cltype required — the contact list type: "ON HOURS" or "OFF HOURS".
   */
  async getUnassignedContactDevices(lid: string, cltype: string): Promise<SpokResponse> {
    return this.execute("GetUnassignedContactDevices", { lid, cltype });
  }

  /** Get page routes reference list. */
  async getPageRoutes(): Promise<SpokResponse> {
    return this.execute("GetPageRoutes");
  }

  /** Check whether a directory sequence number belongs to a pager. */
  async isPagerByDirectorySeqnum(dirseq: string): Promise<SpokResponse> {
    return this.execute("IsPagerByDirectorySeqnum", { dirseq });
  }

  /** Check whether a listing ID belongs to a pager. */
  // NOTE: The server's IsPagerByListingId RPC rejects `lid` and demands `phnum`,
  // making it a duplicate of isPagerByPhone. Verified against the lab server —
  // this wrapper cannot function as named; prefer isPagerByPhone.
  async isPagerByListingId(lid: string): Promise<SpokResponse> {
    return this.execute("IsPagerByListingId", { lid });
  }

  /** Check whether a phone number belongs to a pager. */
  async isPagerByPhone(phone: string): Promise<SpokResponse> {
    return this.execute("IsPagerByPhone", { phone });
  }

  /** Get current status by messaging ID. */
  async getStatus(mid: string): Promise<SpokResponse> {
    return this.execute("GetStatus", { mid });
  }

  /** Get ID status by messaging ID. */
  async getIdStatus(mid: string): Promise<SpokResponse> {
    return this.execute("GetIdStatus", { mid });
  }

  /** Get statuses by employee ID. */
  async getStatusesByEid(eid: string): Promise<SpokResponse> {
    return this.execute("GetStatusesByEid", { eid });
  }

  /** Get statuses by feed ID. */
  async getStatusesByFeedId(feedId: string): Promise<SpokResponse> {
    return this.execute("GetStatusesByFeedId", { feed_id: feedId });
  }

  /**
   * Get statuses by last name.
   * @param searchType required — one of EXACT, BEGINS WITH, ENDS WITH, CONTAINS.
   */
  async getStatusesByLastName(lname: string, searchType: string): Promise<SpokResponse> {
    return this.execute("GetStatusesByLastName", { lname, search_type: searchType });
  }

  /** Get statuses updated on or after a date (YYYY-MM-DD). */
  async getStatusesByLatestDate(date: string): Promise<SpokResponse> {
    return this.execute("GetStatusesByLatestDate", { date });
  }

  /**
   * Get statuses by name.
   * @param searchType required — one of EXACT, BEGINS WITH, ENDS WITH, CONTAINS.
   */
  async getStatusesByName(name: string, searchType: string): Promise<SpokResponse> {
    return this.execute("GetStatusesByName", { name, search_type: searchType });
  }

  /** Get statuses by SSN. */
  async getStatusesBySsn(ssn: string): Promise<SpokResponse> {
    return this.execute("GetStatusesBySsn", { ssn });
  }

  /** Get statuses by user-defined field. */
  async getStatusesByUdf(udfCol: string, udf: string): Promise<SpokResponse> {
    return this.execute("GetStatusesByUdf", { udf_col: udfCol, udf });
  }

  /** Get work hours by listing ID. */
  async getWorkHours(lid: string): Promise<SpokResponse> {
    return this.execute("GetWorkHours", { lid });
  }

  /** Get notification status by event activation ID. */
  async getNotificationStatus(eaid: string): Promise<SpokResponse> {
    return this.execute("GetNotificationStatus", { eaid });
  }

  /** Get notification step queries by event activation ID. */
  async getNotificationStepQueries(eaid: string): Promise<SpokResponse> {
    return this.execute("GetNotificationStepQueries", { eaid });
  }

  /** Get event status by event activation ID. */
  async getEventStatus(eaid: string): Promise<SpokResponse> {
    return this.execute("GetEventStatus", { eaid });
  }

  /** Get event template privilege by template ID and listing ID. */
  async getEventTemplatePrivilege(etid: string, lid: string): Promise<SpokResponse> {
    return this.execute("GetEventTemplatePrivilege", { etid, lid });
  }

  /** Get recipient count for an event activation. */
  async getActivationRecipientCount(eaid: string): Promise<SpokResponse> {
    return this.execute("GetActivationRecipientCount", { eaid });
  }

  /** Get recipient count for an event template. */
  async getTemplateRecipientCount(etid: string): Promise<SpokResponse> {
    return this.execute("GetTemplateRecipientCount", { etid });
  }

  /**
   * Get query template info.
   * @param reqlid required — the requesting operator's listing ID.
   * @param qseq required — the query sequence number.
   */
  async getQueryTemplateInfo(reqlid: string, qseq: string): Promise<SpokResponse> {
    return this.execute("GetQueryTemplateInfo", { reqlid, qseq });
  }

  // ─── Monitoring ────────────────────────────────────────────────────────────

  /** Get event detail for a monitored event. */
  async monitorEventDetail(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("MonitorEventDetail", params);
  }

  /** Get event status for a monitored event. */
  async monitorEventStatus(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("MonitorEventStatus", params);
  }

  /** Get event status summary for a monitored event. */
  async monitorEventStatusSummary(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("MonitorEventStatusSummary", params);
  }

  /** Get procedure status summary for a monitored event. */
  async monitorProcStatusSummary(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("MonitorProcStatusSummary", params);
  }

  /** Get step responses for a monitored event. */
  async monitorStepResponses(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("MonitorStepResponses", params);
  }

  /** Get step status summary for a monitored event. */
  async monitorStepStatusSummary(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("MonitorStepStatusSummary", params);
  }

  // ─── Writes — people, listings, devices ───────────────────────────────────

  /** Delete a person listing by listing ID. */
  async deletePerson(lid: string): Promise<SpokResponse> {
    return this.execute("DeletePerson", { lid });
  }

  /** Enable or disable a listing. */
  async setListingEnabled(lid: string, eflag: string): Promise<SpokResponse> {
    return this.execute("SetListingEnabled", { lid, eflag });
  }

  /** Update the messaging ID on a listing. */
  async updateMessagingId(lid: string, mid: string): Promise<SpokResponse> {
    return this.execute("UpdateMessagingId", { lid, mid });
  }

  /** Assign a role to a listing. */
  async assignRole(lid: string, role: string): Promise<SpokResponse> {
    return this.execute("AssignRole", { lid, role });
  }

  /** Assign message priorities to a listing. */
  async assignMessagePriorities(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AssignMessagePriorities", params);
  }

  /** Assign group limits to a listing. */
  async assignGroupLimits(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AssignGroupLimits", params);
  }

  /** Add a phone number to a listing. */
  async addPhoneNumber(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddPhoneNumber", params);
  }

  /** Delete a phone number from a listing directory entry. */
  async deleteListingDirectoryPhone(lid: string, dirseq: string): Promise<SpokResponse> {
    return this.execute("DeleteListingDirectoryPhone", { lid, dirseq });
  }

  /** Delete an email address by listing ID. */
  async deleteEmailAddressByLid(lid: string, emaddr: string): Promise<SpokResponse> {
    return this.execute("DeleteEmailAddressByLid", { lid, emaddr });
  }

  /** Update an email address by listing ID. */
  async updateEmailAddressByLid(lid: string, oldEmaddr: string, newEmaddr: string): Promise<SpokResponse> {
    return this.execute("UpdateEmailAddressByLid", { lid, old_emaddr: oldEmaddr, new_emaddr: newEmaddr });
  }

  /** Assign a pager to a listing by listing ID. */
  async assignPagerByLid(lid: string, pagerId: string, displayOrder?: string): Promise<SpokResponse> {
    const params: Record<string, string> = { lid, pager_id: pagerId };
    if (displayOrder) params.display_order = displayOrder;
    return this.execute("AssignPagerByLid", params);
  }

  /** Update pager properties. */
  async updatePager(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdatePager", params);
  }

  /** Add a listing instruction note. */
  async addListingInstruction(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddListingInstruction", params);
  }

  /** Update a listing instruction note. */
  async updateListingInstruction(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdateListingInstruction", params);
  }

  /**
   * Delete a listing instruction by sequence number.
   * @param seqnum required — the instruction sequence number.
   * @param lid required — the owning listing ID (server needs both).
   */
  async deleteListingInstruction(seqnum: string, lid: string): Promise<SpokResponse> {
    return this.execute("DeleteListingInstruction", { seqnum, lid });
  }

  /**
   * Share a listing instruction with another listing.
   * @param seqnum required — the instruction sequence number (the family uses seqnum, not instrseq).
   */
  async shareListingInstruction(seqnum: string, targetLid: string): Promise<SpokResponse> {
    return this.execute("ShareListingInstruction", { seqnum, target_lid: targetLid });
  }

  /** Change an on-call exception. */
  async changeException(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("ChangeException", params);
  }

  /** Delete an on-call exception by sequence number. */
  async deleteException(excpseq: string): Promise<SpokResponse> {
    return this.execute("DeleteException", { excpseq });
  }

  /** Add a personal contact device. */
  async addPersonalContactDevice(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddPersonalContactDevice", params);
  }

  /** Update a personal contact device. */
  async updatePersonalContactDevice(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdatePersonalContactDevice", params);
  }

  /**
   * Delete a personal contact device.
   * @param pdoseq required — the device sequence number (returned as pdoseq by getAssignedContactDevices).
   */
  async deletePersonalContactDevice(pdoseq: string): Promise<SpokResponse> {
    return this.execute("DeletePersonalContactDevice", { pdoseq });
  }

  /** Delete all personal device options for a messaging ID. */
  async deleteAllPersonalDeviceOptions(mid: string): Promise<SpokResponse> {
    return this.execute("DeleteAllPersonalDeviceOptions", { mid });
  }

  /** Swap two personal contact devices. */
  async swapPersonalContactDevice(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("SwapPersonalContactDevice", params);
  }

  /** Unassign all contact devices from a messaging ID. */
  async unassignContactDevices(mid: string): Promise<SpokResponse> {
    return this.execute("UnassignContactDevices", { mid });
  }

  /** Register an AMC device. */
  async registerAMCDevice(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("RegisterAMCDevice", params);
  }

  /** Unregister an AMC device. */
  async unregisterAMCDevice(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UnregisterAMCDevice", params);
  }

  // ─── Writes — organization ─────────────────────────────────────────────────

  /** Add an organization. */
  async addOrg(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddOrg", params);
  }

  /** Update an organization. */
  async updateOrg(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdateOrg", params);
  }

  /** Delete an organization by sequence number. */
  async deleteOrg(orgseq: string): Promise<SpokResponse> {
    return this.execute("DeleteOrg", { orgseq });
  }

  /** Insert/update/delete an organization (IUD pattern). */
  async iudOrg(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("IudOrg", params);
  }

  /** Add an address. */
  async addAddress(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddAddress", params);
  }

  /** Update an address. */
  async updateAddress(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdateAddress", params);
  }

  /** Delete an address by sequence number. */
  async deleteAddress(addrseq: string): Promise<SpokResponse> {
    return this.execute("DeleteAddress", { addrseq });
  }

  /** Insert/update/delete a profile specialty (IUD pattern). */
  async iudProfileSpecialty(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("IudProfileSpecialty", params);
  }

  // ─── Writes — on-call ──────────────────────────────────────────────────────

  /** Add an on-call assignment. */
  async addOncallAssignment(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddOncallAssignment", params);
  }

  /** Update an on-call assignment. */
  async updateOncallAssignment(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdateOncallAssignment", params);
  }

  /** Delete an on-call assignment by sequence number. */
  async deleteOncallAssignment(ocaseq: string): Promise<SpokResponse> {
    return this.execute("DeleteOncallAssignment", { ocaseq });
  }

  /** Add an on-call group. */
  async addOncallGroup(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddOncallGroup", params);
  }

  /** Update an on-call group. */
  async updateOncallGroup(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdateOncallGroup", params);
  }

  /** Delete an on-call group by messaging ID. */
  async deleteOncallGroup(ocmid: string): Promise<SpokResponse> {
    return this.execute("DeleteOncallGroup", { ocmid });
  }

  /** Delete a member from an on-call group. */
  async deleteOncallGroupMember(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("DeleteOncallGroupMember", params);
  }

  /** Add a role to an on-call group. */
  async addOncallGroupRole(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddOncallGroupRole", params);
  }

  /** Delete a role from an on-call group by role ID. */
  async deleteOncallGroupRole(roleid: string): Promise<SpokResponse> {
    return this.execute("DeleteOncallGroupRole", { roleid });
  }

  // ─── Writes — work hours ───────────────────────────────────────────────────

  /** Add a work hour entry. */
  async addWorkHour(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddWorkHour", params);
  }

  /** Update a work hour entry. */
  async updateWorkHour(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdateWorkHour", params);
  }

  /**
   * Delete a work hour entry.
   * @param lid required — the owning listing ID.
   * @param phrseq required — the work-hour sequence number (returned as phrseq by getWorkHours).
   */
  async deleteWorkHour(lid: string, phrseq: string): Promise<SpokResponse> {
    return this.execute("DeleteWorkHour", { lid, phrseq });
  }

  /** Unassign all work hours from a messaging ID. */
  async unassignWorkHours(mid: string): Promise<SpokResponse> {
    return this.execute("UnassignWorkHours", { mid });
  }

  // ─── Writes — message groups ───────────────────────────────────────────────

  /** Add a static message group. */
  async addStaticMessageGroup(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("AddStaticMessageGroup", params);
  }

  /** Update a message group. */
  async updateMessageGroup(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdateMessageGroup", params);
  }

  /** Delete a message group by group number. */
  async deleteMessageGroup(grpnum: string): Promise<SpokResponse> {
    return this.execute("DeleteMessageGroup", { grpnum });
  }

  /** Delete a member from a static message group. */
  async deleteStaticMessageGroupMember(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("DeleteStaticMessageGroupMember", params);
  }

  /** Update a member in a static message group. */
  async updateStaticMessageGroupMember(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("UpdateStaticMessageGroupMember", params);
  }

  // ─── Writes — paging / messaging ───────────────────────────────────────────

  /** Send a message (extended send with additional options beyond SendPage). */
  async sendMessage(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("SendMessage", params);
  }

  /** Submit a message for queued delivery. */
  async submitMessage(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("SubmitMessage", params);
  }

  /** Send a page to an on-call group. */
  async sendGroupPage(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("SendGroupPage", params);
  }

  /** Send a page with an alert flag. */
  async sendPageWithAlert(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("SendPageWithAlert", params);
  }

  /** Send a message to a SmartAlert destination. */
  async sendToSmartAlert(params: Record<string, string>): Promise<SpokResponse> {
    return this.execute("SendToSmartAlert", params);
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
