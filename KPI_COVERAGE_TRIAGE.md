# KPI Coverage Triage (98 missing → all wired or removed)

Per-KPI decision matrix. For each missing KPI:
- **A** = Direct stage/board count → add to `KPI_INIT` with source mapping
- **B** = Existing aggregate in `pullPipedrive()` → add resolver name-case
- **C** = Needs `/dealFlow` (time-window, won/lost trend) → Cycle 5
- **D** = No Pipedrive source available → remove from `RT[role].kpis`

| KPI name                                  | Cat | Source / decision                                                |
| ----------------------------------------- | --- | ---------------------------------------------------------------- |
| AP items due                              | D   | Accounting system, not Pipedrive                                 |
| API connection status                     | D   | Internal health metric, not a per-team KPI                       |
| API health status                         | D   | Same — admin status banner already covers this                   |
| AR outstanding                            | D   | Accounting system                                                |
| Affidavits needed                         | A   | Inspection / Need affidavit                                       |
| After hours calls received                | D   | Telephony, no source                                             |
| Audit log entries today                   | D   | App-internal, low value as KPI                                   |
| Avg days per stage                        | B   | Map to existing endToEndDays / boardAvg per role (aggregate)     |
| Awaiting approval                         | A   | Permitting / Permit Submitted (deal count)                       |
| BBB complaints open                       | D   | External system, no source                                       |
| Baseline engine status                    | D   | Internal, not a KPI                                              |
| Board health overview                     | B   | Aggregate: bottlenecksCount (resolver name-case)                 |
| Cancellation impact this week             | C   | won/lost this week — needs trends                                |
| Cancellations this week                   | A   | Cancellations / New Cancellation (deal count)                    |
| Commission discrepancies                  | D   | QuotaPath / Accounting                                            |
| Commissions to process                    | D   | QuotaPath                                                        |
| Deals sent to engineering                 | A   | New Sale / Sent to Engineering                                   |
| Distributor funding pending               | D   | Distributor system                                               |
| Draft vs live status                      | D   | App-internal admin state                                          |
| Email delivery rate                       | D   | App-internal                                                     |
| Enerflo sync issues                       | D   | Enerflo system                                                   |
| Enphase setups due                        | D   | Enphase system                                                    |
| Escalated sales issues                    | D   | No structured source                                              |
| Failed inspections                        | A   | Inspection / Failed Inspection                                   |
| Feedback reports pending                  | D   | App-internal RALPH count — confusing as KPI                       |
| Finance partner issues                    | D   | No source                                                         |
| HOA approvals pending                     | A   | Scheduling/Coordinating / Pending HOA Approvals                  |
| HOA pending approvals                     | A   | duplicate of above                                                |
| In revisions                              | A   | Engineering / Revisions                                          |
| Inbound calls today                       | D   | Telephony                                                         |
| Inspections scheduled                     | A   | Inspection / Inspection Scheduled                                 |
| Inspections scheduled today               | C   | Inspection Scheduled w/ today date — needs dealFlow              |
| Inspections to schedule                   | A   | Inspection / Inspection Ready to Schedule                         |
| Install not completed                     | A   | Scheduling/Coordinating / Install not completed                   |
| Installs completed yesterday              | C   | won/movements — needs dealFlow                                    |
| Installs scheduled this week              | C   | Inst Sched / due-window — needs dealFlow                          |
| Jobs on hold count                        | A   | sum across boards / "Job on hold" stages                          |
| KPI coverage rate                         | B   | resolver-native: (wired/total)                                    |
| Lightreach collections due                | D   | External finance partner                                          |
| M1/M2/M3 invoice status                   | B   | aggregate of M1/M2/M3 needed stages                               |
| M2 invoices needed                        | A   | Funding / M2 invoice needed                                       |
| M3 invoices needed                        | A   | Funding / M3 invoice needed                                       |
| MPU jobs active                           | A   | Utility Disco / MPU and Shut off needed                           |
| Material ordered pending                  | A   | Scheduling/Coordinating / Material Ordered                        |
| Material orders pending                   | A   | dup of above                                                      |
| Missing NTP count                         | A   | New Sale / Missing NTP                                            |
| Monitoring alerts                         | A   | Service / Monitoring                                              |
| NMA applications due                      | A   | Net Metering / Ready for New Meter App                            |
| NMA submitted this week                   | C   | needs dealFlow                                                    |
| NOC filings pending                       | D   | No specific Pipedrive stage / unclear source                       |
| NTP tracking active                       | A   | New Sale / Missing NTP (count active)                              |
| Needs clarification                       | A   | Engineering / Needs Clarification                                 |
| Net metering backlog                      | A   | Net Metering board total                                          |
| Net metering pending                      | A   | Net Metering board total (dup)                                    |
| New deals this week                       | C   | needs dealFlow                                                    |
| New hire onboarding                       | D   | HR, not Pipedrive                                                 |
| New reps to onboard                       | D   | HR                                                                |
| Offboarding pending                       | D   | HR                                                                |
| Onboarding completed this week            | D   | HR                                                                |
| Overdue permits                           | A   | Permitting / stalled count w/ stuck > threshold                   |
| PTO calls due                             | A   | Completed Meter / PTO Call Completed (inverse — pending)          |
| PTO requests                              | D   | HR                                                                |
| PTOs to audit today                       | A   | Completed Meter / PTO Submitted                                   |
| Panel warranty claims                     | A   | Service / Panels Warranty                                         |
| Passed inspections                        | A   | Inspection / Inspection Passed                                    |
| Payroll items due                         | D   | Payroll, not Pipedrive                                            |
| Pending COC                               | A   | Inspection / Pend COC                                             |
| Pending inspections                       | A   | Inspection board total                                            |
| Pending meter swaps                       | A   | Net Metering / Pending meter swap                                 |
| Permit submitted calls due                | A   | Permitting / Permit Submitted                                     |
| Permits in revision                       | A   | Permitting / Revisions                                            |
| Permits submitted this week               | C   | needs dealFlow                                                    |
| Permits to submit today                   | A   | Permitting / Ready for Permitting                                  |
| Pipeline deals active                     | B   | aggregate: totalActiveJobs                                         |
| Post install revisions                    | A   | Engineering / Post Install Revisions                              |
| Quality control queue                     | A   | Engineering / Quality Control                                     |
| QuotaPath sync issues                     | D   | QuotaPath                                                         |
| R&R jobs active                           | A   | R&R board total                                                   |
| R&R ready to schedule                     | A   | R&R / Ready for uninstall                                         |
| R&R uninstalls scheduled                  | A   | R&R / Uninstall Scheduled                                         |
| RALPH loop items                          | D   | App-internal, not Pipedrive                                       |
| RMA submissions pending                   | A   | Service / Panels Warranty (dup-ish)                                |
| Reimbursements pending                    | D   | Accounting                                                        |
| Rejection follow-ups                      | A   | Net Metering / Rejections                                         |
| Roof leaks open                           | A   | Service / Roof Leak                                               |
| Sent to permitting today                  | C   | needs dealFlow                                                    |
| Service requests today                    | C   | needs dealFlow                                                    |
| Site capture pending                      | A   | New Sale / Missing Site Survey Items                              |
| Site surveys scheduled                    | A   | New Sale / Site Survey Scheduled                                  |
| Site surveys to schedule                  | A   | New Sale / Brand New Deal                                         |
| Team utilization rate                     | D   | No source                                                         |
| Technicians scheduled today               | C   | needs dealFlow                                                    |
| Timesheets pending                        | D   | HR/payroll                                                        |
| Transformer upgrades                      | A   | Net Metering / Transformer Upgrade                                |
| Unmapped KPI tags                         | B   | aggregate: count of role-kpis with no source                       |
| Waiting on engineers                      | A   | Engineering / Waiting on Engineers                                |
| Warranty claims active                    | A   | Service / Panels Warranty                                         |
| Webhook events today                      | D   | App-internal                                                      |

## Tally

- **A** (stage/board direct): ~55 KPIs to add to KPI_INIT
- **B** (existing aggregate, just need resolver case): ~6
- **C** (dealFlow / Cycle 5): ~10
- **D** (delete from RT[role].kpis): ~27

After this triage, every remaining KPI name has a real Pipedrive source.

## Removed KPIs — what each role loses

Roles will lose these from their daily emails:

- **Owner**: "Team utilization rate"
- **COO**: (none removed; one "Pending inspections" gets wired)
- **VP of Operations**: same as COO
- **Office Manager**: "BBB complaints open"
- **Office Administrator**: "Timesheets pending", "PTO requests", "New hire onboarding", "Payroll items due" — **all 4 removed; role gets no KPIs**. Replace with relevant Pipedrive-backed KPIs or accept empty KPI row.
- **Installation Manager**: (none)
- **Warehouse Manager**: (none)
- **Service Manager**: (none)
- **Service Coordinator**: "RMA submissions pending" wired (kept)
- **Engineering Coordinator**: (none)
- **Permitting Coordinator**: (none)
- **Scheduling Coordinator**: (none)
- **Inspection Coordinator**: (none)
- **Net Metering Coordinator**: (none)
- **Receptionist**: "Inbound calls today", "Enphase setups due" — 2 of 4 removed
- **President of Sales**: (none — most kept)
- **Sales Relations Manager**: "Escalated sales issues"
- **Account Manager**: "Enerflo sync issues", "NOC filings pending"
- **After Hours Account Manager**: "After hours calls received", "Inbound calls today"
- **Onboarding Coordinator**: ALL 3 removed (HR-only role) — **role gets no KPIs**
- **Accounting Manager**: ALL 4 removed (Accounting) — **role gets no KPIs**
- **Commissions Coordinator**: "Commissions to process", "QuotaPath sync issues" — 2 of 3 removed
- **Director of Finance**: "Finance partner issues", "Distributor funding pending" — partial
- **Funding Coordinator**: "Lightreach collections due"
- **AI Engineer**: "Board health overview" (B), "KPI coverage rate" (B), "Unmapped KPI tags" (B), "API connection status", "Feedback reports pending", "RALPH loop items" — 3 wired, 3 removed
- **AI Back-End Developer**: ALL internal — most removed

Roles that lose ALL their KPIs: Office Administrator, Onboarding Coordinator, Accounting Manager. They will get the briefing email with an empty KPI section. Recommend replacing with relevant Pipedrive KPIs in a future pass — or hiding the KPI section in the email when empty (already supported in cron).
