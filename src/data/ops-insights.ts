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
        "category": "Documentation & contract",
        "count": 5797,
        "subcategories": [
          {
            "category": "documentation_blocker",
            "count": 5797
          }
        ]
      },
      {
        "category": "System, equipment & service",
        "count": 3845,
        "subcategories": [
          {
            "category": "system_performance",
            "count": 2350
          },
          {
            "category": "equipment_failure",
            "count": 692
          },
          {
            "category": "service_warranty",
            "count": 443
          },
          {
            "category": "technical_issue",
            "count": 360
          }
        ]
      },
      {
        "category": "Customer",
        "count": 2772,
        "subcategories": [
          {
            "category": "customer_communication",
            "count": 1665
          },
          {
            "category": "customer_complaint",
            "count": 1049
          },
          {
            "category": "legal_fraud",
            "count": 58
          }
        ]
      },
      {
        "category": "Cancellation",
        "count": 2320,
        "subcategories": [
          {
            "category": "cancellation",
            "count": 2320
          }
        ]
      },
      {
        "category": "Financing & payment",
        "count": 2060,
        "subcategories": [
          {
            "category": "financing",
            "count": 2060
          }
        ]
      },
      {
        "category": "Stalls & scheduling",
        "count": 1775,
        "subcategories": [
          {
            "category": "stall_delay",
            "count": 1359
          },
          {
            "category": "scheduling",
            "count": 416
          }
        ]
      },
      {
        "category": "Installation & site",
        "count": 1607,
        "subcategories": [
          {
            "category": "installation_issue",
            "count": 1095
          },
          {
            "category": "site_structural",
            "count": 512
          }
        ]
      },
      {
        "category": "Design & engineering",
        "count": 1032,
        "subcategories": [
          {
            "category": "design_engineering",
            "count": 1032
          }
        ]
      },
      {
        "category": "Inspection",
        "count": 1002,
        "subcategories": [
          {
            "category": "inspection_failure",
            "count": 1002
          }
        ]
      },
      {
        "category": "Permitting & compliance",
        "count": 925,
        "subcategories": [
          {
            "category": "permitting_compliance",
            "count": 925
          }
        ]
      },
      {
        "category": "Utility / interconnection",
        "count": 561,
        "subcategories": [
          {
            "category": "utility_interconnection",
            "count": 561
          }
        ]
      },
      {
        "category": "Other",
        "count": 521,
        "subcategories": [
          {
            "category": "other",
            "count": 521
          }
        ]
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
            "category": "Documentation & contract",
            "count": 213,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 213
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 121,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 68
              },
              {
                "category": "technical_issue",
                "count": 23
              },
              {
                "category": "equipment_failure",
                "count": 21
              },
              {
                "category": "service_warranty",
                "count": 9
              }
            ]
          },
          {
            "category": "Customer",
            "count": 65,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 39
              },
              {
                "category": "customer_complaint",
                "count": 24
              },
              {
                "category": "legal_fraud",
                "count": 2
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 50,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 39
              },
              {
                "category": "site_structural",
                "count": 11
              }
            ]
          },
          {
            "category": "Design & engineering",
            "count": 49,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 49
              }
            ]
          },
          {
            "category": "Financing & payment",
            "count": 49,
            "subcategories": [
              {
                "category": "financing",
                "count": 49
              }
            ]
          },
          {
            "category": "Cancellation",
            "count": 49,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 49
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 40,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 33
              },
              {
                "category": "scheduling",
                "count": 7
              }
            ]
          },
          {
            "category": "Permitting & compliance",
            "count": 37,
            "subcategories": [
              {
                "category": "permitting_compliance",
                "count": 37
              }
            ]
          },
          {
            "category": "Inspection",
            "count": 29,
            "subcategories": [
              {
                "category": "inspection_failure",
                "count": 29
              }
            ]
          },
          {
            "category": "Other",
            "count": 25,
            "subcategories": [
              {
                "category": "other",
                "count": 25
              }
            ]
          },
          {
            "category": "Utility / interconnection",
            "count": 8,
            "subcategories": [
              {
                "category": "utility_interconnection",
                "count": 8
              }
            ]
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
            "category": "Documentation & contract",
            "count": 560,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 560
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 404,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 264
              },
              {
                "category": "technical_issue",
                "count": 52
              },
              {
                "category": "equipment_failure",
                "count": 51
              },
              {
                "category": "service_warranty",
                "count": 37
              }
            ]
          },
          {
            "category": "Customer",
            "count": 211,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 118
              },
              {
                "category": "customer_complaint",
                "count": 88
              },
              {
                "category": "legal_fraud",
                "count": 5
              }
            ]
          },
          {
            "category": "Financing & payment",
            "count": 165,
            "subcategories": [
              {
                "category": "financing",
                "count": 165
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 159,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 109
              },
              {
                "category": "site_structural",
                "count": 50
              }
            ]
          },
          {
            "category": "Cancellation",
            "count": 148,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 148
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 133,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 103
              },
              {
                "category": "scheduling",
                "count": 30
              }
            ]
          },
          {
            "category": "Design & engineering",
            "count": 100,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 100
              }
            ]
          },
          {
            "category": "Permitting & compliance",
            "count": 91,
            "subcategories": [
              {
                "category": "permitting_compliance",
                "count": 91
              }
            ]
          },
          {
            "category": "Inspection",
            "count": 86,
            "subcategories": [
              {
                "category": "inspection_failure",
                "count": 86
              }
            ]
          },
          {
            "category": "Other",
            "count": 70,
            "subcategories": [
              {
                "category": "other",
                "count": 70
              }
            ]
          },
          {
            "category": "Utility / interconnection",
            "count": 45,
            "subcategories": [
              {
                "category": "utility_interconnection",
                "count": 45
              }
            ]
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
            "category": "Documentation & contract",
            "count": 1065,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 1065
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 695,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 424
              },
              {
                "category": "equipment_failure",
                "count": 113
              },
              {
                "category": "technical_issue",
                "count": 97
              },
              {
                "category": "service_warranty",
                "count": 61
              }
            ]
          },
          {
            "category": "Customer",
            "count": 394,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 222
              },
              {
                "category": "customer_complaint",
                "count": 166
              },
              {
                "category": "legal_fraud",
                "count": 6
              }
            ]
          },
          {
            "category": "Financing & payment",
            "count": 317,
            "subcategories": [
              {
                "category": "financing",
                "count": 317
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 301,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 208
              },
              {
                "category": "site_structural",
                "count": 93
              }
            ]
          },
          {
            "category": "Cancellation",
            "count": 292,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 292
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 238,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 179
              },
              {
                "category": "scheduling",
                "count": 59
              }
            ]
          },
          {
            "category": "Inspection",
            "count": 194,
            "subcategories": [
              {
                "category": "inspection_failure",
                "count": 194
              }
            ]
          },
          {
            "category": "Permitting & compliance",
            "count": 192,
            "subcategories": [
              {
                "category": "permitting_compliance",
                "count": 192
              }
            ]
          },
          {
            "category": "Design & engineering",
            "count": 178,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 178
              }
            ]
          },
          {
            "category": "Other",
            "count": 111,
            "subcategories": [
              {
                "category": "other",
                "count": 111
              }
            ]
          },
          {
            "category": "Utility / interconnection",
            "count": 110,
            "subcategories": [
              {
                "category": "utility_interconnection",
                "count": 110
              }
            ]
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
            "category": "Documentation & contract",
            "count": 2046,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 2046
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 1336,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 778
              },
              {
                "category": "equipment_failure",
                "count": 240
              },
              {
                "category": "technical_issue",
                "count": 185
              },
              {
                "category": "service_warranty",
                "count": 133
              }
            ]
          },
          {
            "category": "Customer",
            "count": 814,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 488
              },
              {
                "category": "customer_complaint",
                "count": 313
              },
              {
                "category": "legal_fraud",
                "count": 13
              }
            ]
          },
          {
            "category": "Financing & payment",
            "count": 763,
            "subcategories": [
              {
                "category": "financing",
                "count": 763
              }
            ]
          },
          {
            "category": "Cancellation",
            "count": 666,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 666
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 612,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 415
              },
              {
                "category": "site_structural",
                "count": 197
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 467,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 337
              },
              {
                "category": "scheduling",
                "count": 130
              }
            ]
          },
          {
            "category": "Design & engineering",
            "count": 425,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 425
              }
            ]
          },
          {
            "category": "Permitting & compliance",
            "count": 374,
            "subcategories": [
              {
                "category": "permitting_compliance",
                "count": 374
              }
            ]
          },
          {
            "category": "Inspection",
            "count": 363,
            "subcategories": [
              {
                "category": "inspection_failure",
                "count": 363
              }
            ]
          },
          {
            "category": "Other",
            "count": 212,
            "subcategories": [
              {
                "category": "other",
                "count": 212
              }
            ]
          },
          {
            "category": "Utility / interconnection",
            "count": 200,
            "subcategories": [
              {
                "category": "utility_interconnection",
                "count": 200
              }
            ]
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
