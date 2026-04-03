"use strict";

const { callAmcom, cleanObject } = require("../utils/connection.js");
const { printResult, printError } = require("../utils/output.js");
const { enforceReadOnly } = require("../utils/readonly.js");

module.exports = function registerDatafeedCommand(program) {
  const datafeed = program
    .command("datafeed")
    .description("Data feed operations via Spok SmartSuite API");

  datafeed
    .command("add-person")
    .description("Add a person via the data feed API")
    .requiredOption("--unique-id <id>", "unique identifier")
    .requiredOption("--last-name <name>", "last name")
    .requiredOption("--source <source>", "source system")
    .option("--facility-code <code>", "facility code")
    .option("--first-name <name>", "first name")
    .option("--middle-initial <initial>", "middle initial")
    .option("--suffix <suffix>", "suffix")
    .option("--salutation <salut>", "salutation")
    .option("--pronunciation <pron>", "pronunciation")
    .option("--gender <gender>", "gender")
    .option("--messaging-id <mid>", "messaging ID")
    .option("--alpha-password <pwd>", "alpha password")
    .option("--numeric-password <pwd>", "numeric password")
    .option("--ssn <ssn>", "SSN")
    .option("--timezone <tz>", "timezone")
    .option("--udf1 <val>", "listing UDF1")
    .option("--udf2 <val>", "listing UDF2")
    .option("--udf3 <val>", "listing UDF3")
    .option("--udf4 <val>", "listing UDF4")
    .option("--udf5 <val>", "listing UDF5")
    .option("--udf6 <val>", "listing UDF6")
    .option("--employee-id <eid>", "employee ID")
    .option("--remark <remark>", "remark")
    .option("--switch-name <name>", "switch name")
    .option("--sso-username <name>", "SSO username")
    .option("--org-code <code>", "organization code")
    .option("--title <title>", "title")
    .option("--department-name <name>", "department name")
    .option("--department-parent <parent>", "department parent")
    .option("--phone-number <num>", "phone number")
    .option("--phone-type <type>", "phone type")
    .option("--email-address <email>", "email address")
    .option("--status-code <code>", "status code")
    .option("--status-text <text>", "status text")
    .option("--transaction-id <id>", "transaction ID")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);

        const params = {
          UniqueID: opts.uniqueId,
          LastName: opts.lastName,
          SourceSystem: opts.source,
        };

        const optMap = {
          facilityCode: "FacilityCode", firstName: "FirstName",
          middleInitial: "MiddleInitial", suffix: "Suffix",
          salutation: "Salutation", pronunciation: "Pronunciation",
          gender: "Gender", messagingId: "MessagingID",
          alphaPassword: "AlphaPassword", numericPassword: "NumericPassword",
          ssn: "SSN", timezone: "TimeZone",
          udf1: "ListingUDF1", udf2: "ListingUDF2", udf3: "ListingUDF3",
          udf4: "ListingUDF4", udf5: "ListingUDF5", udf6: "ListingUDF6",
          employeeId: "EmployeeID", remark: "Remark", switchName: "SwitchName",
          ssoUsername: "SSOUserName", orgCode: "OrgCode", title: "Title",
          departmentName: "DepartmentName", departmentParent: "DepartmentParent",
          phoneNumber: "PhoneNumber", phoneType: "PhoneType",
          emailAddress: "EmailAddress", statusCode: "StatusCode",
          statusText: "StatusText", transactionId: "TransactionId",
        };

        for (const [cliKey, amcomKey] of Object.entries(optMap)) {
          if (opts[cliKey] !== undefined) params[amcomKey] = opts[cliKey];
        }

        const result = await callAmcom(globalOpts, "DataFeedAddPerson", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });

  datafeed
    .command("update-person")
    .description("Update a person via the data feed API")
    .requiredOption("--old-id <id>", "old unique identifier")
    .requiredOption("--new-id <id>", "new unique identifier")
    .requiredOption("--source <source>", "source system")
    .option("--old-facility-code <code>", "old facility code")
    .option("--new-facility-code <code>", "new facility code")
    .option("--old-last-name <name>", "old last name")
    .option("--new-last-name <name>", "new last name")
    .option("--old-first-name <name>", "old first name")
    .option("--new-first-name <name>", "new first name")
    .option("--old-employee-id <eid>", "old employee ID")
    .option("--new-employee-id <eid>", "new employee ID")
    .option("--old-sso-username <name>", "old SSO username")
    .option("--new-sso-username <name>", "new SSO username")
    .option("--old-org-code <code>", "old organization code")
    .option("--new-org-code <code>", "new organization code")
    .option("--old-title <title>", "old title")
    .option("--new-title <title>", "new title")
    .option("--old-phone-number <num>", "old phone number")
    .option("--new-phone-number <num>", "new phone number")
    .option("--old-phone-type <type>", "old phone type")
    .option("--new-phone-type <type>", "new phone type")
    .option("--old-email-address <email>", "old email address")
    .option("--new-email-address <email>", "new email address")
    .option("--old-department-name <name>", "old department name")
    .option("--new-department-name <name>", "new department name")
    .option("--old-department-parent <parent>", "old department parent")
    .option("--new-department-parent <parent>", "new department parent")
    .option("--old-status-code <code>", "old status code")
    .option("--new-status-code <code>", "new status code")
    .option("--old-status-text <text>", "old status text")
    .option("--new-status-text <text>", "new status text")
    .option("--transaction-id <id>", "transaction ID")
    .action(async (opts) => {
      const globalOpts = program.opts();
      try {
        enforceReadOnly(globalOpts);

        const params = {
          OldUniqueID: opts.oldId,
          NewUniqueID: opts.newId,
          SourceSystem: opts.source,
        };

        const optMap = {
          oldFacilityCode: "OldFacilityCode", newFacilityCode: "NewFacilityCode",
          oldLastName: "OldLastName", newLastName: "NewLastName",
          oldFirstName: "OldFirstName", newFirstName: "NewFirstName",
          oldEmployeeId: "OldEmployeeID", newEmployeeId: "NewEmployeeID",
          oldSsoUsername: "OldSSOUserName", newSsoUsername: "NewSSOUserName",
          oldOrgCode: "OldOrgCode", newOrgCode: "NewOrgCode",
          oldTitle: "OldTitle", newTitle: "NewTitle",
          oldPhoneNumber: "OldPhoneNumber", newPhoneNumber: "NewPhoneNumber",
          oldPhoneType: "OldPhoneType", newPhoneType: "NewPhoneType",
          oldEmailAddress: "OldEmailAddress", newEmailAddress: "NewEmailAddress",
          oldDepartmentName: "OldDepartmentName", newDepartmentName: "NewDepartmentName",
          oldDepartmentParent: "OldDepartmentParent", newDepartmentParent: "NewDepartmentParent",
          oldStatusCode: "OldStatusCode", newStatusCode: "NewStatusCode",
          oldStatusText: "OldStatusText", newStatusText: "NewStatusText",
          transactionId: "TransactionId",
        };

        for (const [cliKey, amcomKey] of Object.entries(optMap)) {
          if (opts[cliKey] !== undefined) params[amcomKey] = opts[cliKey];
        }

        const result = await callAmcom(globalOpts, "DataFeedUpdatePerson", params);
        const output = globalOpts.clean ? cleanObject(result) : result;
        await printResult(output, globalOpts.format);
      } catch (err) { printError(err); }
    });
};
