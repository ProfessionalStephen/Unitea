// AUTO-GENERATED ops-insights dataset — aggregates only, no PII.
// Source: solar-pipedrive-kpis notes-extraction pipeline (scripts/export-dashboard-data.py).
// Refresh by re-running that exporter; do not hand-edit.

export const OPS_INSIGHTS = {
  "generated": "2026-06-17",
  "dataFreshThrough": "2026-06-17",
  "source": "Solar Pipedrive notes-extraction pipeline (aggregates only, no PII)",
  "records": 11395,
  "funnel": {
    "totalJobs": 12280,
    "winRate": 75.7,
    "ptoReached": 8863,
    "cancelled": 2844,
    "resolved": 11707,
    "outcomes": [
      {
        "label": "Funding (AR)",
        "count": 4466
      },
      {
        "label": "Completed",
        "count": 3834
      },
      {
        "label": "In service",
        "count": 563
      },
      {
        "label": "Cancelled",
        "count": 2844
      },
      {
        "label": "In field",
        "count": 457
      },
      {
        "label": "Subcontract",
        "count": 116
      }
    ]
  },
  "redFlags": {
    "total": 24217,
    "records": 11395,
    "categories": [
      {
        "category": "documentation_blocker",
        "count": 5127
      },
      {
        "category": "stall_delay",
        "count": 2725
      },
      {
        "category": "system_performance",
        "count": 2657
      },
      {
        "category": "cancellation",
        "count": 2316
      },
      {
        "category": "financing",
        "count": 1582
      },
      {
        "category": "inspection_failure",
        "count": 979
      },
      {
        "category": "customer_complaint",
        "count": 905
      },
      {
        "category": "installation_issue",
        "count": 872
      },
      {
        "category": "permitting",
        "count": 335
      },
      {
        "category": "utility_interconnection",
        "count": 310
      },
      {
        "category": "technical_issue",
        "count": 221
      },
      {
        "category": "customer_concern",
        "count": 194
      },
      {
        "category": "other",
        "count": 5994
      }
    ]
  },
  "cycleTimes": [
    {
      "key": "contract_to_pto",
      "label": "Contract \u2192 PTO",
      "median": 108,
      "mean": 134,
      "n": 1360
    },
    {
      "key": "permit_to_pto",
      "label": "Permit \u2192 PTO",
      "median": 62,
      "mean": 81,
      "n": 1845
    },
    {
      "key": "install_to_pto",
      "label": "Install \u2192 PTO",
      "median": 50,
      "mean": 69,
      "n": 2552
    },
    {
      "key": "contract_to_install",
      "label": "Contract \u2192 install",
      "median": 41,
      "mean": 63,
      "n": 1357
    },
    {
      "key": "permit_to_install",
      "label": "Permit \u2192 install",
      "median": 9,
      "mean": 23,
      "n": 1635
    },
    {
      "key": "job_install_time",
      "label": "Install start \u2192 finish",
      "median": 0,
      "mean": 6,
      "n": 2890
    }
  ],
  "cancellations": {
    "total": 2844,
    "medianDaysToCancel": 18.7,
    "ratePctOfResolved": 24.3,
    "where": [
      {
        "board": "New Sale Board",
        "pct": 49.3,
        "medianDays": 7.1,
        "cancels": 1402
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
        "pct": 10,
        "medianDays": 27.9,
        "cancels": 284
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
        "cancels": 918
      },
      {
        "label": "1-4 weeks",
        "pct": 28.6,
        "cancels": 813
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
        "count": 25
      }
    ]
  },
  "inspections": {
    "events": 5874,
    "failures": 1530,
    "failRatePct": 26.0
  },
  "clawbackAtRisk": 1173,
  "windowAsOf": "2026-06-17",
  "windows": {
    "30": {
      "redFlags": {
        "total": 735,
        "records": 351,
        "categories": [
          {
            "category": "documentation_blocker",
            "count": 205
          },
          {
            "category": "system_performance",
            "count": 69
          },
          {
            "category": "stall_delay",
            "count": 60
          },
          {
            "category": "cancellation",
            "count": 49
          },
          {
            "category": "financing",
            "count": 37
          },
          {
            "category": "inspection_failure",
            "count": 29
          },
          {
            "category": "installation_issue",
            "count": 25
          },
          {
            "category": "customer_complaint",
            "count": 19
          },
          {
            "category": "technical_issue",
            "count": 17
          },
          {
            "category": "permitting",
            "count": 16
          },
          {
            "category": "customer_concern",
            "count": 8
          },
          {
            "category": "utility_interconnection",
            "count": 7
          },
          {
            "category": "other",
            "count": 194
          }
        ]
      },
      "cycleTimes": [
        {
          "key": "contract_to_pto",
          "label": "Contract \u2192 PTO",
          "median": 50,
          "mean": 61,
          "n": 37
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 42,
          "mean": 54,
          "n": 50
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 34,
          "mean": 41,
          "n": 77
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 15,
          "mean": 28,
          "n": 23
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 7,
          "mean": 15,
          "n": 33
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 20,
          "n": 65
        }
      ]
    },
    "90": {
      "redFlags": {
        "total": 2172,
        "records": 853,
        "categories": [
          {
            "category": "documentation_blocker",
            "count": 532
          },
          {
            "category": "system_performance",
            "count": 290
          },
          {
            "category": "stall_delay",
            "count": 208
          },
          {
            "category": "cancellation",
            "count": 148
          },
          {
            "category": "financing",
            "count": 110
          },
          {
            "category": "inspection_failure",
            "count": 82
          },
          {
            "category": "customer_complaint",
            "count": 78
          },
          {
            "category": "installation_issue",
            "count": 67
          },
          {
            "category": "technical_issue",
            "count": 33
          },
          {
            "category": "permitting",
            "count": 29
          },
          {
            "category": "utility_interconnection",
            "count": 28
          },
          {
            "category": "customer_concern",
            "count": 21
          },
          {
            "category": "other",
            "count": 546
          }
        ]
      },
      "cycleTimes": [
        {
          "key": "contract_to_pto",
          "label": "Contract \u2192 PTO",
          "median": 54,
          "mean": 86,
          "n": 118
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 43,
          "mean": 61,
          "n": 189
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 36,
          "mean": 50,
          "n": 260
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 14,
          "mean": 43,
          "n": 99
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 5,
          "mean": 16,
          "n": 107
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 10,
          "n": 216
        }
      ]
    },
    "180": {
      "redFlags": {
        "total": 4087,
        "records": 1419,
        "categories": [
          {
            "category": "documentation_blocker",
            "count": 1011
          },
          {
            "category": "system_performance",
            "count": 472
          },
          {
            "category": "stall_delay",
            "count": 378
          },
          {
            "category": "cancellation",
            "count": 292
          },
          {
            "category": "financing",
            "count": 222
          },
          {
            "category": "inspection_failure",
            "count": 188
          },
          {
            "category": "installation_issue",
            "count": 148
          },
          {
            "category": "customer_complaint",
            "count": 140
          },
          {
            "category": "utility_interconnection",
            "count": 66
          },
          {
            "category": "technical_issue",
            "count": 63
          },
          {
            "category": "permitting",
            "count": 56
          },
          {
            "category": "customer_concern",
            "count": 40
          },
          {
            "category": "other",
            "count": 1011
          }
        ]
      },
      "cycleTimes": [
        {
          "key": "contract_to_pto",
          "label": "Contract \u2192 PTO",
          "median": 83,
          "mean": 101,
          "n": 271
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 56,
          "mean": 69,
          "n": 471
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 46,
          "mean": 59,
          "n": 599
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 16,
          "mean": 39,
          "n": 176
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 6,
          "mean": 22,
          "n": 249
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 7,
          "n": 443
        }
      ]
    },
    "365": {
      "redFlags": {
        "total": 8278,
        "records": 2599,
        "categories": [
          {
            "category": "documentation_blocker",
            "count": 1876
          },
          {
            "category": "system_performance",
            "count": 888
          },
          {
            "category": "stall_delay",
            "count": 745
          },
          {
            "category": "cancellation",
            "count": 664
          },
          {
            "category": "financing",
            "count": 572
          },
          {
            "category": "inspection_failure",
            "count": 351
          },
          {
            "category": "installation_issue",
            "count": 317
          },
          {
            "category": "customer_complaint",
            "count": 268
          },
          {
            "category": "permitting",
            "count": 125
          },
          {
            "category": "utility_interconnection",
            "count": 114
          },
          {
            "category": "technical_issue",
            "count": 112
          },
          {
            "category": "customer_concern",
            "count": 77
          },
          {
            "category": "other",
            "count": 2169
          }
        ]
      },
      "cycleTimes": [
        {
          "key": "contract_to_pto",
          "label": "Contract \u2192 PTO",
          "median": 76,
          "mean": 97,
          "n": 459
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 53,
          "mean": 64,
          "n": 806
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 46,
          "mean": 58,
          "n": 1026
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 22,
          "mean": 41,
          "n": 427
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 6,
          "mean": 16,
          "n": 646
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 6,
          "n": 1025
        }
      ]
    }
  }
} as const;

export type OpsInsights = typeof OPS_INSIGHTS;
