// AUTO-GENERATED ops-insights dataset — aggregates only, no PII.
// Source: solar-pipedrive-kpis notes-extraction pipeline (scripts/export-dashboard-data.py).
// Refresh by re-running that exporter; do not hand-edit.

export const OPS_INSIGHTS = {
  "generated": "2026-06-17",
  "dataFreshThrough": "2026-06-17",
  "source": "Solar Pipedrive notes-extraction pipeline (aggregates only, no PII)",
  "records": 11405,
  "funnel": {
    "totalJobs": 12296,
    "winRate": 75.8,
    "ptoReached": 8888,
    "cancelled": 2844,
    "resolved": 11732,
    "outcomes": [
      {
        "label": "Funding (AR)",
        "count": 4479
      },
      {
        "label": "Completed",
        "count": 3850
      },
      {
        "label": "In service",
        "count": 559
      },
      {
        "label": "Cancelled",
        "count": 2844
      },
      {
        "label": "In field",
        "count": 448
      },
      {
        "label": "Subcontract",
        "count": 116
      }
    ]
  },
  "redFlags": {
    "total": 24126,
    "records": 11405,
    "categories": [
      {
        "category": "Documentation & contract",
        "count": 5814,
        "subcategories": [
          {
            "category": "documentation_blocker",
            "count": 5814
          }
        ]
      },
      {
        "category": "System, equipment & service",
        "count": 3830,
        "subcategories": [
          {
            "category": "system_performance",
            "count": 2387
          },
          {
            "category": "equipment_failure",
            "count": 653
          },
          {
            "category": "service_warranty",
            "count": 436
          },
          {
            "category": "technical_issue",
            "count": 354
          }
        ]
      },
      {
        "category": "Customer",
        "count": 2755,
        "subcategories": [
          {
            "category": "customer_communication",
            "count": 1611
          },
          {
            "category": "customer_complaint",
            "count": 1085
          },
          {
            "category": "legal_fraud",
            "count": 59
          }
        ]
      },
      {
        "category": "Cancellation",
        "count": 2329,
        "subcategories": [
          {
            "category": "cancellation",
            "count": 2329
          }
        ]
      },
      {
        "category": "Financing & payment",
        "count": 2044,
        "subcategories": [
          {
            "category": "financing",
            "count": 2044
          }
        ]
      },
      {
        "category": "Stalls & scheduling",
        "count": 1749,
        "subcategories": [
          {
            "category": "stall_delay",
            "count": 1352
          },
          {
            "category": "scheduling",
            "count": 397
          }
        ]
      },
      {
        "category": "Installation & site",
        "count": 1604,
        "subcategories": [
          {
            "category": "installation_issue",
            "count": 1088
          },
          {
            "category": "site_structural",
            "count": 516
          }
        ]
      },
      {
        "category": "Design & engineering",
        "count": 1003,
        "subcategories": [
          {
            "category": "design_engineering",
            "count": 1003
          }
        ]
      },
      {
        "category": "Inspection",
        "count": 992,
        "subcategories": [
          {
            "category": "inspection_failure",
            "count": 992
          }
        ]
      },
      {
        "category": "Permitting & compliance",
        "count": 921,
        "subcategories": [
          {
            "category": "permitting_compliance",
            "count": 921
          }
        ]
      },
      {
        "category": "Utility / interconnection",
        "count": 566,
        "subcategories": [
          {
            "category": "utility_interconnection",
            "count": 566
          }
        ]
      },
      {
        "category": "Other",
        "count": 519,
        "subcategories": [
          {
            "category": "other",
            "count": 519
          }
        ]
      }
    ]
  },
  "cycleTimes": [
    {
      "key": "contract_to_pto",
      "label": "Contract \u2192 PTO",
      "median": 153,
      "mean": 261,
      "n": 3862
    },
    {
      "key": "permit_to_pto",
      "label": "Permit \u2192 PTO",
      "median": 104,
      "mean": 182,
      "n": 2887
    },
    {
      "key": "install_to_pto",
      "label": "Install \u2192 PTO",
      "median": 88,
      "mean": 176,
      "n": 3079
    },
    {
      "key": "contract_to_install",
      "label": "Contract \u2192 install",
      "median": 41,
      "mean": 70,
      "n": 3237
    },
    {
      "key": "permit_to_install",
      "label": "Permit \u2192 install",
      "median": 10,
      "mean": 26,
      "n": 2884
    },
    {
      "key": "job_install_time",
      "label": "Install start \u2192 finish",
      "median": 1,
      "mean": 7,
      "n": 2846
    }
  ],
  "cancellations": {
    "total": 2844,
    "medianDaysToCancel": 18.7,
    "ratePctOfResolved": 24.2,
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
    "events": 5806,
    "failures": 1518,
    "failRatePct": 26.1
  },
  "clawbackAtRisk": 1159,
  "windowAsOf": "2026-06-18",
  "windows": {
    "30": {
      "redFlags": {
        "total": 707,
        "records": 341,
        "categories": [
          {
            "category": "Documentation & contract",
            "count": 215,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 215
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 103,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 63
              },
              {
                "category": "technical_issue",
                "count": 18
              },
              {
                "category": "equipment_failure",
                "count": 13
              },
              {
                "category": "service_warranty",
                "count": 9
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 63,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 49
              },
              {
                "category": "site_structural",
                "count": 14
              }
            ]
          },
          {
            "category": "Customer",
            "count": 55,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 28
              },
              {
                "category": "customer_complaint",
                "count": 26
              },
              {
                "category": "legal_fraud",
                "count": 1
              }
            ]
          },
          {
            "category": "Financing & payment",
            "count": 48,
            "subcategories": [
              {
                "category": "financing",
                "count": 48
              }
            ]
          },
          {
            "category": "Cancellation",
            "count": 44,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 44
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 41,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 35
              },
              {
                "category": "scheduling",
                "count": 6
              }
            ]
          },
          {
            "category": "Design & engineering",
            "count": 39,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 39
              }
            ]
          },
          {
            "category": "Permitting & compliance",
            "count": 35,
            "subcategories": [
              {
                "category": "permitting_compliance",
                "count": 35
              }
            ]
          },
          {
            "category": "Inspection",
            "count": 28,
            "subcategories": [
              {
                "category": "inspection_failure",
                "count": 28
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
            "count": 11,
            "subcategories": [
              {
                "category": "utility_interconnection",
                "count": 11
              }
            ]
          }
        ]
      },
      "cycleTimes": [
        {
          "key": "contract_to_pto",
          "label": "Contract \u2192 PTO",
          "median": 63,
          "mean": 82,
          "n": 120
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 50,
          "mean": 66,
          "n": 120
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 44,
          "mean": 58,
          "n": 120
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 20,
          "mean": 24,
          "n": 81
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 5,
          "mean": 8,
          "n": 76
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 1,
          "n": 76
        }
      ]
    },
    "90": {
      "redFlags": {
        "total": 2157,
        "records": 858,
        "categories": [
          {
            "category": "Documentation & contract",
            "count": 559,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 559
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 394,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 261
              },
              {
                "category": "equipment_failure",
                "count": 47
              },
              {
                "category": "technical_issue",
                "count": 47
              },
              {
                "category": "service_warranty",
                "count": 39
              }
            ]
          },
          {
            "category": "Customer",
            "count": 199,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 107
              },
              {
                "category": "customer_complaint",
                "count": 88
              },
              {
                "category": "legal_fraud",
                "count": 4
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 175,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 121
              },
              {
                "category": "site_structural",
                "count": 54
              }
            ]
          },
          {
            "category": "Financing & payment",
            "count": 168,
            "subcategories": [
              {
                "category": "financing",
                "count": 168
              }
            ]
          },
          {
            "category": "Cancellation",
            "count": 149,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 149
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 131,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 104
              },
              {
                "category": "scheduling",
                "count": 27
              }
            ]
          },
          {
            "category": "Permitting & compliance",
            "count": 95,
            "subcategories": [
              {
                "category": "permitting_compliance",
                "count": 95
              }
            ]
          },
          {
            "category": "Design & engineering",
            "count": 86,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 86
              }
            ]
          },
          {
            "category": "Inspection",
            "count": 81,
            "subcategories": [
              {
                "category": "inspection_failure",
                "count": 81
              }
            ]
          },
          {
            "category": "Other",
            "count": 71,
            "subcategories": [
              {
                "category": "other",
                "count": 71
              }
            ]
          },
          {
            "category": "Utility / interconnection",
            "count": 49,
            "subcategories": [
              {
                "category": "utility_interconnection",
                "count": 49
              }
            ]
          }
        ]
      },
      "cycleTimes": [
        {
          "key": "contract_to_pto",
          "label": "Contract \u2192 PTO",
          "median": 79,
          "mean": 101,
          "n": 360
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 65,
          "mean": 79,
          "n": 354
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 57,
          "mean": 71,
          "n": 354
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 15,
          "mean": 47,
          "n": 230
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 4,
          "mean": 16,
          "n": 220
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 8,
          "n": 224
        }
      ]
    },
    "180": {
      "redFlags": {
        "total": 4098,
        "records": 1427,
        "categories": [
          {
            "category": "Documentation & contract",
            "count": 1070,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 1070
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 694,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 430
              },
              {
                "category": "equipment_failure",
                "count": 108
              },
              {
                "category": "technical_issue",
                "count": 96
              },
              {
                "category": "service_warranty",
                "count": 60
              }
            ]
          },
          {
            "category": "Customer",
            "count": 389,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 213
              },
              {
                "category": "customer_complaint",
                "count": 171
              },
              {
                "category": "legal_fraud",
                "count": 5
              }
            ]
          },
          {
            "category": "Financing & payment",
            "count": 322,
            "subcategories": [
              {
                "category": "financing",
                "count": 322
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 316,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 221
              },
              {
                "category": "site_structural",
                "count": 95
              }
            ]
          },
          {
            "category": "Cancellation",
            "count": 294,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 294
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 243,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 188
              },
              {
                "category": "scheduling",
                "count": 55
              }
            ]
          },
          {
            "category": "Permitting & compliance",
            "count": 193,
            "subcategories": [
              {
                "category": "permitting_compliance",
                "count": 193
              }
            ]
          },
          {
            "category": "Inspection",
            "count": 190,
            "subcategories": [
              {
                "category": "inspection_failure",
                "count": 190
              }
            ]
          },
          {
            "category": "Design & engineering",
            "count": 161,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 161
              }
            ]
          },
          {
            "category": "Utility / interconnection",
            "count": 115,
            "subcategories": [
              {
                "category": "utility_interconnection",
                "count": 115
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
          }
        ]
      },
      "cycleTimes": [
        {
          "key": "contract_to_pto",
          "label": "Contract \u2192 PTO",
          "median": 97,
          "mean": 120,
          "n": 677
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 77,
          "mean": 88,
          "n": 646
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 67,
          "mean": 77,
          "n": 647
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 18,
          "mean": 50,
          "n": 471
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 4,
          "mean": 13,
          "n": 454
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 1,
          "mean": 6,
          "n": 455
        }
      ]
    },
    "365": {
      "redFlags": {
        "total": 8244,
        "records": 2596,
        "categories": [
          {
            "category": "Documentation & contract",
            "count": 2045,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 2045
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 1330,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 789
              },
              {
                "category": "equipment_failure",
                "count": 230
              },
              {
                "category": "technical_issue",
                "count": 183
              },
              {
                "category": "service_warranty",
                "count": 128
              }
            ]
          },
          {
            "category": "Customer",
            "count": 802,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 467
              },
              {
                "category": "customer_complaint",
                "count": 323
              },
              {
                "category": "legal_fraud",
                "count": 12
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
            "count": 667,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 667
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 617,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 425
              },
              {
                "category": "site_structural",
                "count": 192
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 471,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 344
              },
              {
                "category": "scheduling",
                "count": 127
              }
            ]
          },
          {
            "category": "Design & engineering",
            "count": 403,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 403
              }
            ]
          },
          {
            "category": "Permitting & compliance",
            "count": 375,
            "subcategories": [
              {
                "category": "permitting_compliance",
                "count": 375
              }
            ]
          },
          {
            "category": "Inspection",
            "count": 355,
            "subcategories": [
              {
                "category": "inspection_failure",
                "count": 355
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
            "count": 204,
            "subcategories": [
              {
                "category": "utility_interconnection",
                "count": 204
              }
            ]
          }
        ]
      },
      "cycleTimes": [
        {
          "key": "contract_to_pto",
          "label": "Contract \u2192 PTO",
          "median": 89,
          "mean": 140,
          "n": 1210
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 69,
          "mean": 82,
          "n": 1083
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 58,
          "mean": 73,
          "n": 1086
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 24,
          "mean": 53,
          "n": 1058
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 6,
          "mean": 17,
          "n": 1034
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 5,
          "n": 1022
        }
      ]
    }
  }
} as const;

export type OpsInsights = typeof OPS_INSIGHTS;
