// gateway_worker_all_ops_merged.js
// Gateway worker: merged ops (user + uploaded file) + raw upload passthrough; no base64/presign logic.
// Enhancements: inbound Authorization, unique operation mapping, strict raw method, upstream/missing param validation.

const OPS_SOURCE_INTERNAL = [
  {"operation":"createLead","method":"POST","path":"/api/v1/leads"},
  {"operation":"createLeadImportHomeadvisorLead","method":"POST","path":"/api/v1/leads/import-homeadvisor-lead"},
  {"operation":"deleteLead","method":"DELETE","path":"/api/v1/leads/{leadId}"},
  {"operation":"updateLead","method":"PUT","path":"/api/v1/leads/{leadId}"},
  {"operation":"getAcculynxCountries","method":"GET","path":"/api/v2/acculynx/countries"},
  {"operation":"getAcculynxCountriesByCountryId","method":"GET","path":"/api/v2/acculynx/countries/{countryId}"},
  {"operation":"getAcculynxCountriesStatesByCountryId","method":"GET","path":"/api/v2/acculynx/countries/{countryId}/states"},
  {"operation":"getAcculynxCountriesStatesByCountryIdByStateId","method":"GET","path":"/api/v2/acculynx/countries/{countryId}/states/{stateId}"},
  {"operation":"getCalendars","method":"GET","path":"/api/v2/calendars"},
  {"operation":"getCalendarsAppointmentsByCalendarId","method":"GET","path":"/api/v2/calendars/{calendarId}/appointments"},
  {"operation":"getCalendarAppointmentsByCalendarIdByAppointmentId","method":"GET","path":"/api/v2/calendars/{calendarId}/appointments/{appointmentId}"},
  {"operation":"getCompanySettings","method":"GET","path":"/api/v2/company-settings"},
  {"operation":"getCompanySettingsJobFileSettingsDocumentFolders","method":"GET","path":"/api/v2/company-settings/job-file-settings/document-folders"},
  {"operation":"getCompanySettingsJobFileSettingsInsuranceCompanies","method":"GET","path":"/api/v2/company-settings/job-file-settings/insurance-companies"},
  {"operation":"getCompanySettingsJobFileSettingsJobCategories","method":"GET","path":"/api/v2/company-settings/job-file-settings/job-categories"},
  {"operation":"getCompanySettingsJobFileSettingsPhotoVideoTags","method":"GET","path":"/api/v2/company-settings/job-file-settings/photo-video-tags"},
  {"operation":"getCompanySettingsJobFileSettingsTradeTypes","method":"GET","path":"/api/v2/company-settings/job-file-settings/trade-types"},
  {"operation":"getCompanySettingsJobFileSettingsWorkTypes","method":"GET","path":"/api/v2/company-settings/job-file-settings/work-types"},
  {"operation":"getCompanySettingsJobFileSettingsWorkflowMilestones","method":"GET","path":"/api/v2/company-settings/job-file-settings/workflow-milestones"},
  {"operation":"getCompanySettingsJobFileSettingsWorkflowMilestonesStatusesByMilestone","method":"GET","path":"/api/v2/company-settings/job-file-settings/workflow-milestones/{milestone}/statuses"},
  {"operation":"getCompanySettingsLeadsLeadSources","method":"GET","path":"/api/v2/company-settings/leads/lead-sources"},
  {"operation":"getCompanySettingLeadsLeadSourcesByLeadSourceId","method":"GET","path":"/api/v2/company-settings/leads/lead-sources/{leadSourceId}"},
  {"operation":"getCompanySettingLeadsLeadSourcesChildrenByLeadSourceParentIdByLeadSourceId","method":"GET","path":"/api/v2/company-settings/leads/lead-sources/{leadSourceParentId}/children/{leadSourceId}"},
  {"operation":"getCompanySettingsLocationSettingsAccountTypes","method":"GET","path":"/api/v2/company-settings/location-settings/account-types"},
  {"operation":"getCompanySettingLocationSettingsAccountTypesByAccountTypeId","method":"GET","path":"/api/v2/company-settings/location-settings/account-types/{accountTypeId}"},
  {"operation":"getCompanySettingsLocationSettingsCountries","method":"GET","path":"/api/v2/company-settings/location-settings/countries"},
  {"operation":"getCompanySettingsLocationSettingsCountriesStatesByCountryId","method":"GET","path":"/api/v2/company-settings/location-settings/countries/{countryId}/states"},
  {"operation":"getCompanySettings","method":"GET","path":"/api/v2/company/settings"},
  {"operation":"getCompanySettingsJobFileSettingsDocumentFolders","method":"GET","path":"/api/v2/company/settings/jobFileSettings/documentFolders"},
  {"operation":"getCompanySettingsJobFileSettingsInsuranceCompanies","method":"GET","path":"/api/v2/company/settings/jobFileSettings/insuranceCompanies"},
  {"operation":"getCompanySettingsJobFileSettingsJobCategories","method":"GET","path":"/api/v2/company/settings/jobFileSettings/jobCategories"},
  {"operation":"getCompanySettingsJobFileSettingsPhotoVideoTags","method":"GET","path":"/api/v2/company/settings/jobFileSettings/photoVideoTags"},
  {"operation":"getCompanySettingsJobFileSettingsTradeTypes","method":"GET","path":"/api/v2/company/settings/jobFileSettings/tradeTypes"},
  {"operation":"getCompanySettingsJobFileSettingsWorkTypes","method":"GET","path":"/api/v2/company/settings/jobFileSettings/workTypes"},
  {"operation":"getCompanySettingsJobFileSettingsWorkflowMilestones","method":"GET","path":"/api/v2/company/settings/jobFileSettings/workflowMilestones"},
  {"operation":"getCompanySettingsJobFileSettingsWorkflowMilestonesStatusesByMilestone","method":"GET","path":"/api/v2/company/settings/jobFileSettings/workflowMilestones/{milestone}/statuses"},
  {"operation":"getCompanySettingsLeadsLeadSources","method":"GET","path":"/api/v2/company/settings/leads/leadSources"},
  {"operation":"getCompanySettingLeadsLeadSourcesByLeadSourceId","method":"GET","path":"/api/v2/company/settings/leads/leadSources/{leadSourceId}"},
  {"operation":"getCompanySettingLeadsLeadSourcesChildrenByLeadSourceParentIdByLeadSourceId","method":"GET","path":"/api/v2/company/settings/leads/leadSources/{leadSourceParentId}/children/{leadSourceId}"},
  {"operation":"getCompanySettingsLocationSettingsAccountTypes","method":"GET","path":"/api/v2/company/settings/locationSettings/accountTypes"},
  {"operation":"getCompanySettingLocationSettingsAccountTypesByAccountTypeId","method":"GET","path":"/api/v2/company/settings/locationSettings/accountTypes/{accountTypeId}"},
  {"operation":"getCompanySettingsLocationSettingsCountries","method":"GET","path":"/api/v2/company/settings/locationSettings/countries"},
  {"operation":"getCompanySettingsLocationSettingsCountriesStatesByCountryId","method":"GET","path":"/api/v2/company/settings/locationSettings/countries/{countryId}/states"},
  {"operation":"getCompanySettingsLocationSettingsCountriesStatesByCountryIdByStateId","method":"GET","path":"/api/v2/company/settings/locationSettings/countries/{countryId}/states/{stateId}"},
  {"operation":"getContacts","method":"GET","path":"/api/v2/contacts"},
  {"operation":"createContact","method":"POST","path":"/api/v2/contacts"},
  {"operation":"createContactSearch","method":"POST","path":"/api/v2/contacts/search"},
  {"operation":"deleteContact","method":"DELETE","path":"/api/v2/contacts/{contactId}"},
  {"operation":"getContactByContactId","method":"GET","path":"/api/v2/contacts/{contactId}"},
  {"operation":"updateContact","method":"PUT","path":"/api/v2/contacts/{contactId}"},
  {"operation":"getContactsEmailAddressesByContactId","method":"GET","path":"/api/v2/contacts/{contactId}/emailAddresses"},
  {"operation":"getContactsPhoneNumbersByContactId","method":"GET","path":"/api/v2/contacts/{contactId}/phoneNumbers"},
  {"operation":"getAcculynxCountries","method":"GET","path":"/api/v2/countries"},
  {"operation":"getAcculynxCountriesByCountryId","method":"GET","path":"/api/v2/countries/{countryId}"},
  {"operation":"getAcculynxCountriesStatesByCountryId","method":"GET","path":"/api/v2/countries/{countryId}/states"},
  {"operation":"getAcculynxCountriesStatesByCountryIdByStateId","method":"GET","path":"/api/v2/countries/{countryId}/states/{stateId}"},
  {"operation":"getDiagnosticsPing","method":"GET","path":"/api/v2/diagnostics/ping"},
  {"operation":"getEstimates","method":"GET","path":"/api/v2/estimates"},
  {"operation":"createEstimate","method":"POST","path":"/api/v2/estimates"},
  {"operation":"deleteEstimate","method":"DELETE","path":"/api/v2/estimates/{estimateId}"},
  {"operation":"getEstimateByEstimateId","method":"GET","path":"/api/v2/estimates/{estimateId}"},
  {"operation":"updateEstimate","method":"PUT","path":"/api/v2/estimates/{estimateId}"},
  {"operation":"getEstimatesSectionsByEstimateId","method":"GET","path":"/api/v2/estimates/{estimateId}/sections"},
  {"operation":"getEstimateSectionsByEstimateIdByEstimateSectionId","method":"GET","path":"/api/v2/estimates/{estimateId}/sections/{sectionId}"},
  {"operation":"getEstimatesSectionsItemsByEstimateIdByEstimateSectionId","method":"GET","path":"/api/v2/estimates/{estimateId}/sections/{sectionId}/items"},
  {"operation":"getEstimateSectionsItemsByEstimateIdByEstimateSectionIdByEstimateItemId","method":"GET","path":"/api/v2/estimates/{estimateId}/sections/{sectionId}/items/{itemId}"},
  {"operation":"getFinancialByFinancialsId","method":"GET","path":"/api/v2/financials/{financialsId}"},
  {"operation":"getFinancialsAmendmentsByFinancialsId","method":"GET","path":"/api/v2/financials/{financialsId}/amendments"},
  {"operation":"getFinancialAmendmentsByFinancialsIdByFinancialsAmendmentId","method":"GET","path":"/api/v2/financials/{financialsId}/amendments/{amendmentId}"},
  {"operation":"getFinancialsWorksheetByFinancialsId","method":"GET","path":"/api/v2/financials/{financialsId}/worksheet"},
  {"operation":"getInvoices","method":"GET","path":"/api/v2/invoices"},
  {"operation":"createInvoice","method":"POST","path":"/api/v2/invoices"},
  {"operation":"deleteInvoice","method":"DELETE","path":"/api/v2/invoices/{invoiceId}"},
  {"operation":"getInvoiceByInvoiceId","method":"GET","path":"/api/v2/invoices/{invoiceId}"},
  {"operation":"updateInvoice","method":"PUT","path":"/api/v2/invoices/{invoiceId}"},
  {"operation":"getJobs","method":"GET","path":"/api/v2/jobs"},
  {"operation":"createJob","method":"POST","path":"/api/v2/jobs"},
  {"operation":"createJobExternalReferences","method":"POST","path":"/api/v2/jobs/external-references"},
  {"operation":"createJobSearch","method":"POST","path":"/api/v2/jobs/search"},
  {"operation":"deleteJob","method":"DELETE","path":"/api/v2/jobs/{jobId}"},
  {"operation":"getJobByJobId","method":"GET","path":"/api/v2/jobs/{jobId}"},
  {"operation":"updateJob","method":"PUT","path":"/api/v2/jobs/{jobId}"},
  {"operation":"getJobsAccountingIntegrationStatusByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/accountingIntegrationStatus"},
  {"operation":"getJobsAdjusterByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/adjuster"},
  {"operation":"getJobsContactsByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/contacts"},
  {"operation":"getJobsContractWorksheetByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/contractWorksheet"},
  {"operation":"createJobDocumentsByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/documents"},
  {"operation":"getJobsEstimatesByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/estimates"},
  {"operation":"getJobsExternalReferences","method":"GET","path":"/api/v2/jobs/{jobId}/externalReferences"},
  {"operation":"createJobExternalReferences","method":"POST","path":"/api/v2/jobs/{jobId}/externalReferences"},
  {"operation":"getFinancialsByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/financials"},
  {"operation":"getJobsFinancialsByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/financials"},
  {"operation":"getJobsHistoryByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/history"},
  {"operation":"updateJobInitialAppointmentByJobId","method":"PUT","path":"/api/v2/jobs/{jobId}/initial-appointment"},
  {"operation":"getJobsInitialAppointmentByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/initialAppointment"},
  {"operation":"updateJobInitialAppointmentByJobId","method":"PUT","path":"/api/v2/jobs/{jobId}/initialAppointment"},
  {"operation":"getJobsInsuranceByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/insurance"},
  {"operation":"updateJobInsuranceInsuranceCompanyByJobId","method":"PUT","path":"/api/v2/jobs/{jobId}/insurance/insurance-company"},
  {"operation":"updateJobInsuranceInsuranceCompanyByJobId","method":"PUT","path":"/api/v2/jobs/{jobId}/insurance/{insuranceCompanyId}"},
  {"operation":"getJobsInvoicesByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/invoices"},
  {"operation":"createJobMeasurementsFilesByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/measurements/files"},
  {"operation":"createJobMessagesByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/messages"},
  {"operation":"createJobMessagesRepliesByJobIdByMessageId","method":"POST","path":"/api/v2/jobs/{jobId}/messages/{messageId}/replies"},
  {"operation":"getJobsMilestonesCurrentByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/milestones/current"},
  {"operation":"getJobsMilestonesHistoryByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/milestones/history"},
  {"operation":"getJobMilestonesByJobIdByMilestoneId","method":"GET","path":"/api/v2/jobs/{jobId}/milestones/{milestoneId}"},
  {"operation":"getJobMilestonesStatusByJobIdByMilestoneIdByStatusId","method":"GET","path":"/api/v2/jobs/{jobId}/milestones/{milestoneId}/statuses/{statusId}"},
  {"operation":"getJobsPaymentsByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/payments"},
  {"operation":"createJobPaymentsExpenseByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/payments/expense"},
  {"operation":"getJobsPaymentsOverviewByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/payments/overview"},
  {"operation":"createJobPaymentsPaidByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/payments/paid"},
  {"operation":"createJobPaymentsReceivedByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/payments/received"},
  {"operation":"createJobPhotosVideosByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/photos-videos"},
  {"operation":"createJobPhotosVideosByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/photosVideos"},
  {"operation":"getJobsRepresentativesByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/representatives"},
  {"operation":"deleteJobRepresentativesArOwnerByJobId","method":"DELETE","path":"/api/v2/jobs/{jobId}/representatives/ar-owner"},
  {"operation":"createJobRepresentativesArOwnerByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/representatives/ar-owner"},
  {"operation":"deleteJobRepresentativesArOwnerByJobId","method":"DELETE","path":"/api/v2/jobs/{jobId}/representatives/arOwner"},
  {"operation":"createJobRepresentativesArOwnerByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/representatives/arOwner"},
  {"operation":"getJobsRepresentativesCompanyByJobId","method":"GET","path":"/api/v2/jobs/{jobId}/representatives/company"},
  {"operation":"createJobRepresentativesCompanyByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/representatives/company"},
  {"operation":"deleteJobRepresentativesSalesOwnerByJobId","method":"DELETE","path":"/api/v2/jobs/{jobId}/representatives/sales-owner"},
  {"operation":"createJobRepresentativesSalesOwnerByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/representatives/sales-owner"},
  {"operation":"deleteJobRepresentativesSalesOwnerByJobId","method":"DELETE","path":"/api/v2/jobs/{jobId}/representatives/salesOwner"},
  {"operation":"createJobRepresentativesSalesOwnerByJobId","method":"POST","path":"/api/v2/jobs/{jobId}/representatives/salesOwner"},
  {"operation":"getLeads","method":"GET","path":"/api/v2/leads"},
  {"operation":"createLead","method":"POST","path":"/api/v2/leads"},
  {"operation":"createLeadImportHomeadvisorLead","method":"POST","path":"/api/v2/leads/import/homeadvisor"},
  {"operation":"deleteLead","method":"DELETE","path":"/api/v2/leads/{leadId}"},
  {"operation":"getLeadByLeadId","method":"GET","path":"/api/v2/leads/{leadId}"},
  {"operation":"updateLead","method":"PUT","path":"/api/v2/leads/{leadId}"},
  {"operation":"getLeadsHistoryByLeadId","method":"GET","path":"/api/v2/leads/{leadId}/history"},
  {"operation":"getR2DownloadUrl","method":"POST","path":"/api/v2/r2/downloadUrl"},
  {"operation":"getR2UploadUrl","method":"POST","path":"/api/v2/r2/uploadUrl"},
  {"operation":"getAdvancedReports","method":"GET","path":"/api/v2/reports/advanced"},
  {"operation":"getReportsScheduledReportsRunsByScheduledReportId","method":"GET","path":"/api/v2/reports/scheduledReports/{scheduledReportId}/runs"},
  {"operation":"getReportsScheduledReportsRunsLatestByScheduledReportId","method":"GET","path":"/api/v2/reports/scheduledReports/{scheduledReportId}/runs/latest"},
  {"operation":"getReportScheduledReportsRunsByScheduledReportIdByInstanceRunId","method":"GET","path":"/api/v2/reports/scheduledReports/{scheduledReportId}/runs/{instanceRunId}"},
  {"operation":"getReportsScheduledReportsRunsRecipientsByScheduledReportIdByInstanceRunId","method":"GET","path":"/api/v2/reports/scheduledReports/{scheduledReportId}/runs/{instanceRunId}/recipients"},
  {"operation":"getReportScheduledReportsRunsRecipientsByScheduledReportIdByInstanceRunIdByRecipientId","method":"GET","path":"/api/v2/reports/scheduledReports/{scheduledReportId}/runs/{instanceRunId}/recipients/{recipientId}"},
  {"operation":"getSupplements","method":"GET","path":"/api/v2/supplements"},
  {"operation":"createSupplement","method":"POST","path":"/api/v2/supplements"},
  {"operation":"deleteSupplement","method":"DELETE","path":"/api/v2/supplements/{supplementId}"},
  {"operation":"getSupplementBySupplementId","method":"GET","path":"/api/v2/supplements/{supplementId}"},
  {"operation":"updateSupplement","method":"PUT","path":"/api/v2/supplements/{supplementId}"},
  {"operation":"createTransaction","method":"POST","path":"/api/v2/transactions"},
  {"operation":"updateTransaction","method":"PUT","path":"/api/v2/transactions/{transactionId}"},
  {"operation":"uploadDocumentRaw","method":"POST","path":"/api/v2/uploads/raw"},
  {"operation":"getUsers","method":"GET","path":"/api/v2/users"},
  {"operation":"createUser","method":"POST","path":"/api/v2/users"},
  {"operation":"deleteUser","method":"DELETE","path":"/api/v2/users/{userId}"},
  {"operation":"getUserByUserId","method":"GET","path":"/api/v2/users/{userId}"},
  {"operation":"updateUser","method":"PUT","path":"/api/v2/users/{userId}"},
  {"operation":"changeUserRole","method":"POST","path":"/api/v2/users/{userId}/change-role"},
  {"operation":"deactivateUser","method":"POST","path":"/api/v2/users/{userId}/deactivate"},
  {"operation":"listWebhookSubscriptions","method":"GET","path":"/api/v2/webhooks/subscriptions"},
  {"operation":"createWebhookSubscription","method":"POST","path":"/api/v2/webhooks/subscriptions"},
  {"operation":"deleteWebhookSubscription","method":"DELETE","path":"/api/v2/webhooks/subscriptions/{subscriptionId}"}
];

// Attempt to import generated operations (optional); fall back to internal list if absent/empty
let OPS_SOURCE = OPS_SOURCE_INTERNAL;
try {
  // eslint-disable-next-line import/no-unresolved
  importScripts;
} catch (_) {}
try {
  // Dynamic import guarded in case file missing in CF runtime; Node tests can consume it
  // eslint-disable-next-line
  // @ts-ignore
  const maybe = await import('./operations.generated.js');
  if (Array.isArray(maybe?.OPS_SOURCE) && maybe.OPS_SOURCE.length > 0) {
    OPS_SOURCE = maybe.OPS_SOURCE;
  }
} catch (_) {
  // no-op: use internal source
}

// Derive unique operations and lookup maps
const {
  OPS, // normalized list with unique operation names
  OPS_BY_OPERATION,
  PATH_MAP,
  META
} = deriveOps(OPS_SOURCE);

// Precompute meta payload and set up OpenAPI cache (per origin)
const SORTED_OPERATIONS = OPS.map(o => o.operation).sort();
const META_JSON = JSON.stringify({ ok: true, counts: { total: META.total, unique: META.unique }, operations: SORTED_OPERATIONS });
const OPENAPI_CACHE = new Map(); // origin -> JSON string
const BUILD_TIME = new Date().toISOString();

export default {
  async fetch(request, env, ctx) {
    const t0 = Date.now();
    let route = 'unknown';
    let opName = undefined;
    let mode = undefined;
    try {
      const url = new URL(request.url);

      // CORS preflight
      if (request.method === 'OPTIONS') {
        return corsPreflight();
      }

      // Health and Version
      if (request.method === 'GET' && url.pathname === '/health') {
        route = '/health';
        const resp = json({ ok: true });
        try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'health'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
        return resp;
      }
      if (request.method === 'GET' && url.pathname === '/version') {
        route = '/version';
        const features = {
          d1: !!env.DB,
          r2: !!env.DOCS,
          kv: !!env.POLICY_KV,
          queues: !!(env.JOBS_OUT),
          ai: !!env.AI
        };
        const resp = json({ ok: true, buildTime: BUILD_TIME, features });
        try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'version'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
        return resp;
      }

      // Serve minimal OpenAPI for ChatGPT Actions (memoized per origin + edge cached)
      if (request.method === 'GET' && (url.pathname === '/openapi.json' || url.pathname === '/.well-known/openapi.json')) {
        route = '/openapi.json';
        const cache = caches.default;
        const cacheKey = new Request(new URL('/openapi.json', url).toString(), request);
        const cached = await cache.match(cacheKey);
        if (cached) {
          const resp = withCors(cached);
          try { env?.METRICS?.writeDataPoint({ blobs: [route, opName || '', 'doc'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }
        let json = OPENAPI_CACHE.get(url.origin);
        if (!json) {
          const spec = buildOpenApi(url.origin);
          json = JSON.stringify(spec);
          OPENAPI_CACHE.set(url.origin, json);
        }
        let resp = new Response(json, { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } });
        resp = withCors(resp);
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(cache.put(cacheKey, resp.clone()));
        } else {
          // Fallback if ctx is unavailable
          cache.put(cacheKey, resp.clone());
        }
        try { env?.METRICS?.writeDataPoint({ blobs: [route, opName || '', 'doc'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
        return resp;
      }

      // Inbound gateway auth (only enforced if GATEWAY_TOKEN is configured)
      if (requiresGatewayAuth(url)) {
        const auth = request.headers.get('authorization') || '';
        if (env?.GATEWAY_TOKEN) {
          const bearer = (auth.startsWith('Bearer ') ? auth.slice(7) : auth) || '';
          if (!bearer || bearer !== env.GATEWAY_TOKEN) {
            return json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } }, 401);
          }
        }
      }

      // Meta
      if (request.method === 'GET' && url.pathname === '/gateway/meta') {
        route = '/gateway/meta';
        const resp = withCors(new Response(META_JSON, { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' } }));
        try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'meta'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
        return resp;
      }

      // Describe a single operation by name
      if (request.method === 'GET' && url.pathname.startsWith('/gateway/ops/')) {
        route = '/gateway/ops';
        const name = decodeURIComponent(url.pathname.split('/').pop() || '');
        const entry = OPS_BY_OPERATION.get(name);
        if (!entry) {
          const resp = json({ ok: false, error: { code: 'UNKNOWN_OPERATION', operation: name } }, 404);
          try { env?.METRICS?.writeDataPoint({ blobs: [route, name, 'miss'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }
        const requiredPath = Array.from(entry.path.matchAll(/\{(.*?)\}/g)).map(m => m[1]);
        const resp = json({ ok: true, operation: entry.operation, method: entry.method, path: entry.path, requiredPath });
        try { env?.METRICS?.writeDataPoint({ blobs: [route, name, 'hit'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
        return resp;
      }

      // Config fetch (KV allowlist)
      if (request.method === 'GET' && url.pathname.startsWith('/config/')) {
        route = '/config';
        const key = decodeURIComponent(url.pathname.slice('/config/'.length));
        if (!env.POLICY_KV) {
          const resp = json({ ok: false, error: { code: 'NOT_ENABLED', details: 'KV not bound' } }, 501);
          try { env?.METRICS?.writeDataPoint({ blobs: [route, key, 'no-kv'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }
        const allow = new Set(['policy:scope_flags:v1','templates:messages:v1','policy:labels:v1','materials:cheatsheet:v1','tags:roles:v1']);
        if (!allow.has(key)) {
          const resp = json({ ok: false, error: { code: 'FORBIDDEN', details: 'Key not allowed' } }, 403);
          try { env?.METRICS?.writeDataPoint({ blobs: [route, key, 'forbid'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }
        const val = await env.POLICY_KV.get(key, 'json');
        const resp = json({ ok: true, key, value: val });
        try { env?.METRICS?.writeDataPoint({ blobs: [route, key, 'hit'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
        return resp;
      }

      // Raw upload passthrough (stream body as-is)
      // Usage: POST /gateway/raw?operation=uploadDocumentRaw OR /gateway/raw?path=/api/v2/uploads/raw&method=POST
      if (url.pathname === '/gateway/raw') {
        route = '/gateway/raw';
        if (request.method !== 'POST') {
          const resp = json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for /gateway/raw' } }, 405);
          try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'error'], doubles: [Date.now() - t0, 405], indexes: ['self'] }); } catch {}
          return resp;
        }
        const qop = url.searchParams.get('operation');
        const qpath = url.searchParams.get('path');
        const qmethod = (url.searchParams.get('method') || 'POST').toUpperCase();
        const actorUserId = url.searchParams.get('actorUserId') || undefined;
        const sourceUrl = url.searchParams.get('sourceUrl') || undefined;
        const sourceTimeoutMsParam = url.searchParams.get('sourceTimeoutMs');

        let entry = null;
        if (qop) entry = OPS_BY_OPERATION.get(qop) || null;
        if (!entry && qpath) entry = PATH_MAP.get(methodPathKey(qmethod, qpath)) || null;

        if (!entry) {
          const resp = json({ ok: false, error: { code: 'UNKNOWN_OPERATION_OR_PATH' } }, 400);
          try { env?.METRICS?.writeDataPoint({ blobs: [route, qop || '', 'error'], doubles: [Date.now() - t0, 400], indexes: ['self'] }); } catch {}
          return resp;
        }

        if (entry.method !== 'POST') {
          const resp = json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: `Operation expects ${entry.method}` } }, 405);
          try { env?.METRICS?.writeDataPoint({ blobs: [route, entry.operation, 'error'], doubles: [Date.now() - t0, 405], indexes: ['self'] }); } catch {}
          return resp;
        }

        const upstreamUrl = 'https://api.acculynx.com' + entry.path;
        const headers = new Headers(request.headers);
        const upstreamToken = selectUpstreamToken(env, actorUserId);
        if (!upstreamToken) {
          const resp = json({ ok: false, error: { code: 'UPSTREAM_TOKEN_MISSING', message: 'No upstream ACCULYNX_TOKEN configured' } }, 500);
          try { env?.METRICS?.writeDataPoint({ blobs: [route, entry.operation, 'error'], doubles: [Date.now() - t0, 500], indexes: ['self'] }); } catch {}
          return resp;
        }
        headers.set('authorization', `Bearer ${upstreamToken}`);

        // Do not forward hop-by-hop headers
        ['host', 'content-length'].forEach(h => headers.delete(h));

        let bodyStream = request.body;
        if (sourceUrl) {
          // Basic validation: only http/https
          try {
            const u = new URL(sourceUrl);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') {
              return json({ ok: false, error: { code: 'INVALID_SOURCE_URL', message: 'Only http(s) URLs are allowed' } }, 400);
            }
          } catch {
            return json({ ok: false, error: { code: 'INVALID_SOURCE_URL', message: 'Malformed sourceUrl' } }, 400);
          }
          const timeoutMs = parseTimeout(sourceTimeoutMsParam, env?.RAW_SOURCE_FETCH_TIMEOUT_MS, 20000);
          const remote = await fetchWithTimeout(sourceUrl, {}, timeoutMs).catch(err => ({ ok: false, status: 502, _err: err }));
          if (!remote || !remote.ok) {
            return json({ ok: false, error: { code: 'SOURCE_URL_FETCH_FAILED', status: remote?.status ?? 0 } }, 400);
          }
          bodyStream = remote.body;
          const rct = remote.headers.get('content-type');
          if (rct && !headers.has('content-type')) headers.set('content-type', rct);
        } else {
          // Optional base64 JSON body mode
          const ctype = request.headers.get('content-type') || '';
          if (ctype.includes('application/json')) {
            const j = await request.clone().json().catch(() => null);
            if (j && typeof j === 'object' && typeof j.base64 === 'string' && j.base64) {
              try {
                const bytes = b64ToUint8(j.base64);
                const maxBytes = parseInt(env?.RAW_BASE64_MAX_BYTES || '26214400', 10) || 26214400; // default 25MB
                if (bytes.length > maxBytes) {
                  return json({ ok: false, error: { code: 'PAYLOAD_TOO_LARGE', message: `Base64 payload exceeds limit (${bytes.length} > ${maxBytes} bytes)` } }, 413);
                }
                bodyStream = bytes;
                if (j.contentType && typeof j.contentType === 'string') {
                  headers.set('content-type', j.contentType);
                } else if (!headers.has('content-type')) {
                  headers.set('content-type', 'application/octet-stream');
                }
              } catch (e) {
                return json({ ok: false, error: { code: 'INVALID_BASE64', message: 'Failed to decode base64 body' } }, 400);
              }
            }
          }
        }

        const res = await fetch(upstreamUrl, { method: entry.method, headers, body: bodyStream });
        mode = sourceUrl ? 'sourceUrl' : (request.headers.get('content-type')?.includes('application/json') ? 'base64' : 'raw');
        const resp = withCors(new Response(res.body, { status: res.status, headers: res.headers }));
        try { env?.METRICS?.writeDataPoint({ blobs: [route, entry.operation, mode], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
        return resp;
      }

      // JSON dispatch
      if (!(request.method === 'POST' && url.pathname === '/gateway')) {
        // Templates: render message
        if (request.method === 'POST' && url.pathname === '/templates/render') {
          route = '/templates/render';
          const body = await request.json().catch(() => null) || {};
          const key = String(body.key || '');
          const vars = (body.vars && typeof body.vars === 'object') ? body.vars : {};
          if (!env.POLICY_KV) {
            const resp = json({ ok: false, error: { code: 'NOT_ENABLED', details: 'KV not bound' } }, 501);
            try { env?.METRICS?.writeDataPoint({ blobs: [route, key, 'no-kv'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
          const templates = await env.POLICY_KV.get('templates:messages:v1', 'json');
          const tpl = templates?.[key];
          if (!tpl) {
            const resp = json({ ok: false, error: { code: 'NOT_FOUND', details: 'template key not found' } }, 404);
            try { env?.METRICS?.writeDataPoint({ blobs: [route, key, 'miss'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
          const rendered = renderTemplate(String(tpl), vars);
          const resp = json({ ok: true, key, rendered });
          try { env?.METRICS?.writeDataPoint({ blobs: [route, key, 'hit'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }

        // Readiness analyzer (generic): analyze observed snapshot against KV policies
        if (request.method === 'POST' && url.pathname === '/readiness/analyze') {
          route = '/readiness/analyze';
          const body = await request.json().catch(() => null) || {};
          const jobId = String(body.jobId || '');
          const observed = body.observed || {};
          if (!env.POLICY_KV) {
            const resp = json({ ok: true, jobId, info: 'KV not bound; no policy checks applied', result: { missing: [], warnings: [], mislabeled: [] } });
            try { env?.METRICS?.writeDataPoint({ blobs: [route, jobId, 'no-kv'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
          const musts = await env.POLICY_KV.get('policy:must_haves:v1', 'json') || [];
          const photosReq = await env.POLICY_KV.get('policy:photos:required:v1', 'json') || {};
          const labels = await env.POLICY_KV.get('policy:labels:v1', 'json') || {};
          const { result } = analyzeReadiness(observed, { musts, photosReq, labels });
          const resp = json({ ok: true, jobId, result });
          try { env?.METRICS?.writeDataPoint({ blobs: [route, jobId, 'ok'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }

        // R2 object proxy (simple presign replacement)
        if (url.pathname.startsWith('/r2/object/')) {
          route = '/r2/object';
          if (!env.DOCS) {
            const resp = json({ ok: false, error: { code: 'NOT_ENABLED', details: 'R2 not bound' } }, 501);
            try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'no-r2'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
          const key = decodeURIComponent(url.pathname.slice('/r2/object/'.length));
          if (request.method === 'GET') {
            const obj = await env.DOCS.get(key);
            if (!obj) {
              const resp = json({ ok: false, error: { code: 'NOT_FOUND' } }, 404);
              try { env?.METRICS?.writeDataPoint({ blobs: [route, key, 'miss'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
              return resp;
            }
            const resp = withCors(new Response(obj.body, { status: 200, headers: { 'content-type': obj.httpMetadata?.contentType || 'application/octet-stream' } }));
            try { env?.METRICS?.writeDataPoint({ blobs: [route, key, 'get'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          } else if (request.method === 'PUT') {
            const ct = request.headers.get('content-type') || 'application/octet-stream';
            await env.DOCS.put(key, request.body, { httpMetadata: { contentType: ct } });
            const resp = json({ ok: true, key });
            try { env?.METRICS?.writeDataPoint({ blobs: [route, key, 'put'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
          const resp = json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED' } }, 405);
          try { env?.METRICS?.writeDataPoint({ blobs: [route, key, 'error'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }

        // R2 presign helper (returns worker URLs for GET/PUT)
        if (request.method === 'POST' && url.pathname === '/r2/presign') {
          route = '/r2/presign';
          const body = await request.json().catch(() => null) || {};
          const { key, mode = 'put', contentType = 'application/octet-stream' } = body;
          if (!key) {
            const resp = json({ ok: false, error: { code: 'BAD_REQUEST', details: 'key is required' } }, 400);
            try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'error'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
          const base = new URL(request.url);
          const getUrl = `${base.origin}/r2/object/${encodeURIComponent(key)}`;
          const putUrl = getUrl;
          const resp = json({ ok: true, urls: { get: getUrl, put: putUrl }, mode, contentType });
          try { env?.METRICS?.writeDataPoint({ blobs: [route, key, mode], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }

        // Tools: url-info
        if (request.method === 'GET' && url.pathname === '/tools/url-info') {
          route = '/tools/url-info';
          const target = url.searchParams.get('url');
          if (!target) {
            const resp = json({ ok: false, error: { code: 'BAD_REQUEST', details: 'url parameter is required' } }, 400);
            try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'error'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
          try {
            const u = new URL(target);
            const head = await fetchWithTimeout(u.toString(), { method: 'HEAD' }, 5000);
            const contentType = head.headers.get('content-type') || null;
            const contentLength = head.headers.get('content-length') ? Number(head.headers.get('content-length')) : null;
            const cd = head.headers.get('content-disposition') || '';
            const filename = (cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)?.[1]) || u.pathname.split('/').pop() || null;
            const resp = json({ ok: true, url: u.toString(), contentType, contentLength, filename });
            try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'hit'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          } catch {
            const resp = json({ ok: false, error: { code: 'BAD_URL' } }, 400);
            try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'error'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
        }

        // Tools: redact
        if (request.method === 'POST' && url.pathname === '/tools/redact') {
          route = '/tools/redact';
          const body = await request.json().catch(() => null) || {};
          const text = String(body.text || '');
          const patterns = Array.isArray(body.patterns) ? body.patterns : [];
          let out = text;
          for (const p of patterns) {
            try {
              const rx = new RegExp(p, 'g');
              out = out.replace(rx, '█');
            } catch {}
          }
          const resp = json({ ok: true, text: out });
          try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'ok'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }

        // Tools: label validation/correction
        if (request.method === 'POST' && url.pathname === '/tools/label') {
          route = '/tools/label';
          const body = await request.json().catch(() => null) || {};
          const filename = String(body.filename || 'file');
          const type = String(body.type || 'generic');
          // Basic normalize: lower, spaces->_, keep extension
          const dot = filename.lastIndexOf('.');
          const name = dot > 0 ? filename.slice(0, dot) : filename;
          const ext = dot > 0 ? filename.slice(dot) : '';
          const normalized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') + ext.toLowerCase();
          const resp = json({ ok: true, valid: normalized === filename, correctedName: normalized, type });
          try { env?.METRICS?.writeDataPoint({ blobs: [route, type, 'ok'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }

        // Finance endpoints (ChatGPT-friendly) — optional, safe no-ops if bindings missing
        if (request.method === 'POST' && url.pathname === '/finance/ingest') {
          route = '/finance/ingest';
          const payload = await request.json().catch(() => null) || {};
          const { jobId, sourceUrl, insurer = null, estimateDate = null, approved = true } = payload;
          if (!jobId || !sourceUrl) {
            const resp = json({ ok: false, error: { code: 'BAD_REQUEST', details: 'jobId and sourceUrl are required' } }, 400);
            try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'error'], doubles: [Date.now() - t0, 400], indexes: ['self'] }); } catch {}
            return resp;
          }
          let queued = false;
          try {
            if (env.JOBS_OUT && typeof env.JOBS_OUT.send === 'function') {
              await env.JOBS_OUT.send({ jobId, sourceUrl, insurer, estimateDate, approved });
              queued = true;
            }
          } catch {}
          const resp = json({ ok: true, queued });
          try { env?.METRICS?.writeDataPoint({ blobs: [route, jobId, queued ? 'queued' : 'noqueue'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }

        if (request.method === 'GET' && url.pathname.startsWith('/finance/worksheet/')) {
          route = '/finance/worksheet';
          const jobId = url.pathname.split('/').pop();
          if (!jobId) {
            const resp = json({ ok: false, error: { code: 'BAD_REQUEST', details: 'Missing jobId in path' } }, 400);
            try { env?.METRICS?.writeDataPoint({ blobs: [route, '', 'error'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
          if (!env.DB) {
            const resp = json({ ok: false, error: { code: 'NOT_ENABLED', details: 'D1 database not bound' } }, 501);
            try { env?.METRICS?.writeDataPoint({ blobs: [route, jobId, 'no-db'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
          await ensureSchema(env);
          const ws = await d1All(env, 'SELECT id, admin_cost, final_total, created_at FROM worksheet WHERE job_id = ? ORDER BY created_at DESC LIMIT 1', [jobId]);
          if (!ws.length) {
            const resp = json({ ok: false, error: { code: 'NOT_FOUND' } }, 404);
            try { env?.METRICS?.writeDataPoint({ blobs: [route, jobId, 'miss'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
            return resp;
          }
          const w = ws[0];
          const lines = await d1All(env, 'SELECT code, description, total, rationale FROM worksheet_lines WHERE worksheet_id = ? ORDER BY rowid', [w.id]);
          const resp = json({ ok: true, worksheet: { id: w.id, jobId, adminCost: w.admin_cost, finalTotal: w.final_total, createdAt: w.created_at, lines } });
          try { env?.METRICS?.writeDataPoint({ blobs: [route, jobId, 'hit'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
          return resp;
        }

        const resp = json({ ok: false, error: { code: 'NOT_FOUND' } }, 404);
        try { env?.METRICS?.writeDataPoint({ blobs: [url.pathname, '', 'error'], doubles: [Date.now() - t0, 404], indexes: ['self'] }); } catch {}
        return resp;
      }

      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') {
        const resp = json({ ok: false, error: { code: 'BAD_REQUEST', details: 'Invalid JSON' } }, 400);
        try { env?.METRICS?.writeDataPoint({ blobs: ['/gateway', '', 'error'], doubles: [Date.now() - t0, 400], indexes: ['self'] }); } catch {}
        return resp;
      }

      const { operation, params = {}, timeoutMs = 30000, actorUserId } = body;
      opName = operation;
      const entry = OPS_BY_OPERATION.get(operation);
      if (!entry) {
        const resp = json({ ok: false, error: { code: 'UNKNOWN_OPERATION', operation } }, 400);
        try { env?.METRICS?.writeDataPoint({ blobs: ['/gateway', opName || '', 'error'], doubles: [Date.now() - t0, 400], indexes: ['self'] }); } catch {}
        return resp;
      }

      let upstreamUrl;
      try {
        upstreamUrl = buildUrl('https://api.acculynx.com' + entry.path, params.path, params.query);
      } catch (e) {
        if (e && e.name === 'MissingPathParamError') {
          return json({ ok: false, error: { code: 'MISSING_PATH_PARAM', details: e.message, missing: e.missing || [] } }, 400);
        }
        throw e;
      }
      const method = entry.method;
      const contentType = params.contentType || 'application/json';

      const headers = new Headers({ 'accept': 'application/json' });
      const upstreamToken = selectUpstreamToken(env, actorUserId);
      if (!upstreamToken) {
        return json({ ok: false, error: { code: 'UPSTREAM_TOKEN_MISSING', message: 'No upstream ACCULYNX_TOKEN configured' } }, 500);
      }
      headers.set('authorization', `Bearer ${upstreamToken}`);

      let upstreamBody = undefined;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        if (contentType === 'multipart/form-data') {
          const form = new FormData();
          for (const [k, v] of Object.entries(params.body || {})) form.append(k, String(v));
          upstreamBody = form;
          // let runtime set content-type boundary
        } else if (contentType === 'application/x-www-form-urlencoded') {
          const form = new URLSearchParams();
          for (const [k, v] of Object.entries(params.body || {})) form.set(k, String(v));
          headers.set('content-type', 'application/x-www-form-urlencoded');
          upstreamBody = form;
        } else {
          headers.set('content-type', 'application/json');
          upstreamBody = params.body ? JSON.stringify(params.body) : undefined;
        }
      }

      // Dry run support for ChatGPT reasoning
      if (url.searchParams.get('dryRun') === '1' || body.dryRun === true) {
        const resp = json({ ok: true, dryRun: { method, url: upstreamUrl, headers: Object.fromEntries([...headers].filter(([k]) => k.toLowerCase() !== 'authorization')), hasBody: !!upstreamBody } });
        try { env?.METRICS?.writeDataPoint({ blobs: ['/gateway', entry.operation, 'dry'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
        return resp;
      }

      // Optional GET cache for read ops
      const cacheTtl = Number(url.searchParams.get('cacheTtl') || body.cacheTtl || 0) || 0;
      if (method === 'GET' && cacheTtl > 0) {
        const cache = caches.default;
        const cacheKey = new Request(upstreamUrl, { method: 'GET' });
        const cached = await cache.match(cacheKey);
        if (cached) {
          const cachedResp = withCors(cached);
          try { env?.METRICS?.writeDataPoint({ blobs: ['/gateway', entry.operation, 'cache_hit'], doubles: [Date.now() - t0, cachedResp.status], indexes: ['self'] }); } catch {}
          return cachedResp;
        }
        const res = await fetchWithTimeout(upstreamUrl, { method, headers, body: undefined }, timeoutMs);
        let put = new Response(res.body, { status: res.status, headers: res.headers });
        put.headers.set('cache-control', `public, max-age=${cacheTtl}`);
        put = withCors(put);
        if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(cache.put(cacheKey, put.clone()));
        try { env?.METRICS?.writeDataPoint({ blobs: ['/gateway', entry.operation, 'cache_fill'], doubles: [Date.now() - t0, put.status], indexes: ['self'] }); } catch {}
        return put;
      }

      const res = await fetchWithTimeout(upstreamUrl, { method, headers, body: upstreamBody }, timeoutMs);
      // Stream upstream response as-is (faster, supports binaries)
      const resp = withCors(new Response(res.body, { status: res.status, headers: res.headers }));
      try { env?.METRICS?.writeDataPoint({ blobs: ['/gateway', entry.operation, 'dispatch'], doubles: [Date.now() - t0, resp.status], indexes: ['self'] }); } catch {}
      return resp;
    } catch (err) {
      const resp = json({ ok: false, error: { code: 'GATEWAY_ERROR', message: String(err?.stack || err) } }, 500);
      try { env?.METRICS?.writeDataPoint({ blobs: ['error', opName || '', route || ''], doubles: [Date.now() - t0, 500], indexes: ['self'] }); } catch {}
      return resp;
    }
  },
  // Attach queue consumer to default export so Wrangler can detect it
  queue
};

// Minimal Durable Object for future coordination/state
export class JobController {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  // Simple stub to verify binding works
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/state')) {
      const v = await this.state.storage.get('v');
      return json({ ok: true, v: v ?? null });
    }
    if (url.pathname.endsWith('/bump')) {
      const v = (await this.state.storage.get('v')) ?? 0;
      await this.state.storage.put('v', Number(v) + 1);
      return json({ ok: true, v: Number(v) + 1 });
    }
    return json({ ok: true, hint: 'use /state or /bump' });
  }
}

// Extend worker with Queue consumer (if bound)
async function queue(batch, env, ctx) {
  // Basic consumer: parse estimate JSON at sourceUrl, store into D1, compute worksheet
  if (!env.DB) return; // No D1 configured; skip
  await ensureSchema(env);
  for (const msg of batch.messages) {
    const payload = msg.body || {};
    const { jobId, sourceUrl, insurer = null, estimateDate = null, approved = 1 } = payload || {};
    try {
      if (!jobId || !sourceUrl) { msg.ack(); continue; }
      const now = Date.now();
      await d1Run(env, "INSERT OR IGNORE INTO jobs(job_id, created_at) VALUES(?, ?)", [jobId, now]);

      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error(`Fetch source failed: ${res.status}`);
      const ctype = res.headers.get('content-type') || '';
      let lines = [];
      let totals = {};
      if (ctype.includes('application/json')) {
        const doc = await res.json();
        lines = Array.isArray(doc?.lines) ? doc.lines : [];
        totals = doc?.totals || {};
      } else if (env.DOCS) {
        // Store original in R2 if bound
        const key = `estimates/${jobId}/${now}`;
        await env.DOCS.put(key, res.body, { httpMetadata: { contentType: ctype || 'application/octet-stream' } });
        totals = { stored: true, key };
      }

      const estimateId = crypto.randomUUID();
      await d1Run(env, "INSERT INTO estimates(estimate_id, job_id, insurer, estimate_date, approved, source_url, totals_json, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)", [estimateId, jobId, insurer, estimateDate ? Number(new Date(estimateDate)) : now, approved ? 1 : 0, sourceUrl, JSON.stringify(totals), now]);

      for (const ln of lines) {
        const id = crypto.randomUUID();
        const { code = null, description = null, trade = null, qty = null, unit_price = null, total = null, increase_amount = 0, is_scoped = null } = ln || {};
        await d1Run(env, "INSERT INTO estimate_lines(id, estimate_id, code, description, trade, qty, unit_price, total, increase_amount, is_scoped, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, estimateId, code, description, trade, qty, unit_price, total, increase_amount, is_scoped ? 1 : 0, now]);
      }

      // Compute worksheet if we have lines
      if (lines.length) {
        const scopeFlags = await loadScopeFlags(env); // from KV when available
        const { adminCost, finalTotal, rationale, outLines } = computeWorksheet(lines, scopeFlags);
        const worksheetId = crypto.randomUUID();
        await d1Run(env, "INSERT INTO worksheet(id, job_id, admin_cost, final_total, created_at) VALUES(?, ?, ?, ?, ?)", [worksheetId, jobId, adminCost, finalTotal, now]);
        for (const wl of outLines) {
          const id = crypto.randomUUID();
          await d1Run(env, "INSERT INTO worksheet_lines(id, worksheet_id, code, description, total, rationale, created_at) VALUES(?, ?, ?, ?, ?, ?, ?)", [id, worksheetId, wl.code || null, wl.description || null, wl.total ?? null, wl.rationale || null, now]);
        }
        await d1Run(env, "INSERT INTO events(id, job_id, type, payload, created_at) VALUES(?, ?, ?, ?, ?)", [crypto.randomUUID(), jobId, 'worksheet_computed', JSON.stringify({ worksheetId, adminCost, finalTotal, rationale }), now]);
      }
      msg.ack();
    } catch (e) {
      // Basic retry by not acking; could add dead-letter later
      try { env?.METRICS?.writeDataPoint({ blobs: ['queue_error', String(payload?.jobId || ''), 'parse'], doubles: [0, 500], indexes: ['self'] }); } catch {}
    }
  }
}

// ======== helpers ========
function buildUrl(template, pathVars = {}, query = {}) {
  const required = [];
  // Collect placeholders
  template.replace(/\{(.*?)\}/g, (_, k) => { required.push(k); return ''; });
  const missing = required.filter(k => pathVars?.[k] === undefined || pathVars?.[k] === null || String(pathVars?.[k]) === '');
  if (missing.length) {
    const err = new Error(`Missing required path parameters: ${missing.join(', ')}`);
    err.name = 'MissingPathParamError';
    // @ts-ignore
    err.missing = missing;
    throw err;
  }
  let url = template.replace(/\{(.*?)\}/g, (_, k) => encodeURIComponent(String(pathVars?.[k])));
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); }
  const q = qs.toString();
  if (q) url += (url.includes('?') ? '&' : '?') + q;
  return url;
}

function json(obj, status = 200) {
  return withCors(new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } }));
}

async function fetchWithTimeout(url, init, timeoutMs = 30000) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(to);
  }
}

function selectUpstreamToken(env, actorUserId) {
  if (actorUserId) {
    const key = `ACCULYNX_TOKEN__${actorUserId}`;
    if (env[key]) return env[key];
  }
  return env.ACCULYNX_TOKEN;
}

function requiresGatewayAuth(url) {
  // Protect gateway endpoints; allow meta to be public for discovery
  return url.pathname === '/gateway' || url.pathname === '/gateway/raw';
}

function methodPathKey(method, path) {
  return `${String(method).toUpperCase()} ${path}`;
}

function deriveOps(source) {
  const total = source.length;
  const nameCounts = new Map();
  const dedup = [];
  for (const e of source) {
    const base = e.operation;
    const count = (nameCounts.get(base) || 0) + 1;
    nameCounts.set(base, count);
    let name = base;
    if (count > 1) {
      const verMatch = e.path.match(/\/v(\d+)/);
      const ver = verMatch ? `V${verMatch[1]}` : null;
      name = [base, ver || e.method.toLowerCase()].filter(Boolean).join('_');
      // ensure uniqueness even after suffix
      let i = 2;
      while (nameCounts.has(name)) {
        name = `${base}_${ver || e.method.toLowerCase()}_${i++}`;
      }
      nameCounts.set(name, 1);
    }
    dedup.push({ operation: name, method: e.method, path: e.path });
  }
  const OPS_BY_OPERATION = new Map(dedup.map(o => [o.operation, o]));
  const PATH_MAP = new Map(dedup.map(o => [methodPathKey(o.method, o.path), o]));
  return {
    OPS: dedup,
    OPS_BY_OPERATION,
    PATH_MAP,
    META: { total, unique: dedup.length }
  };
}

// ======== Finance helpers (D1 + KV + compute) ========
async function ensureSchema(env) {
  if (!env.DB) return;
  const stmts = [
    `CREATE TABLE IF NOT EXISTS jobs (job_id TEXT PRIMARY KEY, created_at INTEGER, address TEXT);`,
    `CREATE TABLE IF NOT EXISTS estimates (estimate_id TEXT PRIMARY KEY, job_id TEXT, insurer TEXT, estimate_date INTEGER, approved INTEGER, source_url TEXT, totals_json TEXT, created_at INTEGER);`,
    `CREATE TABLE IF NOT EXISTS estimate_lines (id TEXT PRIMARY KEY, estimate_id TEXT, code TEXT, description TEXT, trade TEXT, qty REAL, unit_price REAL, total REAL, increase_amount REAL, is_scoped INTEGER, created_at INTEGER);`,
    `CREATE TABLE IF NOT EXISTS worksheet (id TEXT PRIMARY KEY, job_id TEXT, admin_cost REAL, final_total REAL, created_at INTEGER);`,
    `CREATE TABLE IF NOT EXISTS worksheet_lines (id TEXT PRIMARY KEY, worksheet_id TEXT, code TEXT, description TEXT, total REAL, rationale TEXT, created_at INTEGER);`,
    `CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, job_id TEXT, type TEXT, payload TEXT, created_at INTEGER);`
  ];
  for (const sql of stmts) {
    await env.DB.prepare(sql).run();
  }
}

async function d1Run(env, sql, params = []) {
  const stmt = env.DB.prepare(sql);
  if (params && params.length) return stmt.bind(...params).run();
  return stmt.run();
}

async function d1All(env, sql, params = []) {
  const stmt = env.DB.prepare(sql);
  const res = params && params.length ? await stmt.bind(...params).all() : await stmt.all();
  return res?.results || [];
}

async function loadScopeFlags(env) {
  // Placeholder; if KV bound as POLICY_KV, read a JSON map of scoped trades/items
  try {
    if (env.POLICY_KV) {
      const v = await env.POLICY_KV.get('policy:scope_flags:v1', 'json');
      if (v) return v;
    }
  } catch {}
  return { }; // default empty
}

function computeWorksheet(approvedLines, scopeFlags = {}) {
  // approvedLines: [{ code, description, trade, total, increase_amount, is_scoped }]
  const scoped = [];
  const nonScopeIncreases = [];
  for (const ln of approvedLines) {
    const isScoped = ln.is_scoped ?? inferScoped(ln, scopeFlags);
    if (isScoped) scoped.push(ln);
    else if ((ln.increase_amount ?? 0) > 0) nonScopeIncreases.push(ln);
  }
  const adminCost = round2(0.20 * nonScopeIncreases.reduce((s, ln) => s + Number(ln.increase_amount || 0), 0));
  const scopedTotal = round2(scoped.reduce((s, ln) => s + Number(ln.total || 0), 0));
  const finalTotal = round2(scopedTotal + adminCost);
  const rationale = `Admin cost is 20% of non-scoped increases (${round2(adminCost)} of ${round2(nonScopeIncreases.reduce((s, ln) => s + Number(ln.increase_amount || 0), 0))}).`;
  const outLines = scoped.map(ln => ({ code: ln.code, description: ln.description, total: ln.total, rationale: 'Included (scoped item)' }));
  if (adminCost > 0) outLines.push({ code: 'ADMIN', description: 'Administrative Cost (non-scoped increases)', total: adminCost, rationale });
  return { adminCost, finalTotal, rationale, outLines };
}

function inferScoped(ln, scopeFlags) {
  // Fallback: if trade present in scopeFlags.trades include; else default true
  if (scopeFlags?.trades && Array.isArray(scopeFlags.trades)) {
    return scopeFlags.trades.includes(ln.trade);
  }
  return true;
}

function round2(x) { return Math.round((Number(x) || 0) * 100) / 100; }

// ======== KV/template/readiness helpers ========
function renderTemplate(tpl, vars) {
  let s = String(tpl);
  for (const [k, v] of Object.entries(vars || {})) {
    const rx = new RegExp(`\\{\\{\s*${k}\s*\\}\\}`, 'g');
    s = s.replace(rx, String(v));
  }
  return s;
}

function analyzeReadiness(observed = {}, cfg = {}) {
  const musts = Array.isArray(cfg.musts) ? cfg.musts : [];
  const photosReq = cfg.photosReq || {};
  const labels = cfg.labels || {};
  const result = { missing: [], warnings: [], mislabeled: [] };

  // Docs check
  const docs = Array.isArray(observed.docs) ? observed.docs : [];
  const presentTypes = new Set(docs.map(d => d.type));
  for (const req of musts) {
    if (!presentTypes.has(req)) result.missing.push({ type: req, kind: 'doc' });
  }

  // Labels check
  for (const d of docs) {
    const pattern = labels[d.type];
    if (!pattern) continue;
    try {
      const rx = new RegExp(pattern);
      if (!rx.test(d.name || '')) result.mislabeled.push({ type: d.type, name: d.name, expected: pattern });
    } catch {}
  }

  // Photos check (generic)
  const photos = Array.isArray(observed.photos) ? observed.photos : [];
  const structures = Array.isArray(observed.structures) ? observed.structures : [];
  if (structures.length && photosReq?.tags && Array.isArray(photosReq.tags)) {
    for (const s of structures) {
      const stPhotos = new Set(photos.filter(p => p.structureId === s.id).map(p => p.tag));
      for (const tag of photosReq.tags) {
        if (!stPhotos.has(tag)) result.missing.push({ structureId: s.id, tag, kind: 'photo' });
      }
    }
  }

  return { result };
}

function b64ToUint8(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function parseTimeout(param, envDefault, fallback) {
  const fromParam = param ? Number(param) : NaN;
  const fromEnv = envDefault ? Number(envDefault) : NaN;
  let v = Number.isFinite(fromParam) && fromParam > 0 ? fromParam : (Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : fallback);
  // Clamp to 120s for safety
  if (v > 120000) v = 120000;
  return v;
}

// (Removed probe/confirm helpers for simplicity)

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-headers', 'authorization, content-type');
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
  headers.set('access-control-expose-headers', '*');
  return new Response(response.body, { status: response.status, headers });
}

function corsPreflight() {
  const headers = new Headers();
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-headers', 'authorization, content-type');
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
  headers.set('access-control-max-age', '86400');
  return new Response(null, { status: 204, headers });
}

function buildOpenApi(origin) {
  const servers = [{ url: origin }];
  const operationEnum = OPS.map(o => o.operation).sort();
  const topExamples = operationEnum.slice(0, 10);
  return {
    openapi: '3.1.0',
    info: { title: 'Accu Gateway', version: '1.0.0', description: 'Cloudflare Worker proxy to AccuLynx' },
    servers,
    components: {
      securitySchemes: {
        Authorization: { type: 'apiKey', in: 'header', name: 'Authorization', description: 'Use Bearer <GATEWAY_TOKEN> (optional)' }
      },
      schemas: {
        GatewayRequest: {
          type: 'object',
          properties: {
            operation: { type: 'string', description: 'Gateway operation name (see /gateway/meta)', enum: operationEnum },
            actorUserId: { type: 'string', nullable: true },
            timeoutMs: { type: 'integer', nullable: true },
            params: {
              type: 'object',
              properties: {
                path: { type: 'object', additionalProperties: { type: 'string' } },
                query: { type: 'object', additionalProperties: { type: 'string' } },
                body: { type: 'object' },
                contentType: { type: 'string', enum: ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'] }
              }
            }
          },
          required: ['operation']
        }
      }
    },
    paths: {
      '/templates/render': {
        post: {
          summary: 'Render a message template',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['key'], properties: { key: { type: 'string' }, vars: { type: 'object', additionalProperties: true } } } } } },
          responses: { '200': { description: 'Rendered message' }, '404': { description: 'Template not found' }, '501': { description: 'KV not enabled' } },
          security: []
        }
      },
      '/readiness/analyze': {
        post: {
          summary: 'Analyze observed job snapshot against KV policies',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { jobId: { type: 'string' }, observed: { type: 'object' } } } } } },
          responses: { '200': { description: 'Analysis result' } },
          security: []
        }
      },
      '/gateway/meta': {
        get: {
          summary: 'List gateway operations',
          responses: {
            '200': {
              description: 'Meta',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      counts: {
                        type: 'object',
                        properties: { total: { type: 'integer' }, unique: { type: 'integer' } }
                      },
                      operations: { type: 'array', items: { type: 'string' } }
                    }
                  },
                  examples: {
                    sample: {
                      value: { ok: true, counts: { total: operationEnum.length, unique: operationEnum.length }, operations: topExamples }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/gateway': {
        post: {
          summary: 'Dispatch an AccuLynx operation',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GatewayRequest' },
                examples: {
                  createLead: {
                    value: {
                      operation: operationEnum.includes('createLead') ? 'createLead' : operationEnum[0],
                      params: { body: { firstName: 'Ada', lastName: 'Lovelace' } }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Passthrough of upstream response (JSON or text)' },
            '400': { description: 'Bad request (invalid JSON, missing params, unknown operation)' },
            '401': { description: 'Unauthorized (if GATEWAY_TOKEN is set and header missing/invalid)' }
          },
          security: []
        }
      },
      '/health': { get: { summary: 'Health check', responses: { '200': { description: 'OK' } }, security: [] } },
      '/version': { get: { summary: 'Build/version info', responses: { '200': { description: 'Version info' } }, security: [] } },
      '/gateway/ops/{name}': { get: { summary: 'Describe a single operation', parameters: [ { name: 'name', in: 'path', required: true, schema: { type: 'string' } } ], responses: { '200': { description: 'Operation metadata' }, '404': { description: 'Unknown operation' } }, security: [] } },
      '/config/{key}': { get: { summary: 'Fetch a config value (allowlist)', parameters: [ { name: 'key', in: 'path', required: true, schema: { type: 'string' } } ], responses: { '200': { description: 'Config value' }, '403': { description: 'Forbidden' }, '501': { description: 'KV not enabled' } }, security: [] } },
      '/tools/url-info': { get: { summary: 'Probe a URL for content-type/length', parameters: [ { name: 'url', in: 'query', required: true, schema: { type: 'string', format: 'uri' } } ], responses: { '200': { description: 'Metadata' }, '400': { description: 'Bad request' } }, security: [] } },
      '/tools/redact': { post: { summary: 'Redact patterns from text', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { text: { type: 'string' }, patterns: { type: 'array', items: { type: 'string' } } }, required: ['text'] } } } }, responses: { '200': { description: 'Redacted text' } }, security: [] } },
      '/tools/label': { post: { summary: 'Validate/correct a filename', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { filename: { type: 'string' }, type: { type: 'string' } }, required: ['filename'] } } } }, responses: { '200': { description: 'Filename result' } }, security: [] } },
      '/r2/presign': { post: { summary: 'Get simple worker URLs for R2 GET/PUT', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['key'], properties: { key: { type: 'string' }, mode: { type: 'string', enum: ['get','put'] }, contentType: { type: 'string' } } } } } }, responses: { '200': { description: 'URLs for GET and PUT via the Worker' }, '400': { description: 'Bad request' }, '501': { description: 'R2 not enabled' } }, security: [] } },
      '/r2/object/{key}': {
        get: { summary: 'Download an object via Worker proxy', parameters: [ { name: 'key', in: 'path', required: true, schema: { type: 'string' } } ], responses: { '200': { description: 'Object stream' }, '404': { description: 'Not found' }, '501': { description: 'R2 not enabled' } }, security: [] },
        put: { summary: 'Upload an object via Worker proxy', parameters: [ { name: 'key', in: 'path', required: true, schema: { type: 'string' } } ], requestBody: { required: true, content: { '*/*': { schema: { type: 'string', format: 'binary' } } } }, responses: { '200': { description: 'Stored' }, '501': { description: 'R2 not enabled' } }, security: [] }
      },
      '/finance/ingest': {
        post: {
          summary: 'Enqueue document ingest (async)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['jobId', 'sourceUrl'],
                  properties: {
                    jobId: { type: 'string' },
                    sourceUrl: { type: 'string', format: 'uri' },
                    insurer: { type: 'string', nullable: true },
                    estimateDate: { oneOf: [ { type: 'string' }, { type: 'integer' } ], nullable: true },
                    approved: { type: 'boolean', default: true }
                  }
                },
                examples: {
                  sample: { value: { jobId: 'JOB-123', sourceUrl: 'https://example.com/data.json' } }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Queued (or no-queue if binding missing)' },
            '400': { description: 'Bad request' }
          },
          security: []
        }
      },
      '/finance/worksheet/{jobId}': {
        get: {
          summary: 'Get latest stored result for a job',
          parameters: [ { name: 'jobId', in: 'path', required: true, schema: { type: 'string' } } ],
          responses: {
            '200': { description: 'Stored result JSON' },
            '404': { description: 'Not found' },
            '501': { description: 'D1 not enabled' }
          },
          security: []
        }
      },
      '/gateway/raw': {
        post: {
          summary: 'Raw passthrough to AccuLynx',
          parameters: [
            { name: 'operation', in: 'query', schema: { type: 'string' } },
            { name: 'path', in: 'query', schema: { type: 'string' } },
            { name: 'method', in: 'query', schema: { type: 'string', default: 'POST' } },
            { name: 'actorUserId', in: 'query', schema: { type: 'string' } },
            { name: 'sourceUrl', in: 'query', schema: { type: 'string', format: 'uri' }, description: 'If provided, the Worker downloads from this URL and streams upstream' },
            { name: 'sourceTimeoutMs', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 120000 }, description: 'Optional timeout for fetching sourceUrl (ms, clamped to 120s)' }
          ],
          requestBody: {
            required: true,
            content: {
              '*/*': { schema: { type: 'string', format: 'binary' }, examples: { pdf: { summary: 'Binary passthrough', value: '<binary>' } } },
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    base64: { type: 'string', description: 'Base64-encoded payload' },
                    contentType: { type: 'string', description: 'Upstream content-type, e.g., application/pdf' }
                  },
                  required: ['base64']
                },
                examples: {
                  base64: {
                    value: { base64: 'JVBERi0xLjcKJc...' , contentType: 'application/pdf' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Passthrough of upstream response (JSON, text, or binary)' },
            '400': { description: 'Bad request (unknown operation/path, method mismatch, invalid base64/sourceUrl)' },
            '401': { description: 'Unauthorized (if GATEWAY_TOKEN is set and header missing/invalid)' },
            '413': { description: 'Payload too large (base64 exceeds limit)' },
            '405': { description: 'Method not allowed (non-POST or upstream expects non-POST)' }
          },
          security: []
        }
      }
    }
  };
}
