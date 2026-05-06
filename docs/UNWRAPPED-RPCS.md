# Unwrapped Amcom RPCs

The Amcom Smart Suite TCP API exposes ~200 stored procedures. This library currently wraps 52 of them — primarily reads/writes against people, pagers, on-call groups, exceptions, and coverage. This document tracks what's still not wrapped, organized by domain and tagged by output buffer type so consumers can plan around the protocol's limits.

**Buffer note**: RPCs whose `xml_result` parameter is declared `VARCHAR2` (rather than `CLOB`) silently return `ORA-06502: numeric or value error` when the result set exceeds the ~4 KB PL/SQL buffer. This is a protocol-level limitation, not something the library can fix client-side. Result-heavy queries are only viable on RPCs declared with `CLOB` output.

## High-priority reads (bulk-safe — CLOB output)

These are the most useful unwrapped reads for directory/contact enumeration and lookup work:

| RPC | Notes |
|---|---|
| `GetListingsByLastName` | Like `GetListingsByName` but on last name; supports `search_type`. Useful for alphabet-sweep enumeration with cleaner results than full-name search. |
| `GetDirectoriesByUdf` | Directory rows by UDF column with `search_type` (CONTAINS / BEGINS WITH / ENDS WITH / EXACT) — the only UDF query path that handles bulk safely. |
| `GetAllDepartments` | Full department list. |
| `GetDepartmentHierarchy` | Hierarchical department tree, by `dirseq`. |
| `GetAllAddresses` | Full address list. |
| `GetMessageGroups` | All message groups. |
| `GetPagerInfoByLid` | Pager info keyed by listing ID (lib only has `ByMid`). |
| `GetRecordNameByLid` / `ByMid` / `ByPid` / `OnlyByMid` | Fast name-only lookups (avoid the full record fetch). |
| `GetListingInstructions` / `GetInstructionInfo` / `GetSharedListingInstruction` | Listing instruction notes. |
| `GetStatusCodes` | Status code reference table. |
| `GetPagingInfo` / `GetPagerCoses` / `GetPagerModels` | Pager configuration metadata. |
| `GetActiveNotifications` | Currently-active notifications. |
| `GetAllEventTemplates` / `GetEventTemplateDetail` / `GetEventActivations` / `GetEventActivationDetail` | Event template + activation details. |
| `GetIdsAssignmentsXml` / `GetIdsCurrAssignXml` | XML-format assignment dumps. |

## Other reads (small-result or single-value)

These return small payloads, single values, or status flags. Wrap as needed:

- **Listings / contacts**: `GetEmailAddresses`, `GetEmailAddressByLid`, `GetEmailAddressByOrder`, `GetCallerEmailAddress`, `GetAlternatePhone`, `GetPhoneNumber`, `GetPhoneNumberByLid`, `GetAddressTypes`, `GetDirectoryTypes`, `GetProfileSpecialties`
- **Pagers / devices**: `GetAssignedContactDevices`, `GetUnassignedContactDevices`, `GetPageRoutes`, `IsPagerByDirectorySeqnum`, `IsPagerByListingId`, `IsPagerByPhone`
- **Status**: `GetStatus`, `GetIdStatus`, `GetStatusesByEid`, `GetStatusesByFeedId`, `GetStatusesByLastName`, `GetStatusesByLatestDate`, `GetStatusesByName`, `GetStatusesBySsn`, `GetStatusesByUdf`
- **Work hours**: `GetWorkHours`
- **Notifications / events**: `GetNotificationStatus`, `GetNotificationStepQueries`, `GetEventStatus`, `GetEventTemplatePrivilege`, `GetActivationRecipientCount`, `GetTemplateRecipientCount`, `GetQueryTemplateInfo`
- **Monitoring**: `MonitorEventDetail`, `MonitorEventStatus`, `MonitorEventStatusSummary`, `MonitorProcStatusSummary`, `MonitorStepResponses`, `MonitorStepStatusSummary`

## Writes — listings, contacts, devices

- **People / listings**: `DeletePerson`, `SetListingEnabled`, `UpdateMessagingId`, `AssignRole`, `AssignMessagePriorities`, `AssignGroupLimits`
- **Phone numbers**: `AddPhoneNumber`, `DeleteListingDirectoryPhone`
- **Email**: `DeleteEmailAddressByLid`, `UpdateEmailAddressByLid`
- **Pagers**: `AssignPagerByLid`, `UpdatePager`
- **Listing instructions**: `AddListingInstruction`, `UpdateListingInstruction`, `DeleteListingInstruction`, `ShareListingInstruction`
- **Exceptions**: `ChangeException`, `DeleteException`
- **Personal contact devices**: `AddPersonalContactDevice`, `UpdatePersonalContactDevice`, `DeletePersonalContactDevice`, `DeleteAllPersonalDeviceOptions`, `SwapPersonalContactDevice`, `UnassignContactDevices`, `RegisterAMCDevice`, `UnregisterAMCDevice`

## Writes — organization

- **Orgs**: `AddOrg`, `UpdateOrg`, `DeleteOrg`, `IudOrg`
- **Addresses**: `AddAddress`, `UpdateAddress`, `DeleteAddress`
- **Specialty**: `IudProfileSpecialty`

## Writes — on-call

- **Assignments**: `AddOncallAssignment`, `UpdateOncallAssignment`, `DeleteOncallAssignment`
- **Groups**: `AddOncallGroup`, `UpdateOncallGroup`, `DeleteOncallGroup`, `DeleteOncallGroupMember`
- **Roles**: `AddOncallGroupRole`, `DeleteOncallGroupRole`

## Writes — work hours

- `AddWorkHour`, `UpdateWorkHour`, `DeleteWorkHour`, `UnassignWorkHours`

## Writes — message groups

- `AddStaticMessageGroup`, `UpdateMessageGroup`, `DeleteMessageGroup`
- `DeleteStaticMessageGroupMember`, `UpdateStaticMessageGroupMember`

## Writes — events & step templates

Largest unwrapped subsystem after DataFeed. Used for emergency notification / event-driven multi-step recipient flows.

- **Event templates**: `CreateBasicEventTemplate`, `CreateYNEventTemplate`, `UpdateEventTemplate`, `DeleteEventTemplate`, `ValidateEventTemplate`, `ValidateEventAvailability`
- **Event privileges**: `AddEventTemplatePrivilege`, `UpdateEventTemplatePrivilege`, `DeleteEventTemplatePrivilege`
- **Activations**: `ActivateEvent`, `ActivateEventRequest`, `CancelEvent`, `CreateEventActivation`, `UpdateEventActivation`
- **Procedure activation/template**: `UpdateProcedureActivation`, `UpdateProcedureTemplate`
- **Step templates**: `AddStepTemplateMessageGroup`, `AddStepTemplateRecipient`, `AddStepTemplateYNQuestion`, `DeleteStepTemplateMessageGroup`, `DeleteStepTemplateRecipient`, `DeleteStepTemplateYNQuestion`, `UpdateStepTemplate`, `UpdateStepTemplateYNQuestion`, `ReplaceStepTemplateAllMessageGroups`, `ReplaceStepTemplateAllRecipients`
- **Step activations**: `AddStepActivationMessageGroup`, `AddStepActivationRecipient`, `AppendToStepActivationRecipients`, `DeleteStepActivationMessageGroup`, `DeleteStepActivationRecipient`, `UpdateStepActivation`, `UpdateStepActivationYNQuestion`, `ReplaceStepActivationAllMessageGroups`, `ReplaceStepActivationAllRecipients`
- **Validation / response**: `ValidateStepRecipient`, `ValidateStepSeqnum`, `InitiateRecipientResponse`, `LogRecipientAnswer`

## Writes — paging / messaging

Beyond the wrapped `SendPage` / `ChangeStatus`:

- `SendMessage`, `SubmitMessage`, `SendGroupPage`, `SendPageWithAlert`, `SendToSmartAlert`

## Writes — DataFeed bulk ingestion (~50 RPCs)

The full `DataFeed*` family for AMC/HR/AD-style bulk ingestion. Useful only if Spok is being treated as a *destination* (you're feeding records *into* Spok) — likely out of scope for most current consumers.

- **People**: `DataFeedAddProfile*`, `DataFeedUpdateProfile*`, `DataFeedDeleteProfile*` for Email, Phone, Pager, Title, Building, Department, Address, Alias, Exception, Duplicate, Status (~40 procs across the matrix)
- **Functions**: `DataFeedAddFunction`, `DataFeedUpdateFunction`, `DataFeedDeleteFunction`
- **OnCall groups**: `DataFeedAddOnCallGroup`, `DataFeedUpdateOnCallGroup`, `DataFeedDeleteOnCallGroup`
- **Group assignments**: `DataFeedAddGroupAssignment`, `DataFeedUpdateGroupAssignment`, `DataFeedDeleteGroupAssignment`
- **Message groups**: `DataFeedAddMessageGroup`, `DataFeedUpdateMessageGroup`, `DataFeedDeleteMessageGroup`, `DataFeedAddMessageGroupMember`, `DataFeedUpdateMessageGroupMember`, `DataFeedDeleteMessageGroupMember`
- **Buildings**: `DataFeedAddBuilding`, `DataFeedUpdateBuilding`, `DataFeedDeleteBuilding`
- **Type changes**: `DataFeedChangePersonToFunction`, `DataFeedChangeFunctionToPerson`, `DataFeedChangePersonToOnCallGroup`, `DataFeedChangeOnCallGroupToPerson`
- **Misc**: `DataFeedActivateEvent`, `DataFeedPing`, `DataFeedUpdateAMCRegistration`, `DataFeedUpdateAllPagerDomain`, `DataFeedUpdateAllPhoneTypes`

## How to wrap an RPC

The pattern is a single method on `SpokService` that calls `this.execute(<rpc-name>, params)`:

```ts
async getListingsByLastName(lname: string, searchType: string, midFlag?: string): Promise<SpokResponse> {
  const params: Record<string, string> = { lname, search_type: searchType };
  if (midFlag) params.mid_flag = midFlag;
  return this.execute("GetListingsByLastName", params);
}
```

Param names must match the protocol declaration in `amcomapi.xml`. When in doubt, consult the Smart Suite User Guide PDF (Section 7) for the canonical signature.
