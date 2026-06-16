// AUTO-GENERATED ops-insights dataset — aggregates only, no PII.
// Source: solar-pipedrive-kpis notes-extraction pipeline (scripts/export-dashboard-data.py).
// Refresh by re-running that exporter; do not hand-edit.

export const OPS_INSIGHTS = {
  "generated": "2026-06-13",
  "dataFreshThrough": "2026-06-13",
  "source": "Solar Pipedrive notes-extraction pipeline (aggregates only, no PII)",
  "records": 11372,
  "funnel": {
    "totalJobs": 12246,
    "winRate": 75.6,
    "ptoReached": 8826,
    "cancelled": 2841,
    "resolved": 11667,
    "outcomes": [
      {
        "label": "Funding (AR)",
        "count": 4447
      },
      {
        "label": "Completed",
        "count": 3825
      },
      {
        "label": "In service",
        "count": 554
      },
      {
        "label": "Cancelled",
        "count": 2841
      },
      {
        "label": "In field",
        "count": 463
      },
      {
        "label": "Subcontract",
        "count": 116
      }
    ]
  },
  "redFlags": {
    "total": 24191,
    "records": 11372,
    "categories": [
      {
        "category": "documentation_blocker",
        "count": 5127
      },
      {
        "category": "stall_delay",
        "count": 2718
      },
      {
        "category": "system_performance",
        "count": 2644
      },
      {
        "category": "cancellation",
        "count": 2311
      },
      {
        "category": "financing",
        "count": 1580
      },
      {
        "category": "inspection_failure",
        "count": 972
      },
      {
        "category": "customer_complaint",
        "count": 900
      },
      {
        "category": "installation_issue",
        "count": 871
      },
      {
        "category": "permitting",
        "count": 337
      },
      {
        "category": "utility_interconnection",
        "count": 312
      },
      {
        "category": "technical_issue",
        "count": 217
      },
      {
        "category": "customer_concern",
        "count": 197
      },
      {
        "category": "other",
        "count": 6005
      }
    ]
  },
  "cycleTimes": [
    {
      "key": "contract_to_pto",
      "label": "Contract \u2192 PTO",
      "median": 108,
      "mean": 134,
      "n": 1358
    },
    {
      "key": "permit_to_pto",
      "label": "Permit \u2192 PTO",
      "median": 62,
      "mean": 81,
      "n": 1839
    },
    {
      "key": "install_to_pto",
      "label": "Install \u2192 PTO",
      "median": 50,
      "mean": 69,
      "n": 2539
    },
    {
      "key": "contract_to_install",
      "label": "Contract \u2192 install",
      "median": 41,
      "mean": 63,
      "n": 1365
    },
    {
      "key": "permit_to_install",
      "label": "Permit \u2192 install",
      "median": 9,
      "mean": 22,
      "n": 1634
    },
    {
      "key": "job_install_time",
      "label": "Install start \u2192 finish",
      "median": 0,
      "mean": 6,
      "n": 2879
    }
  ],
  "cancellations": {
    "total": 2841,
    "medianDaysToCancel": 18.7,
    "ratePctOfResolved": 24.4,
    "where": [
      {
        "board": "New Sale Board",
        "pct": 49.3,
        "medianDays": 7.1,
        "cancels": 1401
      },
      {
        "board": "Scheduling/Coordinating",
        "pct": 17.7,
        "medianDays": 74.6,
        "cancels": 504
      },
      {
        "board": "Engineering",
        "pct": 11.5,
        "medianDays": 11.9,
        "cancels": 327
      },
      {
        "board": "Permitting",
        "pct": 9.9,
        "medianDays": 27.9,
        "cancels": 282
      },
      {
        "board": "Customer Service",
        "pct": 7.1,
        "medianDays": 20.2,
        "cancels": 203
      },
      {
        "board": "(legacy / direct-to-cancel)",
        "pct": 3.2,
        "medianDays": 26,
        "cancels": 90
      },
      {
        "board": "California",
        "pct": 1,
        "medianDays": 59.4,
        "cancels": 28
      },
      {
        "board": "Inspection",
        "pct": 0.1,
        "medianDays": 215.4,
        "cancels": 2
      }
    ],
    "ageBuckets": [
      {
        "label": "< 1 week",
        "pct": 32.3,
        "cancels": 917
      },
      {
        "label": "1-4 weeks",
        "pct": 28.5,
        "cancels": 811
      },
      {
        "label": "1-3 months",
        "pct": 22.9,
        "cancels": 650
      },
      {
        "label": "3-6 months",
        "pct": 12.2,
        "cancels": 346
      },
      {
        "label": "6-12 months",
        "pct": 3.7,
        "cancels": 105
      },
      {
        "label": "> 1 year",
        "pct": 0.4,
        "cancels": 12
      }
    ],
    "monthly": [
      {
        "month": "2025-01",
        "count": 62
      },
      {
        "month": "2025-02",
        "count": 68
      },
      {
        "month": "2025-03",
        "count": 84
      },
      {
        "month": "2025-04",
        "count": 83
      },
      {
        "month": "2025-05",
        "count": 43
      },
      {
        "month": "2025-06",
        "count": 60
      },
      {
        "month": "2025-07",
        "count": 73
      },
      {
        "month": "2025-08",
        "count": 45
      },
      {
        "month": "2025-09",
        "count": 56
      },
      {
        "month": "2025-10",
        "count": 58
      },
      {
        "month": "2025-11",
        "count": 77
      },
      {
        "month": "2025-12",
        "count": 75
      },
      {
        "month": "2026-01",
        "count": 46
      },
      {
        "month": "2026-02",
        "count": 55
      },
      {
        "month": "2026-03",
        "count": 58
      },
      {
        "month": "2026-04",
        "count": 51
      },
      {
        "month": "2026-05",
        "count": 74
      },
      {
        "month": "2026-06",
        "count": 22
      }
    ]
  },
  "inspections": {
    "events": 5854,
    "failures": 1543,
    "failRatePct": 26.4
  },
  "clawbackAtRisk": 1173
} as const;

export type OpsInsights = typeof OPS_INSIGHTS;
