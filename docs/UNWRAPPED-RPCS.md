# Unwrapped Amcom RPCs

The Amcom Smart Suite TCP API exposes ~270 stored procedures. As of Phase 4 (Task 20) this library wraps 175 of them as typed `SpokService` methods — reads/writes across people, pagers, listings, directories, on-call groups/assignments/roles, exceptions, coverage, work hours, message groups, organizations/addresses, personal contact devices, monitoring, and the core paging/messaging family. Every wrapped RPC also has a corresponding CLI command (`spok-api <verb> <noun>`) and is exercised by a lab-gated integration test under `test/integration/` (`SPOK_LAB=1 node --test test/integration/**/*.test.js`; write tests create and delete only their own throwaway records). This document tracks what's **still** not wrapped, organized by domain.

**Buffer note**: RPCs whose `xml_result` parameter is declared `VARCHAR2` (rather than `CLOB`) silently return `ORA-06502: numeric or value error` when the result set exceeds the ~4 KB PL/SQL buffer. This is a protocol-level limitation, not something the library can fix client-side. Result-heavy queries are only viable on RPCs declared with `CLOB` output.

## Now wrapped (Phases 1–4)

All of the following domains — previously listed here as unwrapped — are done: wrapped in `src/index.ts`, exposed as CLI subcommands, and covered by the lab-gated integration suite (paging sends excepted — see below).

- **High-priority bulk reads**: `GetListingsByLastName`, `GetDirectoriesByUdf` (now also accepts optional `lid`/`phtype` filters), `GetAllDepartments`, `GetDepartmentHierarchy`, `GetAllAddresses`, `GetMessageGroups`, `GetPagerInfoByLid` (`ByMid` also wrapped), `GetRecordNameByLid`/`ByMid`/`ByPid`/`OnlyByMid`, `GetListingInstructions`/`GetInstructionInfo`/`GetSharedListingInstruction`, `GetStatusCodes`, `GetPagingInfo` (now accepts optional `lname`/`fname` in addition to `mid`), `GetPagerCoses`, `GetPagerModels`, `GetActiveNotifications`, `GetAllEventTemplates`/`GetEventTemplateDetail`/`GetEventActivations`/`GetEventActivationDetail`, `GetIdsAssignmentsXml`/`GetIdsCurrAssignXml`.
- **Other reads**: all listings/contacts (`GetEmailAddresses`, `GetEmailAddressByLid`, `GetEmailAddressByOrder`, `GetCallerEmailAddress`, `GetAlternatePhone`, `GetPhoneNumber`, `GetPhoneNumberByLid`, `GetAddressTypes`, `GetDirectoryTypes`, `GetProfileSpecialties`), pagers/devices (`GetAssignedContactDevices`, `GetUnassignedContactDevices`, `GetPageRoutes`, `IsPagerByDirectorySeqnum`, `IsPagerByListingId`, `IsPagerByPhone`), status (`GetStatus`, `GetIdStatus`, `GetStatusesByEid`, `GetStatusesByFeedId`, `GetStatusesByLastName`, `GetStatusesByLatestDate`, `GetStatusesByName`, `GetStatusesBySsn`, `GetStatusesByUdf`), work hours (`GetWorkHours`), notifications/events (`GetNotificationStatus`, `GetNotificationStepQueries`, `GetEventStatus`, `GetEventTemplatePrivilege`, `GetActivationRecipientCount`, `GetTemplateRecipientCount`, `GetQueryTemplateInfo`), and monitoring (`MonitorEventDetail`, `MonitorEventStatus`, `MonitorEventStatusSummary`, `MonitorProcStatusSummary`, `MonitorStepResponses`, `MonitorStepStatusSummary`).
- **Writes — listings, contacts, devices**: `DeletePerson`, `SetListingEnabled`, `UpdateMessagingId`, `AssignRole`, `AssignMessagePriorities`, `AssignGroupLimits`, `AddPhoneNumber`, `DeleteListingDirectoryPhone`, `DeleteEmailAddressByLid`, `UpdateEmailAddressByLid`, `AssignPagerByLid`, `UpdatePager`, `AddListingInstruction`, `UpdateListingInstruction`, `DeleteListingInstruction`, `ShareListingInstruction`, `ChangeException`, `DeleteException`, `AddPersonalContactDevice`, `UpdatePersonalContactDevice`, `DeletePersonalContactDevice`, `DeleteAllPersonalDeviceOptions`, `SwapPersonalContactDevice`, `UnassignContactDevices`, `RegisterAMCDevice`, `UnregisterAMCDevice`.
- **Writes — organization**: `AddOrg`, `UpdateOrg`, `DeleteOrg`, `IudOrg`, `AddAddress`, `UpdateAddress`, `DeleteAddress`, `IudProfileSpecialty`.
- **Writes — on-call**: `AddOncallAssignment`, `UpdateOncallAssignment`, `DeleteOncallAssignment`, `AddOncallGroup`, `UpdateOncallGroup`, `DeleteOncallGroup`, `DeleteOncallGroupMember`, `AddOncallGroupMember`, `AddOncallGroupRole`, `DeleteOncallGroupRole`.
- **Writes — work hours**: `AddWorkHour`, `UpdateWorkHour`, `DeleteWorkHour`, `UnassignWorkHours`.
- **Writes — message groups**: `AddStaticMessageGroup`, `AddStaticMessageGroupMember`, `UpdateMessageGroup`, `DeleteMessageGroup`, `DeleteStaticMessageGroupMember`, `UpdateStaticMessageGroupMember`.
- **Writes — paging/messaging**: `SendPage`, `ChangeStatus`, and `SendMessage`/`SubmitMessage`/`SendGroupPage`/`SendPageWithAlert`/`SendToSmartAlert` — the latter 5 are fully wired (library method + CLI command + `it.skip`'d integration test documenting the exact params) but **never live-called**, per the standing "no page/notification sends, ever" constraint. Run `test/integration/writes-paging.test.js` to confirm they show as skipped, never executed.
- **DataFeed — people**: `DataFeedAddPerson`, `DataFeedUpdatePerson` (the `DataFeedDeleteProfile*`/`DataFeedAddProfile*`/`DataFeedUpdateProfile*` sub-families below remain unwrapped).

## Writes — events & step templates

Largest unwrapped subsystem after DataFeed. Used for emergency notification / event-driven multi-step recipient flows.

- **Event templates**: `CreateBasicEventTemplate`, `CreateYNEventTemplate`, `UpdateEventTemplate`, `DeleteEventTemplate`, `ValidateEventTemplate`, `ValidateEventAvailability`
- **Event privileges**: `AddEventTemplatePrivilege`, `UpdateEventTemplatePrivilege`, `DeleteEventTemplatePrivilege`
- **Activations**: `ActivateEvent`, `ActivateEventRequest`, `CancelEvent`, `CreateEventActivation`, `UpdateEventActivation`
- **Procedure activation/template**: `UpdateProcedureActivation`, `UpdateProcedureTemplate`
- **Step templates**: `AddStepTemplateMessageGroup`, `AddStepTemplateRecipient`, `AddStepTemplateYNQuestion`, `DeleteStepTemplateMessageGroup`, `DeleteStepTemplateRecipient`, `DeleteStepTemplateYNQuestion`, `UpdateStepTemplate`, `UpdateStepTemplateYNQuestion`, `ReplaceStepTemplateAllMessageGroups`, `ReplaceStepTemplateAllRecipients`
- **Step activations**: `AddStepActivationMessageGroup`, `AddStepActivationRecipient`, `AppendToStepActivationRecipients`, `DeleteStepActivationMessageGroup`, `DeleteStepActivationRecipient`, `UpdateStepActivation`, `UpdateStepActivationYNQuestion`, `ReplaceStepActivationAllMessageGroups`, `ReplaceStepActivationAllRecipients`
- **Validation / response**: `ValidateStepRecipient`, `ValidateStepSeqnum`, `InitiateRecipientResponse`, `LogRecipientAnswer`

## Writes — DataFeed bulk ingestion (~50 RPCs remaining)

The full `DataFeed*` family for AMC/HR/AD-style bulk ingestion. Useful only if Spok is being treated as a *destination* (you're feeding records *into* Spok) — likely out of scope for most current consumers. `DataFeedAddPerson`/`DataFeedUpdatePerson` (and the unrelated `IudOrg`/`IudProfileSpecialty` IUD procs) are wrapped — see "Now wrapped" above.

- **People**: `DataFeedDeletePerson` (Add/Update are wrapped; Delete is not), plus `DataFeedAddProfile*`, `DataFeedUpdateProfile*`, `DataFeedDeleteProfile*` for Email, Phone, Pager, Title, Building, Department, Address, Alias, Exception, Duplicate, Status (~40 procs across the matrix)
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
