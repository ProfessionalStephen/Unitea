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
  "truckRolls": {
    "meanPerJob": 0.9,
    "jobs": 11405,
    "jobsWithAny": 4533
  },
  "reporting": {
    "clawbackActive": 50,
    "clawbackAtRiskTotal": 1159,
    "clawbackActiveByBoard": [
      {
        "board": "Net Metering",
        "jobs": 16
      },
      {
        "board": "Inspection",
        "jobs": 15
      },
      {
        "board": "Scheduling/Coordinating",
        "jobs": 10
      },
      {
        "board": "Permitting",
        "jobs": 5
      },
      {
        "board": "Engineering",
        "jobs": 2
      },
      {
        "board": "New Sale Board",
        "jobs": 1
      },
      {
        "board": "California",
        "jobs": 1
      }
    ],
    "windows": {
      "30": {
        "winRate": 86.8,
        "cancelRate": 13.2,
        "completed": 335,
        "cancelled": 51,
        "inspectionFailRate": 26.6,
        "inspectionEvents": 169
      },
      "60": {
        "winRate": 85,
        "cancelRate": 15,
        "completed": 693,
        "cancelled": 122,
        "inspectionFailRate": 28.4,
        "inspectionEvents": 335
      },
      "90": {
        "winRate": 85.3,
        "cancelRate": 14.7,
        "completed": 998,
        "cancelled": 172,
        "inspectionFailRate": 27.2,
        "inspectionEvents": 504
      },
      "180": {
        "winRate": 86.7,
        "cancelRate": 13.3,
        "completed": 2079,
        "cancelled": 319,
        "inspectionFailRate": 24.9,
        "inspectionEvents": 1167
      },
      "365": {
        "winRate": 85.7,
        "cancelRate": 14.3,
        "completed": 4311,
        "cancelled": 718,
        "inspectionFailRate": 25,
        "inspectionEvents": 2118
      }
    }
  },
  "windowAsOf": "2026-06-18",
  "windows": {
    "30": {
      "redFlags": {
        "total": 750,
        "records": 362,
        "categories": [
          {
            "category": "Documentation & contract",
            "count": 224,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 224
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 112,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 68
              },
              {
                "category": "technical_issue",
                "count": 20
              },
              {
                "category": "equipment_failure",
                "count": 14
              },
              {
                "category": "service_warranty",
                "count": 10
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 65,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 49
              },
              {
                "category": "site_structural",
                "count": 16
              }
            ]
          },
          {
            "category": "Customer",
            "count": 59,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 31
              },
              {
                "category": "customer_complaint",
                "count": 27
              },
              {
                "category": "legal_fraud",
                "count": 1
              }
            ]
          },
          {
            "category": "Financing & payment",
            "count": 50,
            "subcategories": [
              {
                "category": "financing",
                "count": 50
              }
            ]
          },
          {
            "category": "Cancellation",
            "count": 50,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 50
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 44,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 38
              },
              {
                "category": "scheduling",
                "count": 6
              }
            ]
          },
          {
            "category": "Design & engineering",
            "count": 41,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 41
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
            "count": 28,
            "subcategories": [
              {
                "category": "other",
                "count": 28
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
          "mean": 80,
          "n": 133
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 50,
          "mean": 65,
          "n": 132
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 44,
          "mean": 57,
          "n": 133
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 19,
          "mean": 23,
          "n": 86
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 5,
          "mean": 8,
          "n": 81
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 1,
          "n": 81
        }
      ]
    },
    "60": {
      "redFlags": {
        "total": 1460,
        "records": 622,
        "categories": [
          {
            "category": "Documentation & contract",
            "count": 392,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 392
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 248,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 162
              },
              {
                "category": "service_warranty",
                "count": 31
              },
              {
                "category": "technical_issue",
                "count": 28
              },
              {
                "category": "equipment_failure",
                "count": 27
              }
            ]
          },
          {
            "category": "Customer",
            "count": 130,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 74
              },
              {
                "category": "customer_complaint",
                "count": 53
              },
              {
                "category": "legal_fraud",
                "count": 3
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 118,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 84
              },
              {
                "category": "site_structural",
                "count": 34
              }
            ]
          },
          {
            "category": "Cancellation",
            "count": 111,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 111
              }
            ]
          },
          {
            "category": "Financing & payment",
            "count": 101,
            "subcategories": [
              {
                "category": "financing",
                "count": 101
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 91,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 78
              },
              {
                "category": "scheduling",
                "count": 13
              }
            ]
          },
          {
            "category": "Permitting & compliance",
            "count": 66,
            "subcategories": [
              {
                "category": "permitting_compliance",
                "count": 66
              }
            ]
          },
          {
            "category": "Design & engineering",
            "count": 64,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 64
              }
            ]
          },
          {
            "category": "Inspection",
            "count": 54,
            "subcategories": [
              {
                "category": "inspection_failure",
                "count": 54
              }
            ]
          },
          {
            "category": "Other",
            "count": 50,
            "subcategories": [
              {
                "category": "other",
                "count": 50
              }
            ]
          },
          {
            "category": "Utility / interconnection",
            "count": 35,
            "subcategories": [
              {
                "category": "utility_interconnection",
                "count": 35
              }
            ]
          }
        ]
      },
      "cycleTimes": [
        {
          "key": "contract_to_pto",
          "label": "Contract \u2192 PTO",
          "median": 73,
          "mean": 91,
          "n": 266
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 59,
          "mean": 75,
          "n": 261
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 53,
          "mean": 67,
          "n": 262
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 18,
          "mean": 44,
          "n": 153
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 4,
          "mean": 21,
          "n": 147
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 11,
          "n": 148
        }
      ]
    },
    "90": {
      "redFlags": {
        "total": 2179,
        "records": 859,
        "categories": [
          {
            "category": "Documentation & contract",
            "count": 565,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 565
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 398,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 263
              },
              {
                "category": "technical_issue",
                "count": 49
              },
              {
                "category": "equipment_failure",
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
            "count": 206,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 110
              },
              {
                "category": "customer_complaint",
                "count": 92
              },
              {
                "category": "legal_fraud",
                "count": 4
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 176,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 122
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
            "count": 150,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 150
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 133,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 105
              },
              {
                "category": "scheduling",
                "count": 28
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
            "count": 87,
            "subcategories": [
              {
                "category": "design_engineering",
                "count": 87
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
          "median": 80,
          "mean": 102,
          "n": 363
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 65,
          "mean": 79,
          "n": 357
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 57,
          "mean": 71,
          "n": 357
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 16,
          "mean": 47,
          "n": 232
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 4,
          "mean": 16,
          "n": 222
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 8,
          "n": 226
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
        "total": 8274,
        "records": 2609,
        "categories": [
          {
            "category": "Documentation & contract",
            "count": 2056,
            "subcategories": [
              {
                "category": "documentation_blocker",
                "count": 2056
              }
            ]
          },
          {
            "category": "System, equipment & service",
            "count": 1335,
            "subcategories": [
              {
                "category": "system_performance",
                "count": 791
              },
              {
                "category": "equipment_failure",
                "count": 231
              },
              {
                "category": "technical_issue",
                "count": 184
              },
              {
                "category": "service_warranty",
                "count": 129
              }
            ]
          },
          {
            "category": "Customer",
            "count": 806,
            "subcategories": [
              {
                "category": "customer_communication",
                "count": 470
              },
              {
                "category": "customer_complaint",
                "count": 324
              },
              {
                "category": "legal_fraud",
                "count": 12
              }
            ]
          },
          {
            "category": "Financing & payment",
            "count": 765,
            "subcategories": [
              {
                "category": "financing",
                "count": 765
              }
            ]
          },
          {
            "category": "Cancellation",
            "count": 670,
            "subcategories": [
              {
                "category": "cancellation",
                "count": 670
              }
            ]
          },
          {
            "category": "Installation & site",
            "count": 618,
            "subcategories": [
              {
                "category": "installation_issue",
                "count": 425
              },
              {
                "category": "site_structural",
                "count": 193
              }
            ]
          },
          {
            "category": "Stalls & scheduling",
            "count": 472,
            "subcategories": [
              {
                "category": "stall_delay",
                "count": 345
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
            "count": 356,
            "subcategories": [
              {
                "category": "inspection_failure",
                "count": 356
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
            "count": 206,
            "subcategories": [
              {
                "category": "utility_interconnection",
                "count": 206
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
          "n": 1212
        },
        {
          "key": "permit_to_pto",
          "label": "Permit \u2192 PTO",
          "median": 69,
          "mean": 82,
          "n": 1084
        },
        {
          "key": "install_to_pto",
          "label": "Install \u2192 PTO",
          "median": 58,
          "mean": 73,
          "n": 1087
        },
        {
          "key": "contract_to_install",
          "label": "Contract \u2192 install",
          "median": 24,
          "mean": 53,
          "n": 1059
        },
        {
          "key": "permit_to_install",
          "label": "Permit \u2192 install",
          "median": 6,
          "mean": 17,
          "n": 1035
        },
        {
          "key": "job_install_time",
          "label": "Install start \u2192 finish",
          "median": 0,
          "mean": 5,
          "n": 1023
        }
      ]
    }
  }
} as const;

export type OpsInsights = typeof OPS_INSIGHTS;
