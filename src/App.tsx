// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  BOARDS,
  INDUSTRY_BENCHMARK_DAYS,
  RT,
  PERMISSIONS,
  canAccess,
  boardsForRole as mB,
  kpisForRole as mK,
  ADMIN_EMAILS,
  TEAM_INIT,
  KPI_INIT,
  PD_FIELDS_FLAT,
} from "../shared/domain";
import { resolveKpi, viewFromFrontend } from "../shared/kpi";
import { mapPullResponse } from "./data/pull-response";
import { BarChart, LineChart, DonutChart } from "./charts";
import { chartColors } from "./chart-utils";
import { OPS_INSIGHTS } from "./data/ops-insights";
import { KPI_TARGETS, DELTA_CARD_KEYS, CANCELLATIONS_PER_MONTH_TARGET } from "../shared/domain/kpi-targets";
import { dmy, dmyTime, monthYear } from "./format";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// THEME
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Theme is driven by CSS variables in tokens.css. TH maps the legacy `th.*` keys onto those
// semantic tokens, so every existing inline style is now token-backed and the theme switches via a
// class on the root (.theme-dark / .theme-light) — no per-object swap. Gate-verified (design/foundation*).
const TH={bg:"var(--bg-canvas)",card:"var(--bg-surface)",cardSolid:"var(--bg-surface)",border:"var(--border-subtle)",borderPlain:"var(--border-subtle)",text:"var(--fg-default)",textMuted:"var(--fg-muted)",inputBg:"var(--input-bg)",inputBorder:"var(--input-border)",tabBg:"var(--bg-component)",tabBorder:"var(--border-subtle)",selectText:"var(--fg-default)",selectBg:"var(--bg-component)"};
const C={orange:"#F28F1D",orangeDeep:"#D4721A",green:"#22C55E",amber:"#F59E0B",red:"#EF4444",blue:"#1D6FB5",purple:"#A855F7"};

// BOARDS + INDUSTRY_BENCHMARK_DAYS imported from ../shared/domain

const RANGES=["Week over week","Month over month","Quarter over quarter","Year over year"];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DATA MODEL â€” derived view of pipelineData; domain constants imported from ../shared/domain
function buildPipelineData(liveApiData) {
  var boardNames=Object.keys(BOARDS);
  var boards={};
  var totalActiveJobs=0;
  var totalStuck=0;
  var allDeals=[];

  boardNames.forEach(function(bName) {
    var cfg=BOARDS[bName];
    var stages={};
    var boardTotalJobs=0;
    var boardTotalDays=0;
    var boardStuck=0;

    cfg.stages.forEach(function(sName) {
      var threshold=cfg.rotting[sName]||null;
      var liveStage=null;
      if(liveApiData&&liveApiData.boardData&&liveApiData.boardData[bName]) {
        var lb=liveApiData.boardData[bName];
        liveStage=lb.stages?lb.stages.find(function(s){return s.name&&s.name.toLowerCase()===sName.toLowerCase();}):null;
      }

      // Only show stage data when it's real. No simulated jobCount/avgDays.
      var jobCount=liveStage?liveStage.count:0;
      var avgDays=liveStage?parseFloat(liveStage.avgDays):0;
      var stageTotalValue=liveStage?parseFloat(liveStage.totalValue||0):0;
      var deals=[];

      if(liveStage&&liveStage.deals) {
        deals=liveStage.deals.map(function(d) {
          return {id:d.id,name:d.name||d.title||"Unknown",address:"",days:d.days,rep:d.ownerName||"Unassigned",pipedriveUrl:d.url||d.pipedriveUrl,notes:[],flags:d.days>(threshold||999)?["Past rotting threshold"]:[]};
        });
      }

      var stuckCount=deals.filter(function(d){return threshold&&d.days>threshold;}).length;
      boardTotalJobs+=jobCount;
      boardTotalDays+=avgDays*jobCount;
      boardStuck+=stuckCount;
      deals.forEach(function(d){allDeals.push(Object.assign({},d,{board:bName,stage:sName}));});

      stages[sName]={name:sName,jobCount:jobCount,avgDays:parseFloat(avgDays.toFixed(1)),threshold:threshold,stuckCount:stuckCount,totalValue:stageTotalValue,deals:deals};
    });

    var boardAvgDays=boardTotalJobs>0?parseFloat((boardTotalDays/boardTotalJobs).toFixed(1)):0;
    var boardTotalValue=Object.values(stages).reduce(function(sum,s){return sum+(s.totalValue||0);},0);
    // Status now derived from real stuck count vs total â€” not random
    var stuckRatio=boardTotalJobs>0?boardStuck/boardTotalJobs:0;
    var status=stuckRatio>=0.2?"red":stuckRatio>=0.05?"amber":"green";
    totalActiveJobs+=boardTotalJobs;
    totalStuck+=boardStuck;

    boards[bName]={name:bName,region:cfg.region,jobCount:boardTotalJobs,avgDays:boardAvgDays,stuckCount:boardStuck,totalValue:boardTotalValue,status:status,stages:stages,live:!!(liveApiData&&liveApiData.boardData&&liveApiData.boardData[bName])};
  });

  // End-to-end: sum of board averages (only boards with deals)
  var endToEndDays=Object.values(boards).reduce(function(sum,b){return sum+(b.jobCount>0?b.avgDays:0);},0);

  // Bottleneck detection: stages where avgDays significantly exceeds the board's average
  // Real definition: avgDays >= 1.5x board avg, minimum 7 days, must have at least 1 deal.
  var bottlenecks=[];
  Object.values(boards).forEach(function(b) {
    if(b.jobCount===0||b.avgDays===0)return;
    var threshold=Math.max(7,b.avgDays*1.5);
    Object.values(b.stages).forEach(function(s) {
      if(s.jobCount>0&&s.avgDays>=threshold) {
        bottlenecks.push({
          board:b.name,
          stage:s.name,
          stuckCount:s.jobCount,
          avgDays:s.avgDays,
          boardAvg:b.avgDays,
          pctAbove:b.avgDays>0?Math.round(((s.avgDays-b.avgDays)/b.avgDays)*100):0
        });
      }
    });
  });
  bottlenecks.sort(function(a,b){return b.pctAbove-a.pctAbove;});

  // Rep stats from real allDeals data only (real owner names come from Pipedrive)
  var repStats={};
  allDeals.forEach(function(d) {
    var rep=d.rep||"Unassigned";
    if(!repStats[rep])repStats[rep]={rep:rep,jobCount:0,totalDays:0};
    repStats[rep].jobCount++;
    repStats[rep].totalDays+=d.days||0;
  });
  Object.values(repStats).forEach(function(r:any){
    r.avgDays=r.jobCount>0?parseFloat((r.totalDays/r.jobCount).toFixed(1)):0;
  });

  // Pull aggregate fields from liveApiData (computed in api/_lib/pipedrive.ts)
  var live=liveApiData||{};
  return {
    boards:boards,
    totalActiveJobs:totalActiveJobs,
    totalStuck:totalStuck,
    endToEndDays:parseFloat(endToEndDays.toFixed(1)),
    bottlenecks:bottlenecks,
    repStats:repStats,
    allDeals:allDeals,
    isLive:!!liveApiData,
    // Live aggregates (undefined when no live data â€” resolver falls back)
    totalPipelineValue:live.totalPipelineValue,
    wonThisWeek:live.wonThisWeek,
    wonThisWeekValue:live.wonThisWeekValue,
    wonLast30d:live.wonLast30d,
    lostLast30d:live.lostLast30d,
    lostLast30dValue:live.lostLast30dValue,
    cancellationRate30d:live.cancellationRate30d,
    activitiesDueToday:live.activitiesDueToday,
    activitiesOverdue:live.activitiesOverdue,
    callsDueToday:live.callsDueToday,
  };
}

// PERMISSIONS, canAccess, RT, mB (boardsForRole), mK (kpisForRole),
// TEAM_INIT, KPI_INIT all imported from ../shared/domain at top of file.

const AUDIT_INIT: Array<{id:number;ts:string;user:string;action:string;detail:string;type:string;draft:boolean}>=[];

const RALPH_INIT: Array<{id:number;ts:string;reporter:string;issue:string;kpi:string;status:string;stage:string;correction:string;aiNote:string}>=[];

const RALPH_STAGES=[
  {stage:"R - Reported",desc:"Issue flagged by a user",col:C.red},
  {stage:"A - Annotating",desc:"AI Engineer reviewing and documenting",col:C.amber},
  {stage:"L - Learning",desc:"Correction being mapped to system rules",col:C.blue},
  {stage:"P - Patched",desc:"Fix applied and deployed",col:C.orange},
  {stage:"H - Hardened",desc:"Stress-tested and permanently locked in",col:C.green},
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PIPEDRIVE FETCH
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function valKey(k){if(!k||k.length<20)return "Key too short";if(!/^[a-f0-9]+$/i.test(k))return "Invalid characters";return null;}
async function fetchPD(_apiKey,setErr,setHealth){
  setErr(null);
  try{
    var res=await fetch("/api/pipedrive/pull",{method:"POST",headers:{"Content-Type":"application/json"}});
    var p=await res.json();
    if(!res.ok||!p.success){var msg=p.error||("HTTP "+res.status);setErr("Pipedrive: "+msg);setHealth(function(h){return Object.assign({},h,{pd:res.status===401?"invalid key":"unreachable"});});return null;}
    setHealth(function(h){return Object.assign({},h,{pd:"connected",lastPull:new Date().toLocaleTimeString()});});
    return mapPullResponse(p);
  }catch(err:any){setErr("Request failed: "+err.message);setHealth(function(h){return Object.assign({},h,{pd:"request failed"});});return null;}
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// EMAIL TEMPLATE ENGINE
// Fixed structure â€” AI fills content only
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// KPI VALUE RESOLVER â€” delegates to shared/kpi/resolver
// Wraps adapter call + resolver for code-site convenience.
// One source of truth shared with cron (api/cron/send-briefings.ts).
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function resolveKpiValue(tag, pd) {
  if (!tag) return "â€”";
  return resolveKpi(tag.name, tag, viewFromFrontend(pd));
}

// Build KPI table HTML from pipelineData â€” no AI, guaranteed layout
function buildKpiTableHtml(person, pd, kpiTags, _liveApiData) {
  var kpis = person.kpis.map(function(k) {
    var tag = kpiTags.find(function(t) { return t.name === k; });
    var val = tag ? resolveKpiValue(tag, pd) : "â€”";
    return {name: k, val: val};
  });

  // Build rows of 3
  var rows = "";
  for (var i = 0; i < kpis.length; i += 3) {
    var cells = "";
    for (var j = i; j < Math.min(i + 3, kpis.length); j++) {
      cells += "<td width='33%' style='padding:4px;'>"
        + "<div style='background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;text-align:center;'>"
        + "<p style='margin:0 0 4px;font-size:11px;color:#897C80;font-family:Arial,sans-serif;'>" + kpis[j].name + "</p>"
        + "<p style='margin:0;font-size:18px;font-weight:500;color:#F0F0F0;font-family:Arial,sans-serif;'>" + kpis[j].val + "</p>"
        + "</div></td>";
    }
    // Pad last row if odd
    var remaining = (i + 3) - kpis.length;
    if (remaining > 0 && remaining < 3) {
      for (var p = 0; p < remaining; p++) cells += "<td width='33%' style='padding:4px;'></td>";
    }
    rows += "<tr>" + cells + "</tr>";
  }
  return "<table width='100%' cellpadding='0' cellspacing='0' border='0'>" + rows + "</table>";
}

// Build needs attention HTML from bottlenecks + AI text
function buildNeedsAttentionHtml(alerts, pd) {
  var rows = alerts.map(function(alert, i) {
    var bn = pd.bottlenecks[i];
    var pdUrl = bn ? "https://app.pipedrive.com/deals/?filter_id=" + encodeURIComponent(bn.board) : "https://app.pipedrive.com";
    return "<div style='margin-bottom:8px;padding:10px 14px;background:rgba(239,68,68,0.07);border-left:3px solid #EF4444;border-radius:0 8px 8px 0;'>"
      + "<p style='margin:0 0 4px;font-size:13px;color:#F0F0F0;font-family:Arial,sans-serif;'>" + alert + "</p>"
      + "<a href='" + pdUrl + "' style='font-size:11px;color:#4A9EE0;text-decoration:none;font-family:Arial,sans-serif;'>View in Pipedrive &rarr;</a>"
      + "</div>";
  }).join("");
  return rows;
}

// Master template assembler â€” fixed structure, no variation
function assembleEmail(person, content, kpiTableHtml, needsAttentionHtml, boardHealthHtml, isMonday, isOwnerLevel) {
  var divider = "<div style='height:1px;background:rgba(255,255,255,0.08);margin:0;'></div>";
  var sectionStyle = "padding:18px 22px;background:#24262B;";
  var headerStyle = "margin:0 0 12px;font-size:14px;font-weight:500;color:#F28F1D;font-family:Arial,sans-serif;";
  var bodyStyle = "font-size:13px;color:#F0F0F0;font-family:Arial,sans-serif;line-height:1.6;";

  var sections = [
    // S1 â€” Greeting
    "<div style='" + sectionStyle + "background:#1E2228;'>"
    + "<p style='" + bodyStyle + "margin:0;'>" + (content.greeting || "") + "</p>"
    + "</div>",

    divider,

    // S2 â€” KPIs (built entirely from data, no AI)
    "<div style='" + sectionStyle + "'>"
    + "<p style='" + headerStyle + "'>Your KPIs today</p>"
    + kpiTableHtml
    + "</div>",

    divider,

    // S3 â€” Needs attention (AI text + code-built links)
    "<div style='" + sectionStyle + "background:#1E2228;'>"
    + "<p style='" + headerStyle + "'>Needs attention</p>"
    + needsAttentionHtml
    + "</div>",

    divider,

    // S4 â€” Board health (built entirely from pipelineData, always here, always standalone)
    person.nested ? boardHealthHtml : null,
    person.nested ? divider : null,

    // S5 â€” Today's priorities (AI text)
    "<div style='" + sectionStyle + "'>"
    + "<p style='" + headerStyle + "'>Today's priorities</p>"
    + (content.priorities || []).map(function(p, i) {
        return "<div style='display:flex;gap:10px;margin-bottom:8px;align-items:flex-start;'>"
          + "<span style='font-size:13px;color:#F28F1D;font-family:Arial,sans-serif;font-weight:500;flex-shrink:0;'>" + (i+1) + ".</span>"
          + "<p style='margin:0;font-size:13px;color:#F0F0F0;font-family:Arial,sans-serif;'>" + p + "</p>"
          + "</div>";
      }).join("")
    + "</div>",

    // S6 â€” Team pulse (owners only)
    isOwnerLevel && content.teamPulse ? divider : null,
    isOwnerLevel && content.teamPulse
      ? "<div style='" + sectionStyle + "background:#1E2228;'>"
        + "<p style='" + headerStyle + "'>Team pulse</p>"
        + "<p style='margin:0;" + bodyStyle + "'>" + content.teamPulse + "</p>"
        + "</div>"
      : null,

    // S7 â€” Week in review (Mondays)
    isMonday && content.weekReview ? divider : null,
    isMonday && content.weekReview
      ? "<div style='" + sectionStyle + "'>"
        + "<p style='" + headerStyle + "'>Week in review</p>"
        + "<p style='margin:0;" + bodyStyle + "'>" + content.weekReview + "</p>"
        + "</div>"
      : null,

    divider,

    // Footer â€” hardcoded
    "<div style='padding:14px 22px;background:#141618;text-align:center;'>"
    + "<p style='margin:0 0 6px;font-size:11px;color:#897C80;font-family:Arial,sans-serif;'>"
    + "<a href='mailto:ai@unicitysolar.com?subject=Snooze alert - " + person.name + "' style='color:#897C80;margin:0 8px;'>Snooze alerts</a>"
    + "&middot;"
    + "<a href='mailto:ai@unicitysolar.com?subject=KPI Report - " + person.name + "' style='color:#897C80;margin:0 8px;'>Flag an issue</a>"
    + "</p>"
    + "<p style='margin:0;font-size:11px;color:#4A5568;font-family:Arial,sans-serif;'>Read-only system &middot; Unicity Solar Energy &middot; " + dmy(new Date()) + "</p>"
    + "</div>",
  ].filter(function(s) { return s !== null && s !== undefined; });

  return "<div style='max-width:600px;margin:0 auto;background:#24262B;border-radius:12px;overflow:hidden;border:1px solid rgba(242,143,29,0.2);'>"
    + sections.join("")
    + "</div>";
}

// Escape HTML special chars to prevent injection in email body.
function escHtml(s){
  if(s===null||s===undefined)return "";
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

// Role-aware default priorities. Deterministic â€” no AI needed.
function getPriorities(person,pd){
  var stuck=pd.totalStuck||0;
  var role=(person.role||"").toLowerCase();
  var base=[];
  if(role.indexOf("owner")>=0||role.indexOf("ceo")>=0||role.indexOf("coo")>=0||role.indexOf("vp")>=0){
    base=[
      "Review top 3 bottlenecks with relevant managers",
      stuck>0?("Address "+stuck+" stuck deals across all boards"):"Maintain current pipeline velocity",
      "Check team workload distribution"
    ];
  }else if(role.indexOf("sales")>=0){
    base=["Follow up on stale leads (>14 days no activity)","Review weekly conversion metrics","Coordinate with Installation on hand-off readiness"];
  }else if(role.indexOf("install")>=0||role.indexOf("warehouse")>=0||role.indexOf("operations")>=0){
    base=["Confirm today's installation schedule","Check material availability for next 5 jobs","Review safety/permit status for active jobs"];
  }else if(role.indexOf("finance")>=0){
    base=["Review M1/M2/M3 invoice status","Reconcile prior week payments","Flag any aging receivables >30 days"];
  }else if(role.indexOf("engineer")>=0||role.indexOf("design")>=0){
    base=["Review pending design queue","Address engineering revisions","Coordinate utility submission status"];
  }else{
    base=["Review your KPIs above","Address items in 'Needs attention'","Coordinate with your manager on blockers"];
  }
  return base;
}

// Build standalone board health block injected into preview emails for nested-access roles.
// Uses pipelineData directly â€” no AI.
function buildEmailHealthSection(pd, memberBoards) {
  var boards=(memberBoards||[]).filter(function(b){return pd.boards[b];});
  var sorted=boards.slice().sort(function(a,b){var o={red:0,amber:1,green:2};var sa=pd.boards[a]?pd.boards[a].status:"green";var sb=pd.boards[b]?pd.boards[b].status:"green";return(o[sa]||2)-(o[sb]||2);});
  var gc=boards.filter(function(b){return pd.boards[b]&&pd.boards[b].status==="green";}).length;
  var ac=boards.filter(function(b){return pd.boards[b]&&pd.boards[b].status==="amber";}).length;
  var rc=boards.filter(function(b){return pd.boards[b]&&pd.boards[b].status==="red";}).length;
  var top3=pd.bottlenecks.slice(0,3);

  var boardCards=sorted.map(function(bName){
    var b=pd.boards[bName];if(!b)return"";
    var col=b.status==="green"?"#22C55E":b.status==="amber"?"#F59E0B":"#EF4444";
    var icon=b.status==="green"?"&#9679;":b.status==="amber"?"&#9650;":"&#10005;";
    var topStage=Object.values(b.stages).sort(function(a,b){return b.stuckCount-a.stuckCount;})[0];
    var stageInfo=topStage&&topStage.stuckCount>0?"Top stuck: "+topStage.name+" ("+topStage.stuckCount+" deals, avg "+topStage.avgDays+"d)":"No stuck jobs";
    return "<div style='width:100%;margin-bottom:7px;'>"
      +"<details style='border-radius:8px;overflow:hidden;border:1px solid "+col+"40;'>"
      +"<summary style='padding:10px 14px;background:"+col+"15;cursor:pointer;list-style:none;font-family:Arial,sans-serif;'>"
      +"<table width='100%' cellpadding='0' cellspacing='0' border='0'><tr>"
      +"<td style='color:"+col+";font-size:13px;font-weight:500;'>"+icon+" "+bName+" &mdash; "+b.jobCount+" jobs</td>"
      +"<td style='text-align:right;color:"+col+";font-size:11px;'>"+b.avgDays+"d avg &middot; "+b.stuckCount+" stuck &#9662;</td>"
      +"</tr></table></summary>"
      +"<div style='padding:10px 14px;background:#1E2228;font-family:Arial,sans-serif;'>"
      +"<p style='margin:0 0 5px;font-size:11px;color:#897C80;'>"+stageInfo+"</p>"
      +"<p style='margin:0;font-size:11px;color:#897C80;'>Avg days in board: "+b.avgDays+"d &middot; "+b.jobCount+" jobs &middot; "+b.stuckCount+" past rotting threshold</p>"
      +"</div></details></div>";
  }).join("");

  var bottleneckRows=top3.map(function(bn){
    return "<tr><td style='padding:5px 8px;font-size:11px;color:#F0F0F0;font-family:Arial,sans-serif;'>"+bn.board+"</td>"
      +"<td style='padding:5px 8px;font-size:11px;color:#897C80;font-family:Arial,sans-serif;'>"+bn.stage+"</td>"
      +"<td style='padding:5px 8px;font-size:11px;color:#EF4444;font-family:Arial,sans-serif;text-align:right;'>"+bn.avgDays+"d ("+bn.pctAbove+"% above avg)</td></tr>";
  }).join("");

  var sumRow="<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:14px;'><tr>"
    +"<td width='32%' style='text-align:center;padding:9px 6px;background:rgba(34,197,94,0.1);border-radius:8px;border:1px solid rgba(34,197,94,0.25);'><p style='margin:0;font-size:20px;font-weight:500;color:#22C55E;font-family:Arial,sans-serif;'>"+gc+"</p><p style='margin:3px 0 0;font-size:11px;color:#22C55E;font-family:Arial,sans-serif;'>&#9679; Healthy</p></td>"
    +"<td width='4%'></td>"
    +"<td width='28%' style='text-align:center;padding:9px 6px;background:rgba(245,158,11,0.1);border-radius:8px;border:1px solid rgba(245,158,11,0.25);'><p style='margin:0;font-size:20px;font-weight:500;color:#F59E0B;font-family:Arial,sans-serif;'>"+ac+"</p><p style='margin:3px 0 0;font-size:11px;color:#F59E0B;font-family:Arial,sans-serif;'>&#9650; Watch</p></td>"
    +"<td width='4%'></td>"
    +"<td width='32%' style='text-align:center;padding:9px 6px;background:rgba(239,68,68,0.1);border-radius:8px;border:1px solid rgba(239,68,68,0.25);'><p style='margin:0;font-size:20px;font-weight:500;color:#EF4444;font-family:Arial,sans-serif;'>"+rc+"</p><p style='margin:3px 0 0;font-size:11px;color:#EF4444;font-family:Arial,sans-serif;'>&#10005; Critical</p></td>"
    +"</tr></table>";

  return "<div style='margin:0;padding:18px 22px;background:#1A1D22;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);'>"
    +"<p style='margin:0 0 12px;font-size:15px;font-weight:500;color:#F28F1D;font-family:Arial,sans-serif;'>Board health overview</p>"
    +sumRow
    +"<div style='width:100%;margin-bottom:14px;'>"+boardCards+"</div>"
    +(top3.length>0?"<p style='margin:0 0 7px;font-size:12px;font-weight:500;color:#F28F1D;font-family:Arial,sans-serif;'>Top bottlenecks this period</p>"
    +"<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:rgba(239,68,68,0.06);border-radius:8px;border:1px solid rgba(239,68,68,0.2);'>"+bottleneckRows+"</table>":"")
    +"<p style='margin:10px 0 0;font-size:11px;color:#897C80;text-align:center;font-family:Arial,sans-serif;'>End-to-end pipeline avg: "+pd.endToEndDays+" days &middot; Industry benchmark: "+INDUSTRY_BENCHMARK_DAYS+" days</p>"
    +"</div>";
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DOWNLOAD HELPERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function dlCSV(data,fn){if(!data.length)return;var k=Object.keys(data[0]);var csv=[k.join(",")].concat(data.map(function(r){return k.map(function(key){return '"'+(String(r[key]||"")).replace(/"/g,'""')+'"';}).join(",");})).join("\n");var a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download=fn;a.click();}
function dlJSON(data,fn){var a=document.createElement("a");a.href="data:application/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(data,null,2));a.download=fn;a.click();}
function todayStr(){return new Date().toISOString().split("T")[0];}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// UI ATOMS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UniLogo(){return <img src="/Unicity_Solar_Logo_only.png" alt="Unicity Solar" width="42" height="42" style={{display:"block"}}/>;}
function Avatar({name,size=36}){var ini=name.split(" ").map(function(w){return w[0];}).join("").slice(0,2).toUpperCase();var bg=name.charCodeAt(0)%2===0?C.orange:C.blue;return <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:500,fontSize:size*0.33,flexShrink:0,border:"2px solid "+bg+"44"}}>{ini}</div>;}
function Pill({text,color="orange",size=11}){var fg=color==="green"?C.green:color==="red"?C.red:color==="amber"?C.amber:color==="blue"?C.blue:color==="purple"?C.purple:C.orange;return <span style={{background:fg+"18",color:fg,border:"1px solid "+fg+"44",fontSize:size,fontWeight:500,padding:"3px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{text}</span>;}
function SLabel({icon,text}){return <p style={{fontSize:12,fontWeight:500,color:C.orange,letterSpacing:"0.4px",margin:"0 0 10px",display:"flex",alignItems:"center",gap:6}}><i className={"ti "+icon} aria-hidden="true"/>{text}</p>;}
function SubTab({tabs,active,onChange,th}){return <div style={{display:"flex",gap:4,marginBottom:"1.25rem",background:th.tabBg,border:"1px solid "+th.tabBorder,borderRadius:12,padding:3}}>{tabs.map(function(t){return <button key={t} onClick={function(){onChange(t);}} style={{flex:1,padding:"7px 4px",border:"none",borderRadius:9,background:active===t?C.orange+"22":"transparent",color:active===t?C.orange:th.textMuted,fontWeight:active===t?500:400,fontSize:12,cursor:"pointer"}}>{t}</button>;})}</div>;}
function SDot({on}){return <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:on?C.green:C.orange,boxShadow:on?"0 0 6px "+C.green:"0 0 6px "+C.orange,marginRight:6}}/>;}
function RBadge({role}){var t=RT[role];var fg=t?t.color:"#897C80";return <span style={{background:fg+"18",color:fg,border:"1px solid "+fg+"44",fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{role}</span>;}

// Compact pill version of the cron status â€” sits in the header
function CronStatusPill({status}){
  if(status.loading)return <div style={{display:"flex",alignItems:"center",gap:5,background:"#6B626622",border:"1px solid #6B626644",borderRadius:20,padding:"5px 12px"}}><span style={{color:"#897C80",fontSize:10}}>â—</span><span style={{fontSize:11,color:"#897C80"}}>Checking...</span></div>;
  var mode=status.mode||"unknown";
  var clr=mode==="live"?C.green:mode==="test"?C.amber:mode==="paused"?C.red:"#897C80";
  var label=mode==="live"?"Emails LIVE":mode==="test"?"TEST MODE":mode==="paused"?"PAUSED":"Status unknown";
  return <div title={status.reason||""} style={{display:"flex",alignItems:"center",gap:5,background:clr+"18",border:"1px solid "+clr+"44",borderRadius:20,padding:"5px 12px"}}><span style={{color:clr,fontSize:10}}>â—</span><span style={{fontSize:11,color:clr,fontWeight:500}}>{label}</span></div>;
}

// Full-width banner â€” recipient list, next run, control hints
function CronStatusBanner({status,th}){
  if(status.loading)return null;
  if(status.error)return <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1rem",padding:"10px 16px",borderRadius:12,background:C.red+"10",border:"1px solid "+C.red+"44"}}>
    <div style={{width:12,height:12,borderRadius:"50%",background:C.red,flexShrink:0}}/>
    <div style={{flex:1}}><p style={{margin:0,fontSize:13,fontWeight:500,color:C.red}}>Cron status unavailable</p><p style={{margin:"2px 0 0",fontSize:11,color:th.textMuted}}>{status.error}</p></div>
  </div>;
  var mode=status.mode||"unknown";
  var clr=mode==="live"?C.green:mode==="test"?C.amber:mode==="paused"?C.red:"#897C80";
  var headline=mode==="live"?"Briefings sending live â€” "+status.recipientCount+" recipients":mode==="test"?"TEST MODE â€” single recipient only":mode==="paused"?"Briefings PAUSED â€” no emails will send":"Status unknown";
  var recipientLine=status.recipients&&status.recipients.length>0
    ?status.recipients.map(function(r){return r.name;}).join(", ")
    :(mode==="paused"?"Nothing scheduled":"No recipients configured");
  return <div style={{marginBottom:"1rem",padding:"12px 16px",borderRadius:12,background:clr+"10",border:"2px solid "+clr+"44"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div style={{width:14,height:14,borderRadius:"50%",background:clr,boxShadow:"0 0 12px "+clr,flexShrink:0}}/>
      <div style={{flex:1,minWidth:260}}>
        <p style={{margin:"0 0 1px",fontSize:10,fontWeight:600,letterSpacing:0.4,textTransform:"uppercase",color:th.textMuted}}>Daily Pipedrive Sync &amp; Briefing</p>
        <p style={{margin:0,fontSize:14,fontWeight:600,color:clr}}>{headline}</p>
        <p style={{margin:"3px 0 0",fontSize:11,color:th.textMuted,lineHeight:1.5}}>
          Next run: <span style={{color:th.text}}>{status.nextRunLabel||"unknown"}</span> Â· {status.cronScheduleUtc||""}
          {status.reason?" Â· "+status.reason:""}
        </p>
        <p style={{margin:"3px 0 0",fontSize:11,color:th.textMuted,lineHeight:1.5}}>
          Recipients: <span style={{color:th.text}}>{recipientLine}</span>
        </p>
      </div>
      <div style={{fontSize:10,color:th.textMuted,maxWidth:280,lineHeight:1.4}}>
        Controls live in Vercel Settings â†’ Environment Variables.
        <br/><code style={{color:clr}}>EMAILS_PAUSED=true</code> to pause Â· <code style={{color:clr}}>CRON_TEST_RECIPIENT=&lt;email&gt;</code> for solo test
      </div>
    </div>
  </div>;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DEAL CARD â€” reused across all drill-downs
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DealCard({deal,threshold,th}){
  var [open,setOpen]=useState(false);
  var over=threshold&&deal.days>threshold;
  return <div style={{background:th.inputBg,border:"1px solid "+(over?C.red+"55":th.borderPlain),borderRadius:9,overflow:"hidden",marginBottom:4}}>
    <button onClick={function(){setOpen(!open);}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
      <div style={{flex:1}}>
        <p style={{margin:0,fontSize:12,fontWeight:500,color:th.text}}>{deal.name}</p>
        <p style={{margin:0,fontSize:11,color:th.textMuted}}>{deal.stage} &middot; {deal.board}</p>
      </div>
      <span style={{fontSize:12,fontWeight:500,color:over?C.red:C.green}}>{deal.days}d</span>
      <span style={{fontSize:11,color:th.textMuted}}>{deal.rep}</span>
      <a href={deal.pipedriveUrl} target="_blank" rel="noopener noreferrer" onClick={function(e){e.stopPropagation();}} style={{fontSize:11,color:C.blue,background:C.blue+"18",padding:"1px 6px",borderRadius:5,textDecoration:"none",border:"1px solid "+C.blue+"33"}}>PD</a>
      <i className={"ti ti-chevron-"+(open?"up":"down")} style={{color:th.textMuted,fontSize:11}} aria-hidden="true"/>
    </button>
    {open&&<div style={{borderTop:"1px solid "+th.borderPlain,padding:"8px 10px"}}>
      <p style={{margin:"0 0 6px",fontSize:11,color:th.textMuted}}>{deal.address}</p>
      {deal.flags&&deal.flags.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>{deal.flags.map(function(f){return <span key={f} style={{fontSize:11,color:C.amber,background:C.amber+"15",padding:"1px 6px",borderRadius:5}}>! {f}</span>;})}</div>}
      <p style={{margin:"0 0 5px",fontSize:11,color:th.textMuted,letterSpacing:"0.3px"}}>Notes</p>
      {(deal.notes||[]).map(function(n,i){return <div key={i} style={{padding:"4px 8px",background:th.card,borderRadius:6,borderLeft:"2px solid "+(i===0?C.orange:"rgba(150,150,150,0.3)"),marginBottom:3}}>
        <p style={{margin:0,fontSize:11,color:th.textMuted}}>{dmy(n.date)}</p>
        <p style={{margin:0,fontSize:11,color:th.text}}>{n.text}</p>
      </div>;})}
    </div>}
  </div>;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// KPI DRILL-DOWN PANEL
// Opens when a KPI value is clicked
// Derives all data from pipelineData
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KpiDrillDown({kpiName,pd,memberBoards,role,onClose,th,onNavigateIntelligence}){
  var [expBoard,setExpBoard]=useState(null);
  var [expStage,setExpStage]=useState(null);
  var [dealFilter,setDealFilter]=useState("rotten");

  var relevantBoards=(memberBoards||Object.keys(BOARDS)).filter(function(b){return pd.boards[b];});

  var filteredDeals=useCallback(function(deals,threshold){
    if(dealFilter==="rotten")return deals.filter(function(d){return threshold&&d.days>threshold;});
    if(dealFilter==="slow")return deals.filter(function(d){return d.days>5;});
    if(dealFilter==="top10"){var sorted=deals.slice().sort(function(a,b){return b.days-a.days;});return sorted.slice(0,Math.max(1,Math.ceil(sorted.length*0.1)));}
    return deals;
  },[dealFilter]);

  return <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)",zIndex:400,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"1rem",overflowY:"auto"}}>
    <div style={{background:th.cardSolid,border:"1px solid "+th.border,borderRadius:16,width:"100%",maxWidth:680,marginTop:"2rem"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px",borderBottom:"1px solid "+th.borderPlain}}>
        <div style={{flex:1}}>
          <p style={{margin:0,fontSize:15,fontWeight:500,color:th.text}}>{kpiName}</p>
          <p style={{margin:0,fontSize:11,color:th.textMuted}}>Breakdown across {relevantBoards.length} boards &middot; {pd.totalActiveJobs} total active jobs</p>
        </div>
        <button onClick={function(){onNavigateIntelligence("Bottlenecks");}} style={{background:C.orange+"18",border:"1px solid "+C.orange+"44",borderRadius:8,color:C.orange,fontSize:11,padding:"4px 10px",cursor:"pointer"}}>Deep analysis</button>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:th.textMuted,cursor:"pointer",fontSize:18,padding:"0 4px"}}>x</button>
      </div>

      <div style={{padding:"14px 18px"}}>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {[{k:"rotten",l:"Rotten only"},{k:"slow",l:"Slower than avg"},{k:"top10",l:"Top 10% slowest"},{k:"all",l:"All deals"}].map(function(f){
            return <button key={f.k} onClick={function(){setDealFilter(f.k);}} style={{padding:"4px 10px",border:"1px solid "+(dealFilter===f.k?C.orange:th.borderPlain),borderRadius:20,background:dealFilter===f.k?C.orange+"18":th.inputBg,color:dealFilter===f.k?C.orange:th.textMuted,fontSize:11,cursor:"pointer",fontWeight:dealFilter===f.k?500:400}}>{f.l}</button>;
          })}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {relevantBoards.map(function(bName){
            var b=pd.boards[bName];if(!b||b.jobCount===0)return null;
            var isExp=expBoard===bName;
            var col=b.status==="green"?C.green:b.status==="amber"?C.amber:C.red;
            var topStage=Object.values(b.stages).sort(function(a,bb){return bb.stuckCount-a.stuckCount;})[0];
            return <div key={bName} style={{border:"1px solid "+(isExp?col+"44":th.borderPlain),borderRadius:10,overflow:"hidden"}}>
              <button onClick={function(){setExpBoard(isExp?null:bName);setExpStage(null);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:isExp?col+"0d":"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:col,boxShadow:"0 0 6px "+col,flexShrink:0}}/>
                <span style={{flex:1,fontSize:13,fontWeight:500,color:th.text}}>{bName}</span>
                <span style={{fontSize:12,color:th.textMuted}}>{b.jobCount} jobs</span>
                <span style={{fontSize:12,color:C.orange}}>{b.avgDays}d avg</span>
                {b.stuckCount>0&&<Pill text={b.stuckCount+" stuck"} color="red"/>}
                <i className={"ti ti-chevron-"+(isExp?"up":"down")} style={{color:th.textMuted,fontSize:12}} aria-hidden="true"/>
              </button>
              {isExp&&<div style={{borderTop:"1px solid "+th.borderPlain,padding:"10px 14px"}}>
                {topStage&&topStage.stuckCount>0&&<div style={{background:C.red+"0d",border:"1px solid "+C.red+"22",borderRadius:8,padding:"7px 10px",marginBottom:10}}>
                  <p style={{margin:0,fontSize:12,color:C.red}}>Top congestion: {topStage.name} &mdash; {topStage.stuckCount} stuck, avg {topStage.avgDays} days</p>
                </div>}
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {Object.values(b.stages).filter(function(s){return s.jobCount>0;}).map(function(stage){
                    var isStageExp=expStage===bName+stage.name;
                    var stageDeals=filteredDeals(stage.deals,stage.threshold);
                    return <div key={stage.name} style={{border:"1px solid "+(stage.stuckCount>0?C.red+"44":th.borderPlain),borderRadius:8,overflow:"hidden"}}>
                      <button onClick={function(){setExpStage(isStageExp?null:bName+stage.name);}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                        {stage.stuckCount>0&&<span style={{width:5,height:5,borderRadius:"50%",background:C.red,flexShrink:0}}/>}
                        <span style={{flex:1,fontSize:12,color:stage.stuckCount>0?C.red:th.text}}>{stage.name}</span>
                        <span style={{fontSize:11,color:th.textMuted}}>{stage.jobCount} jobs &middot; {stage.avgDays}d avg</span>
                        {stage.threshold&&<span style={{fontSize:11,color:C.orange,background:C.orange+"18",padding:"1px 5px",borderRadius:6}}>{stage.threshold}d rot</span>}
                        <span style={{fontSize:11,color:th.textMuted}}>({stageDeals.length} shown)</span>
                        <i className={"ti ti-chevron-"+(isStageExp?"up":"down")} style={{color:th.textMuted,fontSize:11}} aria-hidden="true"/>
                      </button>
                      {isStageExp&&<div style={{borderTop:"1px solid "+th.borderPlain,padding:"8px 10px"}}>
                        {stageDeals.length===0?<p style={{margin:0,fontSize:11,color:th.textMuted}}>No deals match current filter</p>:stageDeals.map(function(d){return <DealCard key={d.id} deal={d} threshold={stage.threshold} th={th}/>;})}
                      </div>}
                    </div>;
                  })}
                </div>
              </div>}
            </div>;
          })}
        </div>
      </div>
    </div>
  </div>;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// INTELLIGENCE TAB
// 4 sub-tabs: Overview, Pipeline Speed, Bottlenecks, History
// All powered by pipelineData
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function IntelligenceTab({pd,member,role,th,kpiTags,onAiSummary,aiSummary,summaryLoading,activeSubTab,onSubTabChange}){
  var [internalSub,setInternalSub]=useState("Overview");
  var sub=activeSubTab||internalSub;
  var setSub=onSubTabChange||setInternalSub;
  var [range,setRange]=useState("Week over week");
  var [heatExpand,setHeatExpand]=useState(null);
  var memberBoards=(member.boards||[]).filter(function(b){return pd.boards[b];});
  var showRepData=canAccess(role,"repData");

  // Snapshot accumulation state â€” fetched lazily when History sub-tab opens
  var [snapInfo,setSnapInfo]=useState({loading:false,loaded:false,count:0,oldest:null,newest:null,error:null});
  useEffect(function(){
    if(sub!=="History"||snapInfo.loaded||snapInfo.loading)return;
    setSnapInfo(function(s){return Object.assign({},s,{loading:true});});
    fetch("/api/snapshots/list",{credentials:"include"})
      .then(function(r){return r.ok?r.json():Promise.reject(new Error("HTTP "+r.status));})
      .then(function(j){setSnapInfo({loading:false,loaded:true,count:j.count||0,oldest:j.oldest,newest:j.newest,error:null});})
      .catch(function(e){setSnapInfo({loading:false,loaded:true,count:0,oldest:null,newest:null,error:e.message||"fetch failed"});});
  },[sub,snapInfo.loaded,snapInfo.loading]);

  // Range comparison â€” Cycle 7. Fires whenever the user picks a range pill
  // on the History tab. Diffs current snapshot against the closest snapshot
  // on or before the range's baseline date. Server-side: api/snapshots/compare.
  var [compareInfo,setCompareInfo]=useState<{loading:boolean;status:string|null;rows:any[]|null;currentDate:string|null;baselineDate:string|null;message:string|null;error:string|null}>({loading:false,status:null,rows:null,currentDate:null,baselineDate:null,message:null,error:null});
  useEffect(function(){
    if(sub!=="History")return;
    if(snapInfo.loading||!snapInfo.loaded)return;
    if(snapInfo.count===0)return;
    setCompareInfo(function(s){return Object.assign({},s,{loading:true,error:null});});
    fetch("/api/snapshots/compare?range="+encodeURIComponent(range),{credentials:"include"})
      .then(function(r){return r.ok?r.json():Promise.reject(new Error("HTTP "+r.status));})
      .then(function(j){
        setCompareInfo({
          loading:false,
          status:j.status||null,
          rows:j.rows||null,
          currentDate:j.currentDate||null,
          baselineDate:j.baselineDate||null,
          message:j.message||null,
          error:null,
        });
      })
      .catch(function(e){
        setCompareInfo({loading:false,status:"error",rows:null,currentDate:null,baselineDate:null,message:null,error:e.message||"compare failed"});
      });
  },[sub,range,snapInfo.loaded,snapInfo.loading,snapInfo.count]);

  function fmtDiffValue(format,n){
    if(format==="money"){if(Math.abs(n)>=1_000_000)return"$"+(n/1_000_000).toFixed(1)+"M";if(Math.abs(n)>=1_000)return"$"+Math.round(n/1_000)+"k";return"$"+Math.round(n);}
    if(format==="days")return n+"d";
    if(format==="percent")return n.toFixed(1)+"%";
    return String(n);
  }

  // Heat map colour: greenâ†’amberâ†’red based on avgDays vs threshold (or fallback)
  function heatColor(avgDays,threshold){
    var ref=threshold||7;
    var ratio=avgDays/ref;
    if(ratio<=0.8)return{bg:"rgba(34,197,94,0.25)",text:C.green};
    if(ratio<=1.2)return{bg:"rgba(245,158,11,0.2)",text:C.amber};
    return{bg:"rgba(239,68,68,0.25)",text:C.red};
  }

  return <div>
    <SubTab tabs={["Overview","Pipeline Speed","Bottlenecks","History"]} active={sub} onChange={setSub} th={th}/>

    {sub==="Overview"&&<div>
      {pd.isLive&&<div style={{background:C.green+"0d",border:"1px solid "+C.green+"22",borderRadius:10,padding:"7px 12px",marginBottom:"1rem"}}>
        <span style={{fontSize:12,color:C.green}}>Live Pipedrive data &middot; {pd.totalActiveJobs} active jobs &middot; {pd.totalStuck} stuck</span>
      </div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:"1rem"}}>
        {[
          {l:"Active jobs",v:pd.totalActiveJobs,col:C.orange,tip:"All open deals across every Pipedrive pipeline. Pulled live when you click 'Pull live data'."},
          {l:"Stuck jobs",v:pd.totalStuck,col:C.red,tip:"Deals in stages where the average days-in-stage is over 30% above that board's overall average. Indicates bottleneck pressure, not individual deal age."},
          {l:"End-to-end avg",v:pd.endToEndDays+"d",col:C.blue,tip:"Sum of average days-in-stage across all your boards. Approximates total pipeline time from first stage to install."},
          {l:"Industry bench",v:INDUSTRY_BENCHMARK_DAYS+"d",col:th.textMuted,tip:"Industry average end-to-end pipeline time. For comparison only â€” your number above is what matters."}
        ].map(function(s){
          return <div key={s.l} title={s.tip} style={{background:s.col+"0d",border:"1px solid "+s.col+"22",borderRadius:10,padding:"10px 12px",textAlign:"center",cursor:"help"}}>
            <p style={{margin:0,fontSize:20,fontWeight:500,color:s.col}}>{s.v}</p>
            <p style={{margin:0,fontSize:11,color:th.textMuted}}>{s.l}</p>
          </div>;
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:"1rem"}}>
        {[["green","Healthy","â—"],["amber","Watch","â–²"],["red","Critical","x"]].map(function(arr){
          var s=arr[0];var label=arr[1];var icon=arr[2];
          var col=s==="green"?C.green:s==="amber"?C.amber:C.red;
          var count=memberBoards.filter(function(b){return pd.boards[b]&&pd.boards[b].status===s;}).length;
          return <div key={s} style={{background:col+"12",border:"1px solid "+col+"30",borderRadius:12,padding:"10px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:20,fontWeight:500,color:col}}>{count}</p>
            <p style={{margin:0,fontSize:11,color:col,fontWeight:500}}>{icon} {label}</p>
          </div>;
        })}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {memberBoards.map(function(bName){
          var b=pd.boards[bName];if(!b)return null;
          var col=b.status==="green"?C.green:b.status==="amber"?C.amber:C.red;
          return <div key={bName} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:th.inputBg,border:"1px solid "+col+"30",borderRadius:11}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:col,boxShadow:"0 0 7px "+col,flexShrink:0}}/>
            <span style={{flex:1,fontSize:13,fontWeight:500,color:th.text}}>{bName}</span>
            <span style={{fontSize:12,color:th.textMuted}}>{b.jobCount} jobs</span>
            {b.avgDays>0&&<span style={{fontSize:12,color:C.orange}}>{b.avgDays}d avg</span>}
            {b.stuckCount>0&&<Pill text={b.stuckCount+" stuck"} color="red"/>}
            {b.live&&<Pill text="live" color="green"/>}
          </div>;
        })}
      </div>
    </div>}

    {sub==="Pipeline Speed"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:"1rem",alignItems:"center",flexWrap:"wrap"}}>
        <div style={{flex:1}}>
          <p style={{margin:0,fontSize:13,fontWeight:500,color:th.text}}>End-to-end avg: <span style={{color:C.orange}}>{pd.endToEndDays} days</span> &nbsp; Industry benchmark: <span style={{color:th.textMuted}}>{INDUSTRY_BENCHMARK_DAYS} days</span></p>
          <p style={{margin:"3px 0 0",fontSize:11,color:pd.endToEndDays>INDUSTRY_BENCHMARK_DAYS?C.red:C.green}}>{pd.endToEndDays>INDUSTRY_BENCHMARK_DAYS?"Above industry benchmark by "+(pd.endToEndDays-INDUSTRY_BENCHMARK_DAYS)+"d":"Within industry benchmark"}</p>
        </div>
      </div>

      <p style={{margin:"0 0 8px",fontSize:12,color:th.textMuted}}>Heat map &mdash; avg days per stage. Colour: green = fast, amber = near threshold, red = slow. Click a cell to see deals.</p>
      <div style={{overflowX:"auto",marginBottom:"1rem"}}>
        {memberBoards.slice(0,8).map(function(bName){
          var b=pd.boards[bName];if(!b)return null;
          var stages=Object.values(b.stages).filter(function(s){return s.jobCount>0;});
          return <div key={bName} style={{marginBottom:8}}>
            <p style={{margin:"0 0 4px",fontSize:12,fontWeight:500,color:th.text}}>{bName} <span style={{fontSize:11,color:th.textMuted}}>({b.jobCount} jobs, {b.avgDays}d avg)</span></p>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {stages.map(function(s){
                var hc=heatColor(s.avgDays,s.threshold);
                var isExp=heatExpand===bName+s.name;
                return <div key={s.name} style={{marginBottom:3}}>
                  <button onClick={function(){setHeatExpand(isExp?null:bName+s.name);}} style={{padding:"5px 9px",background:hc.bg,border:"1px solid "+hc.text+"44",borderRadius:7,cursor:"pointer",textAlign:"left"}}>
                    <p style={{margin:0,fontSize:10,color:hc.text,fontWeight:500,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</p>
                    <p style={{margin:"1px 0 0",fontSize:11,fontWeight:500,color:hc.text}}>{s.avgDays}d</p>
                    <p style={{margin:0,fontSize:9,color:th.textMuted}}>{s.jobCount} jobs</p>
                  </button>
                  {isExp&&<div style={{background:th.card,border:"1px solid "+th.border,borderRadius:8,padding:"8px 10px",marginTop:3,minWidth:220}}>
                    <p style={{margin:"0 0 6px",fontSize:11,fontWeight:500,color:th.text}}>{s.name} &mdash; {s.jobCount} jobs, avg {s.avgDays}d</p>
                    <p style={{margin:"0 0 6px",fontSize:11,color:th.textMuted}}>Threshold: {s.threshold?s.threshold+"d":"none"}</p>
                    {s.deals.slice(0,4).map(function(d){return <DealCard key={d.id} deal={d} threshold={s.threshold} th={th}/>;})}
                  </div>}
                </div>;
              })}
            </div>
          </div>;
        })}
      </div>
    </div>}

    {sub==="Bottlenecks"&&<div>
      <div style={{marginBottom:"1rem",padding:"12px 14px",background:C.purple+"0a",border:"1px solid "+C.purple+"30",borderRadius:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <p style={{margin:0,fontSize:13,fontWeight:500,color:C.purple}}>AI pattern analysis</p>
          <button onClick={onAiSummary} disabled={summaryLoading} style={{background:C.purple+"18",border:"1px solid "+C.purple+"44",borderRadius:8,color:C.purple,fontSize:11,padding:"3px 10px",cursor:"pointer",marginLeft:"auto"}}>{summaryLoading?"Analysing...":"Refresh analysis"}</button>
        </div>
        {summaryLoading&&<p style={{margin:0,fontSize:12,color:th.textMuted}}>Analysing pipeline patterns...</p>}
        {aiSummary&&!summaryLoading&&<p style={{margin:0,fontSize:12,color:th.text,lineHeight:1.6}}>{aiSummary}</p>}
        {!aiSummary&&!summaryLoading&&<p style={{margin:0,fontSize:12,color:th.textMuted}}>Click Refresh to generate an AI analysis of your current bottlenecks and patterns.</p>}
      </div>

      <p style={{margin:"0 0 8px",fontSize:12,fontWeight:500,color:th.text}}>Top bottlenecks ({pd.bottlenecks.length} detected)</p>
      <p style={{margin:"0 0 12px",fontSize:11,color:th.textMuted}}>Stages where average days exceeds the board average by 50% or more. Real Pipedrive data.</p>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:"1.5rem"}}>
        {pd.bottlenecks.slice(0,10).map(function(bn,i){
          var severity=bn.pctAbove>=80?C.red:bn.pctAbove>=50?C.amber:C.orange;
          return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:th.inputBg,border:"1px solid "+severity+"33",borderRadius:9}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:severity,boxShadow:"0 0 5px "+severity,flexShrink:0}}/>
            <div style={{flex:1}}>
              <p style={{margin:0,fontSize:12,fontWeight:500,color:th.text}}>{bn.board}</p>
              <p style={{margin:0,fontSize:11,color:th.textMuted}}>{bn.stage}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{margin:0,fontSize:12,fontWeight:500,color:severity}}>{bn.avgDays}d avg</p>
              <p style={{margin:0,fontSize:11,color:th.textMuted}}>board: {bn.boardAvg}d (+{bn.pctAbove}%)</p>
            </div>
            <span style={{fontSize:11,color:C.red,background:C.red+"18",padding:"2px 7px",borderRadius:8,fontWeight:500}}>{bn.stuckCount} deals</span>
          </div>;
        })}
        {pd.bottlenecks.length===0&&<p style={{margin:0,fontSize:13,color:C.green}}>âœ“ No significant bottlenecks detected. All stages within 50% of their board average.</p>}
      </div>

      {showRepData&&<div>
        <p style={{margin:"0 0 8px",fontSize:12,fontWeight:500,color:th.text}}>Rep performance <span style={{fontSize:11,color:th.textMuted}}>(owner-level only)</span></p>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {Object.values(pd.repStats).filter(function(r:any){return r.jobCount>0;}).sort(function(a:any,b:any){return b.avgDays-a.avgDays;}).map(function(r:any){
            var col=r.avgDays>8?C.red:r.avgDays>5?C.amber:C.green;
            return <div key={r.rep} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 12px",background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:8}}>
              <span style={{flex:1,fontSize:12,color:th.text}}>{r.rep}</span>
              <span style={{fontSize:11,color:th.textMuted}}>{r.jobCount} jobs</span>
              <span style={{fontSize:12,fontWeight:500,color:col}}>{r.avgDays}d avg</span>
              <div style={{width:60,height:6,background:th.borderPlain,borderRadius:3,overflow:"hidden"}}>
                <div style={{width:Math.min(100,r.avgDays/12*100)+"%",height:"100%",background:col,borderRadius:3}}/>
              </div>
            </div>;
          })}
        </div>
      </div>}
    </div>}

    {sub==="History"&&<div>
      <div style={{display:"flex",gap:6,marginBottom:"1rem",flexWrap:"wrap"}}>
        {RANGES.map(function(r){return <button key={r} onClick={function(){setRange(r);}} style={{padding:"6px 12px",border:"1px solid "+(range===r?C.orange:th.borderPlain),borderRadius:20,background:range===r?C.orange+"18":th.inputBg,color:range===r?C.orange:th.textMuted,fontSize:11,cursor:"pointer",fontWeight:range===r?500:400}}>{r}</button>;})}</div>
      <div style={{background:th.card,border:"1px solid "+th.border,borderRadius:12,padding:"1.25rem 1.5rem"}}>
        {snapInfo.loading?
          <p style={{margin:0,fontSize:13,color:th.textMuted,textAlign:"center"}}>Loading snapshot indexâ€¦</p>
        :snapInfo.error?
          <div style={{textAlign:"center"}}>
            <p style={{margin:"0 0 6px",fontSize:14,fontWeight:500,color:C.red}}>Snapshot store unavailable</p>
            <p style={{margin:0,fontSize:11,color:th.textMuted}}>{snapInfo.error}. Verify Vercel Blob is enabled and BLOB_READ_WRITE_TOKEN is set.</p>
          </div>
        :snapInfo.count===0?
          <div style={{textAlign:"center"}}>
            <p style={{margin:"0 0 8px",fontSize:14,fontWeight:500,color:th.text}}>No snapshots stored yet</p>
            <p style={{margin:"0 0 4px",fontSize:12,color:th.textMuted,lineHeight:1.5}}>Daily snapshots begin after the next cron run (live Pipedrive data only).</p>
            <p style={{margin:"12px 0 0",fontSize:11,color:th.textMuted}}>Current snapshot: {pd.totalActiveJobs} active jobs &middot; {pd.totalStuck} stuck &middot; end-to-end {pd.endToEndDays}d</p>
          </div>
        :<div>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:14}}>
            <div>
              <p style={{margin:0,fontSize:13,fontWeight:500,color:th.text}}>{range}</p>
              {compareInfo.currentDate&&compareInfo.baselineDate&&
                <p style={{margin:"2px 0 0",fontSize:11,color:th.textMuted}}>{dmy(compareInfo.baselineDate)}â†’ {dmy(compareInfo.currentDate)}</p>}
            </div>
            <p style={{margin:0,fontSize:11,color:th.textMuted}}>{snapInfo.count} snapshot{snapInfo.count===1?"":"s"} stored &middot; oldest {dmy(snapInfo.oldest)}</p>
          </div>
          {compareInfo.loading?
            <p style={{margin:0,fontSize:12,color:th.textMuted,textAlign:"center",padding:"1rem 0"}}>Computing diffâ€¦</p>
          :compareInfo.error?
            <p style={{margin:0,fontSize:12,color:C.red,textAlign:"center",padding:"1rem 0"}}>{compareInfo.error}</p>
          :compareInfo.status==="ok"&&compareInfo.rows?
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {compareInfo.rows.map(function(row){
                var col=row.direction==="up"?C.green:row.direction==="down"?C.red:th.textMuted;
                // For some KPIs "down" is good â€” invert colour
                if(row.key==="lostLast30d"||row.key==="cancellationRate30d"||row.key==="activitiesOverdue"||row.key==="endToEndDays"){
                  col=row.direction==="down"?C.green:row.direction==="up"?C.red:th.textMuted;
                }
                var sign=row.delta>0?"+":"";
                return <div key={row.key} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:th.inputBg,borderRadius:8,border:"1px solid "+th.borderPlain}}>
                  <span style={{flex:1,fontSize:13,color:th.text}}>{row.label}</span>
                  <span style={{fontSize:12,color:th.textMuted,minWidth:90,textAlign:"right"}}>{fmtDiffValue(row.format,row.baseline)} â†’ {fmtDiffValue(row.format,row.current)}</span>
                  <span style={{fontSize:13,fontWeight:500,color:col,minWidth:80,textAlign:"right"}}>{sign}{fmtDiffValue(row.format,row.delta)}{row.pct!==null?" ("+sign+row.pct.toFixed(1)+"%)":""}</span>
                </div>;
              })}
            </div>
          :<div style={{textAlign:"center",padding:"1rem 0"}}>
            <p style={{margin:"0 0 4px",fontSize:13,color:th.text}}>Not enough history yet</p>
            <p style={{margin:0,fontSize:11,color:th.textMuted}}>{compareInfo.message||"More snapshots needed for this range."}</p>
          </div>}
        </div>}
      </div>
    </div>}
  </div>;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MODALS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BoardModal({member,allBoards,onSave,onClose,th}){
  var [sel,setSel]=useState(new Set(member.boards));
  var toggle=function(b){setSel(function(s){var n=new Set(s);n.has(b)?n.delete(b):n.add(b);return n;});};
  var iS={background:th.inputBg,border:"1px solid "+th.inputBorder,borderRadius:10,color:th.selectText,fontSize:13,padding:"8px 11px",outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const,cursor:"pointer"};
  return <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",minHeight:500}}>
    <div style={{background:th.cardSolid,border:"1px solid "+th.border,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:440,maxHeight:"80vh",display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Avatar name={member.name} size={28}/>
        <div style={{flex:1}}><p style={{margin:0,fontWeight:500,color:th.text,fontSize:13}}>{member.name}</p><p style={{margin:0,fontSize:11,color:th.textMuted}}>Board access</p></div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:th.textMuted,cursor:"pointer",fontSize:18}}>x</button>
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={function(){setSel(new Set(allBoards));}} style={Object.assign({},iS,{padding:"4px 10px",fontSize:11})}>All</button>
        <button onClick={function(){setSel(new Set());}} style={Object.assign({},iS,{padding:"4px 10px",fontSize:11,color:th.textMuted})}>None</button>
        <span style={{marginLeft:"auto",fontSize:11,color:th.textMuted}}>{sel.size}/{allBoards.length}</span>
      </div>
      <div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:4}}>
        {allBoards.map(function(b){var on=sel.has(b);return <button key={b} onClick={function(){toggle(b);}} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 11px",background:on?C.orange+"12":th.inputBg,border:"1px solid "+(on?C.orange:th.borderPlain),borderRadius:9,cursor:"pointer",textAlign:"left"}}>
          <div style={{width:15,height:15,borderRadius:4,border:"2px solid "+(on?C.orange:"rgba(150,150,150,0.3)"),background:on?C.orange:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{on&&<span style={{color:"#fff",fontSize:10}}>v</span>}</div>
          <span style={{flex:1,fontSize:12,color:on?C.orange:th.text}}>{b}</span>
          <span style={{fontSize:11,color:th.textMuted}}>{BOARDS[b]?BOARDS[b].region:""}</span>
        </button>;})}
      </div>
      <button onClick={function(){onSave([...sel]);}} style={{background:"linear-gradient(135deg,"+C.orange+","+C.orangeDeep+")",border:"none",borderRadius:10,color:"#fff",fontWeight:500,fontSize:13,padding:"10px",cursor:"pointer",width:"100%"}}>Save</button>
    </div>
  </div>;
}

function PushModal({draftChanges,team,onConfirm,onCancel,th}){
  return <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",minHeight:500}}>
    <div style={{background:th.cardSolid,border:"2px solid "+C.orange,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:500}}>
      <p style={{margin:"0 0 4px",fontSize:16,fontWeight:500,color:th.text}}>Push draft to live?</p>
      <p style={{margin:"0 0 16px",fontSize:12,color:th.textMuted}}>Affects the live 6am send for all {team.length} recipients.</p>
      <div style={{background:C.amber+"0d",border:"1px solid "+C.amber+"33",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
        <p style={{margin:"0 0 8px",fontSize:12,fontWeight:500,color:C.amber}}>Draft changes ({draftChanges.length})</p>
        {draftChanges.length===0?<p style={{margin:0,fontSize:11,color:th.textMuted}}>No changes in draft mode.</p>:
          <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:180,overflowY:"auto"}}>
            {draftChanges.map(function(e){return <div key={e.id} style={{display:"flex",gap:8,padding:"5px 8px",background:th.inputBg,borderRadius:7}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.amber,marginTop:3,flexShrink:0}}/>
              <div><p style={{margin:0,fontSize:11,fontWeight:500,color:th.text}}>{e.action}</p><p style={{margin:0,fontSize:11,color:th.textMuted}}>{e.detail}</p></div>
            </div>;})}
          </div>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onConfirm} style={{flex:1,background:"linear-gradient(135deg,"+C.orange+","+C.orangeDeep+")",border:"none",borderRadius:10,color:"#fff",fontWeight:500,fontSize:13,padding:"11px",cursor:"pointer"}}>Confirm</button>
        <button onClick={onCancel} style={{flex:1,background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:10,color:th.textMuted,fontWeight:500,fontSize:13,padding:"11px",cursor:"pointer"}}>Cancel</button>
      </div>
    </div>
  </div>;
}

// PD_FIELDS_FLAT imported from ../shared/domain

function KpiMapping({kpiTags,setKpiTags,team,th,pd,kpiCfgState,onSaveKpiConfig}){
  var [sel,setSel]=useState(kpiTags[0]?kpiTags[0].id:null);
  var [newName,setNewName]=useState("");var [testing,setTesting]=useState(null);var [cfmDel,setCfmDel]=useState(null);var [tagSearch,setTagSearch]=useState("");
  var tag=kpiTags.find(function(t){return t.id===sel;});
  var bNames=Object.keys(BOARDS);
  var iS={background:th.inputBg,border:"1px solid "+th.inputBorder,borderRadius:10,color:th.selectText,fontSize:13,padding:"8px 11px",outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const};
  var filtered=useMemo(function(){return tagSearch?kpiTags.filter(function(t){return t.name.toLowerCase().indexOf(tagSearch.toLowerCase())>=0;}):kpiTags;},[kpiTags,tagSearch]);

  // â”€â”€ Save bar UI bits â”€â”€
  var cfg=kpiCfgState||{status:"saved",source:"default",updatedAt:null,error:null};
  var saveColor=cfg.status==="dirty"?C.orange:cfg.status==="saving"?C.blue:cfg.status==="error"?C.red:C.green;
  var saveLabel=cfg.status==="dirty"?"Save changes":cfg.status==="saving"?"Saving...":cfg.status==="error"?"Retry save":cfg.status==="loading"?"Loading...":"Saved";
  var sourceLabel=cfg.source==="blob"?"Persisted (cron will use these)":cfg.source==="default"?"Defaults (edits NOT yet saved)":"";
  var updatedLabel=cfg.updatedAt?dmyTime(cfg.updatedAt):null;

  function addSrc(){if(!sel)return;setKpiTags(function(ts){return ts.map(function(t){return t.id===sel?Object.assign({},t,{sources:t.sources.concat([{board:bNames[0],scope:"board",stage:null,field:"stage.deal_count"}])}):t;});});}
  function updSrc(tid,si,f,v){setKpiTags(function(ts){return ts.map(function(t){if(t.id!==tid)return t;var s=t.sources.map(function(src,i){if(i!==si)return src;var u=Object.assign({},src);u[f]=v;if(f==="board")u.stage=null;if(f==="scope"&&v==="board")u.stage=null;return u;});return Object.assign({},t,{sources:s});});});}
  function remSrc(tid,si){setKpiTags(function(ts){return ts.map(function(t){return t.id===tid?Object.assign({},t,{sources:t.sources.filter(function(_,i){return i!==si;})}):t;});});}
  function addTag(){var n=newName.trim();if(!n)return;setKpiTags(function(ts){return ts.concat([{id:"k"+Date.now(),name:n,sources:[],fallback:"N/A",testResult:null}]);});setNewName("");}
  function delTag(tid){if(cfmDel!==tid){setCfmDel(tid);setTimeout(function(){setCfmDel(function(c){return c===tid?null:c;});},3000);return;}setKpiTags(function(ts){return ts.filter(function(t){return t.id!==tid;});});if(sel===tid)setSel(null);setCfmDel(null);}
  function usedBy(name){return team.filter(function(m){return m.kpis.indexOf(name)>=0;}).length;}
  function testTag(tid){
    setTesting(tid);
    setTimeout(function(){
      setKpiTags(function(ts){return ts.map(function(t){
        if(t.id!==tid)return t;
        var result;
        if(!pd){result="No data â€” pull Pipedrive first";}
        else{
          var val=resolveKpiValue(t,pd);
          var liveLabel=pd.isLive?"":" (no live data â€” fallback)";
          result=val+liveLabel;
        }
        return Object.assign({},t,{testResult:result});
      });});
      setTesting(null);
    },300);
  }

  return <div style={{display:"flex",flexDirection:"column",gap:10}}>
    {/* Persistence bar â€” Cycle 6 */}
    <div style={{background:th.card,border:"1px solid "+saveColor+"44",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:200}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:saveColor,boxShadow:"0 0 6px "+saveColor}}/>
          <span style={{fontSize:13,fontWeight:500,color:th.text}}>{sourceLabel}</span>
        </div>
        {updatedLabel&&<p style={{margin:"2px 0 0 16px",fontSize:11,color:th.textMuted}}>Last saved: {updatedLabel}</p>}
        {cfg.error&&<p style={{margin:"2px 0 0 16px",fontSize:11,color:C.red}}>{cfg.error}</p>}
      </div>
      <button
        onClick={onSaveKpiConfig}
        disabled={cfg.status==="saving"||cfg.status==="loading"||cfg.status==="saved"}
        style={{background:saveColor+"22",border:"1px solid "+saveColor+"66",borderRadius:8,color:saveColor,fontWeight:500,fontSize:12,padding:"7px 14px",cursor:cfg.status==="saving"||cfg.status==="saved"?"default":"pointer",opacity:cfg.status==="saved"?0.6:1}}
      >{saveLabel}</button>
    </div>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <div style={{width:210,flexShrink:0}}>
      <div style={{background:th.card,border:"1px solid "+th.border,borderRadius:16,padding:"1rem"}}>
        <SLabel icon="ti-tag" text="Global KPI tags"/>
        <div style={{display:"flex",gap:5,marginBottom:7}}>
          <input value={tagSearch} onChange={function(e){setTagSearch(e.target.value);}} placeholder="Search..." style={Object.assign({},iS,{flex:1,fontSize:11,padding:"5px 8px"})}/>
          {tagSearch&&<button onClick={function(){setTagSearch("");}} style={{background:"transparent",border:"none",color:th.textMuted,cursor:"pointer",fontSize:14,padding:"0 4px"}}>x</button>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3,maxHeight:300,overflowY:"auto",marginBottom:8}}>
          {filtered.map(function(t){var used=usedBy(t.name);var isCfm=cfmDel===t.id;
            return <div key={t.id} style={{display:"flex",alignItems:"center",gap:4}}>
              <button onClick={function(){setSel(t.id);}} style={{flex:1,display:"flex",alignItems:"center",gap:5,padding:"6px 9px",borderRadius:8,border:"1px solid "+(sel===t.id?C.orange:"transparent"),background:sel===t.id?C.orange+"18":"transparent",color:sel===t.id?C.orange:th.text,fontSize:12,cursor:"pointer",textAlign:"left",minWidth:0}}>
                <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</span>
                <span style={{fontSize:11,color:t.sources.length>0?C.green:C.amber}}>{t.sources.length>0?"v":"!"}</span>
              </button>
              <button onClick={function(){delTag(t.id);}} style={{background:isCfm?C.red+"22":"transparent",border:"1px solid "+(isCfm?C.red:"transparent"),borderRadius:6,color:isCfm?C.red:th.textMuted,cursor:"pointer",padding:"3px 5px",fontSize:11,flexShrink:0}}>{isCfm?"x"+(used>0?"("+used+")":""):"x"}</button>
            </div>;
          })}
          {filtered.length===0&&<p style={{margin:0,fontSize:11,color:th.textMuted,textAlign:"center",padding:"8px 0"}}>No tags match</p>}
        </div>
        <div style={{display:"flex",gap:5}}>
          <input value={newName} onChange={function(e){setNewName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")addTag();}} placeholder="New tag..." style={Object.assign({},iS,{flex:1,fontSize:11,padding:"5px 8px"})}/>
          <button onClick={addTag} style={{background:C.orange,border:"none",borderRadius:7,color:"#fff",fontWeight:500,width:28,cursor:"pointer",fontSize:14}}>+</button>
        </div>
      </div>
    </div>
    <div style={{flex:1,minWidth:260}}>
      {tag?<div style={{background:th.card,border:"1px solid "+th.border,borderRadius:16,padding:"1rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{fontSize:14,fontWeight:500,color:th.text,flex:1}}>{tag.name}</span>
          <button onClick={function(){testTag(tag.id);}} disabled={!!testing} style={{background:C.blue+"18",border:"1px solid "+C.blue+"44",borderRadius:10,color:C.blue,fontWeight:500,fontSize:11,padding:"4px 12px",cursor:"pointer"}}>{testing===tag.id?"Testing...":"Test"}</button>
        </div>
        {tag.testResult&&<div style={{background:C.green+"12",border:"1px solid "+C.green+"33",borderRadius:8,padding:"6px 10px",marginBottom:10}}><p style={{margin:0,fontSize:11,color:C.green}}>Result: {tag.testResult}</p></div>}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <span style={{fontSize:11,color:th.textMuted}}>Fallback:</span>
          <select value={tag.fallback} onChange={function(e){setKpiTags(function(ts){return ts.map(function(t){return t.id===tag.id?Object.assign({},t,{fallback:e.target.value}):t;});});}} style={Object.assign({},iS,{padding:"4px 8px",fontSize:11,width:"auto",color:th.selectText,background:th.selectBg})}>
            {["N/A","0","â€”","No data","Use last known value"].map(function(o){return <option key={o} style={{background:th.selectBg,color:th.selectText}}>{o}</option>;})}
          </select>
        </div>
        <p style={{fontSize:11,color:th.textMuted,margin:"0 0 6px"}}>Data sources ({tag.sources.length})</p>
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:9}}>
          {tag.sources.map(function(src,si){
            var stgs=BOARDS[src.board]?BOARDS[src.board].stages:[];
            return <div key={si} style={{background:th.inputBg,border:"1px solid "+C.orange+"22",borderRadius:10,padding:"9px"}}>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:5}}><button onClick={function(){remSrc(tag.id,si);}} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:11}}>Remove</button></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <div><p style={{margin:"0 0 3px",fontSize:11,color:th.textMuted}}>Board</p>
                  <select value={src.board} onChange={function(e){updSrc(tag.id,si,"board",e.target.value);}} style={Object.assign({},iS,{width:"100%",padding:"4px 7px",fontSize:11,background:th.selectBg})}>
                    {bNames.map(function(b){return <option key={b} style={{background:th.selectBg,color:th.selectText}}>{b}</option>;})}</select></div>
                <div><p style={{margin:"0 0 3px",fontSize:11,color:th.textMuted}}>Scope</p>
                  <select value={src.scope} onChange={function(e){updSrc(tag.id,si,"scope",e.target.value);}} style={Object.assign({},iS,{width:"100%",padding:"4px 7px",fontSize:11,background:th.selectBg})}>
                    <option style={{background:th.selectBg,color:th.selectText}} value="board">Entire board</option>
                    <option style={{background:th.selectBg,color:th.selectText}} value="stage">Specific stage</option></select></div>
                {src.scope==="stage"&&<div style={{gridColumn:"1/-1"}}><p style={{margin:"0 0 3px",fontSize:11,color:th.textMuted}}>Stage</p>
                  <select value={src.stage||""} onChange={function(e){updSrc(tag.id,si,"stage",e.target.value);}} style={Object.assign({},iS,{width:"100%",padding:"4px 7px",fontSize:11,background:th.selectBg})}>
                    <option value="" style={{background:th.selectBg,color:th.selectText}}>Select stage...</option>
                    {stgs.map(function(s){return <option key={s} style={{background:th.selectBg,color:th.selectText}}>{s}</option>;})}</select></div>}
                <div style={{gridColumn:"1/-1"}}><p style={{margin:"0 0 3px",fontSize:11,color:th.textMuted}}>Data point</p>
                  <select value={src.field} onChange={function(e){updSrc(tag.id,si,"field",e.target.value);}} style={Object.assign({},iS,{width:"100%",padding:"4px 7px",fontSize:11,background:th.selectBg})}>
                    {PD_FIELDS_FLAT.map(function(f){return <option key={f.n} value={f.n} style={{background:th.selectBg,color:th.selectText}}>{f.n} - {f.d}</option>;})}
                  </select></div>
              </div>
            </div>;
          })}
        </div>
        <button onClick={addSrc} style={{background:C.orange+"18",border:"1px solid "+C.orange+"44",borderRadius:10,color:C.orange,fontWeight:500,fontSize:11,padding:"6px 14px",cursor:"pointer",width:"100%"}}>+ Add data source</button>
      </div>:<div style={{background:th.card,border:"1px solid "+th.border,borderRadius:16,padding:"2rem",textAlign:"center"}}><p style={{color:th.textMuted,fontSize:13}}>Select a KPI tag to configure</p></div>}
    </div>
    </div>
  </div>;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN APP
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Dashboard({session}:{session:{signedIn:boolean;email:string;name:string}}){
  var [dark,setDark]=useState(true);
  var th=TH;
  var cc=chartColors(dark);   // theme-aware, gate-verified chart/RAG palette
  var glass={background:th.card,border:"1px solid "+th.border,borderRadius:16,padding:"1.25rem"};
  var iS={background:th.inputBg,border:"1px solid "+th.inputBorder,borderRadius:10,color:th.selectText,fontSize:13,padding:"8px 11px",outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const};

  // Derive admin status from session email (case-insensitive match)
  var isAdmin=ADMIN_EMAILS.indexOf((session.email||"").toLowerCase())>=0;

  // Core state
  var [tab,setTab]=useState("Overview");
  var [stab,setStab]=useState("General");
  var [pdKey,setPdKey]=useState("");
  var [gcId,setGcId]=useState("");
  var [gConn,setGConn]=useState(false);
  var [draft,setDraft]=useState(false);
  var [showPush,setShowPush]=useState(false);
  var [sendTime,setSendTime]=useState("06:00");
  var [team,setTeam]=useState(TEAM_INIT.map(function(m){return Object.assign({},m);}));
  var [kpiTags,setKpiTags]=useState(KPI_INIT);
  // Persistence state for kpiTags config (Cycle 6).
  // 'idle' = initial value before first load. 'loading' = fetch in flight.
  // 'saved' = local matches blob. 'dirty' = local has unsaved edits.
  // 'saving' = save in flight. 'error' = last load/save failed.
  var [kpiCfgState,setKpiCfgState]=useState<{status:string;source:string;updatedAt:string|null;error:string|null}>({status:"idle",source:"default",updatedAt:null,error:null});
  var [audit,setAudit]=useState(AUDIT_INIT);
  var [ralph,setRalph]=useState(RALPH_INIT);
  var [showRalphForm,setShowRalphForm]=useState(false);
  var [boardEdit,setBoardEdit]=useState(null);
  var [prevPerson,setPrevPerson]=useState(null);
  var [prevLoad,setPrevLoad]=useState(false);
  var [prevEmail,setPrevEmail]=useState(null);
  var [sendLog,setSendLog]=useState([]);
  var [sendStatus,setSendStatus]=useState({});
  var [saved,setSaved]=useState(false);
  var [tSearch,setTSearch]=useState("");
  var [tFilter,setTFilter]=useState("All");

  // Data layer state
  var [liveApiData,setLiveApiData]=useState(null);
  // staleCache: if non-null, we're displaying data from localStorage because the live fetch failed.
  // Shape: { ts: number } â€” when the cached data was originally fetched.
  var [staleCache,setStaleCache]=useState<{ts:number}|null>(null);
  var [liveLoad,setLiveLoad]=useState(false);
  var [apiHealth,setApiHealth]=useState({pd:"unknown",gmail:"unknown",lastPull:"Never"});
  var [apiErr,setApiErr]=useState(null);

  // Intelligence state
  var [intelSub,setIntelSub]=useState("Overview");
  var [intelMember,setIntelMember]=useState(0);
  var [aiSummary,setAiSummary]=useState(null);
  var [summaryLoading,setSummaryLoading]=useState(false);

  // KPI drill-down state
  var [kpiDrillKpi,setKpiDrillKpi]=useState(null);
  var [drillBoards,setDrillBoards]=useState(null);   // PR-B: scope drill-down to a clicked board

  // Cron status state â€” fetched from /api/cron/status. Refreshed every 30s.
  var [cronStatus,setCronStatus]=useState({loading:true,mode:"unknown",error:null});
  useEffect(function(){
    var cancelled=false;
    function fetchStatus(){
      fetch("/api/cron/status",{credentials:"include"})
        .then(function(r){return r.ok?r.json():Promise.reject(new Error("HTTP "+r.status));})
        .then(function(j){if(!cancelled)setCronStatus(Object.assign({loading:false,error:null},j));})
        .catch(function(e){if(!cancelled)setCronStatus({loading:false,mode:"unknown",error:e.message||"fetch failed"});});
    }
    fetchStatus();
    var id=setInterval(fetchStatus,30000);
    return function(){cancelled=true;clearInterval(id);};
  },[]);

  // Increment 2 — period-over-period comparison (reuses /api/snapshots/compare) + editable targets
  var [cmpRange,setCmpRange]=useState("Month over month");
  var [cmpInfo,setCmpInfo]=useState({loading:false,status:null,rows:null,currentDate:null,baselineDate:null,message:null,error:null});
  var [editTargets,setEditTargets]=useState(false);
  var [targets,setTargets]=useState(function(){
    var t={};Object.keys(KPI_TARGETS).forEach(function(k){t[k]=Object.assign({},KPI_TARGETS[k]);});
    try{var saved=JSON.parse(localStorage.getItem("unitea:kpiTargets")||"{}");Object.keys(saved).forEach(function(k){if(!t[k])t[k]={betterWhen:"neutral",target:null};t[k]=Object.assign({},t[k],{target:saved[k]});});}catch(e){}
    return t;
  });
  useEffect(function(){
    if(tab!=="Reports")return;
    setCmpInfo(function(s){return Object.assign({},s,{loading:true,error:null});});
    fetch("/api/snapshots/compare?range="+encodeURIComponent(cmpRange),{credentials:"include"})
      .then(function(r){return r.ok?r.json():Promise.reject(new Error("HTTP "+r.status));})
      .then(function(j){setCmpInfo({loading:false,status:j.status||null,rows:j.rows||null,currentDate:j.currentDate||null,baselineDate:j.baselineDate||null,message:j.message||null,error:null});})
      .catch(function(e){setCmpInfo({loading:false,status:"error",rows:null,currentDate:null,baselineDate:null,message:null,error:e.message||"compare failed"});});
  },[tab,cmpRange]);

  // PR-A: reporting controls (date-range + region) + URL-encoded saved views + live-KPI trend series
  var [fltDays,setFltDays]=useState(90);
  var [fltRegion,setFltRegion]=useState("All");
  var [trendMetric,setTrendMetric]=useState("totalActiveJobs");
  var [seriesInfo,setSeriesInfo]=useState({loading:false,status:null,series:null,error:null});
  var [copied,setCopied]=useState(false);
  var RANGE_OPTS=[{d:30,l:"30d"},{d:90,l:"90d"},{d:180,l:"6mo"},{d:365,l:"1yr"},{d:730,l:"All"}];
  var METRIC_LABELS={totalActiveJobs:"Active jobs",totalPipelineValue:"Pipeline value",endToEndDays:"End-to-end days",wonThisWeek:"Won this week",wonLast30d:"Won last 30d",lostLast30d:"Lost last 30d",cancellationRate30d:"Cancellation rate (30d)",activitiesOverdue:"Overdue activities",callsDueToday:"Calls due today",installsScheduledThisWeek:"Installs scheduled (wk)",permitsSubmittedThisWeek:"Permits submitted (wk)",nmaSubmittedThisWeek:"NMA submitted (wk)"};
  // Notes-extracted insight charts (red flags, cycle times) honour the active date range via per-window
  // buckets in OPS_INSIGHTS.windows; "All" (730) and any non-bucketed range fall back to all-time figures.
  function opsWin(days){var w=OPS_INSIGHTS.windows&&OPS_INSIGHTS.windows[String(days)];return w||{redFlags:OPS_INSIGHTS.redFlags,cycleTimes:OPS_INSIGHTS.cycleTimes};}
  var ow=opsWin(fltDays);
  var owIsAll=!(OPS_INSIGHTS.windows&&OPS_INSIGHTS.windows[String(fltDays)]);
  var owLabel=owIsAll?"all-time":"last "+((RANGE_OPTS.find(function(o){return o.d===fltDays;})||{l:fltDays+"d"}).l);
  useEffect(function(){  // hydrate the view from the URL once (shareable saved views)
    try{var q=new URLSearchParams(window.location.search);
      if(q.get("tab"))setTab(q.get("tab"));
      if(q.get("days"))setFltDays(Number(q.get("days"))||90);
      if(q.get("region"))setFltRegion(q.get("region"));
      if(q.get("metric"))setTrendMetric(q.get("metric"));
    }catch(e){}
  },[]);
  useEffect(function(){  // keep the URL in sync so any view is a shareable link
    try{var q=new URLSearchParams();q.set("tab",tab);q.set("days",String(fltDays));q.set("region",fltRegion);q.set("metric",trendMetric);
      window.history.replaceState(null,"","?"+q.toString());
    }catch(e){}
  },[tab,fltDays,fltRegion,trendMetric]);
  useEffect(function(){  // date-rangeable live-KPI trend, fetched on Overview + when the range changes
    if(tab!=="Overview")return;
    setSeriesInfo(function(s){return Object.assign({},s,{loading:true,error:null});});
    fetch("/api/snapshots/series?days="+fltDays,{credentials:"include"})
      .then(function(r){return r.ok?r.json():Promise.reject(new Error("HTTP "+r.status));})
      .then(function(j){setSeriesInfo({loading:false,status:j.status||null,series:j.series||null,error:null});})
      .catch(function(e){setSeriesInfo({loading:false,status:"error",series:null,error:e.message||"series failed"});});
  },[tab,fltDays]);
  function copyLink(){try{navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(function(){setCopied(false);},1500);}catch(e){}}
  function dmShort(ymd){return String(ymd).slice(8,10)+"/"+String(ymd).slice(5,7);}

  // Single derived pipelineData â€” everything in the app reads from this
  var pd=useMemo(function(){return buildPipelineData(liveApiData);},[liveApiData]);

  var allBoards=Object.keys(BOARDS);
  var draftChanges=audit.filter(function(e){return e.draft;});

  function addAudit(action,detail,type){type=type||"system";setAudit(function(l){return [{id:Date.now(),ts:dmyTime(),user:"Stephen Farrell",action:action,detail:detail,type:type,draft:draft}].concat(l);});}
  function updMember(i,u){setTeam(function(t){return t.map(function(x,idx){return idx===i?u:x;});});}
  function switchToDraft(){setDraft(true);addAudit("Switched to draft mode","Changes will not affect live send","system");}
  function pushToLive(){setDraft(false);setShowPush(false);setAudit(function(l){return l.map(function(e){return Object.assign({},e,{draft:false});});});addAudit("Pushed to live","All draft changes promoted","system");}
  // Increment 2 helpers
  var RANGE_SHORT={"Week over week":"last week","Month over month":"last month","Quarter over quarter":"last quarter","Year over year":"last year"};
  function fmtDiff(format,n){
    if(format==="money"){var a=Math.abs(n);if(a>=1e6)return"$"+(n/1e6).toFixed(1)+"M";if(a>=1e3)return"$"+Math.round(n/1e3)+"k";return"$"+Math.round(n);}
    if(format==="days")return Math.round(n)+"d";
    if(format==="percent")return (Math.round(n*10)/10)+"%";
    return Math.round(n).toLocaleString();
  }
  function ragColor(cur,tgt,better){
    if(tgt==null||better==="neutral")return null;
    if(better==="higher"){var r=tgt===0?(cur>0?1:0):cur/tgt;return r>=1?cc.green:r>=0.8?cc.amber:cc.red;}
    if(cur<=tgt)return cc.green;var over=tgt===0?(cur>0?2:0):cur/tgt;return over<=1.25?cc.amber:cc.red;
  }
  function setTarget(key,val){
    setTargets(function(prev){var next=Object.assign({},prev);next[key]=Object.assign({},next[key]||{betterWhen:"neutral"},{target:val});
      try{var saved=JSON.parse(localStorage.getItem("unitea:kpiTargets")||"{}");if(val==null){delete saved[key];}else{saved[key]=val;}localStorage.setItem("unitea:kpiTargets",JSON.stringify(saved));}catch(e){}
      return next;});
  }

  async function pullLive(isAuto){
    setLiveLoad(true);
    setApiHealth(function(h){return Object.assign({},h,{pd:"checking"});});
    setApiErr(null);
    var d=await fetchPD(pdKey,setApiErr,setApiHealth);
    if(d){
      setLiveApiData(d);
      setStaleCache(null);
      try{window.localStorage.setItem("pipedrive:lastPull",JSON.stringify({data:d,ts:Date.now()}));}catch(e){}
      addAudit(isAuto?"Live Pipedrive data auto-pulled":"Live Pipedrive data pulled",d.totalDeals+" open deals fetched","system");
    } else if(isAuto){
      // Auto-pull failed â€” try to use localStorage cache
      try{
        var raw=window.localStorage.getItem("pipedrive:lastPull");
        if(raw){
          var cached=JSON.parse(raw);
          if(cached&&cached.data){
            setLiveApiData(cached.data);
            setStaleCache({ts:cached.ts});
            setApiErr(null);
          }
        }
      }catch(e){}
    }
    setLiveLoad(false);
  }

  // Auto-pull live data on dashboard mount.
  // If the fetch fails, fall back to localStorage cache and retry once after 30s.
  React.useEffect(function(){
    var retryTimer=null;
    var canceled=false;
    async function attempt(){
      if(canceled)return;
      setLiveLoad(true);
      setApiHealth(function(h){return Object.assign({},h,{pd:"checking"});});
      var d=await fetchPD(pdKey,setApiErr,setApiHealth);
      if(canceled)return;
      if(d){
        setLiveApiData(d);
        setStaleCache(null);
        try{window.localStorage.setItem("pipedrive:lastPull",JSON.stringify({data:d,ts:Date.now()}));}catch(e){}
        addAudit("Live Pipedrive data auto-pulled",d.totalDeals+" open deals fetched","system");
      } else {
        // Try cache
        try{
          var raw=window.localStorage.getItem("pipedrive:lastPull");
          if(raw){
            var cached=JSON.parse(raw);
            if(cached&&cached.data){
              setLiveApiData(cached.data);
              setStaleCache({ts:cached.ts});
              setApiErr(null);
            }
          }
        }catch(e){}
        // Schedule one retry in 30 seconds
        retryTimer=setTimeout(function(){if(!canceled)attempt();},30000);
      }
      setLiveLoad(false);
    }
    attempt();
    return function(){canceled=true;if(retryTimer)clearTimeout(retryTimer);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Load persisted KPI tag config on mount. Falls back to bundled
  // KPI_INIT if blob is empty or fetch fails â€” UI shows source label
  // so the user knows whether they're editing defaults or saved.
  React.useEffect(function(){
    var canceled=false;
    async function load(){
      setKpiCfgState(function(s){return Object.assign({},s,{status:"loading",error:null});});
      try{
        var r=await fetch("/api/config/kpi-tags");
        if(!r.ok)throw new Error("HTTP "+r.status);
        var j=await r.json();
        if(canceled)return;
        if(j&&j.success&&Array.isArray(j.tags)){
          setKpiTags(j.tags);
          setKpiCfgState({status:"saved",source:j.source||"default",updatedAt:j.updatedAt||null,error:null});
        }else{
          setKpiCfgState({status:"saved",source:"default",updatedAt:null,error:null});
        }
      }catch(err:any){
        if(canceled)return;
        setKpiCfgState({status:"error",source:"default",updatedAt:null,error:err.message||"load failed"});
      }
    }
    load();
    return function(){canceled=true;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Mark dirty whenever kpiTags changes AFTER initial load.
  // We use a ref-like flag via the "status" check so the first hydration doesn't trigger.
  var kpiTagsFirstRef=React.useRef(true);
  React.useEffect(function(){
    if(kpiTagsFirstRef.current){kpiTagsFirstRef.current=false;return;}
    setKpiCfgState(function(s){if(s.status==="saving"||s.status==="loading")return s;return Object.assign({},s,{status:"dirty"});});
  },[kpiTags]);

  async function saveKpiConfig(){
    setKpiCfgState(function(s){return Object.assign({},s,{status:"saving",error:null});});
    try{
      var r=await fetch("/api/config/kpi-tags",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({tags:kpiTags}),
      });
      var j=await r.json();
      if(!r.ok||!j.success)throw new Error(j.error||("HTTP "+r.status));
      setKpiCfgState({status:"saved",source:"blob",updatedAt:j.updatedAt||new Date().toISOString(),error:null});
      addAudit("KPI tag config saved",kpiTags.length+" tags persisted to Blob","kpi");
    }catch(err:any){
      setKpiCfgState(function(s){return Object.assign({},s,{status:"error",error:err.message||"save failed"});});
    }
  }


  async function genAiSummary(){
    setSummaryLoading(true);
    var top3=(pd.bottlenecks||[]).slice(0,3);
    var lines=[];
    if(top3.length===0){
      lines.push("No significant bottlenecks detected. Pipeline is flowing within expected thresholds.");
    }else{
      lines.push("Top "+top3.length+" bottleneck"+(top3.length>1?"s":"")+" across the pipeline:");
      top3.forEach(function(b,i){
        lines.push((i+1)+". "+b.board+" â€º "+b.stage+" â€” "+b.stuckCount+" stuck deals, "+b.pctAbove+"% above average.");
      });
      lines.push("");
      lines.push("Recommended focus: review the highest-percentage bottleneck with the owning team and identify whether the constraint is process, capacity, or external dependency.");
    }
    setAiSummary(lines.join("\n"));
    setSummaryLoading(false);
  }

  // Generate preview email â€” fully deterministic, no AI. Built from pipelineData and person.
  async function genPreview(person,idx){
    setPrevLoad(true);setPrevEmail(null);
    try{
      var days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      var day=days[new Date().getDay()];
      var isMon=day==="Monday";
      var isOwner=canAccess(person.role,"analyticsDeep");
      var firstName=person.name.split(" ")[0];

      // â”€â”€ KPI value resolver: live data when mapped, fallback otherwise â”€â”€
      function resolveKpi(kpiName){
        var tag=kpiTags.find(function(t){return t.name===kpiName;});
        if(!tag||!tag.sources||tag.sources.length===0)return tag&&tag.fallback?tag.fallback:"â€”";
        if(!liveApiData||!liveApiData.boardData)return tag.fallback||"â€”";
        var src=tag.sources[0];
        var bd=liveApiData.boardData[src.board];
        if(!bd)return tag.fallback||"â€”";
        if(src.scope==="board")return String(bd.totalDeals);
        if(src.scope==="stage"&&src.stage){
          var st=bd.stages&&bd.stages.find(function(s){return s.name&&s.name.toLowerCase()===src.stage.toLowerCase();});
          return st?String(st.count):(tag.fallback||"â€”");
        }
        return tag.fallback||"â€”";
      }

      // â”€â”€ Build KPI table (3 cols, fills with empty cells for odd counts) â”€â”€
      var kpiCells=person.kpis.map(function(k){
        var v=resolveKpi(k);
        return "<td style='padding:10px 8px;vertical-align:top;width:33%;'><div style='font-size:11px;color:#897C80;margin-bottom:3px;'>"+escHtml(k)+"</div><div style='font-size:18px;color:#F0F0F0;font-weight:600;'>"+escHtml(v)+"</div></td>";
      });
      while(kpiCells.length%3!==0)kpiCells.push("<td></td>");
      var kpiRows="";
      for(var ri=0;ri<kpiCells.length;ri+=3){
        kpiRows+="<tr>"+kpiCells[ri]+kpiCells[ri+1]+kpiCells[ri+2]+"</tr>";
      }

      // â”€â”€ Bottlenecks (top 3 relevant to this person's boards) â”€â”€
      var personBoards=person.boards==="all"?Object.keys(BOARDS):(Array.isArray(person.boards)?person.boards:[]);
      var bottlenecks=(pd.bottlenecks||[]).filter(function(b){return personBoards.indexOf(b.board)>=0;}).slice(0,3);
      var bottleneckHtml=bottlenecks.length===0
        ? "<p style='margin:0;font-size:13px;color:#22C55E;'>No bottlenecks detected in your boards. âœ“</p>"
        : bottlenecks.map(function(b){
            return "<div style='margin-bottom:8px;padding:8px 10px;background:rgba(239,68,68,0.08);border-left:3px solid #EF4444;border-radius:0 4px 4px 0;'>"
              +"<div style='font-size:13px;color:#F0F0F0;font-weight:500;'>"+escHtml(b.board)+" â€º "+escHtml(b.stage)+"</div>"
              +"<div style='font-size:11px;color:#897C80;margin-top:2px;'>"+b.stuckCount+" stuck deals Â· "+b.pctAbove+"% above avg</div>"
              +"</div>";
          }).join("");

      // â”€â”€ Today's priorities (role-aware, deterministic) â”€â”€
      var priorityList=getPriorities(person,pd);
      var priorityHtml=priorityList.map(function(p,i){
        return "<div style='margin-bottom:6px;font-size:13px;color:#F0F0F0;'><span style='color:#F28F1D;font-weight:600;margin-right:6px;'>"+(i+1)+".</span>"+escHtml(p)+"</div>";
      }).join("");

      // â”€â”€ Health section (existing builder, only for nested-access roles) â”€â”€
      var healthHtml=person.nested?buildEmailHealthSection(pd,personBoards):"";

      // â”€â”€ Week in review (Mondays only) â”€â”€
      var weekHtml=isMon?(
        "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;'>"
        +"<div style='padding:18px;'>"
        +"<h2 style='margin:0 0 10px;font-size:15px;color:#F28F1D;font-weight:600;'>Week in review</h2>"
        +"<p style='margin:0 0 6px;font-size:13px;color:#F0F0F0;'>Prior week: "+(pd.totalActiveJobs||0)+" active jobs, "+(pd.totalStuck||0)+" total bottlenecks, end-to-end avg "+(pd.endToEndDays||0)+" days.</p>"
        +"<p style='margin:0;font-size:12px;color:#897C80;'>Industry benchmark: "+INDUSTRY_BENCHMARK_DAYS+" days.</p>"
        +"</div>"
      ):"";

      // â”€â”€ Owner-level team pulse â”€â”€
      var ownerHtml=isOwner?(
        "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;'>"
        +"<div style='padding:18px;'>"
        +"<h2 style='margin:0 0 10px;font-size:15px;color:#F28F1D;font-weight:600;'>Team pulse</h2>"
        +"<table style='width:100%;border-collapse:collapse;'><tr>"
        +"<td style='padding:8px;width:25%;'><div style='font-size:11px;color:#897C80;'>Active</div><div style='font-size:16px;color:#F0F0F0;font-weight:600;'>"+(pd.totalActiveJobs||0)+"</div></td>"
        +"<td style='padding:8px;width:25%;'><div style='font-size:11px;color:#897C80;'>Stuck</div><div style='font-size:16px;color:#F0F0F0;font-weight:600;'>"+(pd.totalStuck||0)+"</div></td>"
        +"<td style='padding:8px;width:25%;'><div style='font-size:11px;color:#897C80;'>E2E days</div><div style='font-size:16px;color:#F0F0F0;font-weight:600;'>"+(pd.endToEndDays||0)+"</div></td>"
        +"<td style='padding:8px;width:25%;'><div style='font-size:11px;color:#897C80;'>Source</div><div style='font-size:12px;color:#F0F0F0;font-weight:500;'>"+(liveApiData?"Live":"Sim")+"</div></td>"
        +"</tr></table></div>"
      ):"";

      // â”€â”€ Assemble full email â”€â”€
      var finalHtml=""
        +"<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#24262B;color:#F0F0F0;border-radius:8px;overflow:hidden;'>"
        // Section 1: greeting
        +"<div style='padding:18px;'>"
        +"<h1 style='margin:0 0 4px;font-size:20px;color:#F28F1D;font-weight:600;'>Good morning, "+escHtml(firstName)+"</h1>"
        +"<p style='margin:0;font-size:13px;color:#897C80;'>"+escHtml(day)+" "+dmy(new Date())+" Â· "+escHtml(person.title)+(isMon?" Â· New week, fresh start.":"")+"</p>"
        +"</div>"
        // Section 2: KPIs
        +"<hr style='border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;'>"
        +"<div style='padding:18px;'>"
        +"<h2 style='margin:0 0 10px;font-size:15px;color:#F28F1D;font-weight:600;'>Your KPIs today</h2>"
        +"<table style='width:100%;border-collapse:collapse;'>"+kpiRows+"</table>"
        +"</div>"
        // Section 3: needs attention
        +"<hr style='border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;'>"
        +"<div style='padding:18px;'>"
        +"<h2 style='margin:0 0 10px;font-size:15px;color:#F28F1D;font-weight:600;'>Needs attention</h2>"
        +bottleneckHtml
        +"</div>"
        // Health (injected for nested access)
        +(healthHtml?"<hr style='border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;'>"+healthHtml:"")
        // Section 4: priorities
        +"<hr style='border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;'>"
        +"<div style='padding:18px;'>"
        +"<h2 style='margin:0 0 10px;font-size:15px;color:#F28F1D;font-weight:600;'>Today's priorities</h2>"
        +priorityHtml
        +"</div>"
        // Optional sections
        +weekHtml
        +ownerHtml
        // Footer
        +"<hr style='border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;'>"
        +"<div style='padding:14px 18px;font-size:11px;color:#897C80;text-align:center;'>"
        +"Read-only system Â· Unicity Solar Energy Â· "+(liveApiData?"Live data":"Simulated data")+" Â· "+new Date().toLocaleTimeString()
        +"</div>"
        +"</div>";

      setPrevEmail(finalHtml);
    }catch(err:any){
      setPrevEmail("<p style='color:#EF4444'>Error generating preview: "+(err.message||"unknown")+"</p>");
    }
    setPrevLoad(false);
  }

  async function doSend(m,i){
    if(!m.email){
      alert("No email set for "+m.name+". Add it to TEAM_INIT first.");
      return;
    }
    setSendStatus(function(s){var n=Object.assign({},s);n[i]="sending...";return n;});
    try{
      var html="<div style='font-family:Arial,sans-serif;background:#24262B;color:#F0F0F0;padding:1.5rem;border-radius:8px'>"
        +"<h2 style='color:#F28F1D;margin:0 0 1rem'>Test briefing â€” "+m.name+"</h2>"
        +"<p style='margin:0 0 0.5rem'>Hello "+m.name.split(" ")[0]+",</p>"
        +"<p style='margin:0 0 0.5rem'>This is a manual send from the Unicity Solar KPI dashboard.</p>"
        +"<p style='margin:0 0 0.5rem'>Pipeline summary: <strong>"+pd.totalActiveJobs+"</strong> active jobs, <strong>"+pd.totalStuck+"</strong> stuck, end-to-end avg <strong>"+pd.endToEndDays+"d</strong>.</p>"
        +"<p style='margin:1.5rem 0 0;font-size:11px;color:#897C80'>Sent "+dmyTime()+" â€” "+(liveApiData?"Live data":"Simulated data")+"</p>"
        +"</div>";
      var res=await fetch("/api/email/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:m.email,subject:"Unicity KPI Briefing â€” Test",html:html})});
      var data=await res.json();
      if(!res.ok)throw new Error(data.error||"Send failed");
      var entry={id:Date.now(),name:m.name,role:m.role,email:m.email,ts:dmyTime(),dataSource:liveApiData?"Live Pipedrive":"Simulated",mode:draft?"Draft":"Live",status:"Sent"};
      setSendLog(function(l){return [entry].concat(l);});
      setSendStatus(function(s){var n=Object.assign({},s);n[i]=new Date().toLocaleTimeString();return n;});
      addAudit("Email sent",m.name+" â€” "+entry.dataSource,"system");
    }catch(err:any){
      setSendStatus(function(s){var n=Object.assign({},s);n[i]="failed";return n;});
      alert("Send failed: "+(err.message||"unknown"));
    }
  }

  var ALL_TABS=[{id:"Overview",icon:"ti-layout-dashboard",admin:false},{id:"Setup",icon:"ti-settings",admin:true},{id:"Team",icon:"ti-users",admin:false},{id:"Boards",icon:"ti-layout-board",admin:false},{id:"Intelligence",icon:"ti-brain",admin:false},{id:"Reports",icon:"ti-chart-bar",admin:false},{id:"Preview",icon:"ti-mail",admin:false},{id:"Send",icon:"ti-send",admin:true},{id:"Audit",icon:"ti-history",admin:true},{id:"RALPH",icon:"ti-circuit-board",admin:true}];
  var TABS=ALL_TABS.filter(function(t){return isAdmin||!t.admin;});
  var ICON_OF={}; ALL_TABS.forEach(function(t){ICON_OF[t.id]=t.icon;});
  var NAV_GROUPS=[{label:"",items:["Overview"]},{label:"Analytics",items:["Reports","Intelligence","Boards"]},{label:"People",items:["Team","Preview"]},{label:"System",items:["Setup","Send","Audit","RALPH"]}];

  function getDept(r){if(["Owner","COO","VP of Operations","Office Manager","Office Administrator","Installation Manager","Warehouse Manager","Service Manager","Service Coordinator","Engineering Coordinator","Permitting Coordinator","Scheduling Coordinator","Inspection Coordinator","Net Metering Coordinator","Receptionist"].indexOf(r)>=0)return"Operations";if(["President of Sales","Sales Relations Manager","Account Manager","After Hours Account Manager","Onboarding Coordinator"].indexOf(r)>=0)return"Sales";if(["Accounting Manager","Commissions Coordinator","Director of Finance","Funding Coordinator"].indexOf(r)>=0)return"Finance";return"AI";}

  var filtTeam=team.filter(function(m){var ms=m.name.toLowerCase().indexOf(tSearch.toLowerCase())>=0||m.title.toLowerCase().indexOf(tSearch.toLowerCase())>=0;var mf=tFilter==="All"||getDept(m.role)===tFilter||m.region===tFilter;return ms&&mf;});
  var pdCol=apiHealth.pd==="connected"?C.green:apiHealth.pd==="checking"?C.amber:apiHealth.pd==="unknown"?th.textMuted:C.red;

  return <div className={dark?"theme-dark":"theme-light"} style={{minHeight:"100vh",background:th.bg,fontFamily:"var(--font-sans)",position:"relative",display:"flex"}}>
    {boardEdit!==null&&<BoardModal member={team[boardEdit]} allBoards={allBoards} onSave={function(nb){addAudit("Board access updated",team[boardEdit].name+" boards updated","access");updMember(boardEdit,Object.assign({},team[boardEdit],{boards:nb}));setBoardEdit(null);}} onClose={function(){setBoardEdit(null);}} th={th}/>}
    {showPush&&<PushModal draftChanges={draftChanges} team={team} onConfirm={pushToLive} onCancel={function(){setShowPush(false);}} th={th}/>}
    {kpiDrillKpi&&<KpiDrillDown kpiName={kpiDrillKpi} pd={pd} memberBoards={drillBoards||(team[prevPerson]?team[prevPerson].boards:Object.keys(BOARDS))} role={team[prevPerson]?team[prevPerson].role:"Owner"} onClose={function(){setKpiDrillKpi(null);setDrillBoards(null);}} th={th} onNavigateIntelligence={function(sub){setKpiDrillKpi(null);setDrillBoards(null);setTab("Intelligence");setIntelSub(sub);}}/>}

    {/* Sidebar nav (rebuild step 2) */}
    <aside style={{width:212,flexShrink:0,minHeight:"100vh",background:th.tabBg,borderRight:"1px solid "+th.borderPlain,display:"flex",flexDirection:"column",gap:2,padding:"16px 12px",boxSizing:"border-box"}}>
      <div style={{display:"flex",alignItems:"center",gap:9,padding:"4px 8px 14px"}}>
        <UniLogo/>
        <div style={{display:"flex",alignItems:"baseline",gap:5}}><span style={{fontSize:15,fontWeight:600,color:th.text}}>Unicity</span><span style={{fontSize:15,fontWeight:600,color:C.orange}}>KPI</span></div>
      </div>
      {NAV_GROUPS.map(function(g){var items=g.items.filter(function(id){return TABS.some(function(t){return t.id===id;});});if(!items.length)return null;return <div key={g.label||"top"}>
        {g.label?<div style={{fontSize:10,letterSpacing:"0.8px",color:th.textMuted,padding:"10px 8px 4px",textTransform:"uppercase" as const}}>{g.label}</div>:null}
        {items.map(function(id){var a=tab===id;return <button key={id} onClick={function(){setTab(id);}} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"8px 9px",border:"none",borderRadius:8,background:a?C.orange+"24":"transparent",color:a?C.orange:th.text,fontWeight:a?500:400,fontSize:12.5,cursor:"pointer",textAlign:"left" as const,marginBottom:1}}>
          <i className={"ti "+ICON_OF[id]} style={{fontSize:16,flexShrink:0}} aria-hidden="true"/>{id}
        </button>;})}
      </div>;})}
      <div style={{marginTop:"auto",padding:"10px 8px 2px",fontSize:10.5,color:th.textMuted,borderTop:"1px solid "+th.borderPlain}}>Briefing system v8</div>
    </aside>

    {/* Main column */}
    <main style={{flex:1,minWidth:0,minHeight:"100vh",padding:"1.25rem 1.5rem 2rem",boxSizing:"border-box"}}>

    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1rem",flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:120}}>
        <div style={{fontSize:20,fontWeight:600,color:th.text}}>{tab}</div>
        <p style={{margin:0,fontSize:11,color:th.textMuted}}>Unicity Solar Energy &middot; KPI dashboard</p>
      </div>
      <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:th.textMuted,marginRight:8}}>{session.name||session.email} Â· <a href="/api/auth/signout" style={{color:C.orange,textDecoration:"none"}}>Sign out</a></span>
        {liveApiData&&!staleCache&&<Pill text={"Live Â· "+pd.totalActiveJobs+" jobs"} color="green"/>}
        {staleCache&&<Pill text="Cached" color="blue"/>}
        {liveLoad&&<Pill text="Pulling..." color="amber"/>}
        <button onClick={function(){pullLive(false);}} disabled={liveLoad} title="Refresh live Pipedrive data" style={{display:"flex",alignItems:"center",gap:5,background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:20,padding:"5px 12px",color:th.textMuted,fontSize:11,cursor:liveLoad?"wait":"pointer"}}>
          <i className="ti ti-refresh" style={{fontSize:13}} aria-hidden="true"/>{liveLoad?"...":"Refresh"}
        </button>
        <span style={{background:C.green+"12",border:"1px solid "+C.green+"30",borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:500,color:C.green}}>Read-only</span>
        <button onClick={function(){setDark(function(d){return !d;});}} style={{display:"flex",alignItems:"center",gap:5,background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:20,padding:"5px 12px",color:th.textMuted,fontSize:11,cursor:"pointer"}}>
          <i className={"ti ti-"+(dark?"sun":"moon")} style={{fontSize:13}} aria-hidden="true"/>{dark?"Light":"Dark"}
        </button>
        <CronStatusPill status={cronStatus}/>
      </div>
    </div>

    {/* Cron status banner â€” always visible, makes live/test/paused state unmissable */}
    <CronStatusBanner status={cronStatus} th={th}/>

    {/* Draft/Live banner */}
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1rem",padding:"10px 16px",borderRadius:12,background:draft?C.amber+"12":C.green+"0d",border:"2px solid "+(draft?C.amber:C.green)+"44"}}>
      <div style={{width:12,height:12,borderRadius:"50%",background:draft?C.amber:C.green,boxShadow:"0 0 10px "+(draft?C.amber:C.green),flexShrink:0}}/>
      <div style={{flex:1}}>
        <p style={{margin:0,fontSize:14,fontWeight:500,color:draft?C.amber:C.green}}>{draft?"Draft mode - changes are NOT live":"Live mode - 6am send is active"}</p>
        <p style={{margin:0,fontSize:11,color:th.textMuted}}>{draft?draftChanges.length+" draft changes pending":"Last pushed: "+(audit.find(function(e){return e.action==="Pushed to live";})||{ts:"Never"}).ts}</p>
      </div>
      {draft?<button onClick={function(){setShowPush(true);}} style={{background:"linear-gradient(135deg,"+C.orange+","+C.orangeDeep+")",border:"none",borderRadius:10,color:"#fff",fontWeight:500,fontSize:12,padding:"9px 18px",cursor:"pointer",whiteSpace:"nowrap"}}>Push to live</button>
      :<button onClick={switchToDraft} style={{background:C.amber+"18",border:"1px solid "+C.amber+"44",borderRadius:10,color:C.amber,fontWeight:500,fontSize:12,padding:"9px 18px",cursor:"pointer",whiteSpace:"nowrap"}}>Switch to draft</button>}
    </div>

    <div style={{background:C.green+"0a",border:"1px solid "+C.green+"22",borderRadius:12,padding:"7px 14px",marginBottom:"1rem"}}>
      <p style={{margin:0,fontSize:12,color:C.green}}>Read-only mode. Pipedrive GET endpoints only. Google OAuth: gmail.send + gmail.readonly. No data is modified.</p>
    </div>

    {/* nav moved to the sidebar */}

    {/* Data-source status banner â€” visible across all tabs */}
    {staleCache&&<div style={{background:C.blue+"0d",border:"1px solid "+C.blue+"22",borderRadius:10,padding:"7px 12px",marginBottom:"1rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
      <span style={{fontSize:12,color:C.blue}}>Using cached data from {new Date(staleCache.ts).toLocaleTimeString()} &mdash; will re-attempt to pull live data shortly</span>
      <button onClick={function(){pullLive(false);}} disabled={liveLoad} style={{background:C.blue+"22",border:"1px solid "+C.blue+"44",borderRadius:6,color:C.blue,fontWeight:500,fontSize:11,padding:"4px 10px",cursor:liveLoad?"wait":"pointer",flexShrink:0}}>{liveLoad?"Retrying...":"Retry now"}</button>
    </div>}
    {!pd.isLive&&!staleCache&&<div style={{background:C.amber+"0d",border:"1px solid "+C.amber+"22",borderRadius:10,padding:"7px 12px",marginBottom:"1rem"}}>
      <span style={{fontSize:12,color:C.amber}}>{liveLoad?"Loading live data from Pipedrive...":"Simulated data \u2014 Pipedrive unavailable, using fallback numbers"}</span>
    </div>}

    {/* OVERVIEW — graph-forward landing (rebuild step 3) */}
    {tab==="Overview"&&<div>
      {/* Reporting controls — date range + region + shareable link (PR-A) */}
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <span style={{fontSize:11,color:th.textMuted}}>Range</span>
        <div style={{display:"flex",gap:4,background:th.bg,border:"1px solid "+th.borderPlain,borderRadius:9,padding:3}}>
          {RANGE_OPTS.map(function(o){var a=fltDays===o.d;return <button key={o.d} onClick={function(){setFltDays(o.d);}} style={{fontSize:11,padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",background:a?C.orange:"transparent",color:a?"#1a1209":th.textMuted,fontWeight:a?500:400}}>{o.l}</button>;})}
        </div>
        <span style={{fontSize:11,color:th.textMuted,marginLeft:6}}>Region</span>
        <select value={fltRegion} onChange={function(e){setFltRegion(e.target.value);}} style={Object.assign({},iS,{padding:"6px 9px"})}>
          <option value="All">All regions</option><option value="FL">Florida</option><option value="CA">California</option>
        </select>
        <button onClick={copyLink} title="Copy a shareable link to this view" style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:20,padding:"6px 12px",color:copied?cc.green:th.textMuted,fontSize:11,cursor:"pointer"}}><i className={"ti "+(copied?"ti-check":"ti-link")} style={{fontSize:13}} aria-hidden="true"/>{copied?"Copied":"Copy link"}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:14}}>
        {[
          {l:"Active jobs",v:String(pd.totalActiveJobs),c:th.text,s:pd.totalStuck+" stuck"},
          {l:"Win rate",v:OPS_INSIGHTS.funnel.winRate+"%",c:OPS_INSIGHTS.funnel.winRate>=70?cc.green:cc.amber,s:OPS_INSIGHTS.funnel.resolved.toLocaleString()+" resolved"},
          {l:"Cancellation rate",v:OPS_INSIGHTS.cancellations.ratePctOfResolved+"%",c:OPS_INSIGHTS.cancellations.ratePctOfResolved>30?cc.red:OPS_INSIGHTS.cancellations.ratePctOfResolved>15?cc.amber:cc.green,s:"median "+OPS_INSIGHTS.cancellations.medianDaysToCancel+"d to cancel"},
          {l:"Median cycle → PTO",v:(ow.cycleTimes[0].median!=null?ow.cycleTimes[0].median+"d":"—"),c:th.text,s:"contract → PTO · "+owLabel},
          {l:"Inspection fail rate",v:OPS_INSIGHTS.inspections.failRatePct+"%",c:OPS_INSIGHTS.inspections.failRatePct>30?cc.red:OPS_INSIGHTS.inspections.failRatePct>15?cc.amber:cc.green,s:OPS_INSIGHTS.inspections.failures.toLocaleString()+" failures"}
        ].map(function(card,i){return <div key={i} onClick={function(){setDrillBoards(null);setKpiDrillKpi(card.l+" — "+card.v);}} title="Click to drill into the underlying jobs" style={Object.assign({},glass,{padding:"0.9rem 1.1rem",cursor:"pointer"})}>
          <p style={{margin:"0 0 5px",fontSize:11,color:th.textMuted}}>{card.l}</p>
          <p style={{margin:0,fontSize:25,fontWeight:600,color:card.c}}>{card.v}</p>
          <p style={{margin:"3px 0 0",fontSize:10.5,color:th.textMuted}}>{card.s}</p>
        </div>;})}
      </div>
      {/* Date-rangeable live-KPI trend (PR-A) */}
      <div style={Object.assign({},glass,{marginBottom:12})}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:10}}>
          <span style={{fontSize:14,fontWeight:500,color:th.text,flex:1}}>KPI trend</span>
          <select value={trendMetric} onChange={function(e){setTrendMetric(e.target.value);}} style={Object.assign({},iS,{padding:"5px 9px"})}>
            {Object.keys(METRIC_LABELS).map(function(k){return <option key={k} value={k}>{METRIC_LABELS[k]}</option>;})}
          </select>
        </div>
        {seriesInfo.loading?
          <p style={{margin:0,fontSize:12,color:th.textMuted,textAlign:"center",padding:"1.5rem 0"}}>Loading trend…</p>
        :seriesInfo.status==="ok"&&seriesInfo.series&&seriesInfo.series.length>1?
          <LineChart th={th} color={cc.blue} height={220} format={trendMetric==="totalPipelineValue"?"money":trendMetric==="cancellationRate30d"?"pct":trendMetric==="endToEndDays"?"days":"int"} data={seriesInfo.series.map(function(row){return {label:dmShort(row.date),value:row[trendMetric]};})}/>
        :<div style={{textAlign:"center",padding:"1.5rem 0"}}><p style={{margin:"0 0 4px",fontSize:13,color:th.text}}>Trend builds as daily snapshots accumulate</p><p style={{margin:0,fontSize:11,color:th.textMuted}}>{seriesInfo.series&&seriesInfo.series.length===1?"Only one snapshot so far — need ≥2 points.":"No snapshots in this range yet."}</p></div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(280px,360px) 1fr",gap:12,marginBottom:12}}>
        <div style={glass}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Job outcomes</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>All jobs by lifecycle phase</p>
          <DonutChart th={th} data={OPS_INSIGHTS.funnel.outcomes.map(function(o,i){return {label:o.label,value:o.count,color:[cc.blue,cc.green,cc.teal,cc.red,cc.amber,cc.neutral][i]};})}/>
        </div>
        <div style={glass}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Cancellations per month</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>Trend &middot; dashed = target</p>
          <LineChart th={th} color={cc.orange} goal={CANCELLATIONS_PER_MONTH_TARGET} goalColor={cc.amber} data={OPS_INSIGHTS.cancellations.monthly.slice(-Math.max(3,Math.ceil(fltDays/30))).map(function(m){return {label:monthYear(m.month,true),value:m.count};})}/>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={glass}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Top red-flag categories</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>{ow.redFlags.total.toLocaleString()} flags &middot; {owLabel}</p>
          <BarChart th={th} color={cc.red} data={ow.redFlags.categories.slice(0,6).map(function(c){return {label:c.category.replace(/_/g," "),value:c.count};})}/>
        </div>
        <div style={glass}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Active pipeline by board {pd.isLive?"":"(simulated)"}</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>Live &middot; {pd.totalActiveJobs} active jobs</p>
          <BarChart th={th} color={cc.orange} onBarClick={function(b){setDrillBoards([b]);setKpiDrillKpi(b+" — jobs");}} data={Object.keys(pd.boards).map(function(b){return {label:b,value:pd.boards[b].jobCount};}).filter(function(d){return d.value>0&&(fltRegion==="All"||(BOARDS[d.label]&&BOARDS[d.label].region===fltRegion));}).sort(function(a,b){return b.value-a.value;}).slice(0,8)}/>
        </div>
      </div>
    </div>}

    {/* SETUP */}
    {isAdmin&&tab==="Setup"&&<div>
      <SubTab tabs={["General","KPI Mapping","Pipedrive Fields"]} active={stab} onChange={setStab} th={th}/>
      {stab==="General"&&<div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
        <div style={glass}>
          <SLabel icon="ti-plug-connected" text="Connection status"/>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:C.green+"0d",border:"1px solid "+C.green+"22",borderRadius:8}}>
              <div>
                <p style={{margin:0,fontSize:13,color:th.text,fontWeight:500}}><span style={{color:C.green,marginRight:6}}>â—</span>Pipedrive</p>
                <p style={{margin:"2px 0 0",fontSize:11,color:th.textMuted}}>Read-only Â· server-managed credentials Â· no setup needed</p>
              </div>
              <button onClick={pullLive} disabled={liveLoad} style={{background:C.orange+"22",border:"1px solid "+C.orange+"44",borderRadius:8,color:C.orange,fontWeight:500,fontSize:12,padding:"6px 12px",cursor:"pointer"}}>{liveLoad?"Pulling...":(liveApiData?"Refresh":"Pull live data")}</button>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:C.green+"0d",border:"1px solid "+C.green+"22",borderRadius:8}}>
              <div>
                <p style={{margin:0,fontSize:13,color:th.text,fontWeight:500}}><span style={{color:C.green,marginRight:6}}>â—</span>Google Workspace</p>
                <p style={{margin:"2px 0 0",fontSize:11,color:th.textMuted}}>Sender authorized Â· briefings sent automatically</p>
              </div>
            </div>
            {liveApiData&&<div style={{padding:"8px 12px",background:C.blue+"08",border:"1px solid "+C.blue+"22",borderRadius:8}}>
              <p style={{margin:0,fontSize:12,color:C.blue}}>Latest pull: {liveApiData.totalDeals} open deals across {(liveApiData.pipelines||[]).length} pipelines Â· {apiHealth.lastPull}</p>
            </div>}
            {apiErr&&<div style={{padding:"8px 12px",background:C.red+"0d",border:"1px solid "+C.red+"33",borderRadius:8}}>
              <p style={{margin:0,fontSize:12,color:C.red}}>! {apiErr}</p>
            </div>}
          </div>
        </div>
        <div style={glass}>
          <SLabel icon="ti-clock" text="Send schedule"/>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <input type="time" value={sendTime} onChange={function(e){setSendTime(e.target.value);}} style={Object.assign({},iS,{width:130,color:C.orange,fontWeight:500,fontSize:18})}/>
            <div><p style={{margin:0,fontSize:13,color:th.text,fontWeight:500}}>Weekdays Â· Mon-Fri</p><p style={{margin:"2px 0 0",fontSize:11,color:th.textMuted}}>Server schedule: 11:00 UTC (7am EDT / 6am EST) Â· {team.length} recipients Â· managed via Vercel cron</p></div>
          </div>
        </div>
        <div style={glass}>
          <SLabel icon="ti-heartbeat" text="API health monitor"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[{l:"Pipedrive",v:apiHealth.pd,col:pdCol},{l:"Gmail",v:apiHealth.gmail,col:apiHealth.gmail==="connected"?C.green:th.textMuted},{l:"Last pull",v:apiHealth.lastPull,col:th.textMuted}].map(function(s){return <div key={s.l} style={{background:s.col+"0d",border:"1px solid "+s.col+"22",borderRadius:10,padding:"8px 12px"}}><p style={{margin:0,fontSize:11,color:th.textMuted}}>{s.l}</p><p style={{margin:0,fontSize:12,fontWeight:500,color:s.col}}>{s.v}</p></div>;})}
          </div>
        </div>
        <div style={glass}>
          <SLabel icon="ti-toggle-left" text="Draft vs live mode"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <div style={{padding:"12px 14px",borderRadius:12,border:"2px solid "+(!draft?C.green:th.borderPlain),background:!draft?C.green+"0d":th.inputBg}}><p style={{margin:"0 0 2px",fontSize:13,fontWeight:500,color:!draft?C.green:th.textMuted}}>Live mode</p><p style={{margin:0,fontSize:11,color:th.textMuted}}>6am send active.</p></div>
            <div style={{padding:"12px 14px",borderRadius:12,border:"2px solid "+(draft?C.amber:th.borderPlain),background:draft?C.amber+"0d":th.inputBg}}><p style={{margin:"0 0 2px",fontSize:13,fontWeight:500,color:draft?C.amber:th.textMuted}}>Draft mode</p><p style={{margin:0,fontSize:11,color:th.textMuted}}>Safe testing. Nothing affects live.</p></div>
          </div>
          {draft?<button onClick={function(){setShowPush(true);}} style={{background:"linear-gradient(135deg,"+C.orange+","+C.orangeDeep+")",border:"none",borderRadius:10,color:"#fff",fontWeight:500,fontSize:12,padding:"9px 20px",cursor:"pointer"}}>Push to live</button>
          :<button onClick={switchToDraft} style={{background:C.amber+"18",border:"1px solid "+C.amber+"44",borderRadius:10,color:C.amber,fontWeight:500,fontSize:12,padding:"9px 20px",cursor:"pointer"}}>Switch to draft</button>}
        </div>
        <button onClick={function(){setSaved(true);addAudit("Configuration saved","General settings updated","system");setTimeout(function(){setSaved(false);},2000);}} style={{alignSelf:"flex-start",background:saved?C.green+"18":"linear-gradient(135deg,"+C.orange+","+C.orangeDeep+")",color:saved?C.green:"#fff",border:saved?"1px solid "+C.green:"none",borderRadius:12,padding:"10px 24px",fontSize:14,fontWeight:500,cursor:"pointer"}}>{saved?"Saved":"Save configuration"}</button>
      </div>}
      {stab==="KPI Mapping"&&<KpiMapping kpiTags={kpiTags} setKpiTags={setKpiTags} team={team} th={th} pd={pd} kpiCfgState={kpiCfgState} onSaveKpiConfig={saveKpiConfig}/>}
      {stab==="Pipedrive Fields"&&<div>
        <p style={{fontSize:13,color:th.textMuted,margin:"0 0 1rem"}}>All available Pipedrive data points for KPI mapping.</p>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {PD_FIELDS_FLAT.map(function(f){return <div key={f.n} style={{display:"grid",gridTemplateColumns:"170px 1fr 70px",gap:8,padding:"7px 10px",background:th.card,border:"1px solid "+th.border,borderRadius:8,alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:500,color:C.orange,fontFamily:"monospace"}}>{f.n}</span>
            <span style={{fontSize:11,color:th.text}}>{f.d}</span>
            <span style={{fontSize:11,color:C.blue,background:C.blue+"15",padding:"1px 5px",borderRadius:4,textAlign:"center"}}>{f.r}</span>
          </div>;})}
        </div>
      </div>}
    </div>}

    {/* TEAM */}
    {tab==="Team"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:"1rem",flexWrap:"wrap"}}>
        <input value={tSearch} onChange={function(e){setTSearch(e.target.value);}} placeholder="Search team..." style={Object.assign({},iS,{flex:1,minWidth:150})}/>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {["All","Operations","Sales","Finance","AI","FL","CA","Both"].map(function(f){return <button key={f} onClick={function(){setTFilter(f);}} style={{padding:"6px 10px",border:"1px solid "+(tFilter===f?C.orange:th.borderPlain),borderRadius:8,background:tFilter===f?C.orange+"18":th.inputBg,color:tFilter===f?C.orange:th.textMuted,fontSize:11,cursor:"pointer",fontWeight:tFilter===f?500:400}}>{f}</button>;})}
        </div>
      </div>
      <p style={{fontSize:12,color:th.textMuted,margin:"0 0 10px"}}>{filtTeam.length}/{team.length} members shown</p>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {filtTeam.map(function(m){
          var i=team.indexOf(m);var unmapped=m.kpis.filter(function(k){return !kpiTags.find(function(t){return t.name===k&&t.sources.length>0;});}).length;
          return <div key={m.id} style={glass}>
            <div style={{display:"flex",alignItems:"center",gap:9,flexWrap:"wrap"}}>
              <Avatar name={m.name}/>
              <div style={{flex:1,minWidth:100}}><p style={{margin:0,fontWeight:500,fontSize:13,color:th.text}}>{m.name}</p><p style={{margin:0,fontSize:11,color:th.textMuted}}>{m.title} - {m.hours}{m.manager?" - Reports to: "+m.manager:""}</p></div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                <RBadge role={m.role}/>
                <Pill text={m.region} color={m.region==="FL"?"blue":m.region==="CA"?"green":"amber"}/>
                <Pill text={m.boards.length+"B"}/><Pill text={m.kpis.length+"K"}/>
                {unmapped>0&&<Pill text={"! "+unmapped} color="amber"/>}
                {m.nested&&<Pill text="Nested" color="amber"/>}
                {canAccess(m.role,"boardEdit")&&<button onClick={function(){setBoardEdit(i);}} style={{background:C.blue+"18",border:"1px solid "+C.blue+"44",borderRadius:8,color:C.blue,fontSize:11,fontWeight:500,padding:"2px 9px",cursor:"pointer"}}>Boards</button>}
                <button onClick={function(){setPrevPerson(i);setTab("Preview");genPreview(m,i);}} style={{background:C.orange+"18",border:"1px solid "+C.orange+"44",borderRadius:8,color:C.orange,fontSize:11,fontWeight:500,padding:"2px 9px",cursor:"pointer"}}>Preview</button>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>}

    {/* BOARDS */}
    {tab==="Boards"&&<div>
      <p style={{fontSize:13,color:th.textMuted,margin:"0 0 1rem"}}>{allBoards.length} boards - {Object.values(BOARDS).filter(function(b){return b.region==="FL";}).length} Florida - {Object.values(BOARDS).filter(function(b){return b.region==="CA";}).length} California</p>
      <div style={Object.assign({},glass,{marginBottom:12})}>
        <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Jobs by board {pd.isLive?"":"(simulated)"}</p>
        <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>Open deals per board &middot; live pipeline</p>
        <BarChart th={th} color={cc.blue} onBarClick={function(b){setDrillBoards([b]);setKpiDrillKpi(b+" — jobs");}} data={Object.keys(pd.boards).map(function(b){return {label:b,value:pd.boards[b].jobCount};}).filter(function(d){return d.value>0;}).sort(function(a,b){return b.value-a.value;})}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:8}}>
        {allBoards.map(function(b){
          var bd=BOARDS[b];var rc=bd.region==="FL"?C.blue:C.green;
          var pdBoard=pd.boards[b];
          return <div key={b} style={glass}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              <span style={{flex:1,fontSize:13,fontWeight:500,color:th.text}}>{b}</span>
              <span style={{fontSize:11,color:rc,background:rc+"18",padding:"1px 7px",borderRadius:10,border:"1px solid "+rc+"33"}}>{bd.region}</span>
              {pdBoard&&<div style={{width:7,height:7,borderRadius:"50%",background:pdBoard.status==="green"?C.green:pdBoard.status==="amber"?C.amber:C.red}}/>}
            </div>
            <p style={{margin:0,fontSize:11,color:th.textMuted}}>{bd.stages.length} stages</p>
            {pdBoard&&<p style={{margin:"3px 0 0",fontSize:12,color:C.orange,fontWeight:500}}>{pdBoard.jobCount} jobs &middot; {pdBoard.avgDays}d avg</p>}
          </div>;
        })}
      </div>
    </div>}

    {/* INTELLIGENCE â€” replaces Health tab, backed by pipelineData */}
    {tab==="Intelligence"&&<div>
      <div style={{display:"flex",gap:6,marginBottom:"1rem",flexWrap:"wrap",alignItems:"center"}}>
        <p style={{margin:0,fontSize:13,color:th.textMuted,flex:1}}>Viewing as:</p>
        {team.filter(function(m){return m.nested||canAccess(m.role,"analyticsDeep");}).map(function(m){var idx=team.indexOf(m);var a=intelMember===idx;
          return <button key={m.id} onClick={function(){setIntelMember(idx);}} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 11px",background:a?C.orange+"18":th.inputBg,border:"1px solid "+(a?C.orange:th.borderPlain),borderRadius:11,cursor:"pointer"}}>
            <Avatar name={m.name} size={22}/><span style={{fontSize:11,fontWeight:a?500:400,color:a?C.orange:th.text}}>{m.name.split(" ")[0]}</span>
          </button>;
        })}
      </div>
      <IntelligenceTab pd={pd} member={team[intelMember]} role={team[intelMember]?team[intelMember].role:"Owner"} th={th} kpiTags={kpiTags} onAiSummary={genAiSummary} aiSummary={aiSummary} summaryLoading={summaryLoading} activeSubTab={intelSub} onSubTabChange={setIntelSub}/>
    </div>}

    {/* REPORTS — charts & analytics (Increment 1: charts + red-flag categories + RAG + CSV) */}
    {tab==="Reports"&&<div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1rem",flexWrap:"wrap"}}>
        <p style={{margin:0,fontSize:13,color:th.textMuted,flex:1}}>Visual KPI reports. Live pipeline from Pipedrive; operational insights from the notes-extraction pipeline.</p>
        <span style={{fontSize:11,color:th.textMuted}}>Insights range</span>
        <div style={{display:"flex",gap:4,background:th.bg,border:"1px solid "+th.borderPlain,borderRadius:9,padding:3}}>
          {RANGE_OPTS.map(function(o){var a=fltDays===o.d;return <button key={o.d} onClick={function(){setFltDays(o.d);}} style={{fontSize:11,padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",background:a?C.orange:"transparent",color:a?"#1a1209":th.textMuted,fontWeight:a?500:400}}>{o.l}</button>;})}
        </div>
        <span style={{fontSize:11,color:th.textMuted,background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:20,padding:"4px 10px"}}><i className="ti ti-clock" style={{fontSize:12,marginRight:4}} aria-hidden="true"/>Insights through {dmy(OPS_INSIGHTS.dataFreshThrough)}</span>
        <button onClick={function(){dlCSV(ow.redFlags.categories.map(function(c){return {category:c.category,count:c.count};}),"red-flag-categories-"+(owIsAll?"all":fltDays+"d")+"-"+todayStr()+".csv");}} style={{display:"flex",alignItems:"center",gap:5,background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:20,padding:"7px 14px",color:th.textMuted,fontSize:11,cursor:"pointer"}}><i className="ti ti-download" style={{fontSize:13}} aria-hidden="true"/>Export CSV</button>
      </div>

      {/* Live KPIs vs period — range control + period-over-period deltas + targets/RAG (Increment 2) */}
      <div style={Object.assign({},glass,{marginBottom:"1rem"})}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:12}}>
          <div style={{flex:1,minWidth:170}}>
            <p style={{margin:0,fontSize:14,fontWeight:500,color:th.text}}>Live KPIs vs {RANGE_SHORT[cmpRange]||"prior period"}</p>
            <p style={{margin:"2px 0 0",fontSize:11,color:th.textMuted}}>{cmpInfo.status==="ok"&&cmpInfo.baselineDate?dmy(cmpInfo.baselineDate)+" → "+dmy(cmpInfo.currentDate)+" · from daily snapshots":"period-over-period from daily snapshots"}</p>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {RANGES.map(function(r){var a=cmpRange===r;return <button key={r} title={r} onClick={function(){setCmpRange(r);}} style={{padding:"6px 11px",border:"1px solid "+(a?C.orange:th.borderPlain),borderRadius:20,background:a?C.orange+"18":th.inputBg,color:a?C.orange:th.textMuted,fontSize:11,cursor:"pointer",fontWeight:a?500:400}}>{r.split(" ")[0]}</button>;})}
          </div>
          <button onClick={function(){setEditTargets(function(e){return !e;});}} style={{display:"flex",alignItems:"center",gap:5,background:editTargets?C.orange+"18":th.inputBg,border:"1px solid "+(editTargets?C.orange:th.borderPlain),borderRadius:20,padding:"7px 12px",color:editTargets?C.orange:th.textMuted,fontSize:11,cursor:"pointer"}}><i className="ti ti-target" style={{fontSize:13}} aria-hidden="true"/>{editTargets?"Done":"Edit targets"}</button>
        </div>
        {cmpInfo.loading?
          <p style={{margin:0,fontSize:12,color:th.textMuted,textAlign:"center",padding:"1rem 0"}}>Loading comparison…</p>
        :cmpInfo.error?
          <p style={{margin:0,fontSize:12,color:cc.red,textAlign:"center",padding:"1rem 0"}}>{cmpInfo.error}</p>
        :cmpInfo.status==="ok"&&cmpInfo.rows?
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:8}}>
            {DELTA_CARD_KEYS.map(function(k){
              var row=cmpInfo.rows.find(function(x){return x.key===k;});
              if(!row)return null;
              var meta=targets[k]||{betterWhen:"neutral",target:null};
              var good=meta.betterWhen==="neutral"?null:((meta.betterWhen==="higher"&&row.direction==="up")||(meta.betterWhen==="lower"&&row.direction==="down"));
              var dcol=row.direction==="flat"?th.textMuted:(good===null?th.textMuted:(good?cc.green:cc.red));
              var icon=row.direction==="up"?"ti-trending-up":row.direction==="down"?"ti-trending-down":"ti-minus";
              var sign=row.delta>0?"+":"";
              var rag=ragColor(row.current,meta.target,meta.betterWhen);
              return <div key={k} style={{background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:10,padding:"0.8rem 0.9rem"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{flex:1,fontSize:11,color:th.textMuted}}>{row.label}</span>
                  {rag&&<span title="vs target" style={{width:8,height:8,borderRadius:"50%",background:rag,flexShrink:0}}/>}
                </div>
                <p style={{margin:0,fontSize:21,fontWeight:600,color:th.text}}>{fmtDiff(row.format,row.current)}</p>
                <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3}}>
                  <i className={"ti "+icon} style={{fontSize:13,color:dcol}} aria-hidden="true"/>
                  <span style={{fontSize:11.5,fontWeight:500,color:dcol}}>{sign}{fmtDiff(row.format,row.delta)}{row.pct!==null?" ("+sign+row.pct.toFixed(1)+"%)":""}</span>
                </div>
                {editTargets
                  ?<div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}><span style={{fontSize:10.5,color:th.textMuted}}>target</span><input type="number" value={meta.target==null?"":meta.target} onChange={function(e){setTarget(k,e.target.value===""?null:Number(e.target.value));}} style={{width:62,background:th.card,border:"1px solid "+th.inputBorder,borderRadius:6,color:th.selectText,fontSize:11,padding:"3px 6px",fontFamily:"inherit"}}/></div>
                  :(meta.target!=null&&<p style={{margin:"5px 0 0",fontSize:10.5,color:th.textMuted}}>target {fmtDiff(row.format,meta.target)}</p>)}
              </div>;
            })}
          </div>
        :<div style={{textAlign:"center",padding:"1rem 0"}}>
          <p style={{margin:"0 0 4px",fontSize:13,color:th.text}}>Comparisons activate as daily snapshots accumulate</p>
          <p style={{margin:0,fontSize:11,color:th.textMuted}}>{cmpInfo.message||"Need at least two daily snapshots for period-over-period deltas."}</p>
        </div>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginBottom:"1rem"}}>
        {[
          {l:"Total jobs",v:OPS_INSIGHTS.funnel.totalJobs.toLocaleString(),c:th.text,s:OPS_INSIGHTS.records.toLocaleString()+" extracted"},
          {l:"Win rate (resolved)",v:OPS_INSIGHTS.funnel.winRate+"%",c:OPS_INSIGHTS.funnel.winRate>=70?cc.green:cc.amber,s:OPS_INSIGHTS.funnel.resolved.toLocaleString()+" resolved"},
          {l:"Cancellation rate",v:OPS_INSIGHTS.cancellations.ratePctOfResolved+"%",c:OPS_INSIGHTS.cancellations.ratePctOfResolved>30?cc.red:OPS_INSIGHTS.cancellations.ratePctOfResolved>15?cc.amber:cc.green,s:"median "+OPS_INSIGHTS.cancellations.medianDaysToCancel+"d to cancel"},
          {l:"Inspection fail rate",v:OPS_INSIGHTS.inspections.failRatePct+"%",c:OPS_INSIGHTS.inspections.failRatePct>30?cc.red:OPS_INSIGHTS.inspections.failRatePct>15?cc.amber:cc.green,s:OPS_INSIGHTS.inspections.failures.toLocaleString()+" of "+OPS_INSIGHTS.inspections.events.toLocaleString()},
          {l:"Clawback at risk",v:OPS_INSIGHTS.clawbackAtRisk.toLocaleString(),c:cc.red,s:"jobs flagged"},
        ].map(function(card,i){return <div key={i} style={Object.assign({},glass,{padding:"0.9rem 1rem"})}>
          <p style={{margin:"0 0 5px",fontSize:11,color:th.textMuted}}>{card.l}</p>
          <p style={{margin:0,fontSize:23,fontWeight:600,color:card.c}}>{card.v}</p>
          <p style={{margin:"3px 0 0",fontSize:10.5,color:th.textMuted}}>{card.s}</p>
        </div>;})}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(330px,1fr))",gap:10}}>
        <div style={glass}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Red-flag categories</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>{ow.redFlags.total.toLocaleString()} flags across {ow.redFlags.records.toLocaleString()} jobs &middot; {owLabel}</p>
          <BarChart th={th} color={cc.red} data={ow.redFlags.categories.map(function(c){return {label:c.category.replace(/_/g," "),value:c.count};})}/>
        </div>

        <div style={glass}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Job outcomes</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>All jobs by current lifecycle phase</p>
          <DonutChart th={th} data={OPS_INSIGHTS.funnel.outcomes.map(function(o,i){return {label:o.label,value:o.count,color:[cc.blue,cc.green,cc.teal,cc.red,cc.amber,cc.neutral][i]};})}/>
        </div>

        <div style={glass}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Cycle times (median days)</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>Days between milestones &middot; {owLabel}</p>
          <BarChart th={th} color={cc.blue} format="days" data={ow.cycleTimes.filter(function(c){return c.median!=null;}).map(function(c){return {label:c.label,value:c.median};})}/>
        </div>

        <div style={glass}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Where jobs cancel</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>Stage when cancelled (% of cancellations)</p>
          <BarChart th={th} color={cc.red} format="pct" data={OPS_INSIGHTS.cancellations.where.map(function(w){return {label:w.board,value:w.pct};})}/>
        </div>

        <div style={glass}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>How long before cancelling</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>Age at cancellation (% of cancellations)</p>
          <BarChart th={th} color={cc.amber} format="pct" data={OPS_INSIGHTS.cancellations.ageBuckets.map(function(a){return {label:a.label,value:a.pct};})}/>
        </div>

        <div style={glass}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Active jobs by board {pd.isLive?"":"(simulated)"}</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>Live pipeline &middot; {pd.totalActiveJobs} active jobs</p>
          <BarChart th={th} color={cc.orange} data={Object.keys(pd.boards).map(function(b){return {label:b,value:pd.boards[b].jobCount};}).filter(function(d){return d.value>0;}).sort(function(a,b){return b.value-a.value;}).slice(0,10)}/>
        </div>

        <div style={Object.assign({},glass,{gridColumn:"1/-1"})}>
          <p style={{margin:"0 0 2px",fontSize:14,fontWeight:500,color:th.text}}>Cancellations per month</p>
          <p style={{margin:"0 0 10px",fontSize:11,color:th.textMuted}}>Trend over time</p>
          <LineChart th={th} color={cc.orange} goal={CANCELLATIONS_PER_MONTH_TARGET} goalColor={cc.amber} data={OPS_INSIGHTS.cancellations.monthly.map(function(m){return {label:monthYear(m.month,true),value:m.count};})}/>
        </div>
      </div>
    </div>}

    {/* PREVIEW */}
    {tab==="Preview"&&<div>
      <div style={{background:liveApiData?C.green+"0d":C.amber+"0d",border:"1px solid "+(liveApiData?C.green:C.amber)+"22",borderRadius:10,padding:"8px 14px",marginBottom:"1rem"}}>
        <p style={{margin:0,fontSize:12,color:liveApiData?C.green:C.amber}}>{liveApiData?"Live data active - "+pd.totalActiveJobs+" jobs":"No live data - previews use simulated numbers."}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:6,marginBottom:"1.25rem"}}>
        {team.map(function(m,i){var a=prevPerson===i;return <button key={m.id} onClick={function(){setPrevPerson(i);genPreview(m,i);}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 9px",background:a?C.orange+"18":th.inputBg,border:"1px solid "+(a?C.orange:th.borderPlain),borderRadius:11,cursor:"pointer",textAlign:"left"}}>
          <Avatar name={m.name} size={24}/><div>
            <p style={{margin:0,fontSize:11,fontWeight:500,color:th.text}}>{m.name.split(" ")[0]}</p>
            <p style={{margin:0,fontSize:11,color:th.textMuted,maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title.split(" ").pop()}</p>
            {m.nested&&<span style={{fontSize:11,color:C.amber}}>*</span>}
          </div>
        </button>;})}
      </div>
      {prevLoad&&<div style={Object.assign({},glass,{textAlign:"center" as const,padding:"2.5rem"})}>
        <div style={{width:34,height:34,borderRadius:"50%",border:"3px solid "+C.orange+"44",borderTop:"3px solid "+C.orange,animation:"spin 0.8s linear infinite",margin:"0 auto 10px"}}/>
        <p style={{margin:0,fontSize:13,color:th.textMuted}}>Generating {team[prevPerson]?team[prevPerson].name.split(" ")[0]:""}s briefing...</p>
        <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      </div>}
      {prevEmail&&!prevLoad&&<div style={{border:"1px solid "+C.orange+"30",borderRadius:16,overflow:"hidden"}}>
        <div style={{background:C.orange+"12",borderBottom:"1px solid "+C.orange+"22",padding:"9px 14px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:th.text,fontWeight:500}}>{team[prevPerson]?team[prevPerson].name:""} - {team[prevPerson]?team[prevPerson].email||"no email set":""}</span>
          {liveApiData&&<Pill text="Live" color="green"/>}
          {team[prevPerson]&&team[prevPerson].nested&&<Pill text="Health injected" color="amber"/>}
          <span style={{marginLeft:"auto",fontSize:11,color:th.textMuted}}>{sendTime}</span>
          {draft&&<Pill text="Draft" color="amber"/>}
          <button onClick={function(){setKpiDrillKpi("Total active jobs - "+pd.totalActiveJobs+" jobs");}} style={{background:C.blue+"18",border:"1px solid "+C.blue+"44",borderRadius:7,color:C.blue,fontSize:11,padding:"3px 8px",cursor:"pointer"}}>Drill down</button>
        </div>
        <div style={{padding:"1.25rem",background:"#1A1C20"}} dangerouslySetInnerHTML={{__html:prevEmail}}/>
      </div>}
      {!prevEmail&&!prevLoad&&<div style={Object.assign({},glass,{textAlign:"center" as const,padding:"2.5rem"})}><p style={{margin:0,fontSize:13,color:th.textMuted}}>Select a team member above to generate their personalised briefing</p></div>}
    </div>}

    {/* SEND */}
    {isAdmin&&tab==="Send"&&<div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <div style={glass}>
        <SLabel icon="ti-clock-play" text="Automated schedule"/>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
          {[{l:"Send time",v:sendTime},{l:"Mode",v:draft?"Draft":"Live"},{l:"Recipients",v:String(team.length)},{l:"Data",v:liveApiData?"Live":"Simulated"}].map(function(s){return <div key={s.l} style={{background:C.orange+"0d",border:"1px solid "+C.orange+"22",borderRadius:10,padding:"7px 12px"}}><p style={{margin:0,fontSize:11,color:th.textMuted}}>{s.l}</p><p style={{margin:0,fontSize:14,fontWeight:500,color:C.orange}}>{s.v}</p></div>;})}
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}><SDot on={gConn}/><span style={{fontSize:12,color:th.textMuted}}>{gConn?"Gmail connected":"Not connected"}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:5}}><SDot on={!!liveApiData}/><span style={{fontSize:12,color:th.textMuted}}>{liveApiData?"Live Pipedrive":"Simulated"}</span></div>
        </div>
      </div>
      <div style={glass}>
        <SLabel icon="ti-send" text="Manual send"/>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {team.map(function(m,i){return <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:11,flexWrap:"wrap"}}>
            <Avatar name={m.name} size={26}/>
            <div style={{flex:1,minWidth:80}}><p style={{margin:0,fontSize:12,fontWeight:500,color:th.text}}>{m.name}</p><p style={{margin:0,fontSize:11,color:th.textMuted}}>{m.email||"No email"} - {m.sendFreq}</p></div>
            <RBadge role={m.role}/>
            {sendStatus[i]&&<span style={{fontSize:11,color:C.green}}>Sent {sendStatus[i]}</span>}
            <button onClick={function(){doSend(m,i);}} style={{background:C.orange+"18",border:"1px solid "+C.orange+"44",borderRadius:8,color:C.orange,fontWeight:500,fontSize:11,padding:"5px 10px",cursor:"pointer"}}>Send now</button>
          </div>;})}
        </div>
      </div>
      {sendLog.length>0&&<div style={glass}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <SLabel icon="ti-history" text="Send history"/>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            <button onClick={function(){dlCSV(sendLog,"unicity-send-log-"+todayStr()+".csv");}} style={{background:C.blue+"18",border:"1px solid "+C.blue+"44",borderRadius:8,color:C.blue,fontSize:11,fontWeight:500,padding:"4px 10px",cursor:"pointer"}}>CSV</button>
            <button onClick={function(){dlJSON(sendLog,"unicity-send-log-"+todayStr()+".json");}} style={{background:C.purple+"18",border:"1px solid "+C.purple+"44",borderRadius:8,color:C.purple,fontSize:11,fontWeight:500,padding:"4px 10px",cursor:"pointer"}}>JSON</button>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:220,overflowY:"auto"}}>
          {sendLog.map(function(e){return <div key={e.id} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,padding:"7px 10px",background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:9}}>
            <div><p style={{margin:0,fontSize:12,fontWeight:500,color:th.text}}>{e.name}</p><p style={{margin:0,fontSize:11,color:th.textMuted}}>{e.email} - {e.dataSource} - {e.mode}</p></div>
            <div style={{textAlign:"right"}}><p style={{margin:0,fontSize:11,color:C.green}}>{e.status}</p><p style={{margin:0,fontSize:11,color:th.textMuted}}>{e.ts}</p></div>
          </div>;})}
        </div>
      </div>}
    </div>}

    {/* AUDIT */}
    {isAdmin&&tab==="Audit"&&<div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1rem",flexWrap:"wrap"}}>
        <p style={{margin:0,fontSize:13,color:th.textMuted,flex:1}}>{audit.length} entries</p>
        <button onClick={function(){dlCSV(audit,"unicity-audit-"+todayStr()+".csv");}} style={{background:C.blue+"18",border:"1px solid "+C.blue+"44",borderRadius:8,color:C.blue,fontSize:11,fontWeight:500,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><i className="ti ti-download" style={{fontSize:13}} aria-hidden="true"/>CSV</button>
        <button onClick={function(){dlJSON(audit,"unicity-audit-"+todayStr()+".json");}} style={{background:C.purple+"18",border:"1px solid "+C.purple+"44",borderRadius:8,color:C.purple,fontSize:11,fontWeight:500,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><i className="ti ti-download" style={{fontSize:13}} aria-hidden="true"/>JSON</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {audit.map(function(e){var tc=e.type==="kpi"?C.orange:e.type==="access"?C.blue:e.type==="team"?C.green:th.textMuted;
          return <div key={e.id} style={Object.assign({},glass,{display:"flex",gap:9})}>
            <div style={{width:7,height:7,borderRadius:"50%",background:tc,marginTop:4,flexShrink:0,boxShadow:"0 0 5px "+tc}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:2,alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:500,color:th.text}}>{e.action}</span>
                <Pill text={e.type} color={e.type==="kpi"?"orange":e.type==="access"?"blue":"green"}/>
                {e.draft&&<Pill text="draft" color="amber"/>}
              </div>
              <p style={{margin:0,fontSize:11,color:th.text}}>{e.detail}</p>
              <p style={{margin:0,fontSize:11,color:th.textMuted}}>{e.ts} - {e.user}</p>
            </div>
          </div>;
        })}
      </div>
    </div>}

    {/* RALPH */}
    {isAdmin&&tab==="RALPH"&&<div>
      <div style={Object.assign({},glass,{marginBottom:"1rem",background:C.purple+"0a",borderColor:C.purple+"30"})}>
        <p style={{margin:0,fontSize:13,fontWeight:500,color:C.purple}}>RALPH - Repair, Annotate, Learn, Patch, Harden</p>
        <p style={{margin:0,fontSize:11,color:th.textMuted,marginTop:3}}>User feedback flows here. AI Engineers review, patch, and document fixes.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:6,marginTop:12}}>
          {RALPH_STAGES.map(function(s){return <div key={s.stage} style={{padding:"8px 10px",background:s.col+"0d",border:"1px solid "+s.col+"22",borderRadius:9}}>
            <p style={{margin:"0 0 3px",fontSize:11,fontWeight:500,color:s.col}}>{s.stage}</p>
            <p style={{margin:0,fontSize:11,color:th.textMuted}}>{s.desc}</p>
          </div>;})}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1rem"}}>
        <div style={{display:"flex",gap:8,flex:1,flexWrap:"wrap"}}>
          {["open","in-review","patched"].map(function(s){var col=s==="open"?C.red:s==="in-review"?C.amber:C.green;var count=ralph.filter(function(r){return r.status===s;}).length;
            return <div key={s} style={{background:col+"12",border:"1px solid "+col+"30",borderRadius:10,padding:"8px 14px",flex:1,textAlign:"center"}}>
              <p style={{margin:0,fontSize:18,fontWeight:500,color:col}}>{count}</p>
              <p style={{margin:0,fontSize:11,color:col,fontWeight:500}}>{s}</p>
            </div>;})}
        </div>
        <button onClick={function(){setShowRalphForm(!showRalphForm);}} style={{background:C.purple+"18",border:"1px solid "+C.purple+"44",borderRadius:10,color:C.purple,fontWeight:500,fontSize:12,padding:"8px 14px",cursor:"pointer",whiteSpace:"nowrap"}}>+ Log issue</button>
      </div>
      {showRalphForm&&<div style={{background:th.card,border:"1px solid "+C.purple+"44",borderRadius:14,padding:"1rem",marginBottom:"1rem"}}>
        <p style={{margin:"0 0 12px",fontSize:13,fontWeight:500,color:C.purple}}>Log new issue</p>
        <RalphFormInline kpiTags={kpiTags} th={th} iS={iS} onSubmit={function(obj){setRalph(function(l){return [{id:Date.now(),ts:dmyTime(),reporter:obj.reporter,issue:obj.issue,kpi:obj.kpi,status:"open",stage:"R - Reported",correction:"",aiNote:""}].concat(l);});setShowRalphForm(false);addAudit("RALPH issue logged",obj.reporter+": "+obj.issue.slice(0,50),"system");}} onCancel={function(){setShowRalphForm(false);}}/>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {ralph.map(function(r){var sc=r.stage.startsWith("R")?C.red:r.stage.startsWith("A")?C.amber:r.stage.startsWith("L")?C.blue:r.stage.startsWith("P")?C.orange:C.green;
          return <div key={r.id} style={Object.assign({},glass,{borderColor:sc+"30"})}>
            <div style={{display:"flex",gap:8,marginBottom:7,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:12,fontWeight:500,color:th.text,flex:1}}>{r.issue}</span>
              <Pill text={r.stage} color={r.stage.startsWith("R")?"red":r.stage.startsWith("A")?"amber":"green"}/>
              <Pill text={r.status} color={r.status==="open"?"red":r.status==="patched"?"green":"amber"}/>
            </div>
            <p style={{margin:"0 0 5px",fontSize:11,color:th.textMuted}}>KPI: <span style={{color:C.orange}}>{r.kpi}</span> - {r.reporter} - {r.ts}</p>
            {r.correction&&<div style={{marginTop:6,padding:"6px 10px",background:C.green+"0d",border:"1px solid "+C.green+"22",borderRadius:7}}><p style={{margin:0,fontSize:11,color:C.green}}>Fix: {r.correction}</p></div>}
            {r.status==="open"&&<div style={{marginTop:9,display:"flex",gap:6}}>
              <button onClick={function(){setRalph(function(l){return l.map(function(x){return x.id===r.id?Object.assign({},x,{status:"in-review",stage:"A - Annotating"}):x;});});}} style={{background:C.amber+"18",border:"1px solid "+C.amber+"44",borderRadius:10,color:C.amber,fontWeight:500,fontSize:11,padding:"5px 12px",cursor:"pointer"}}>Review</button>
              <button onClick={function(){setRalph(function(l){return l.map(function(x){return x.id===r.id?Object.assign({},x,{status:"patched",stage:"H - Hardened",correction:"Fix applied by AI Engineer"}):x;});});}} style={{background:C.green+"18",border:"1px solid "+C.green+"44",borderRadius:10,color:C.green,fontWeight:500,fontSize:11,padding:"5px 12px",cursor:"pointer"}}>Mark patched</button>
            </div>}
          </div>;
        })}
      </div>
    </div>}
    </main>
  </div>;
}

// Inline RALPH form to avoid hoisting issues
function RalphFormInline({kpiTags,th,iS,onSubmit,onCancel}){
  var [issue,setIssue]=useState("");var [kpi,setKpi]=useState(kpiTags[0]?kpiTags[0].name:"");var [reporter,setReporter]=useState("Stephen Farrell");
  return <div style={{display:"flex",flexDirection:"column",gap:8}}>
    <div><p style={{margin:"0 0 3px",fontSize:11,color:th.textMuted}}>Issue description</p>
      <textarea value={issue} onChange={function(e){setIssue(e.target.value);}} placeholder="Describe the issue..." rows={3} style={Object.assign({},iS,{width:"100%",resize:"vertical"})}/></div>
    <div><p style={{margin:"0 0 3px",fontSize:11,color:th.textMuted}}>Related KPI tag</p>
      <select value={kpi} onChange={function(e){setKpi(e.target.value);}} style={Object.assign({},iS,{width:"100%",background:th.selectBg})}>
        {kpiTags.map(function(t){return <option key={t.id} style={{background:th.selectBg,color:th.selectText}}>{t.name}</option>;})}
        <option style={{background:th.selectBg,color:th.selectText}}>General / Other</option>
      </select></div>
    <div><p style={{margin:"0 0 3px",fontSize:11,color:th.textMuted}}>Reported by</p>
      <input value={reporter} onChange={function(e){setReporter(e.target.value);}} style={Object.assign({},iS,{width:"100%"})}/></div>
    <div style={{display:"flex",gap:8}}>
      <button onClick={function(){if(issue.trim())onSubmit({issue:issue.trim(),kpi:kpi,reporter:reporter});}} style={{flex:1,background:"linear-gradient(135deg,"+C.orange+","+C.orangeDeep+")",border:"none",borderRadius:10,color:"#fff",fontWeight:500,fontSize:12,padding:"9px",cursor:"pointer"}}>Submit</button>
      <button onClick={onCancel} style={{flex:1,background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:10,color:th.textMuted,fontWeight:500,fontSize:12,padding:"9px",cursor:"pointer"}}>Cancel</button>
    </div>
  </div>;
}

// â”€â”€ Auth wrapper: handles session, gates dashboard â”€â”€
export default function App(){
  var [session,setSession]=useState({signedIn:false,email:"",name:"",loaded:false});
  React.useEffect(function(){
    fetch("/api/auth/me").then(function(r){return r.json();}).then(function(d){
      setSession({signedIn:!!d.signedIn,email:d.email||"",name:d.name||"",loaded:true});
    }).catch(function(){
      setSession({signedIn:false,email:"",name:"",loaded:true});
    });
  },[]);

  if(!session.loaded){
    return <div style={{minHeight:"100vh",background:"#1A1C20",display:"flex",alignItems:"center",justifyContent:"center",color:"#897C80",fontFamily:"system-ui,sans-serif"}}>Loadingâ€¦</div>;
  }
  if(!session.signedIn){
    return <div style={{minHeight:"100vh",background:"#1A1C20",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:"2rem"}}>
      <div style={{background:"#2E3138",border:"1px solid rgba(242,143,29,0.2)",borderRadius:16,padding:"2.5rem 2rem",maxWidth:420,textAlign:"center"}}>
        <img src="/Unicity_Solar_Logo_only.png" alt="Unicity Solar" width="64" height="64" style={{display:"block",margin:"0 auto 1rem"}}/>
        <p style={{margin:"0 0 0.5rem",fontSize:22,fontWeight:500,color:"#F0F0F0"}}>Unicity Solar KPI</p>
        <p style={{margin:"0 0 1.5rem",fontSize:13,color:"#897C80"}}>Sign in with your <span style={{color:"#F28F1D"}}>@unicitysolar.com</span> or <span style={{color:"#F28F1D"}}>@unicityhome.com</span> account.</p>
        <a href="/api/auth/google/start" style={{display:"inline-block",background:"linear-gradient(135deg,#F28F1D,#D4721A)",color:"#fff",padding:"11px 28px",borderRadius:10,textDecoration:"none",fontWeight:500,fontSize:14}}>Sign in with Google</a>
      </div>
    </div>;
  }
  return <Dashboard session={session}/>;
}

