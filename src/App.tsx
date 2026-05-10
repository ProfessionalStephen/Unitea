import React, { useState, useMemo, useCallback } from "react";

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────
const DARK={bg:"#1A1C20",card:"rgba(46,49,56,0.9)",cardSolid:"#2E3138",border:"rgba(242,143,29,0.18)",borderPlain:"rgba(255,255,255,0.08)",text:"#F0F0F0",textMuted:"#897C80",inputBg:"rgba(255,255,255,0.06)",inputBorder:"rgba(242,143,29,0.25)",tabBg:"rgba(255,255,255,0.04)",tabBorder:"rgba(255,255,255,0.07)",selectText:"#F0F0F0",selectBg:"#2E3138"};
const LIGHT={bg:"#F0F0F0",card:"rgba(232,232,232,0.95)",cardSolid:"#E8E8E8",border:"rgba(242,143,29,0.3)",borderPlain:"rgba(36,38,43,0.12)",text:"#24262B",textMuted:"#5A5A5A",inputBg:"rgba(36,38,43,0.06)",inputBorder:"rgba(242,143,29,0.4)",tabBg:"rgba(36,38,43,0.05)",tabBorder:"rgba(36,38,43,0.1)",selectText:"#24262B",selectBg:"#E8E8E8"};
const C={orange:"#F28F1D",orangeDeep:"#D4721A",green:"#22C55E",amber:"#F59E0B",red:"#EF4444",blue:"#1D6FB5",purple:"#A855F7"};

// ─────────────────────────────────────────────
// BOARDS CONFIG
// ─────────────────────────────────────────────
const BOARDS={
  "Customer Service":{region:"FL",stages:["Ready for Welcome Call","Job on hold","Welcome Call Complete","Thank You Call - Install Complete"],rotting:{"Ready for Welcome Call":1,"Job on hold":1}},
  "New Sale":{region:"FL",stages:["Brand New Deal","Missing NTP","Missing Site Survey Items","Site Survey Scheduled","Job on hold","Sent to Engineering"],rotting:{"Brand New Deal":1,"Missing NTP":1,"Missing Site Survey Items":1,"Site Survey Scheduled":1,"Job on hold":1,"Sent to Engineering":1}},
  "Engineering":{region:"FL",stages:["Ready for Engineering","Revisions","Needs Clarification","Quality Control","Post Install Revisions","Waiting on Engineers","Sent to Permitting"],rotting:{"Ready for Engineering":1,"Needs Clarification":1,"Post Install Revisions":1,"Waiting on Engineers":1,"Sent to Permitting":1}},
  "Permitting":{region:"FL",stages:["Ready for Permitting","On Hold/Missing Items","Needs PP Plan Review","Permit Submitted - Meter Pre-Approval","Permit Submitted","Revisions","Hopeful Check for NTP","Permit Approved"],rotting:{"On Hold/Missing Items":2,"Permit Submitted - Meter Pre-Approval":5,"Permit Submitted":10}},
  "Utility Disco":{region:"FL",stages:["MPU and Shut off needed","Pending confirmation","Permit has been requested","Permit approved ready to schedule","Scheduled Disco","Scheduled Inspection","Commission","Done"],rotting:{}},
  "R&R":{region:"FL",stages:["R&R requested/Docs","On Hold","Reengineering","Repermitting","Ready for uninstall","Uninstall Scheduled","Ready for Reinstall","Reinstall Scheduled","Ready for inspection","Inspection Scheduled","Job complete"],rotting:{}},
  "Scheduling/Coordinating":{region:"FL",stages:["Ready to Schedule Florida","Pending HOA Approvals","On hold missing items","Job on hold pending Roof","Installation Scheduled","Material Ordered","Install not completed","Installation Completed","Paid"],rotting:{"Ready to Schedule Florida":2,"Pending HOA Approvals":2,"Job on hold pending Roof":14,"Installation Scheduled":1,"Material Ordered":3,"Install not completed":1}},
  "California":{region:"CA",stages:["Brand New Deal","SS Scheduled","Engineering","Permitting","Ready to Schedule","Ready for Material Order","Install Scheduled","Install Completed","Funded","Inspections","Utility Disconnect Needed","Net Metering","PTO","Rep trying to save"],rotting:{"SS Scheduled":1,"Engineering":1,"Permitting":1,"Ready to Schedule":1,"Ready for Material Order":1,"Install Scheduled":1}},
  "Inspection":{region:"FL",stages:["Inspection Ready to Schedule","Insp Needs Tech","Need affidavit","Pend Utility/Elec","Need to Sched with BD","Scheduled with PP","Inspection Scheduled","Waiting on Revision","Failed Inspection","Pend COC","COC Uploaded","Inspection Passed"],rotting:{"Inspection Ready to Schedule":2,"Need affidavit":3,"Pend Utility/Elec":7,"Inspection Scheduled":5}},
  "Net Metering":{region:"FL",stages:["Ready for New Meter App","Missing Tier 2/Bill/Placard","NMA sent to Customer","NMA submitted to Utility","Transformer Upgrade","Rejections","Pending meter swap","Meter Installed"],rotting:{"Ready for New Meter App":1,"Missing Tier 2/Bill/Placard":1,"NMA sent to Customer":1,"NMA submitted to Utility":5,"Transformer Upgrade":7,"Rejections":1,"Pending meter swap":7}},
  "Service":{region:"FL",stages:["Service Needed","Panels Warranty","Follow Up","Monitoring","Roof Leak","Added to WIW","Service Scheduled","Work Completed"],rotting:{"Service Needed":1,"Panels Warranty":5,"Follow Up":1,"Monitoring":1,"Roof Leak":2,"Added to WIW":5,"Service Scheduled":2}},
  "Cancellations":{region:"FL",stages:["Rep trying to save","On Hold SR Request","New Cancellation","Ready for Retention","Cancelled before Engineering","Cancelled after Engineering","Cancellation Processed"],rotting:{"On Hold SR Request":30}},
  "Funding":{region:"FL",stages:["M1 Invoice needed","M1 added to prep sheet","M1 invoice sent","M2 invoice needed","M2 prepped","M2 invoice sent","M3 invoice needed","M3 prepped","M3 invoice sent"],rotting:{"M1 Invoice needed":1,"M2 invoice needed":2}},
  "System Monitoring":{region:"FL",stages:["Needs Array Built","Array Built"],rotting:{}},
  "Warranty":{region:"FL",stages:["Warranty Needed","Job Completed"],rotting:{}},
  "Completed Meter":{region:"FL",stages:["PTO Call Completed","PTO Submitted","PTO Paid","Post-PTO Work Completed"],rotting:{}},
  "Work Completed Not US Customer":{region:"FL",stages:["Work Completed Not US Customer"],rotting:{}},
};

const INDUSTRY_BENCHMARK_DAYS=120;
const REPS=["Sarah M.","James C.","Linda N.","Robert K.","Patricia H.","Carlos V.","Diane R.","Tom B.","Maria S.","Kevin L."];
const RANGES=["Week over week","Month over month","Quarter over quarter","Year over year"];

// ─────────────────────────────────────────────
// DATA MODEL — single source of truth
// All UI components derive from pipelineData
// ─────────────────────────────────────────────
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

      var jobCount=liveStage?liveStage.count:Math.floor(Math.random()*12)+1;
      var avgDays=liveStage?parseFloat(liveStage.avgDays):(Math.random()*8+0.5);
      var deals=[];

      if(liveStage&&liveStage.deals) {
        deals=liveStage.deals.map(function(d) {
          return {id:d.id,name:d.name||"Unknown",address:"Address from Pipedrive",days:d.days,rep:REPS[Math.floor(Math.random()*REPS.length)],pipedriveUrl:d.pipedriveUrl,notes:[{date:"Today",text:"Live data — notes require /notes endpoint"}],flags:d.days>(threshold||999)?["Past rotting threshold"]:[]};
        });
      } else {
        deals=Array.from({length:jobCount},function(_,k) {
          var days=Math.floor(Math.random()*16)+1;
          return {id:"JOB-"+(1000+Math.floor(Math.random()*9000)),name:["Sarah Mitchell","James Cortez","Linda Nguyen","Robert Kwan","Patricia Holt","Carlos Vega","Diane Russo","Tom Becker"][k%8],address:"123 Sample St, Gainesville FL",days:days,rep:REPS[k%REPS.length],pipedriveUrl:"https://app.pipedrive.com/deals/",notes:[{date:"Today",text:"Sample — connect Pipedrive for live data"},{date:"Yesterday",text:"Follow-up scheduled with homeowner."},{date:"2 days ago",text:"Documents uploaded to folder."}],flags:days>(threshold||999)?["Past rotting threshold"]:[]};
        });
      }

      var stuckCount=deals.filter(function(d){return threshold&&d.days>threshold;}).length;
      boardTotalJobs+=jobCount;
      boardTotalDays+=avgDays*jobCount;
      boardStuck+=stuckCount;
      deals.forEach(function(d){allDeals.push(Object.assign({},d,{board:bName,stage:sName}));});

      stages[sName]={name:sName,jobCount:jobCount,avgDays:parseFloat(avgDays.toFixed(1)),threshold:threshold,stuckCount:stuckCount,deals:deals,
        historicalAvg:parseFloat((avgDays*(0.8+Math.random()*0.4)).toFixed(1)),
        prevPeriodAvg:parseFloat((avgDays*(0.9+Math.random()*0.3)).toFixed(1))};
    });

    var boardAvgDays=boardTotalJobs>0?parseFloat((boardTotalDays/boardTotalJobs).toFixed(1)):0;
    var healthScore=boardStuck===0?85+Math.floor(Math.random()*15):boardStuck<=2?55+Math.floor(Math.random()*25):20+Math.floor(Math.random()*30);
    totalActiveJobs+=boardTotalJobs;
    totalStuck+=boardStuck;

    boards[bName]={name:bName,region:cfg.region,jobCount:boardTotalJobs,avgDays:boardAvgDays,stuckCount:boardStuck,healthScore:healthScore,status:healthScore>=80?"green":healthScore>=50?"amber":"red",trend:["up","down","flat"][Math.floor(Math.random()*3)],stages:stages,
      historicalAvg:parseFloat((boardAvgDays*(0.85+Math.random()*0.3)).toFixed(1)),live:!!(liveApiData&&liveApiData.boardData&&liveApiData.boardData[bName])};
  });

  // End-to-end pipeline speed (simulated journey through all boards)
  var endToEndDays=Object.values(boards).reduce(function(sum,b){return sum+b.avgDays;},0);

  // Bottleneck analysis
  var bottlenecks=[];
  Object.values(boards).forEach(function(b) {
    Object.values(b.stages).forEach(function(s) {
      if(s.stuckCount>0||(s.historicalAvg&&s.avgDays>s.historicalAvg*1.2)) {
        bottlenecks.push({board:b.name,stage:s.name,stuckCount:s.stuckCount,avgDays:s.avgDays,historicalAvg:s.historicalAvg,delta:parseFloat((s.avgDays-s.historicalAvg).toFixed(1)),pctAbove:s.historicalAvg>0?Math.round(((s.avgDays-s.historicalAvg)/s.historicalAvg)*100):0});
      }
    });
  });
  bottlenecks.sort(function(a,b){return b.pctAbove-a.pctAbove;});

  // Rep performance (owner-level only)
  var repStats={};
  REPS.forEach(function(rep) {
    var repDeals=allDeals.filter(function(d){return d.rep===rep;});
    var avgDays=repDeals.length?parseFloat((repDeals.reduce(function(s,d){return s+d.days;},0)/repDeals.length).toFixed(1)):0;
    repStats[rep]={rep:rep,jobCount:repDeals.length,avgDays:avgDays,slowBoards:[]};
  });

  // Time patterns (simulated)
  var timePatterns=[
    {pattern:"Jobs entered Permitting on Mondays average 3.2 days longer than mid-week submissions",severity:"amber",type:"time"},
    {pattern:"End-of-month volume spikes in New Sale cause 40% slowdown in Engineering intake",severity:"red",type:"volume"},
    {pattern:"Permit Submitted stage consistently exceeds threshold on weeks 2 and 4 of each month",severity:"amber",type:"time"},
    {pattern:"R&R jobs scheduled in Q4 average 18% longer uninstall-to-reinstall turnaround",severity:"amber",type:"time"},
  ];

  return {boards:boards,totalActiveJobs:totalActiveJobs,totalStuck:totalStuck,endToEndDays:parseFloat(endToEndDays.toFixed(1)),bottlenecks:bottlenecks,repStats:repStats,timePatterns:timePatterns,allDeals:allDeals,isLive:!!liveApiData,baselineDays:Math.floor(Math.random()*14)};
}

// ─────────────────────────────────────────────
// PERMISSIONS — single canAccess function
// ─────────────────────────────────────────────
const PERMISSIONS={
  repData:["Owner","COO","VP of Operations","President of Sales","AI Engineer","AI Back-End Developer"],
  nestedEmail:["Owner","COO","VP of Operations","President of Sales","Director of Finance","AI Engineer","AI Back-End Developer","Warehouse Manager"],
  boardEdit:["AI Engineer","AI Back-End Developer"],
  auditAccess:["AI Engineer","AI Back-End Developer"],
  analyticsDeep:["Owner","COO","VP of Operations","President of Sales","Director of Finance","AI Engineer","AI Back-End Developer"],
};
function canAccess(role,feature){return (PERMISSIONS[feature]||[]).indexOf(role)>=0;}

// ─────────────────────────────────────────────
// ROLE TEMPLATES
// ─────────────────────────────────────────────
const RT={
  "Owner":{color:C.amber,boards:"all",region:"Both",nested:true,kpis:["Total active jobs","Jobs completed this week","Revenue pipeline value","Critical bottlenecks","Cancellation rate","Avg days to install","Team utilization rate","End-to-end pipeline days"],sendFreq:"daily"},
  "COO":{color:C.amber,boards:"all",region:"Both",nested:true,kpis:["Total active jobs","Jobs completed this week","Critical bottlenecks","Avg days per stage","Cancellation rate","Pending inspections","Net metering backlog","Service tickets open"],sendFreq:"daily"},
  "VP of Operations":{color:C.amber,boards:"all",region:"Both",nested:true,kpis:["Total active jobs","Jobs completed this week","Critical bottlenecks","Avg days per stage","Cancellation rate","Pending inspections","Net metering backlog","Service tickets open"],sendFreq:"daily"},
  "Office Manager":{color:C.blue,boards:"all",region:"Both",nested:false,kpis:["Welcome calls due today","Thank you calls due","Jobs on hold count","Missing NTP count","Overdue activities","BBB complaints open"],sendFreq:"daily"},
  "Office Administrator":{color:C.blue,boards:["New Sale","Funding"],region:"Both",nested:false,kpis:["Timesheets pending","PTO requests","New hire onboarding","Payroll items due"],sendFreq:"daily"},
  "Installation Manager":{color:C.blue,boards:["Customer Service","New Sale","Scheduling/Coordinating","R&R"],region:"FL",nested:false,kpis:["Installs scheduled today","Installs completed yesterday","Material ordered pending","Install not completed","HOA approvals pending","R&R jobs active"],sendFreq:"daily"},
  "Warehouse Manager":{color:C.blue,boards:["Customer Service","Scheduling/Coordinating","R&R","Inspection","Net Metering","Utility Disco"],region:"FL",nested:true,kpis:["Material orders pending","Installs scheduled this week","R&R uninstalls scheduled","Inspections scheduled","Net metering pending"],sendFreq:"daily"},
  "Service Manager":{color:C.blue,boards:["Service","Utility Disco"],region:"FL",nested:false,kpis:["Service tickets open","Technicians scheduled today","MPU jobs active","Roof leaks open","Warranty claims active"],sendFreq:"daily"},
  "Service Coordinator":{color:C.blue,boards:["Service"],region:"FL",nested:false,kpis:["Service requests today","RMA submissions pending","Panel warranty claims","Monitoring alerts"],sendFreq:"daily"},
  "Engineering Coordinator":{color:C.blue,boards:["Engineering"],region:"FL",nested:false,kpis:["Ready for engineering","In revisions","Needs clarification","Quality control queue","Post install revisions","Waiting on engineers","Sent to permitting today"],sendFreq:"daily"},
  "Permitting Coordinator":{color:C.blue,boards:["Permitting"],region:"FL",nested:false,kpis:["Permits to submit today","Permits submitted this week","Permits in revision","Awaiting approval","Overdue permits"],sendFreq:"daily"},
  "Scheduling Coordinator":{color:C.blue,boards:["Scheduling/Coordinating","R&R","Inspection"],region:"FL",nested:false,kpis:["Installs scheduled this week","HOA pending approvals","R&R ready to schedule","Inspections to schedule","Material orders pending"],sendFreq:"daily"},
  "Inspection Coordinator":{color:C.blue,boards:["Inspection"],region:"FL",nested:false,kpis:["Inspections to schedule","Inspections scheduled today","Failed inspections","Passed inspections","Pending COC","Affidavits needed"],sendFreq:"daily"},
  "Net Metering Coordinator":{color:C.blue,boards:["Net Metering","Completed Meter"],region:"FL",nested:false,kpis:["NMA applications due","NMA submitted this week","Pending meter swaps","PTO calls due","Transformer upgrades","Rejection follow-ups"],sendFreq:"daily"},
  "Receptionist":{color:C.blue,boards:["Customer Service","New Sale"],region:"FL",nested:false,kpis:["Inbound calls today","Welcome calls pending","Enphase setups due","Site capture pending"],sendFreq:"daily"},
  "President of Sales":{color:C.amber,boards:["New Sale","R&R","Scheduling/Coordinating","Completed Meter"],region:"Both",nested:true,kpis:["New deals this week","Site surveys scheduled","Deals sent to engineering","Installs completed","Funded this week","Pipeline value","Cancellation rate"],sendFreq:"daily"},
  "Sales Relations Manager":{color:C.blue,boards:["New Sale","Cancellations"],region:"Both",nested:false,kpis:["Pipeline deals active","Escalated sales issues","Cancellations this week"],sendFreq:"daily"},
  "Account Manager":{color:C.blue,boards:["New Sale","Customer Service","Permitting"],region:"Both",nested:false,kpis:["Welcome calls due","NOC filings pending","Site surveys to schedule","Permit submitted calls due","Enerflo sync issues"],sendFreq:"daily"},
  "After Hours Account Manager":{color:C.blue,boards:["New Sale","Customer Service"],region:"Both",nested:false,kpis:["After hours calls received","Site surveys scheduled","Welcome calls completed"],sendFreq:"daily"},
  "Onboarding Coordinator":{color:C.blue,boards:["New Sale"],region:"Both",nested:false,kpis:["New reps to onboard","Offboarding pending","Onboarding completed this week"],sendFreq:"daily"},
  "Accounting Manager":{color:C.blue,boards:["Funding"],region:"Both",nested:false,kpis:["AP items due","AR outstanding","Reimbursements pending","Commission discrepancies"],sendFreq:"daily"},
  "Commissions Coordinator":{color:C.blue,boards:["Funding","Cancellations"],region:"Both",nested:false,kpis:["Commissions to process","QuotaPath sync issues","Cancellation impact this week"],sendFreq:"daily"},
  "Director of Finance":{color:C.amber,boards:["Funding"],region:"Both",nested:true,kpis:["Funding pipeline value","Finance partner issues","Distributor funding pending","M1/M2/M3 invoice status"],sendFreq:"daily"},
  "Funding Coordinator":{color:C.blue,boards:["Funding","Completed Meter"],region:"Both",nested:false,kpis:["PTOs to audit today","NTP tracking active","Lightreach collections due","M1 invoices needed","M2 invoices needed","M3 invoices needed"],sendFreq:"daily"},
  "AI Engineer":{color:C.purple,boards:"all",region:"Both",nested:true,kpis:["Total active jobs","Critical bottlenecks","Board health overview","KPI coverage rate","Unmapped KPI tags","API connection status","Feedback reports pending","RALPH loop items"],sendFreq:"daily"},
  "AI Back-End Developer":{color:C.purple,boards:"all",region:"Both",nested:true,kpis:["API health status","Webhook events today","Baseline engine status","Draft vs live status","Audit log entries today","Email delivery rate","RALPH loop items"],sendFreq:"daily"},
};
function mB(r){var t=RT[r];if(!t)return Object.keys(BOARDS);return t.boards==="all"?Object.keys(BOARDS):t.boards;}
function mK(r){return RT[r]?RT[r].kpis:[];}

const TEAM_INIT=[
  {id:1,name:"Jordan Lee",title:"Owner",role:"Owner",email:"jordan@unicitysolar.com",manager:"",region:"Both",boards:mB("Owner"),kpis:mK("Owner"),nested:true,sendFreq:"daily",hours:"24/7"},
  {id:2,name:"Mallory Amend",title:"COO",role:"COO",email:"mamend@unicitysolar.com",manager:"Dan",region:"Both",boards:mB("COO"),kpis:mK("COO"),nested:true,sendFreq:"daily",hours:"24/7"},
  {id:30,name:"Josh Labarre",title:"VP of Operations",role:"VP of Operations",email:"josh@unicitysolar.com",manager:"Mallory",region:"Both",boards:mB("VP of Operations"),kpis:mK("VP of Operations"),nested:true,sendFreq:"daily",hours:"24/7"},
  {id:3,name:"Julie Schultz",title:"Office Manager",role:"Office Manager",email:"jschultz@unicitysolar.com",manager:"Mallory",region:"Both",boards:mB("Office Manager"),kpis:mK("Office Manager"),nested:false,sendFreq:"daily",hours:"7AM-3PM"},
  {id:4,name:"Val Martin",title:"Office Administrator",role:"Office Administrator",email:"",manager:"Mallory",region:"Both",boards:mB("Office Administrator"),kpis:mK("Office Administrator"),nested:false,sendFreq:"daily",hours:"7AM-3PM"},
  {id:5,name:"Julio Valdes",title:"Installation Manager",role:"Installation Manager",email:"jvaldes@unicitysolar.com",manager:"Mallory",region:"FL",boards:mB("Installation Manager"),kpis:mK("Installation Manager"),nested:false,sendFreq:"daily",hours:"5:30AM-3PM"},
  {id:6,name:"Aidon Paris",title:"Warehouse Manager",role:"Warehouse Manager",email:"aparis@unicitysolar.com",manager:"Mallory",region:"FL",boards:mB("Warehouse Manager"),kpis:mK("Warehouse Manager"),nested:true,sendFreq:"daily",hours:"5:30AM-3PM"},
  {id:7,name:"Ro Mora",title:"Service Manager",role:"Service Manager",email:"",manager:"Mallory",region:"FL",boards:mB("Service Manager"),kpis:mK("Service Manager"),nested:false,sendFreq:"daily",hours:"5:30AM-3PM"},
  {id:8,name:"Autumn Wilson",title:"Service Coordinator",role:"Service Coordinator",email:"",manager:"Ro Mora",region:"FL",boards:mB("Service Coordinator"),kpis:mK("Service Coordinator"),nested:false,sendFreq:"daily",hours:"8AM-4PM"},
  {id:9,name:"Anthony Cowan",title:"Engineering Coordinator",role:"Engineering Coordinator",email:"acowan@unicitysolar.com",manager:"Julie",region:"FL",boards:mB("Engineering Coordinator"),kpis:mK("Engineering Coordinator"),nested:false,sendFreq:"daily",hours:"8AM-4PM"},
  {id:10,name:"Heather Pennoyer",title:"Permitting Coordinator",role:"Permitting Coordinator",email:"",manager:"Julie",region:"FL",boards:mB("Permitting Coordinator"),kpis:mK("Permitting Coordinator"),nested:false,sendFreq:"daily",hours:"8AM-4PM"},
  {id:11,name:"Anjulik Texteira",title:"Permitting Coordinator",role:"Permitting Coordinator",email:"",manager:"Julie",region:"FL",boards:mB("Permitting Coordinator"),kpis:mK("Permitting Coordinator"),nested:false,sendFreq:"daily",hours:"7AM-3PM"},
  {id:12,name:"Matt Bloemer",title:"Scheduling Coordinator",role:"Scheduling Coordinator",email:"",manager:"Julie",region:"FL",boards:mB("Scheduling Coordinator"),kpis:mK("Scheduling Coordinator"),nested:false,sendFreq:"daily",hours:"8AM-4PM"},
  {id:13,name:"John",title:"Inspection Coordinator",role:"Inspection Coordinator",email:"",manager:"Julie",region:"FL",boards:mB("Inspection Coordinator"),kpis:mK("Inspection Coordinator"),nested:false,sendFreq:"daily",hours:"7AM-3PM"},
  {id:14,name:"Odin",title:"Inspection Coordinator",role:"Inspection Coordinator",email:"",manager:"Julie",region:"FL",boards:mB("Inspection Coordinator"),kpis:mK("Inspection Coordinator"),nested:false,sendFreq:"daily",hours:"7AM-3PM"},
  {id:15,name:"Kristina Solis",title:"Net Metering Coordinator",role:"Net Metering Coordinator",email:"",manager:"Julie",region:"FL",boards:mB("Net Metering Coordinator"),kpis:mK("Net Metering Coordinator"),nested:false,sendFreq:"daily",hours:"7AM-3PM"},
  {id:16,name:"Felicia",title:"Net Metering Coordinator",role:"Net Metering Coordinator",email:"",manager:"Julie",region:"FL",boards:mB("Net Metering Coordinator"),kpis:mK("Net Metering Coordinator"),nested:false,sendFreq:"daily",hours:"7AM-3PM"},
  {id:17,name:"Brissa",title:"Receptionist",role:"Receptionist",email:"",manager:"Julie",region:"FL",boards:mB("Receptionist"),kpis:mK("Receptionist"),nested:false,sendFreq:"daily",hours:"8AM-4PM"},
  {id:18,name:"Dan Sperruzzi",title:"President of Sales",role:"President of Sales",email:"dsperruzzi@unicitysolar.com",manager:"",region:"Both",boards:mB("President of Sales"),kpis:mK("President of Sales"),nested:true,sendFreq:"daily",hours:"24/7"},
  {id:19,name:"Aaron Clements",title:"Sales Relations Manager",role:"Sales Relations Manager",email:"",manager:"Dan",region:"Both",boards:mB("Sales Relations Manager"),kpis:mK("Sales Relations Manager"),nested:false,sendFreq:"daily",hours:"Varies"},
  {id:20,name:"Freddie",title:"Account Manager",role:"Account Manager",email:"",manager:"Aaron",region:"Both",boards:mB("Account Manager"),kpis:mK("Account Manager"),nested:false,sendFreq:"daily",hours:"Varies"},
  {id:21,name:"Erika",title:"Account Manager",role:"Account Manager",email:"",manager:"Aaron",region:"Both",boards:mB("Account Manager"),kpis:mK("Account Manager"),nested:false,sendFreq:"daily",hours:"Varies"},
  {id:22,name:"Amanda Biondi",title:"After Hours Account Manager",role:"After Hours Account Manager",email:"",manager:"Aaron",region:"Both",boards:mB("After Hours Account Manager"),kpis:mK("After Hours Account Manager"),nested:false,sendFreq:"daily",hours:"Varies"},
  {id:23,name:"Rick Sperruzzi",title:"Onboarding Coordinator",role:"Onboarding Coordinator",email:"",manager:"Dan",region:"Both",boards:mB("Onboarding Coordinator"),kpis:mK("Onboarding Coordinator"),nested:false,sendFreq:"daily",hours:"Varies"},
  {id:24,name:"Ella",title:"Accounting Manager",role:"Accounting Manager",email:"",manager:"Dan",region:"Both",boards:mB("Accounting Manager"),kpis:mK("Accounting Manager"),nested:false,sendFreq:"daily",hours:"7AM-3PM"},
  {id:25,name:"Austin Richman",title:"Commissions Coordinator",role:"Commissions Coordinator",email:"",manager:"Dan",region:"Both",boards:mB("Commissions Coordinator"),kpis:mK("Commissions Coordinator"),nested:false,sendFreq:"daily",hours:"8AM-4PM"},
  {id:26,name:"Christina Graham",title:"Director of Finance",role:"Director of Finance",email:"",manager:"Mallory",region:"Both",boards:mB("Director of Finance"),kpis:mK("Director of Finance"),nested:true,sendFreq:"daily",hours:"8AM-4PM"},
  {id:27,name:"Jay Johnson",title:"Funding Coordinator",role:"Funding Coordinator",email:"",manager:"Christina",region:"Both",boards:mB("Funding Coordinator"),kpis:mK("Funding Coordinator"),nested:false,sendFreq:"daily",hours:"7AM-3PM"},
  {id:28,name:"Aidon Paris",title:"AI Engineer",role:"AI Engineer",email:"aparis@unicitysolar.com",manager:"",region:"Both",boards:mB("AI Engineer"),kpis:mK("AI Engineer"),nested:true,sendFreq:"daily",hours:"5:30AM-3PM"},
  {id:29,name:"Stephen Farrell",title:"AI Back-End Developer",role:"AI Back-End Developer",email:"stephen@unicityhome.com",manager:"",region:"Both",boards:mB("AI Back-End Developer"),kpis:mK("AI Back-End Developer"),nested:true,sendFreq:"daily",hours:"Varies"},
];

const KPI_INIT=[
  {id:"k1",name:"Total active jobs",sources:[],fallback:"N/A",testResult:null},
  {id:"k2",name:"Jobs completed this week",sources:[],fallback:"N/A",testResult:null},
  {id:"k3",name:"Critical bottlenecks",sources:[],fallback:"0",testResult:null},
  {id:"k4",name:"Revenue pipeline value",sources:[],fallback:"N/A",testResult:null},
  {id:"k5",name:"Ready for engineering",sources:[{board:"Engineering",scope:"stage",stage:"Ready for Engineering",field:"stage.deal_count"}],fallback:"0",testResult:null},
  {id:"k6",name:"Installs scheduled today",sources:[{board:"Scheduling/Coordinating",scope:"stage",stage:"Installation Scheduled",field:"stage.deal_count"}],fallback:"0",testResult:null},
  {id:"k7",name:"Service tickets open",sources:[{board:"Service",scope:"board",stage:null,field:"pipeline.deal_count"}],fallback:"0",testResult:null},
  {id:"k8",name:"M1 invoices needed",sources:[{board:"Funding",scope:"stage",stage:"M1 Invoice needed",field:"stage.deal_count"}],fallback:"0",testResult:null},
  {id:"k9",name:"End-to-end pipeline days",sources:[],fallback:"N/A",testResult:null},
  {id:"k10",name:"Cancellation rate",sources:[],fallback:"N/A",testResult:null},
];

const AUDIT_INIT=[
  {id:1,ts:"2026-05-09 05:58",user:"Stephen Farrell",action:"KPI tag mapped",detail:"Ready for engineering mapped to Engineering board",type:"kpi",draft:false},
  {id:2,ts:"2026-05-09 05:55",user:"Aidon Paris",action:"Board access updated",detail:"Heather Pennoyer added Inspection board",type:"access",draft:false},
];

const RALPH_INIT=[
  {id:1,ts:"2026-05-08 09:12",reporter:"Mallory Amend",issue:"Critical bottlenecks KPI showing 0 every day",kpi:"Critical bottlenecks",status:"open",stage:"R - Reported",correction:"",aiNote:""},
  {id:2,ts:"2026-05-07 07:45",reporter:"Dan Sperruzzi",issue:"Pipeline value not matching Pipedrive dashboard",kpi:"Revenue pipeline value",status:"patched",stage:"H - Hardened",correction:"Fixed field mapping to sum all open deal values",aiNote:"Confirmed fix deployed."},
];

const RALPH_STAGES=[
  {stage:"R - Reported",desc:"Issue flagged by a user",col:C.red},
  {stage:"A - Annotating",desc:"AI Engineer reviewing and documenting",col:C.amber},
  {stage:"L - Learning",desc:"Correction being mapped to system rules",col:C.blue},
  {stage:"P - Patched",desc:"Fix applied and deployed",col:C.orange},
  {stage:"H - Hardened",desc:"Stress-tested and permanently locked in",col:C.green},
];

// ─────────────────────────────────────────────
// PIPEDRIVE FETCH
// ─────────────────────────────────────────────
function valKey(k){if(!k||k.length<20)return "Key too short";if(!/^[a-f0-9]+$/i.test(k))return "Invalid characters";return null;}
async function fetchPD(apiKey,setErr,setHealth){
  var e=valKey(apiKey);if(e){setErr(e);setHealth(function(h){return Object.assign({},h,{pd:"invalid key"});});return null;}
  setErr(null);
  try{
    var instruc="Using Pipedrive API token "+apiKey+", make read-only GET requests to pipelines, stages, and open deals. Return ONLY JSON (no markdown). Schema: {success:true, totalDeals:number, pipelines:[{id,name}], boardData:{pipelineName:{totalDeals:number, stages:[{name,count,avgDays,deals:[{id,name,days,pipedriveUrl}]}]}}}. On auth failure: {success:false,error:string}";
    var res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:instruc}]})});
    var data=await res.json();
    var raw=(data.content||[]).find(function(b){return b.type==="text";});
    var p=JSON.parse((raw?raw.text:"").replace(/```json|```/g,"").trim());
    if(!p.success){var msg=p.error||"Unknown";setErr("Pipedrive: "+msg);setHealth(function(h){return Object.assign({},h,{pd:msg.toLowerCase().indexOf("unauthorized")>=0?"invalid key":"unreachable"});});return null;}
    setHealth(function(h){return Object.assign({},h,{pd:"connected",lastPull:new Date().toLocaleTimeString()});});
    return{boardData:p.boardData,totalDeals:p.totalDeals,pipelines:p.pipelines};
  }catch(err){setErr("Request failed: "+err.message);setHealth(function(h){return Object.assign({},h,{pd:"request failed"});});return null;}
}

// ─────────────────────────────────────────────
// EMAIL TEMPLATE ENGINE
// Fixed structure — AI fills content only
// ─────────────────────────────────────────────

// Fetch AI-generated text content only (no HTML structure)
async function fetchEmailContent(person, pd, kpiTags, liveApiData, isMonday, isOwnerLevel) {
  var kpiValues = person.kpis.map(function(k) {
    var tag = kpiTags.find(function(t) { return t.name === k; });
    var mapped = tag && tag.sources.length > 0;
    var val = "—";
    if (liveApiData && mapped && tag.sources[0]) {
      var src = tag.sources[0];
      var bd = liveApiData.boardData ? liveApiData.boardData[src.board] : null;
      if (bd) {
        if (src.scope === "board") val = String(bd.totalDeals);
        else if (src.scope === "stage" && src.stage) {
          var st = bd.stages ? bd.stages.find(function(s) { return s.name && s.name.toLowerCase() === src.stage.toLowerCase(); }) : null;
          if (st) val = String(st.count);
        }
      }
    } else {
      // Simulated values
      var simVals = {"Total active jobs": String(pd.totalActiveJobs), "End-to-end pipeline days": pd.endToEndDays + "d", "Critical bottlenecks": String(pd.totalStuck)};
      val = simVals[k] || String(Math.floor(Math.random() * 30) + 1);
    }
    return k + ": " + val;
  }).join(", ");

  var top3 = pd.bottlenecks.slice(0, 3).map(function(b) {
    return b.board + " > " + b.stage + " (" + b.stuckCount + " stuck, avg " + b.avgDays + "d, " + b.pctAbove + "% above hist)";
  }).join("; ");

  var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var day = days[new Date().getDay()];

  var prompt = "You are writing content for a morning KPI briefing email for " + person.name + ", " + person.title + " at Unicity Solar Energy. Today is " + day + ".\n\n"
    + "Return ONLY a valid JSON object with these exact keys, no markdown, no backticks:\n"
    + "{\n"
    + "  \"greeting\": \"A warm 1-2 sentence greeting using their first name " + person.name.split(" ")[0] + ". Mention " + day + (isMonday ? " and add a motivational note" : "") + ". Max 40 words.\",\n"
    + "  \"needsAttention\": [\"2-3 specific bottleneck alert strings based on: " + top3 + ". Each string: board name, stage, days stuck, brief action suggestion. Max 20 words each.\"],\n"
    + "  \"priorities\": [\"3 specific action item strings for a " + person.title + " today. Concrete and role-specific. Max 15 words each.\"]"
    + (isOwnerLevel ? ",\n  \"teamPulse\": \"2-3 sentence company-wide snapshot. Total jobs: " + pd.totalActiveJobs + ", stuck: " + pd.totalStuck + ", end-to-end avg: " + pd.endToEndDays + "d. Max 50 words.\"" : "")
    + (isMonday ? ",\n  \"weekReview\": \"2-3 sentence prior week summary comparing performance. Reference boards and numbers. Max 50 words.\"" : "")
    + "\n}";

  try {
    var res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({model: "claude-sonnet-4-20250514", max_tokens: 600, messages: [{role: "user", content: prompt}]})
    });
    var data = await res.json();
    var raw = (data.content || []).find(function(b) { return b.type === "text"; });
    return JSON.parse((raw ? raw.text : "{}").replace(/```json|```/g, "").trim());
  } catch(e) {
    return {
      greeting: "Good morning " + person.name.split(" ")[0] + ", here is your daily briefing for " + day + ".",
      needsAttention: pd.bottlenecks.slice(0,2).map(function(b) { return b.board + " > " + b.stage + ": " + b.stuckCount + " stuck jobs averaging " + b.avgDays + " days."; }),
      priorities: ["Review all rotten deals and reassign where needed.", "Check in with your team on today's scheduled installs.", "Follow up on any open customer escalations."]
    };
  }
}

// Build KPI table HTML from pipelineData — no AI, guaranteed layout
function buildKpiTableHtml(person, pd, kpiTags, liveApiData) {
  var kpis = person.kpis.map(function(k) {
    var tag = kpiTags.find(function(t) { return t.name === k; });
    var mapped = tag && tag.sources.length > 0;
    var val = "—";
    if (liveApiData && mapped && tag.sources[0]) {
      var src = tag.sources[0];
      var bd = liveApiData.boardData ? liveApiData.boardData[src.board] : null;
      if (bd) {
        if (src.scope === "board") val = String(bd.totalDeals);
        else if (src.scope === "stage" && src.stage) {
          var st = bd.stages ? bd.stages.find(function(s) { return s.name && s.name.toLowerCase() === src.stage.toLowerCase(); }) : null;
          if (st) val = String(st.count);
        }
      }
    } else {
      var simMap = {"Total active jobs": String(pd.totalActiveJobs), "End-to-end pipeline days": pd.endToEndDays + "d", "Critical bottlenecks": String(pd.totalStuck), "Cancellation rate": "4.2%", "Revenue pipeline value": "$2.4M"};
      val = simMap[k] || String(Math.floor(Math.random() * 30) + 1);
    }
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

// Build board health HTML — fully from pipelineData, with per-deal Pipedrive links
function buildBoardHealthHtml(pd, memberBoards) {
  var boards = (memberBoards || []).filter(function(b) { return pd.boards[b]; });
  var sorted = boards.slice().sort(function(a, b) {
    var o = {red: 0, amber: 1, green: 2};
    return (o[pd.boards[a].status] || 2) - (o[pd.boards[b].status] || 2);
  });
  var gc = boards.filter(function(b) { return pd.boards[b] && pd.boards[b].status === "green"; }).length;
  var ac = boards.filter(function(b) { return pd.boards[b] && pd.boards[b].status === "amber"; }).length;
  var rc = boards.filter(function(b) { return pd.boards[b] && pd.boards[b].status === "red"; }).length;

  var boardCards = sorted.map(function(bName) {
    var b = pd.boards[bName]; if (!b) return "";
    var col = b.status === "green" ? "#22C55E" : b.status === "amber" ? "#F59E0B" : "#EF4444";
    var icon = b.status === "green" ? "&#9679;" : b.status === "amber" ? "&#9650;" : "&#10005;";
    var statusLabel = b.status === "green" ? "Healthy" : b.status === "amber" ? "Watch" : "Critical";
    var stuckStages = Object.values(b.stages).filter(function(s) { return s.stuckCount > 0; });

    var stageRows = stuckStages.length === 0
      ? "<p style='margin:0;font-size:12px;color:#22C55E;font-family:Arial,sans-serif;'>No stuck jobs in this board</p>"
      : stuckStages.map(function(stage) {
          var dealRows = stage.deals.filter(function(d) { return stage.threshold && d.days > stage.threshold; }).slice(0, 3).map(function(d) {
            return "<div style='margin:3px 0;padding:5px 8px;background:rgba(255,255,255,0.04);border-radius:5px;'>"
              + "<table width='100%' cellpadding='0' cellspacing='0' border='0'><tr>"
              + "<td style='font-size:11px;color:#F0F0F0;font-family:Arial,sans-serif;'>" + d.name + "</td>"
              + "<td style='font-size:11px;color:#EF4444;text-align:center;font-family:Arial,sans-serif;'>" + d.days + "d</td>"
              + "<td style='font-size:11px;text-align:right;font-family:Arial,sans-serif;'><a href='" + d.pipedriveUrl + "' style='color:#4A9EE0;text-decoration:none;'>Open &rarr;</a></td>"
              + "</tr></table>"
              + "</div>";
          }).join("");

          return "<div style='margin-bottom:7px;padding:8px 10px;background:rgba(239,68,68,0.08);border-left:3px solid #EF4444;border-radius:0 6px 6px 0;'>"
            + "<p style='margin:0 0 5px;font-size:12px;color:#EF4444;font-weight:500;font-family:Arial,sans-serif;'>"
            + stage.name + " &mdash; " + stage.stuckCount + " stuck (avg " + stage.avgDays + "d)"
            + (stage.threshold ? " &middot; threshold: " + stage.threshold + "d" : "") + "</p>"
            + (dealRows || "<p style='margin:0;font-size:11px;color:#897C80;font-family:Arial,sans-serif;'>No deals past threshold</p>")
            + "</div>";
        }).join("");

    return "<details style='margin-bottom:7px;border-radius:9px;overflow:hidden;border:1px solid " + col + "40;'>"
      + "<summary style='padding:10px 14px;background:" + col + "15;cursor:pointer;list-style:none;font-family:Arial,sans-serif;'>"
      + "<table width='100%' cellpadding='0' cellspacing='0' border='0'><tr>"
      + "<td style='color:" + col + ";font-size:13px;font-weight:500;'>" + icon + " " + bName + " &mdash; " + b.jobCount + " jobs</td>"
      + "<td style='text-align:right;color:" + col + ";font-size:11px;'>" + b.avgDays + "d avg &middot; " + statusLabel + " &#9662;</td>"
      + "</tr></table></summary>"
      + "<div style='padding:12px 14px;background:#1E2228;font-family:Arial,sans-serif;'>"
      + "<p style='margin:0 0 8px;font-size:11px;color:#897C80;'>Avg days: " + b.avgDays + "d &middot; Historical avg: " + b.historicalAvg + "d &middot; " + stuckStages.length + " stuck stages</p>"
      + stageRows
      + "</div></details>";
  }).join("");

  var summaryRow = "<table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:14px;'><tr>"
    + "<td width='32%' style='text-align:center;padding:10px 6px;background:rgba(34,197,94,0.1);border-radius:8px;border:1px solid rgba(34,197,94,0.25);'><p style='margin:0;font-size:20px;font-weight:500;color:#22C55E;font-family:Arial,sans-serif;'>" + gc + "</p><p style='margin:3px 0 0;font-size:11px;color:#22C55E;font-family:Arial,sans-serif;'>&#9679; Healthy</p></td>"
    + "<td width='4%'></td>"
    + "<td width='28%' style='text-align:center;padding:10px 6px;background:rgba(245,158,11,0.1);border-radius:8px;border:1px solid rgba(245,158,11,0.25);'><p style='margin:0;font-size:20px;font-weight:500;color:#F59E0B;font-family:Arial,sans-serif;'>" + ac + "</p><p style='margin:3px 0 0;font-size:11px;color:#F59E0B;font-family:Arial,sans-serif;'>&#9650; Watch</p></td>"
    + "<td width='4%'></td>"
    + "<td width='32%' style='text-align:center;padding:10px 6px;background:rgba(239,68,68,0.1);border-radius:8px;border:1px solid rgba(239,68,68,0.25);'><p style='margin:0;font-size:20px;font-weight:500;color:#EF4444;font-family:Arial,sans-serif;'>" + rc + "</p><p style='margin:3px 0 0;font-size:11px;color:#EF4444;font-family:Arial,sans-serif;'>&#10005; Critical</p></td>"
    + "</tr></table>";

  return "<div style='padding:18px 22px;background:#1A1D22;'>"
    + "<p style='margin:0 0 12px;font-size:14px;font-weight:500;color:#F28F1D;font-family:Arial,sans-serif;'>Board health overview</p>"
    + summaryRow
    + "<div style='width:100%;'>" + boardCards + "</div>"
    + "<p style='margin:10px 0 0;font-size:11px;color:#897C80;text-align:center;font-family:Arial,sans-serif;'>End-to-end pipeline avg: " + pd.endToEndDays + "d &middot; Industry benchmark: " + INDUSTRY_BENCHMARK_DAYS + "d</p>"
    + "</div>";
}

// Master template assembler — fixed structure, no variation
function assembleEmail(person, content, kpiTableHtml, needsAttentionHtml, boardHealthHtml, isMonday, isOwnerLevel) {
  var divider = "<div style='height:1px;background:rgba(255,255,255,0.08);margin:0;'></div>";
  var sectionStyle = "padding:18px 22px;background:#24262B;";
  var headerStyle = "margin:0 0 12px;font-size:14px;font-weight:500;color:#F28F1D;font-family:Arial,sans-serif;";
  var bodyStyle = "font-size:13px;color:#F0F0F0;font-family:Arial,sans-serif;line-height:1.6;";

  var sections = [
    // S1 — Greeting
    "<div style='" + sectionStyle + "background:#1E2228;'>"
    + "<p style='" + bodyStyle + "margin:0;'>" + (content.greeting || "") + "</p>"
    + "</div>",

    divider,

    // S2 — KPIs (built entirely from data, no AI)
    "<div style='" + sectionStyle + "'>"
    + "<p style='" + headerStyle + "'>Your KPIs today</p>"
    + kpiTableHtml
    + "</div>",

    divider,

    // S3 — Needs attention (AI text + code-built links)
    "<div style='" + sectionStyle + "background:#1E2228;'>"
    + "<p style='" + headerStyle + "'>Needs attention</p>"
    + needsAttentionHtml
    + "</div>",

    divider,

    // S4 — Board health (built entirely from pipelineData, always here, always standalone)
    person.nested ? boardHealthHtml : null,
    person.nested ? divider : null,

    // S5 — Today's priorities (AI text)
    "<div style='" + sectionStyle + "'>"
    + "<p style='" + headerStyle + "'>Today's priorities</p>"
    + (content.priorities || []).map(function(p, i) {
        return "<div style='display:flex;gap:10px;margin-bottom:8px;align-items:flex-start;'>"
          + "<span style='font-size:13px;color:#F28F1D;font-family:Arial,sans-serif;font-weight:500;flex-shrink:0;'>" + (i+1) + ".</span>"
          + "<p style='margin:0;font-size:13px;color:#F0F0F0;font-family:Arial,sans-serif;'>" + p + "</p>"
          + "</div>";
      }).join("")
    + "</div>",

    // S6 — Team pulse (owners only)
    isOwnerLevel && content.teamPulse ? divider : null,
    isOwnerLevel && content.teamPulse
      ? "<div style='" + sectionStyle + "background:#1E2228;'>"
        + "<p style='" + headerStyle + "'>Team pulse</p>"
        + "<p style='margin:0;" + bodyStyle + "'>" + content.teamPulse + "</p>"
        + "</div>"
      : null,

    // S7 — Week in review (Mondays)
    isMonday && content.weekReview ? divider : null,
    isMonday && content.weekReview
      ? "<div style='" + sectionStyle + "'>"
        + "<p style='" + headerStyle + "'>Week in review</p>"
        + "<p style='margin:0;" + bodyStyle + "'>" + content.weekReview + "</p>"
        + "</div>"
      : null,

    divider,

    // Footer — hardcoded
    "<div style='padding:14px 22px;background:#141618;text-align:center;'>"
    + "<p style='margin:0 0 6px;font-size:11px;color:#897C80;font-family:Arial,sans-serif;'>"
    + "<a href='mailto:ai@unicitysolar.com?subject=Snooze alert - " + person.name + "' style='color:#897C80;margin:0 8px;'>Snooze alerts</a>"
    + "&middot;"
    + "<a href='mailto:ai@unicitysolar.com?subject=KPI Report - " + person.name + "' style='color:#897C80;margin:0 8px;'>Flag an issue</a>"
    + "</p>"
    + "<p style='margin:0;font-size:11px;color:#4A5568;font-family:Arial,sans-serif;'>Read-only system &middot; Unicity Solar Energy &middot; " + new Date().toLocaleDateString() + "</p>"
    + "</div>",
  ].filter(function(s) { return s !== null && s !== undefined; });

  return "<div style='max-width:600px;margin:0 auto;background:#24262B;border-radius:12px;overflow:hidden;border:1px solid rgba(242,143,29,0.2);'>"
    + sections.join("")
    + "</div>";
}

// Build standalone board health block injected into preview emails for nested-access roles.
// Uses pipelineData directly — no AI, no duplication of buildBoardHealthHtml.
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
      +"<td style='text-align:right;color:"+col+";font-size:11px;'>"+b.avgDays+"d avg &middot; "+b.healthScore+" score &#9662;</td>"
      +"</tr></table></summary>"
      +"<div style='padding:10px 14px;background:#1E2228;font-family:Arial,sans-serif;'>"
      +"<p style='margin:0 0 5px;font-size:11px;color:#897C80;'>"+stageInfo+"</p>"
      +"<p style='margin:0;font-size:11px;color:#897C80;'>Avg days in board: "+b.avgDays+"d &middot; Historical avg: "+b.historicalAvg+"d</p>"
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

// ─────────────────────────────────────────────
// DOWNLOAD HELPERS
// ─────────────────────────────────────────────
function dlCSV(data,fn){if(!data.length)return;var k=Object.keys(data[0]);var csv=[k.join(",")].concat(data.map(function(r){return k.map(function(key){return '"'+(String(r[key]||"")).replace(/"/g,'""')+'"';}).join(",");})).join("\n");var a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download=fn;a.click();}
function dlJSON(data,fn){var a=document.createElement("a");a.href="data:application/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(data,null,2));a.download=fn;a.click();}
function todayStr(){return new Date().toISOString().split("T")[0];}

// ─────────────────────────────────────────────
// UI ATOMS
// ─────────────────────────────────────────────
function UniLogo(){return <svg width="42" height="42" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="22" fill="#24262B"/><g transform="translate(4,4)"><path d="M18 4C18 4 26 6 30 14C34 22 30 30 22 32" stroke="#F28F1D" strokeWidth="3.2" strokeLinecap="round" fill="none"/><path d="M22 32C22 32 13 31 9 23C5 15 9 7 17 5" stroke="#E8841A" strokeWidth="3.2" strokeLinecap="round" fill="none"/><path d="M4 18C4 18 6 10 14 7C22 4 29 8 31 16" stroke="#F5A623" strokeWidth="3.2" strokeLinecap="round" fill="none"/><path d="M32 22C32 22 30 30 22 33C14 36 7 32 5 24" stroke="#D4721A" strokeWidth="3.2" strokeLinecap="round" fill="none"/></g></svg>;}
function Avatar({name,size=36}){var ini=name.split(" ").map(function(w){return w[0];}).join("").slice(0,2).toUpperCase();var bg=name.charCodeAt(0)%2===0?C.orange:C.blue;return <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:500,fontSize:size*0.33,flexShrink:0,border:"2px solid "+bg+"44"}}>{ini}</div>;}
function Pill({text,color="orange",size=11}){var fg=color==="green"?C.green:color==="red"?C.red:color==="amber"?C.amber:color==="blue"?C.blue:color==="purple"?C.purple:C.orange;return <span style={{background:fg+"18",color:fg,border:"1px solid "+fg+"44",fontSize:size,fontWeight:500,padding:"3px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{text}</span>;}
function SLabel({icon,text}){return <p style={{fontSize:12,fontWeight:500,color:C.orange,letterSpacing:"0.4px",margin:"0 0 10px",display:"flex",alignItems:"center",gap:6}}><i className={"ti "+icon} aria-hidden="true"/>{text}</p>;}
function SubTab({tabs,active,onChange,th}){return <div style={{display:"flex",gap:4,marginBottom:"1.25rem",background:th.tabBg,border:"1px solid "+th.tabBorder,borderRadius:12,padding:3}}>{tabs.map(function(t){return <button key={t} onClick={function(){onChange(t);}} style={{flex:1,padding:"7px 4px",border:"none",borderRadius:9,background:active===t?C.orange+"22":"transparent",color:active===t?C.orange:th.textMuted,fontWeight:active===t?500:400,fontSize:12,cursor:"pointer"}}>{t}</button>;})}</div>;}
function SDot({on}){return <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:on?C.green:C.orange,boxShadow:on?"0 0 6px "+C.green:"0 0 6px "+C.orange,marginRight:6}}/>;}
function RBadge({role}){var t=RT[role];var fg=t?t.color:"#897C80";return <span style={{background:fg+"18",color:fg,border:"1px solid "+fg+"44",fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{role}</span>;}

// ─────────────────────────────────────────────
// DEAL CARD — reused across all drill-downs
// ─────────────────────────────────────────────
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
        <p style={{margin:0,fontSize:11,color:th.textMuted}}>{n.date}</p>
        <p style={{margin:0,fontSize:11,color:th.text}}>{n.text}</p>
      </div>;})}
    </div>}
  </div>;
}

// ─────────────────────────────────────────────
// KPI DRILL-DOWN PANEL
// Opens when a KPI value is clicked
// Derives all data from pipelineData
// ─────────────────────────────────────────────
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
                {b.historicalAvg&&b.avgDays>b.historicalAvg?<span style={{fontSize:11,color:C.red}}>+{(b.avgDays-b.historicalAvg).toFixed(1)}d vs hist</span>:null}
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

// ─────────────────────────────────────────────
// INTELLIGENCE TAB
// 4 sub-tabs: Overview, Pipeline Speed, Bottlenecks, History
// All powered by pipelineData
// ─────────────────────────────────────────────
function IntelligenceTab({pd,member,role,th,kpiTags,onAiSummary,aiSummary,summaryLoading,activeSubTab,onSubTabChange}){
  var [internalSub,setInternalSub]=useState("Overview");
  var sub=activeSubTab||internalSub;
  var setSub=onSubTabChange||setInternalSub;
  var [range,setRange]=useState("Week over week");
  var [heatExpand,setHeatExpand]=useState(null);
  var memberBoards=(member.boards||[]).filter(function(b){return pd.boards[b];});
  var showRepData=canAccess(role,"repData");

  // Heat map colour: green→amber→red based on avgDays relative to threshold
  function heatColor(avgDays,threshold,historicalAvg){
    var ref=threshold||historicalAvg||5;
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
      {!pd.isLive&&<div style={{background:C.amber+"0d",border:"1px solid "+C.amber+"22",borderRadius:10,padding:"7px 12px",marginBottom:"1rem"}}>
        <span style={{fontSize:12,color:C.amber}}>Simulated data &mdash; paste Pipedrive API key in Setup for live intelligence</span>
      </div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:"1rem"}}>
        {[{l:"Active jobs",v:pd.totalActiveJobs,col:C.orange},{l:"Stuck jobs",v:pd.totalStuck,col:C.red},{l:"End-to-end avg",v:pd.endToEndDays+"d",col:C.blue},{l:"Industry bench",v:INDUSTRY_BENCHMARK_DAYS+"d",col:th.textMuted}].map(function(s){
          return <div key={s.l} style={{background:s.col+"0d",border:"1px solid "+s.col+"22",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:20,fontWeight:500,color:s.col}}>{s.v}</p>
            <p style={{margin:0,fontSize:11,color:th.textMuted}}>{s.l}</p>
          </div>;
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:"1rem"}}>
        {[["green","Healthy","●"],["amber","Watch","▲"],["red","Critical","x"]].map(function(arr){
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
          var vsHist=b.avgDays>b.historicalAvg?"+":"";
          return <div key={bName} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:th.inputBg,border:"1px solid "+col+"30",borderRadius:11}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:col,boxShadow:"0 0 7px "+col,flexShrink:0}}/>
            <span style={{flex:1,fontSize:13,fontWeight:500,color:th.text}}>{bName}</span>
            <span style={{fontSize:12,color:th.textMuted}}>{b.jobCount} jobs</span>
            <span style={{fontSize:12,color:C.orange}}>{b.avgDays}d avg</span>
            <span style={{fontSize:11,color:b.avgDays>b.historicalAvg?C.red:C.green}}>{vsHist}{(b.avgDays-b.historicalAvg).toFixed(1)}d vs hist</span>
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
                var hc=heatColor(s.avgDays,s.threshold,s.historicalAvg);
                var isExp=heatExpand===bName+s.name;
                return <div key={s.name} style={{marginBottom:3}}>
                  <button onClick={function(){setHeatExpand(isExp?null:bName+s.name);}} style={{padding:"5px 9px",background:hc.bg,border:"1px solid "+hc.text+"44",borderRadius:7,cursor:"pointer",textAlign:"left"}}>
                    <p style={{margin:0,fontSize:10,color:hc.text,fontWeight:500,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</p>
                    <p style={{margin:"1px 0 0",fontSize:11,fontWeight:500,color:hc.text}}>{s.avgDays}d</p>
                    <p style={{margin:0,fontSize:9,color:th.textMuted}}>{s.jobCount} jobs</p>
                  </button>
                  {isExp&&<div style={{background:th.card,border:"1px solid "+th.border,borderRadius:8,padding:"8px 10px",marginTop:3,minWidth:220}}>
                    <p style={{margin:"0 0 6px",fontSize:11,fontWeight:500,color:th.text}}>{s.name} &mdash; {s.jobCount} jobs, avg {s.avgDays}d</p>
                    <p style={{margin:"0 0 6px",fontSize:11,color:th.textMuted}}>Historical avg: {s.historicalAvg}d &middot; Threshold: {s.threshold?s.threshold+"d":"none"}</p>
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
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:"1.5rem"}}>
        {pd.bottlenecks.slice(0,10).map(function(bn,i){
          var severity=bn.pctAbove>=40?C.red:bn.pctAbove>=20?C.amber:C.orange;
          return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:th.inputBg,border:"1px solid "+severity+"33",borderRadius:9}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:severity,boxShadow:"0 0 5px "+severity,flexShrink:0}}/>
            <div style={{flex:1}}>
              <p style={{margin:0,fontSize:12,fontWeight:500,color:th.text}}>{bn.board}</p>
              <p style={{margin:0,fontSize:11,color:th.textMuted}}>{bn.stage}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{margin:0,fontSize:12,fontWeight:500,color:severity}}>{bn.avgDays}d avg</p>
              <p style={{margin:0,fontSize:11,color:th.textMuted}}>hist: {bn.historicalAvg}d (+{bn.pctAbove}%)</p>
            </div>
            <span style={{fontSize:11,color:C.red,background:C.red+"18",padding:"2px 7px",borderRadius:8,fontWeight:500}}>{bn.stuckCount} stuck</span>
          </div>;
        })}
      </div>

      <p style={{margin:"0 0 8px",fontSize:12,fontWeight:500,color:th.text}}>Time and volume patterns</p>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:"1.5rem"}}>
        {pd.timePatterns.map(function(p,i){
          var col=p.severity==="red"?C.red:C.amber;
          return <div key={i} style={{display:"flex",gap:10,padding:"8px 12px",background:th.inputBg,border:"1px solid "+col+"33",borderRadius:9}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:col,marginTop:3,flexShrink:0}}/>
            <p style={{margin:0,fontSize:12,color:th.text}}>{p.pattern}</p>
          </div>;
        })}
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
      <div style={{background:C.amber+"0d",border:"1px solid "+C.amber+"22",borderRadius:10,padding:"7px 12px",marginBottom:"1rem"}}>
        <span style={{fontSize:12,color:C.amber}}>Historical comparison activates after 14-day Pipedrive baseline. Currently showing simulated deltas.</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {memberBoards.map(function(bName){
          var b=pd.boards[bName];if(!b)return null;
          var col=b.status==="green"?C.green:b.status==="amber"?C.amber:C.red;
          var prevDeals=Math.floor(Math.random()*80)+20;
          var prevAvg=parseFloat((b.avgDays*(0.85+Math.random()*0.3)).toFixed(1));
          var dealsDelta=b.jobCount-prevDeals;
          var avgDelta=parseFloat((b.avgDays-prevAvg).toFixed(1));
          return <div key={bName} style={{background:th.card,border:"1px solid "+th.border,borderRadius:12,padding:"1rem",borderLeft:"3px solid "+col}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:col}}/>
              <span style={{flex:1,fontSize:13,fontWeight:500,color:th.text}}>{bName}</span>
              <span style={{fontSize:11,color:th.textMuted}}>{range}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
              {[
                {label:"Active jobs",cur:b.jobCount,prev:prevDeals,unit:"",low:false},
                {label:"Avg days",cur:b.avgDays,prev:prevAvg,unit:"d",low:true},
                {label:"Stuck jobs",cur:b.stuckCount,prev:Math.floor(Math.random()*8),unit:"",low:true},
                {label:"Health score",cur:b.healthScore,prev:Math.floor(Math.random()*40)+50,unit:"",low:false},
              ].map(function(m){
                var diff=Number(m.cur)-Number(m.prev);
                var good=m.low?diff<0:diff>0;
                var col2=diff===0?C.amber:good?C.green:C.red;
                var arrow=diff===0?"→":diff>0?"↑":"↓";
                return <div key={m.label} style={{background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:9,padding:"8px 10px"}}>
                  <p style={{margin:"0 0 3px",fontSize:11,color:th.textMuted}}>{m.label}</p>
                  <p style={{margin:"0 0 2px",fontSize:16,fontWeight:500,color:th.text}}>{m.cur}{m.unit}</p>
                  <span style={{fontSize:11,color:col2,fontWeight:500}}>{arrow} {Math.abs(diff).toFixed(1)}{m.unit}</span>
                  <p style={{margin:"2px 0 0",fontSize:11,color:th.textMuted}}>vs {m.prev}{m.unit} prior</p>
                </div>;
              })}
            </div>
          </div>;
        })}
      </div>
    </div>}
  </div>;
}

// ─────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// KPI MAPPING + PD FIELDS (condensed, same logic)
// ─────────────────────────────────────────────
const PD_FIELDS_FLAT=[
  {n:"deal.title",d:"Name/title of the deal",r:"String"},{n:"deal.status",d:"open/won/lost/deleted",r:"Enum"},{n:"deal.value",d:"Monetary value",r:"Currency"},{n:"deal.add_time",d:"When deal was created",r:"Datetime"},{n:"deal.stage_change_time",d:"When deal last moved stages",r:"Datetime"},{n:"deal.rotten_time",d:"When deal entered rotten status",r:"Datetime"},{n:"deal.owner_name",d:"Assigned user name",r:"String"},{n:"deal.person_name",d:"Contact person name",r:"String"},
  {n:"activity.type",d:"Type: call, email, meeting, task",r:"Enum"},{n:"activity.due_date",d:"When activity is due",r:"Date"},{n:"activity.done",d:"Whether completed",r:"Boolean"},{n:"activity.overdue",d:"Past due and not done",r:"Boolean"},
  {n:"person.name",d:"Full name of contact",r:"String"},{n:"person.phone",d:"Phone number(s)",r:"Array"},{n:"person.email",d:"Email address(es)",r:"Array"},{n:"person.address",d:"Home/install address",r:"String"},
  {n:"pipeline.deal_count",d:"Total deals in pipeline",r:"Integer"},{n:"stage.deal_count",d:"Deals in stage",r:"Integer"},{n:"stage.avg_age_days",d:"Avg days deals spend in stage",r:"Float"},{n:"stage.rotten_flag",d:"Stage has rotten deals",r:"Boolean"},
  {n:"calc.days_in_stage",d:"Days since deal entered current stage",r:"Integer"},{n:"calc.is_rotten",d:"True if past rotting threshold",r:"Boolean"},{n:"calc.stuck_count",d:"Deals past rotting threshold",r:"Integer"},{n:"calc.completion_rate",d:"Won deals / total deals",r:"Percentage"},{n:"calc.board_health_score",d:"Composite health score 0-100",r:"Integer"},
];

function KpiMapping({kpiTags,setKpiTags,team,th}){
  var [sel,setSel]=useState(kpiTags[0]?kpiTags[0].id:null);
  var [newName,setNewName]=useState("");var [testing,setTesting]=useState(null);var [cfmDel,setCfmDel]=useState(null);var [tagSearch,setTagSearch]=useState("");
  var tag=kpiTags.find(function(t){return t.id===sel;});
  var bNames=Object.keys(BOARDS);
  var iS={background:th.inputBg,border:"1px solid "+th.inputBorder,borderRadius:10,color:th.selectText,fontSize:13,padding:"8px 11px",outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const};
  var filtered=useMemo(function(){return tagSearch?kpiTags.filter(function(t){return t.name.toLowerCase().indexOf(tagSearch.toLowerCase())>=0;}):kpiTags;},[kpiTags,tagSearch]);

  function addSrc(){if(!sel)return;setKpiTags(function(ts){return ts.map(function(t){return t.id===sel?Object.assign({},t,{sources:t.sources.concat([{board:bNames[0],scope:"board",stage:null,field:"stage.deal_count"}])}):t;});});}
  function updSrc(tid,si,f,v){setKpiTags(function(ts){return ts.map(function(t){if(t.id!==tid)return t;var s=t.sources.map(function(src,i){if(i!==si)return src;var u=Object.assign({},src);u[f]=v;if(f==="board")u.stage=null;if(f==="scope"&&v==="board")u.stage=null;return u;});return Object.assign({},t,{sources:s});});});}
  function remSrc(tid,si){setKpiTags(function(ts){return ts.map(function(t){return t.id===tid?Object.assign({},t,{sources:t.sources.filter(function(_,i){return i!==si;})}):t;});});}
  function addTag(){var n=newName.trim();if(!n)return;setKpiTags(function(ts){return ts.concat([{id:"k"+Date.now(),name:n,sources:[],fallback:"N/A",testResult:null}]);});setNewName("");}
  function delTag(tid){if(cfmDel!==tid){setCfmDel(tid);setTimeout(function(){setCfmDel(function(c){return c===tid?null:c;});},3000);return;}setKpiTags(function(ts){return ts.filter(function(t){return t.id!==tid;});});if(sel===tid)setSel(null);setCfmDel(null);}
  function usedBy(name){return team.filter(function(m){return m.kpis.indexOf(name)>=0;}).length;}
  async function testTag(tid){setTesting(tid);await new Promise(function(r){setTimeout(r,1200);});setKpiTags(function(ts){return ts.map(function(t){return t.id===tid?Object.assign({},t,{testResult:Math.floor(Math.random()*24)+" (simulated)"}):t;});});setTesting(null);}

  return <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
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
            {["N/A","0","—","No data","Use last known value"].map(function(o){return <option key={o} style={{background:th.selectBg,color:th.selectText}}>{o}</option>;})}
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
  </div>;
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
function Dashboard({session}:{session:{signedIn:boolean;email:string;name:string}}){
  var [dark,setDark]=useState(true);
  var th=dark?DARK:LIGHT;
  var glass={background:th.card,border:"1px solid "+th.border,borderRadius:16,padding:"1.25rem"};
  var iS={background:th.inputBg,border:"1px solid "+th.inputBorder,borderRadius:10,color:th.selectText,fontSize:13,padding:"8px 11px",outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const};

  // Core state
  var [tab,setTab]=useState("Setup");
  var [stab,setStab]=useState("General");
  var [pdKey,setPdKey]=useState("");
  var [gcId,setGcId]=useState("");
  var [gConn,setGConn]=useState(false);
  var [draft,setDraft]=useState(false);
  var [showPush,setShowPush]=useState(false);
  var [sendTime,setSendTime]=useState("06:00");
  var [team,setTeam]=useState(TEAM_INIT.map(function(m){return Object.assign({},m);}));
  var [kpiTags,setKpiTags]=useState(KPI_INIT);
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

  // Single derived pipelineData — everything in the app reads from this
  var pd=useMemo(function(){return buildPipelineData(liveApiData);},[liveApiData]);

  var allBoards=Object.keys(BOARDS);
  var draftChanges=audit.filter(function(e){return e.draft;});

  function addAudit(action,detail,type){type=type||"system";setAudit(function(l){return [{id:Date.now(),ts:new Date().toLocaleString(),user:"Stephen Farrell",action:action,detail:detail,type:type,draft:draft}].concat(l);});}
  function updMember(i,u){setTeam(function(t){return t.map(function(x,idx){return idx===i?u:x;});});}
  function switchToDraft(){setDraft(true);addAudit("Switched to draft mode","Changes will not affect live send","system");}
  function pushToLive(){setDraft(false);setShowPush(false);setAudit(function(l){return l.map(function(e){return Object.assign({},e,{draft:false});});});addAudit("Pushed to live","All draft changes promoted","system");}

  async function pullLive(){
    if(!pdKey){setApiErr("Please enter your Pipedrive API key first.");return;}
    setLiveLoad(true);setApiHealth(function(h){return Object.assign({},h,{pd:"checking"});});setApiErr(null);
    var d=await fetchPD(pdKey,setApiErr,setApiHealth);
    if(d){setLiveApiData(d);addAudit("Live Pipedrive data pulled",d.totalDeals+" open deals fetched","system");}
    setLiveLoad(false);
  }

  async function genAiSummary(){
    setSummaryLoading(true);
    var top5=pd.bottlenecks.slice(0,5).map(function(b){return b.board+" > "+b.stage+" ("+b.pctAbove+"% above avg, "+b.stuckCount+" stuck)";}).join("; ");
    var patterns=pd.timePatterns.map(function(p){return p.pattern;}).join("; ");
    var prompt="You are a solar installation operations analyst. Given these bottlenecks: "+top5+". And these patterns: "+patterns+". Write 3-4 sentences of plain English analysis identifying the root cause patterns and what they suggest about the operation. Be specific and actionable. Do not use bullet points.";
    try{
      var res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,messages:[{role:"user",content:prompt}]})});
      var data=await res.json();
      var raw=(data.content||[]).find(function(b){return b.type==="text";});
      setAiSummary(raw?raw.text:"Unable to generate summary.");
    }catch(err){setAiSummary("Analysis unavailable: "+err.message);}
    setSummaryLoading(false);
  }

  // Generate preview email — no redundant health build, uses pd directly
  async function genPreview(person,idx){
    setPrevLoad(true);setPrevEmail(null);
    var kl=person.kpis.map(function(k){
      var tag=kpiTags.find(function(t){return t.name===k;});var mapped=tag&&tag.sources.length>0;
      var lv="";
      if(liveApiData&&mapped&&tag.sources[0]){var src=tag.sources[0];var bd=liveApiData.boardData?liveApiData.boardData[src.board]:null;if(bd){if(src.scope==="board"){lv=" = "+bd.totalDeals+" deals";}else if(src.scope==="stage"&&src.stage){var st=bd.stages?bd.stages.find(function(s){return s.name&&s.name.toLowerCase()===src.stage.toLowerCase();}):null;if(st)lv=" = "+st.count+" deals";}}}
      return k+(mapped?" (source: "+tag.sources.map(function(s){return s.board+(s.stage?" > "+s.stage:"");}).join(", ")+lv+")":" - unmapped");
    }).join("\n");
    var days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var day=days[new Date().getDay()];var isMon=day==="Monday";
    var isOwner=canAccess(person.role,"analyticsDeep");
    var parts=[
      "Generate a morning KPI briefing email for "+person.name+", "+person.title+" at Unicity Solar Energy.",
      "Today: "+day+". Region: "+person.region+". Hours: "+person.hours+".",
      liveApiData?"Data: live Pipedrive":"Data: simulated",
      "","KPI tags — include ALL, no skipping:","",kl,"",
      "HTML email, inline styles, max-width 600px, dark bg #24262B, text #F0F0F0, orange #F28F1D.",
      "Sections separated by <hr style=\"border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;\">",
      "DO NOT include a board health section — it will be injected programmatically after section 3.",
      "",
      "SECTION 1 - Greeting: warm, first name "+person.name.split(" ")[0]+", mention "+day+(isMon?", motivational":"")+".",
      "SECTION 2 - Your KPIs today: ALL tags in 3-column HTML table. Each cell: tag name (11px #897C80) above bold value (18px #F0F0F0). Odd tags fill with empty tds. Use "+(liveApiData?"live":"realistic")+" numbers.",
      "SECTION 3 - Needs attention: 2-3 bottleneck alerts, stage name, days stuck, View in Pipedrive link.",
      "SECTION 4 - Today's priorities: 3 action items for "+person.title+".",
      isMon?"SECTION 5 - Week in review: prior week summary with metrics and trends.":"",
      isOwner?"SECTION - Team pulse: company-wide snapshot with 4-5 metrics.":"",
      "FOOTER: snooze link | flag issue (mailto:ai@unicitysolar.com) | Read-only system - Unicity Solar Energy",
      "","Return ONLY the HTML. No markdown, no backticks."
    ];
    var prompt=parts.filter(function(p){return p!==undefined&&p!==null;}).join("\n");
    try{
      var res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2500,messages:[{role:"user",content:prompt}]})});
      var data=await res.json();
      var raw=(data.content||[]).find(function(b){return b.type==="text";});
      var emailBody=(raw?raw.text:"<p style='color:#EF4444'>No content.</p>").replace(/<\/body>/gi,"").replace(/<\/html>/gi,"").trim();

      var finalHtml=emailBody;
      if(person.nested){
        var hBlock=buildEmailHealthSection(pd,person.boards);
        var injected=false;
        var markers=["Today's priorities","SECTION 4","priorities"];
        for(var mi=0;mi<markers.length;mi++){
          var idx2=emailBody.indexOf(markers[mi]);
          if(idx2>=0){var before=emailBody.slice(0,idx2);var hrIdx=before.lastIndexOf("<hr");var insertAt=hrIdx>=0?hrIdx:idx2;
            finalHtml=emailBody.slice(0,insertAt)+"<hr style=\"border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;\">"+hBlock+"<hr style=\"border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;\">"+emailBody.slice(insertAt);
            injected=true;break;
          }
        }
        if(!injected){var footIdx=emailBody.search(/snooze|flag an issue|read-only/i);var ins=footIdx>=0?footIdx:emailBody.length;finalHtml=emailBody.slice(0,ins)+hBlock+emailBody.slice(ins);}
      }
      setPrevEmail(finalHtml);
    }catch(err){setPrevEmail("<p style='color:#EF4444'>Error: "+err.message+"</p>");}
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
        +"<h2 style='color:#F28F1D;margin:0 0 1rem'>Test briefing — "+m.name+"</h2>"
        +"<p style='margin:0 0 0.5rem'>Hello "+m.name.split(" ")[0]+",</p>"
        +"<p style='margin:0 0 0.5rem'>This is a manual send from the Unicity Solar KPI dashboard.</p>"
        +"<p style='margin:0 0 0.5rem'>Pipeline summary: <strong>"+pd.totalActiveJobs+"</strong> active jobs, <strong>"+pd.totalStuck+"</strong> stuck, end-to-end avg <strong>"+pd.endToEndDays+"d</strong>.</p>"
        +"<p style='margin:1.5rem 0 0;font-size:11px;color:#897C80'>Sent "+new Date().toLocaleString()+" — "+(liveApiData?"Live data":"Simulated data")+"</p>"
        +"</div>";
      var res=await fetch("/api/email/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:m.email,subject:"Unicity KPI Briefing — Test",html:html})});
      var data=await res.json();
      if(!res.ok)throw new Error(data.error||"Send failed");
      var entry={id:Date.now(),name:m.name,role:m.role,email:m.email,ts:new Date().toLocaleString(),dataSource:liveApiData?"Live Pipedrive":"Simulated",mode:draft?"Draft":"Live",status:"Sent"};
      setSendLog(function(l){return [entry].concat(l);});
      setSendStatus(function(s){var n=Object.assign({},s);n[i]=new Date().toLocaleTimeString();return n;});
      addAudit("Email sent",m.name+" — "+entry.dataSource,"system");
    }catch(err:any){
      setSendStatus(function(s){var n=Object.assign({},s);n[i]="failed";return n;});
      alert("Send failed: "+(err.message||"unknown"));
    }
  }

  var TABS=[{id:"Setup",icon:"ti-settings"},{id:"Team",icon:"ti-users"},{id:"Boards",icon:"ti-layout-board"},{id:"Intelligence",icon:"ti-brain"},{id:"Preview",icon:"ti-mail"},{id:"Send",icon:"ti-send"},{id:"Audit",icon:"ti-history"},{id:"RALPH",icon:"ti-circuit-board"}];

  function getDept(r){if(["Owner","COO","VP of Operations","Office Manager","Office Administrator","Installation Manager","Warehouse Manager","Service Manager","Service Coordinator","Engineering Coordinator","Permitting Coordinator","Scheduling Coordinator","Inspection Coordinator","Net Metering Coordinator","Receptionist"].indexOf(r)>=0)return"Operations";if(["President of Sales","Sales Relations Manager","Account Manager","After Hours Account Manager","Onboarding Coordinator"].indexOf(r)>=0)return"Sales";if(["Accounting Manager","Commissions Coordinator","Director of Finance","Funding Coordinator"].indexOf(r)>=0)return"Finance";return"AI";}

  var filtTeam=team.filter(function(m){var ms=m.name.toLowerCase().indexOf(tSearch.toLowerCase())>=0||m.title.toLowerCase().indexOf(tSearch.toLowerCase())>=0;var mf=tFilter==="All"||getDept(m.role)===tFilter||m.region===tFilter;return ms&&mf;});
  var pdCol=apiHealth.pd==="connected"?C.green:apiHealth.pd==="checking"?C.amber:apiHealth.pd==="unknown"?th.textMuted:C.red;

  return <div style={{minHeight:"100vh",background:th.bg,padding:"1.5rem 1rem",fontFamily:"var(--font-sans)",transition:"background 0.2s",position:"relative"}}>
    {boardEdit!==null&&<BoardModal member={team[boardEdit]} allBoards={allBoards} onSave={function(nb){addAudit("Board access updated",team[boardEdit].name+" boards updated","access");updMember(boardEdit,Object.assign({},team[boardEdit],{boards:nb}));setBoardEdit(null);}} onClose={function(){setBoardEdit(null);}} th={th}/>}
    {showPush&&<PushModal draftChanges={draftChanges} team={team} onConfirm={pushToLive} onCancel={function(){setShowPush(false);}} th={th}/>}
    {kpiDrillKpi&&<KpiDrillDown kpiName={kpiDrillKpi} pd={pd} memberBoards={team[prevPerson]?team[prevPerson].boards:Object.keys(BOARDS)} role={team[prevPerson]?team[prevPerson].role:"Owner"} onClose={function(){setKpiDrillKpi(null);}} th={th} onNavigateIntelligence={function(sub){setKpiDrillKpi(null);setTab("Intelligence");setIntelSub(sub);}}/>}

    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1rem",flexWrap:"wrap"}}>
      <UniLogo/>
      <div>
        <div style={{display:"flex",alignItems:"baseline",gap:7}}><span style={{fontSize:19,fontWeight:500,color:th.text}}>Unicity</span><span style={{fontSize:19,fontWeight:500,color:C.orange}}>Solar Energy</span></div>
        <p style={{margin:0,fontSize:11,color:th.textMuted}}>Morning KPI briefing system v8</p>
      </div>
      <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:th.textMuted,marginRight:8}}>{session.name||session.email} · <a href="/api/auth/signout" style={{color:C.orange,textDecoration:"none"}}>Sign out</a></span>
        {liveApiData&&<Pill text={"Live - "+pd.totalActiveJobs+" jobs"} color="green"/>}
        {liveLoad&&<Pill text="Pulling..." color="amber"/>}
        <span style={{background:C.green+"12",border:"1px solid "+C.green+"30",borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:500,color:C.green}}>Read-only</span>
        <button onClick={function(){setDark(function(d){return !d;});}} style={{display:"flex",alignItems:"center",gap:5,background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:20,padding:"5px 12px",color:th.textMuted,fontSize:11,cursor:"pointer"}}>
          <i className={"ti ti-"+(dark?"sun":"moon")} style={{fontSize:13}} aria-hidden="true"/>{dark?"Light":"Dark"}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:5,background:th.inputBg,border:"1px solid "+th.borderPlain,borderRadius:20,padding:"5px 12px"}}><SDot on={gConn}/><span style={{fontSize:11,color:th.textMuted}}>{gConn?"Live":"Setup needed"}</span></div>
      </div>
    </div>

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

    {/* Tabs */}
    <div style={{display:"flex",gap:3,marginBottom:"1.5rem",background:th.tabBg,border:"1px solid "+th.tabBorder,borderRadius:14,padding:4,overflowX:"auto"}}>
      {TABS.map(function(t){var a=tab===t.id;return <button key={t.id} onClick={function(){setTab(t.id);}} style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"8px 10px",border:"none",borderRadius:11,background:a?C.orange:"transparent",color:a?"#fff":th.textMuted,fontWeight:a?500:400,fontSize:12,cursor:"pointer"}}>
        <i className={"ti "+t.icon} style={{fontSize:13}} aria-hidden="true"/>{t.id}
      </button>;})}
    </div>

    {/* SETUP */}
    {tab==="Setup"&&<div>
      <SubTab tabs={["General","KPI Mapping","Pipedrive Fields"]} active={stab} onChange={setStab} th={th}/>
      {stab==="General"&&<div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
        <div style={glass}>
          <SLabel icon="ti-key" text="Pipedrive API key"/>
          <div style={{display:"flex",gap:8}}>
            <input value={pdKey} onChange={function(e){setPdKey(e.target.value);setApiErr(null);setApiHealth(function(h){return Object.assign({},h,{pd:"unknown"});});}} placeholder="Paste your Pipedrive API key..." style={Object.assign({},iS,{flex:1})} type="password"/>
            <button onClick={pullLive} disabled={liveLoad} style={{background:C.orange+"22",border:"1px solid "+C.orange+"44",borderRadius:10,color:C.orange,fontWeight:500,fontSize:12,padding:"8px 14px",cursor:"pointer",flexShrink:0}}>{liveLoad?"Pulling...":"Pull live data"}</button>
          </div>
          <p style={{fontSize:11,color:th.textMuted,margin:"6px 0 4px"}}>Read-only GET access. Settings - Personal preferences - API in Pipedrive.</p>
          {apiErr&&<div style={{background:C.red+"0d",border:"1px solid "+C.red+"33",borderRadius:8,padding:"7px 12px",marginTop:6}}><p style={{margin:0,fontSize:12,color:C.red}}>! {apiErr}</p><p style={{margin:"4px 0 0",fontSize:11,color:th.textMuted}}>Browsers cannot call Pipedrive directly (CORS). This app routes through Claude's API securely.</p></div>}
          {liveApiData&&<div style={{background:C.green+"0d",border:"1px solid "+C.green+"22",borderRadius:8,padding:"7px 12px",marginTop:6}}><p style={{margin:0,fontSize:12,color:C.green}}>Connected - {liveApiData.totalDeals} open deals - {(liveApiData.pipelines||[]).length} pipelines - {apiHealth.lastPull}</p></div>}
        </div>
        <div style={glass}>
          <SLabel icon="ti-brand-google" text="Gmail / Google Workspace OAuth"/>
          <input value={gcId} onChange={function(e){setGcId(e.target.value);}} placeholder="your-client-id.apps.googleusercontent.com" style={Object.assign({},iS,{width:"100%",marginBottom:8})} type="text"/>
          <p style={{margin:"0 0 8px",fontSize:11,color:th.textMuted}}>Scopes: gmail.send + gmail.readonly only.</p>
          <button onClick={async function(){if(!gcId)return;var params=new URLSearchParams({client_id:gcId,redirect_uri:window.location.origin,response_type:"code",scope:"https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",access_type:"offline",prompt:"consent"});window.open("https://accounts.google.com/o/oauth2/v2/auth?"+params,"_blank","width=500,height=600");setGConn(true);addAudit("Google OAuth initiated","gmail.send + gmail.readonly","system");}} style={{display:"flex",alignItems:"center",gap:8,background:gConn?C.green+"12":C.orange+"18",border:"1px solid "+(gConn?C.green:C.orange)+"44",borderRadius:10,padding:"9px 16px",color:gConn?C.green:C.orange,fontSize:13,fontWeight:500,cursor:"pointer"}}>
            <SDot on={gConn}/>{gConn?"Google Workspace connected":"Connect Google Workspace"}
          </button>
        </div>
        <div style={glass}>
          <SLabel icon="ti-clock" text="Send schedule"/>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <input type="time" value={sendTime} onChange={function(e){setSendTime(e.target.value);}} style={Object.assign({},iS,{width:130,color:C.orange,fontWeight:500,fontSize:18})}/>
            <div><p style={{margin:0,fontSize:13,color:th.text,fontWeight:500}}>Weekdays - Mon-Fri</p><p style={{margin:0,fontSize:11,color:th.textMuted}}>Monday sends weekly summary - {team.length} recipients</p></div>
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
      {stab==="KPI Mapping"&&<KpiMapping kpiTags={kpiTags} setKpiTags={setKpiTags} team={team} th={th}/>}
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

    {/* INTELLIGENCE — replaces Health tab, backed by pipelineData */}
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
    {tab==="Send"&&<div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
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
    {tab==="Audit"&&<div>
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
    {tab==="RALPH"&&<div>
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
        <RalphFormInline kpiTags={kpiTags} th={th} iS={iS} onSubmit={function(obj){setRalph(function(l){return [{id:Date.now(),ts:new Date().toLocaleString(),reporter:obj.reporter,issue:obj.issue,kpi:obj.kpi,status:"open",stage:"R - Reported",correction:"",aiNote:""}].concat(l);});setShowRalphForm(false);addAudit("RALPH issue logged",obj.reporter+": "+obj.issue.slice(0,50),"system");}} onCancel={function(){setShowRalphForm(false);}}/>
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

// ── Auth wrapper: handles session, gates dashboard ──
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
    return <div style={{minHeight:"100vh",background:"#1A1C20",display:"flex",alignItems:"center",justifyContent:"center",color:"#897C80",fontFamily:"system-ui,sans-serif"}}>Loading…</div>;
  }
  if(!session.signedIn){
    return <div style={{minHeight:"100vh",background:"#1A1C20",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:"2rem"}}>
      <div style={{background:"#2E3138",border:"1px solid rgba(242,143,29,0.2)",borderRadius:16,padding:"2.5rem 2rem",maxWidth:420,textAlign:"center"}}>
        <p style={{margin:"0 0 0.5rem",fontSize:22,fontWeight:500,color:"#F0F0F0"}}>Unicity Solar KPI</p>
        <p style={{margin:"0 0 1.5rem",fontSize:13,color:"#897C80"}}>Sign in with your <span style={{color:"#F28F1D"}}>@unicitysolar.com</span> or <span style={{color:"#F28F1D"}}>@unicityhome.com</span> account.</p>
        <a href="/api/auth/google/start" style={{display:"inline-block",background:"linear-gradient(135deg,#F28F1D,#D4721A)",color:"#fff",padding:"11px 28px",borderRadius:10,textDecoration:"none",fontWeight:500,fontSize:14}}>Sign in with Google</a>
      </div>
    </div>;
  }
  return <Dashboard session={session}/>;
}
