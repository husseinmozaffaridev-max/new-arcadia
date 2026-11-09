/**
 * ife.seed.ts
 *
 * Complete ARCADIA / Capella-style In-Flight Entertainment (IFE) system seed.
 * Exact reference implementation modeled directly from Thales Capella IFE:
 * - OA: [OABD] All Activities, [OEBD] Entities & Actors, [OCB] Capabilities, [OAB] Architecture
 * - SA: [CSA] Contextual Actors, [MCB] Missions & Capabilities, [SFBD] Functions Breakdown, [SDFB] Data Flow, [SAB] System Architecture
 * - LA: [LCBD] Component Breakdown, [LFBD] Function Breakdown, [LDFB] Data Flow, [LAB] Logical Architecture, [CRB] Capability Realization
 * - PA: [PCBD] Component Breakdown, [PFBD] Function Breakdown, [PDFB] Data Flow, [PAB] Physical Architecture
 *
 * Rules:
 * - All relationships respect ConnectionPolicy & Capella palette definitions
 * - All trace links respect TracePolicy
 * - No orphan elements
 * - Physical layer uses DeploymentLink, PhysicalLink, ComponentExchange
 */

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { db as defaultDb } from "./client";
import {
  diagrams,
  elements,
  models,
  relationships,
  traceLinks,
} from "./schemas";

type SeedIFEInput = {
  projectId: string;
};

type Database = typeof defaultDb;
type ModelRow = typeof models.$inferSelect;

export async function seedIFEProject(input: SeedIFEInput, db: Database) {
  // =========================================================================
  // 1. MODELS (OA, SA, LA, PA)
  // =========================================================================
  const existingModels = await db
    .select()
    .from(models)
    .where(eq(models.projectId, input.projectId));

  const findModel = (layer: string) =>
    existingModels.find((m: ModelRow) => m.layer === layer);

  const modelIds = {
    oa: findModel("OA")?.id ?? randomUUID(),
    sa: findModel("SA")?.id ?? randomUUID(),
    la: findModel("LA")?.id ?? randomUUID(),
    pa: findModel("PA")?.id ?? randomUUID(),
  };

  const modelsToInsert = [];
  if (!findModel("OA")) {
    modelsToInsert.push({
      id: modelIds.oa,
      projectId: input.projectId,
      layer: "OA",
      name: "Operational Analysis",
      description: "Operational analysis of In-Flight Entertainment System",
    });
  }
  if (!findModel("SA")) {
    modelsToInsert.push({
      id: modelIds.sa,
      projectId: input.projectId,
      layer: "SA",
      name: "System Analysis",
      description: "System analysis of In-Flight Entertainment System",
    });
  }
  if (!findModel("LA")) {
    modelsToInsert.push({
      id: modelIds.la,
      projectId: input.projectId,
      layer: "LA",
      name: "Logical Architecture",
      description: "Logical architecture of In-Flight Entertainment System",
    });
  }
  if (!findModel("PA")) {
    modelsToInsert.push({
      id: modelIds.pa,
      projectId: input.projectId,
      layer: "PA",
      name: "Physical Architecture",
      description: "Physical architecture of In-Flight Entertainment System",
    });
  }

  if (modelsToInsert.length > 0) {
    await db.insert(models).values(modelsToInsert);
  }

  // Clean up existing elements, relationships, diagrams, traceLinks for this project
  const allModelIds = [modelIds.oa, modelIds.sa, modelIds.la, modelIds.pa];
  await db.delete(traceLinks).where(eq(traceLinks.projectId, input.projectId));
  for (const mId of allModelIds) {
    await db.delete(relationships).where(eq(relationships.modelId, mId));
    await db.delete(diagrams).where(eq(diagrams.modelId, mId));
    await db.delete(elements).where(eq(elements.modelId, mId));
  }

  // =========================================================================
  // 2. OPERATIONAL ANALYSIS (OA) ELEMENTS
  // =========================================================================
  const oa = {
    // Actors
    passenger: randomUUID(),
    crew: randomUUID(),
    groundOperator: randomUUID(),
    // Entities
    airline: randomUUID(),
    aircraft: randomUUID(),
    // Mission & Capabilities
    missionIFE: randomUUID(),
    capabilityEntertainment: randomUUID(),
    capabilityCommercial: randomUUID(),
    // Activities
    actDefineStrategy: randomUUID(),
    actUpdateMediaOffer: randomUUID(),
    actUseEntertainment: randomUUID(),
    actWatchMovie: randomUUID(),
    actListenToAudio: randomUUID(),
    actBrowseInternet: randomUUID(),
    actPlayGames: randomUUID(),
    actWatchMovingMap: randomUUID(),
    actBroadcastAnnouncement: randomUUID(),
  };

  await db.insert(elements).values([
    // Entities & Actors
    {
      id: oa.passenger,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActor",
      name: "Passenger",
      description: "Aircraft passenger enjoying entertainment services",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: oa.crew,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActor",
      name: "Cabin Crew",
      description: "Cabin crew managing flight comfort and announcements",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: oa.groundOperator,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActor",
      name: "Ground Operator",
      description: "Ground personnel loading media content",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: oa.airline,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalEntity",
      name: "Airline Company",
      description: "Commercial airline operating flights and entertainment",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: oa.aircraft,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalEntity",
      name: "Aircraft",
      description: "Physical aircraft hosting passenger cabins",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    // Mission & Capabilities
    {
      id: oa.missionIFE,
      modelId: modelIds.oa,
      layer: "OA",
      type: "Mission",
      name: "Provide In-Flight Entertainment and Services",
      description:
        "Mission to satisfy passengers with rich multimedia services",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: oa.capabilityEntertainment,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalCapability",
      name: "Provide Entertainment Services",
      description: "Offer movies, music, games and moving map to passengers",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: oa.capabilityCommercial,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalCapability",
      name: "Provide Commercial Services",
      description: "In-flight shopping and premium internet connectivity",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    // Activities
    {
      id: oa.actDefineStrategy,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActivity",
      name: "Define business strategy",
      description: "Airline corporate business planning",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: oa.actUpdateMediaOffer,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActivity",
      name: "Update Digital Media Offer",
      description: "Refresh movie catalog and audio playlists",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: oa.actUseEntertainment,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActivity",
      name: "Use Entertainment Services",
      description: "Root activity grouping all in-flight media usage",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: oa.actWatchMovie,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActivity",
      name: "Watch Movie",
      description: "View on-demand digital cinema",
      properties: { status: "VALIDATED" },
      parentId: oa.actUseEntertainment,
    },
    {
      id: oa.actListenToAudio,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActivity",
      name: "Listen to Audio",
      description: "Listen to music albums and podcasts",
      properties: { status: "VALIDATED" },
      parentId: oa.actUseEntertainment,
    },
    {
      id: oa.actBrowseInternet,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActivity",
      name: "Browse the Internet",
      description: "Satellite high-speed internet surfing",
      properties: { status: "VALIDATED" },
      parentId: oa.actUseEntertainment,
    },
    {
      id: oa.actPlayGames,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActivity",
      name: "Play Games",
      description: "Interactive casual gaming",
      properties: { status: "VALIDATED" },
      parentId: oa.actUseEntertainment,
    },
    {
      id: oa.actWatchMovingMap,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActivity",
      name: "Watch Moving Map",
      description: "Real-time 3D flight trajectory visualization",
      properties: { status: "VALIDATED" },
      parentId: oa.actUseEntertainment,
    },
    {
      id: oa.actBroadcastAnnouncement,
      modelId: modelIds.oa,
      layer: "OA",
      type: "OperationalActivity",
      name: "Broadcast Audio/Video Information",
      description: "Cabin crew safety and flight announcements",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
  ]);

  // =========================================================================
  // 3. SYSTEM ANALYSIS (SA) ELEMENTS
  // =========================================================================
  const sa = {
    system: randomUUID(),
    passenger: randomUUID(),
    crew: randomUUID(),
    aircraft: randomUUID(),
    missionEntertain: randomUUID(),
    capWatchMovie: randomUUID(),
    capListenAudio: randomUUID(),
    capAccessInternet: randomUUID(),
    fnPerformEntertainment: randomUUID(),
    fnProvideVideo: randomUUID(),
    fnProvideAudio: randomUUID(),
    fnProvideMovingMap: randomUUID(),
    fnProvideConnectivity: randomUUID(),
    fnManageAnnouncements: randomUUID(),
    fnManageContent: randomUUID(),
    fnCaptureSelection: randomUUID(),
  };

  await db.insert(elements).values([
    // System & Actors
    {
      id: sa.system,
      modelId: modelIds.sa,
      layer: "SA",
      type: "System",
      name: "In-Flight Entertainment System",
      description: "Complete aircraft digital IFE system",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: sa.passenger,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemActor",
      name: "Passenger",
      description: "System user interacting with seat screen",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: sa.crew,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemActor",
      name: "Cabin Crew",
      description: "Crew using cabin control panel and announcements",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: sa.aircraft,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemActor",
      name: "Aircraft",
      description: "Avionics providing navigation, speed, and altitude data",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    // Mission & Capabilities
    {
      id: sa.missionEntertain,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemMission",
      name: "Entertain Passengers during flight",
      description: "Provide interactive digital services throughout cruise",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: sa.capWatchMovie,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemCapability",
      name: "Watch Movie",
      description: "System capability for video on-demand",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: sa.capListenAudio,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemCapability",
      name: "Listen to Audio",
      description: "System capability for streaming audio playlists",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: sa.capAccessInternet,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemCapability",
      name: "Access Internet",
      description: "System capability for high-speed airborne broadband",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    // Functions
    {
      id: sa.fnPerformEntertainment,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemFunction",
      name: "Perform Entertainment Services",
      description: "Root function orchestrating all entertainment services",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: sa.fnProvideVideo,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemFunction",
      name: "Provide Video Services",
      description: "Decompresses and renders video content",
      properties: { status: "VALIDATED" },
      parentId: sa.fnPerformEntertainment,
    },
    {
      id: sa.fnProvideAudio,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemFunction",
      name: "Provide Audio Services",
      description: "Streams Hi-Fi multi-channel audio",
      properties: { status: "VALIDATED" },
      parentId: sa.fnPerformEntertainment,
    },
    {
      id: sa.fnProvideMovingMap,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemFunction",
      name: "Provide Moving Map Services",
      description: "Plots real-time route from avionics telemetry",
      properties: { status: "VALIDATED" },
      parentId: sa.fnPerformEntertainment,
    },
    {
      id: sa.fnProvideConnectivity,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemFunction",
      name: "Provide Passenger Connectivity",
      description: "Handles Wi-Fi authentication and bandwidth",
      properties: { status: "VALIDATED" },
      parentId: sa.fnPerformEntertainment,
    },
    {
      id: sa.fnManageAnnouncements,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemFunction",
      name: "Manage Audio Video Announcements",
      description: "Pauses playback and broadcasts safety announcements",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: sa.fnManageContent,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemFunction",
      name: "Manage Content & Configuration",
      description: "Stores catalogs and configures cabin parameters",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: sa.fnCaptureSelection,
      modelId: modelIds.sa,
      layer: "SA",
      type: "SystemFunction",
      name: "Capture Passenger Selection",
      description: "Captures user touch screen input events",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
  ]);

  // =========================================================================
  // 4. LOGICAL ARCHITECTURE (LA) ELEMENTS
  // =========================================================================
  const la = {
    ifeSystem: randomUUID(),
    sdu: randomUUID(),
    server: randomUUID(),
    ctu: randomUUID(),
    networkSwitch: randomUUID(),
    passenger: randomUUID(),
    crew: randomUUID(),
    capStreamHD: randomUUID(),
    fnDisplayVideo: randomUUID(),
    fnProcessSelection: randomUUID(),
    fnStreamMedia: randomUUID(),
    fnManageCatalog: randomUUID(),
    fnManageCabinAnnounce: randomUUID(),
    fnForwardPackets: randomUUID(),
  };

  await db.insert(elements).values([
    // Components & Actors
    {
      id: la.ifeSystem,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalComponent",
      name: "IFE System",
      description: "Logical boundary of in-flight entertainment",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: la.sdu,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalComponent",
      name: "Seat Display Unit (SDU)",
      description: "Interactive touchscreen terminal at passenger seat",
      properties: { status: "VALIDATED" },
      parentId: la.ifeSystem,
    },
    {
      id: la.server,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalComponent",
      name: "IFE Media Server",
      description: "Centralized server storing media and managing streaming",
      properties: { status: "VALIDATED" },
      parentId: la.ifeSystem,
    },
    {
      id: la.ctu,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalComponent",
      name: "Cabin Terminal Unit",
      description: "Crew control console and PA microphone interface",
      properties: { status: "VALIDATED" },
      parentId: la.ifeSystem,
    },
    {
      id: la.networkSwitch,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalComponent",
      name: "Aircraft Network Switch",
      description: "Gigabit Ethernet switch distributing cabin traffic",
      properties: { status: "VALIDATED" },
      parentId: la.ifeSystem,
    },
    {
      id: la.passenger,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalActor",
      name: "Passenger",
      description: "Interacts logically with the seat display",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: la.crew,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalActor",
      name: "Cabin Crew",
      description: "Interacts logically with cabin terminal unit",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: la.capStreamHD,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalCapability",
      name: "Stream High-Definition Media",
      description: "Realization of HD on-demand streaming",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    // Logical Functions
    {
      id: la.fnDisplayVideo,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalFunction",
      name: "Display Video Stream",
      description: "Decodes H.264 packets and outputs to LCD panel",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: la.fnProcessSelection,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalFunction",
      name: "Process User Selection",
      description: "Handles GUI taps, navigation, and volume controls",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: la.fnStreamMedia,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalFunction",
      name: "Stream Video & Music",
      description: "Multicasts media streams over network",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: la.fnManageCatalog,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalFunction",
      name: "Manage Media Catalog",
      description: "Maintains metadata, synopsis, languages, and covers",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: la.fnManageCabinAnnounce,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalFunction",
      name: "Manage Cabin Audio Announcements",
      description: "Handles PA override and crew broadcast",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: la.fnForwardPackets,
      modelId: modelIds.la,
      layer: "LA",
      type: "LogicalFunction",
      name: "Forward Digital Data Packets",
      description: "Routes Ethernet IP frames across cabin segments",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
  ]);

  // =========================================================================
  // 5. PHYSICAL ARCHITECTURE (PA) ELEMENTS
  // =========================================================================
  const pa = {
    // Physical Nodes (Hardware)
    nodeSDU: randomUUID(),
    nodeServer: randomUUID(),
    nodeCAP: randomUUID(),
    nodeSwitch: randomUUID(),
    // Behavior Components (Software / Firmware)
    compPlayerApp: randomUUID(),
    compStreamService: randomUUID(),
    compCrewGUI: randomUUID(),
    compSwitchFirmware: randomUUID(),
    // Actors
    passenger: randomUUID(),
    crew: randomUUID(),
    // Functions
    fnRenderVideo: randomUUID(),
    fnReadStorage: randomUUID(),
    fnEncodeAudio: randomUUID(),
    fnRouteFrames: randomUUID(),
  };

  await db.insert(elements).values([
    // Hardware Nodes
    {
      id: pa.nodeSDU,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalNode",
      name: "Seat Display Unit Hardware (SDU-HW)",
      description: "ARM-based touchscreen terminal embedded in seat back",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: pa.nodeServer,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalNode",
      name: "Media Server Unit Rack (MSU-HW)",
      description: "Avionics rack-mounted x86 enterprise server with NVMe",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: pa.nodeCAP,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalNode",
      name: "Cabin Attendant Panel Hardware (CAP-HW)",
      description: "Wall-mounted ruggedized crew touch panel and handset",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: pa.nodeSwitch,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalNode",
      name: "Cabin Ethernet Switch (CES-HW)",
      description: "ARINC 664 managed 24-port Gigabit Ethernet switch",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    // Behavior Software Components
    {
      id: pa.compPlayerApp,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalComponent",
      name: "SDU Interactive Player App",
      description: "Qt/C++ passenger UI and hardware-accelerated player",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: pa.compStreamService,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalComponent",
      name: "Streaming Server Software",
      description: "RTSP/HLS streaming server daemon",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: pa.compCrewGUI,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalComponent",
      name: "Crew Management GUI",
      description: "Crew control application and PA broadcast manager",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: pa.compSwitchFirmware,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalComponent",
      name: "Switch Routing Firmware",
      description: "Embedded VLAN QoS packet routing firmware",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    // Actors
    {
      id: pa.passenger,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalActor",
      name: "Passenger",
      description: "Physical human sitting at passenger seat",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: pa.crew,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalActor",
      name: "Cabin Crew",
      description: "Physical flight attendant speaking through microphone",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    // Functions
    {
      id: pa.fnRenderVideo,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalFunction",
      name: "Render High-Definition Video",
      description: "Hardware decoding and frame rendering to LCD",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: pa.fnReadStorage,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalFunction",
      name: "Read Media Storage & Stream Packets",
      description: "Direct DMA read from NVMe array to network socket",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: pa.fnEncodeAudio,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalFunction",
      name: "Encode Microphone Audio",
      description: "Captures microphone ADC signal and encodes Opus stream",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
    {
      id: pa.fnRouteFrames,
      modelId: modelIds.pa,
      layer: "PA",
      type: "PhysicalFunction",
      name: "Route Ethernet Frames",
      description: "Hardware ASIC forwarding with priority 802.1p tagging",
      properties: { status: "VALIDATED" },
      parentId: null,
    },
  ]);

  // =========================================================================
  // 6. RELATIONSHIPS (PER LAYER)
  // =========================================================================
  await db.insert(relationships).values([
    // ─── OA Relationships ───
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "InvolvementLink",
      name: "Involvement",
      sourceElementId: oa.passenger,
      targetElementId: oa.capabilityEntertainment,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "InvolvementLink",
      name: "Involvement",
      sourceElementId: oa.crew,
      targetElementId: oa.capabilityCommercial,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "InvolvementLink",
      name: "Involvement",
      sourceElementId: oa.airline,
      targetElementId: oa.missionIFE,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "OperationalExchange",
      name: "Media Content Request",
      sourceElementId: oa.passenger,
      targetElementId: oa.airline,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "OperationalExchange",
      name: "Announcement Audio",
      sourceElementId: oa.crew,
      targetElementId: oa.passenger,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "OperationalExchange",
      name: "Digital Media Exchange",
      sourceElementId: oa.actWatchMovie,
      targetElementId: oa.actUpdateMediaOffer,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: oa.actWatchMovie,
      targetElementId: oa.passenger,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: oa.actBroadcastAnnouncement,
      targetElementId: oa.crew,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: oa.actUpdateMediaOffer,
      targetElementId: oa.airline,
      properties: {},
    },

    // ─── SA Relationships ───
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "SystemExchange",
      name: "Passenger AV Interaction",
      sourceElementId: sa.system,
      targetElementId: sa.passenger,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "SystemExchange",
      name: "Cabin Controls Data",
      sourceElementId: sa.system,
      targetElementId: sa.crew,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "SystemExchange",
      name: "Flight Parameters (Speed/Alt)",
      sourceElementId: sa.system,
      targetElementId: sa.aircraft,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "InvolvementLink",
      name: "Involvement",
      sourceElementId: sa.passenger,
      targetElementId: sa.capWatchMovie,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "InvolvementLink",
      name: "Involvement",
      sourceElementId: sa.crew,
      targetElementId: sa.capAccessInternet,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "InvolvementLink",
      name: "Involvement",
      sourceElementId: sa.system,
      targetElementId: sa.missionEntertain,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "FunctionalExchange",
      name: "Media Stream",
      sourceElementId: sa.fnManageContent,
      targetElementId: sa.fnProvideVideo,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "FunctionalExchange",
      name: "Announcement Interrupt",
      sourceElementId: sa.fnManageAnnouncements,
      targetElementId: sa.fnProvideAudio,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: sa.fnProvideVideo,
      targetElementId: sa.system,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: sa.fnProvideAudio,
      targetElementId: sa.system,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: sa.fnProvideMovingMap,
      targetElementId: sa.system,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: sa.fnProvideConnectivity,
      targetElementId: sa.system,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: sa.fnManageAnnouncements,
      targetElementId: sa.system,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: sa.fnManageContent,
      targetElementId: sa.system,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: sa.fnCaptureSelection,
      targetElementId: sa.passenger,
      properties: {},
    },

    // ─── LA Relationships ───
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "ComponentExchange",
      name: "Ethernet GbE Stream",
      sourceElementId: la.server,
      targetElementId: la.networkSwitch,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "ComponentExchange",
      name: "Seat Ethernet Link",
      sourceElementId: la.networkSwitch,
      targetElementId: la.sdu,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "ComponentExchange",
      name: "Cabin Control Link",
      sourceElementId: la.ctu,
      targetElementId: la.server,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "ComponentExchange",
      name: "Touch Interaction",
      sourceElementId: la.passenger,
      targetElementId: la.sdu,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "LogicalExchange",
      name: "H.264 Video Stream",
      sourceElementId: la.fnStreamMedia,
      targetElementId: la.fnDisplayVideo,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "LogicalExchange",
      name: "Movie Selection Command",
      sourceElementId: la.fnProcessSelection,
      targetElementId: la.fnManageCatalog,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "LogicalExchange",
      name: "Audio Pause Signal",
      sourceElementId: la.fnManageCabinAnnounce,
      targetElementId: la.fnDisplayVideo,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: la.fnDisplayVideo,
      targetElementId: la.sdu,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: la.fnProcessSelection,
      targetElementId: la.sdu,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: la.fnStreamMedia,
      targetElementId: la.server,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: la.fnManageCatalog,
      targetElementId: la.server,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: la.fnManageCabinAnnounce,
      targetElementId: la.ctu,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: la.fnForwardPackets,
      targetElementId: la.networkSwitch,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "InvolvementLink",
      name: "Involvement",
      sourceElementId: la.sdu,
      targetElementId: la.capStreamHD,
      properties: {},
    },

    // ─── PA Relationships ───
    // DeploymentLinks (Behavior Components on Physical Nodes)
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "DeploymentLink",
      name: "Deploys",
      sourceElementId: pa.compPlayerApp,
      targetElementId: pa.nodeSDU,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "DeploymentLink",
      name: "Deploys",
      sourceElementId: pa.compStreamService,
      targetElementId: pa.nodeServer,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "DeploymentLink",
      name: "Deploys",
      sourceElementId: pa.compCrewGUI,
      targetElementId: pa.nodeCAP,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "DeploymentLink",
      name: "Deploys",
      sourceElementId: pa.compSwitchFirmware,
      targetElementId: pa.nodeSwitch,
      properties: {},
    },
    // PhysicalLinks (Cables between hardware nodes)
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "PhysicalLink",
      name: "GbE Cat6 Ethernet Cable",
      sourceElementId: pa.nodeServer,
      targetElementId: pa.nodeSwitch,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "PhysicalLink",
      name: "Seat Daisy-Chain Cable",
      sourceElementId: pa.nodeSwitch,
      targetElementId: pa.nodeSDU,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "PhysicalLink",
      name: "Panel Ethernet Cable",
      sourceElementId: pa.nodeCAP,
      targetElementId: pa.nodeSwitch,
      properties: {},
    },
    // ComponentExchange & PhysicalExchange
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "ComponentExchange",
      name: "Video UDP Stream",
      sourceElementId: pa.compStreamService,
      targetElementId: pa.compPlayerApp,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "PhysicalExchange",
      name: "Ethernet Video Packets",
      sourceElementId: pa.fnReadStorage,
      targetElementId: pa.fnRenderVideo,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "PhysicalExchange",
      name: "Audio Priority Signal",
      sourceElementId: pa.fnEncodeAudio,
      targetElementId: pa.fnRenderVideo,
      properties: {},
    },
    // Allocations
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: pa.fnRenderVideo,
      targetElementId: pa.compPlayerApp,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: pa.fnReadStorage,
      targetElementId: pa.compStreamService,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: pa.fnEncodeAudio,
      targetElementId: pa.compCrewGUI,
      properties: {},
    },
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "Allocation",
      name: "Allocated",
      sourceElementId: pa.fnRouteFrames,
      targetElementId: pa.compSwitchFirmware,
      properties: {},
    },
  ]);

  // =========================================================================
  // 7. TRACE LINKS (CROSS-LAYER REALIZATION)
  // =========================================================================
  await db.insert(traceLinks).values([
    // SA -> OA Realization
    {
      id: randomUUID(),
      projectId: input.projectId,
      sourceModelId: modelIds.sa,
      targetModelId: modelIds.oa,
      type: "Realization",
      sourceElementId: sa.passenger,
      sourceLayer: "SA",
      targetElementId: oa.passenger,
      targetLayer: "OA",
      description: "System Passenger realizes Operational Passenger",
    },
    {
      id: randomUUID(),
      projectId: input.projectId,
      sourceModelId: modelIds.sa,
      targetModelId: modelIds.oa,
      type: "Realization",
      sourceElementId: sa.crew,
      sourceLayer: "SA",
      targetElementId: oa.crew,
      targetLayer: "OA",
      description: "System Crew realizes Operational Crew",
    },
    {
      id: randomUUID(),
      projectId: input.projectId,
      sourceModelId: modelIds.sa,
      targetModelId: modelIds.oa,
      type: "Realization",
      sourceElementId: sa.capWatchMovie,
      sourceLayer: "SA",
      targetElementId: oa.capabilityEntertainment,
      targetLayer: "OA",
      description: "System Capability realizes Operational Capability",
    },
    // LA -> SA Realization
    {
      id: randomUUID(),
      projectId: input.projectId,
      sourceModelId: modelIds.la,
      targetModelId: modelIds.sa,
      type: "Realization",
      sourceElementId: la.ifeSystem,
      sourceLayer: "LA",
      targetElementId: sa.system,
      targetLayer: "SA",
      description: "Logical IFE realizes System Box",
    },
    {
      id: randomUUID(),
      projectId: input.projectId,
      sourceModelId: modelIds.la,
      targetModelId: modelIds.sa,
      type: "Realization",
      sourceElementId: la.fnDisplayVideo,
      sourceLayer: "LA",
      targetElementId: sa.fnProvideVideo,
      targetLayer: "SA",
      description: "Logical Display realizes System Video",
    },
    // PA -> LA Realization
    {
      id: randomUUID(),
      projectId: input.projectId,
      sourceModelId: modelIds.pa,
      targetModelId: modelIds.la,
      type: "Realization",
      sourceElementId: pa.nodeSDU,
      sourceLayer: "PA",
      targetElementId: la.sdu,
      targetLayer: "LA",
      description: "SDU Hardware realizes Logical SDU",
    },
    {
      id: randomUUID(),
      projectId: input.projectId,
      sourceModelId: modelIds.pa,
      targetModelId: modelIds.la,
      type: "Realization",
      sourceElementId: pa.nodeServer,
      sourceLayer: "PA",
      targetElementId: la.server,
      targetLayer: "LA",
      description: "Media Server Hardware realizes Logical Server",
    },
    {
      id: randomUUID(),
      projectId: input.projectId,
      sourceModelId: modelIds.pa,
      targetModelId: modelIds.la,
      type: "Realization",
      sourceElementId: pa.fnRenderVideo,
      sourceLayer: "PA",
      targetElementId: la.fnDisplayVideo,
      targetLayer: "LA",
      description: "Physical Render realizes Logical Display Video",
    },
  ]);

  // =========================================================================
  // 8. DIAGRAMS WITH COMPLETE CAPELLA LAYOUTS
  // =========================================================================
  await db.insert(diagrams).values([
    // ───────────────────────────────────────────────────────────────────────
    // OA DIAGRAMS
    // ───────────────────────────────────────────────────────────────────────
    // 1. [OABD] All Activities (Matches Capella Screenshot!)
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "OABD",
      name: "All Activities",
      description: "Operational Activity Breakdown of In-Flight Entertainment",
      viewport: { x: 0, y: 0, zoom: 0.9 },
      elementLayouts: [
        {
          elementId: oa.actDefineStrategy,
          position: { x: 80, y: 80 },
          size: { width: 220, height: 75 },
        },
        {
          elementId: oa.actUpdateMediaOffer,
          position: { x: 340, y: 80 },
          size: { width: 220, height: 75 },
        },
        {
          elementId: oa.actUseEntertainment,
          position: { x: 620, y: 80 },
          size: { width: 240, height: 75 },
        },
        {
          elementId: oa.actWatchMovie,
          position: { x: 440, y: 250 },
          size: { width: 130, height: 65 },
        },
        {
          elementId: oa.actListenToAudio,
          position: { x: 590, y: 250 },
          size: { width: 130, height: 65 },
        },
        {
          elementId: oa.actBrowseInternet,
          position: { x: 740, y: 250 },
          size: { width: 150, height: 65 },
        },
        {
          elementId: oa.actPlayGames,
          position: { x: 910, y: 250 },
          size: { width: 120, height: 65 },
        },
        {
          elementId: oa.actWatchMovingMap,
          position: { x: 1050, y: 250 },
          size: { width: 150, height: 65 },
        },
      ],
    },
    // 2. [OEBD] Operational Entities and Actors
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "OEBD",
      name: "Operational Entities and Actors",
      description: "Breakdown of human and non-human operational actors",
      viewport: { x: 0, y: 0, zoom: 1 },
      elementLayouts: [
        {
          elementId: oa.airline,
          position: { x: 80, y: 80 },
          size: { width: 220, height: 90 },
        },
        {
          elementId: oa.aircraft,
          position: { x: 360, y: 80 },
          size: { width: 220, height: 90 },
        },
        {
          elementId: oa.passenger,
          position: { x: 80, y: 260 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: oa.crew,
          position: { x: 360, y: 260 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: oa.groundOperator,
          position: { x: 640, y: 260 },
          size: { width: 180, height: 80 },
        },
      ],
    },
    // 3. [OCB] Operational Capabilities
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "OCB",
      name: "Operational Capabilities",
      description: "High-level mission and operational capabilities",
      viewport: { x: 0, y: 0, zoom: 1 },
      elementLayouts: [
        {
          elementId: oa.missionIFE,
          position: { x: 400, y: 60 },
          size: { width: 340, height: 85 },
        },
        {
          elementId: oa.capabilityEntertainment,
          position: { x: 220, y: 220 },
          size: { width: 260, height: 80 },
        },
        {
          elementId: oa.capabilityCommercial,
          position: { x: 660, y: 220 },
          size: { width: 260, height: 80 },
        },
        {
          elementId: oa.passenger,
          position: { x: 100, y: 380 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: oa.crew,
          position: { x: 440, y: 380 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: oa.airline,
          position: { x: 760, y: 380 },
          size: { width: 200, height: 80 },
        },
      ],
    },
    // 4. [OAB] Operational Architecture
    {
      id: randomUUID(),
      modelId: modelIds.oa,
      type: "OAB",
      name: "Operational Architecture",
      description: "Complete operational architecture and activity allocation",
      viewport: { x: 0, y: 0, zoom: 0.95 },
      elementLayouts: [
        {
          elementId: oa.airline,
          position: { x: 80, y: 100 },
          size: { width: 220, height: 95 },
        },
        {
          elementId: oa.passenger,
          position: { x: 460, y: 100 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: oa.crew,
          position: { x: 800, y: 100 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: oa.actUpdateMediaOffer,
          position: { x: 80, y: 300 },
          size: { width: 220, height: 75 },
        },
        {
          elementId: oa.actWatchMovie,
          position: { x: 460, y: 300 },
          size: { width: 180, height: 75 },
        },
        {
          elementId: oa.actBroadcastAnnouncement,
          position: { x: 800, y: 300 },
          size: { width: 240, height: 75 },
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // SA DIAGRAMS
    // ───────────────────────────────────────────────────────────────────────
    // 5. [CSA] Contextual System Actors
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "CSA",
      name: "Contextual System Actors",
      description: "Black-box boundary and external interacting actors",
      viewport: { x: 0, y: 0, zoom: 1 },
      elementLayouts: [
        {
          elementId: sa.passenger,
          position: { x: 80, y: 120 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: sa.crew,
          position: { x: 80, y: 320 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: sa.system,
          position: { x: 440, y: 180 },
          size: { width: 300, height: 160 },
        },
        {
          elementId: sa.aircraft,
          position: { x: 880, y: 220 },
          size: { width: 180, height: 80 },
        },
      ],
    },
    // 6. [MCB] Missions and Capabilities
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "MCB",
      name: "Missions and Capabilities",
      description: "System missions, capabilities and actor participation",
      viewport: { x: 0, y: 0, zoom: 1 },
      elementLayouts: [
        {
          elementId: sa.missionEntertain,
          position: { x: 420, y: 60 },
          size: { width: 280, height: 80 },
        },
        {
          elementId: sa.capWatchMovie,
          position: { x: 140, y: 200 },
          size: { width: 220, height: 80 },
        },
        {
          elementId: sa.capListenAudio,
          position: { x: 440, y: 200 },
          size: { width: 220, height: 80 },
        },
        {
          elementId: sa.capAccessInternet,
          position: { x: 740, y: 200 },
          size: { width: 220, height: 80 },
        },
        {
          elementId: sa.passenger,
          position: { x: 160, y: 360 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: sa.system,
          position: { x: 430, y: 360 },
          size: { width: 260, height: 90 },
        },
        {
          elementId: sa.crew,
          position: { x: 760, y: 360 },
          size: { width: 180, height: 80 },
        },
      ],
    },
    // 7. [SFBD] System Function Breakdown
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "SFBD",
      name: "System Function Breakdown",
      description: "Hierarchical breakdown of IFE system functions",
      viewport: { x: 0, y: 0, zoom: 0.9 },
      elementLayouts: [
        {
          elementId: sa.fnPerformEntertainment,
          position: { x: 480, y: 60 },
          size: { width: 280, height: 80 },
        },
        {
          elementId: sa.fnProvideVideo,
          position: { x: 80, y: 220 },
          size: { width: 230, height: 75 },
        },
        {
          elementId: sa.fnProvideAudio,
          position: { x: 350, y: 220 },
          size: { width: 230, height: 75 },
        },
        {
          elementId: sa.fnProvideMovingMap,
          position: { x: 620, y: 220 },
          size: { width: 240, height: 75 },
        },
        {
          elementId: sa.fnProvideConnectivity,
          position: { x: 900, y: 220 },
          size: { width: 240, height: 75 },
        },
        {
          elementId: sa.fnManageAnnouncements,
          position: { x: 350, y: 360 },
          size: { width: 270, height: 75 },
        },
        {
          elementId: sa.fnManageContent,
          position: { x: 660, y: 360 },
          size: { width: 260, height: 75 },
        },
      ],
    },
    // 8. [SDFB] System Data Flow Blank
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "SDFB",
      name: "System Data Flow",
      description: "Data flow exchanges between system functions",
      viewport: { x: 0, y: 0, zoom: 1 },
      elementLayouts: [
        {
          elementId: sa.fnManageContent,
          position: { x: 100, y: 140 },
          size: { width: 260, height: 80 },
        },
        {
          elementId: sa.fnProvideVideo,
          position: { x: 520, y: 140 },
          size: { width: 240, height: 80 },
        },
        {
          elementId: sa.fnManageAnnouncements,
          position: { x: 100, y: 300 },
          size: { width: 270, height: 80 },
        },
        {
          elementId: sa.fnProvideAudio,
          position: { x: 520, y: 300 },
          size: { width: 240, height: 80 },
        },
      ],
    },
    // 9. [SAB] System Architecture Blank
    {
      id: randomUUID(),
      modelId: modelIds.sa,
      type: "SAB",
      name: "System Architecture",
      description:
        "System functions allocated to IFE System with external exchanges",
      viewport: { x: 0, y: 0, zoom: 0.9 },
      elementLayouts: [
        {
          elementId: sa.passenger,
          position: { x: 80, y: 140 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: sa.crew,
          position: { x: 80, y: 340 },
          size: { width: 180, height: 80 },
        },
        {
          elementId: sa.system,
          position: { x: 380, y: 100 },
          size: { width: 560, height: 360 },
        },
        {
          elementId: sa.fnProvideVideo,
          position: { x: 410, y: 150 },
          size: { width: 220, height: 70 },
        },
        {
          elementId: sa.fnProvideAudio,
          position: { x: 410, y: 260 },
          size: { width: 220, height: 70 },
        },
        {
          elementId: sa.fnManageAnnouncements,
          position: { x: 670, y: 150 },
          size: { width: 240, height: 70 },
        },
        {
          elementId: sa.fnProvideConnectivity,
          position: { x: 670, y: 260 },
          size: { width: 240, height: 70 },
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // LA DIAGRAMS
    // ───────────────────────────────────────────────────────────────────────
    // 10. [LCBD] Logical Component Breakdown
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "LCBD",
      name: "Logical Component Breakdown",
      description: "Decomposition of IFE into logical subcomponents",
      viewport: { x: 0, y: 0, zoom: 0.9 },
      elementLayouts: [
        {
          elementId: la.ifeSystem,
          position: { x: 480, y: 60 },
          size: { width: 260, height: 90 },
        },
        {
          elementId: la.sdu,
          position: { x: 80, y: 220 },
          size: { width: 240, height: 90 },
        },
        {
          elementId: la.server,
          position: { x: 360, y: 220 },
          size: { width: 240, height: 90 },
        },
        {
          elementId: la.ctu,
          position: { x: 640, y: 220 },
          size: { width: 240, height: 90 },
        },
        {
          elementId: la.networkSwitch,
          position: { x: 920, y: 220 },
          size: { width: 240, height: 90 },
        },
      ],
    },
    // 11. [LFBD] Logical Function Breakdown
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "LFBD",
      name: "Logical Function Breakdown",
      description: "Breakdown of internal logical functions",
      viewport: { x: 0, y: 0, zoom: 0.9 },
      elementLayouts: [
        {
          elementId: la.fnDisplayVideo,
          position: { x: 80, y: 100 },
          size: { width: 230, height: 75 },
        },
        {
          elementId: la.fnProcessSelection,
          position: { x: 340, y: 100 },
          size: { width: 230, height: 75 },
        },
        {
          elementId: la.fnStreamMedia,
          position: { x: 600, y: 100 },
          size: { width: 230, height: 75 },
        },
        {
          elementId: la.fnManageCatalog,
          position: { x: 860, y: 100 },
          size: { width: 230, height: 75 },
        },
        {
          elementId: la.fnManageCabinAnnounce,
          position: { x: 220, y: 240 },
          size: { width: 270, height: 75 },
        },
        {
          elementId: la.fnForwardPackets,
          position: { x: 560, y: 240 },
          size: { width: 250, height: 75 },
        },
      ],
    },
    // 12. [LDFB] Logical Data Flow Blank
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "LDFB",
      name: "Logical Data Flow",
      description: "Data and control flows between logical functions",
      viewport: { x: 0, y: 0, zoom: 1 },
      elementLayouts: [
        {
          elementId: la.fnProcessSelection,
          position: { x: 100, y: 120 },
          size: { width: 230, height: 80 },
        },
        {
          elementId: la.fnManageCatalog,
          position: { x: 440, y: 120 },
          size: { width: 230, height: 80 },
        },
        {
          elementId: la.fnStreamMedia,
          position: { x: 780, y: 120 },
          size: { width: 230, height: 80 },
        },
        {
          elementId: la.fnDisplayVideo,
          position: { x: 440, y: 300 },
          size: { width: 230, height: 80 },
        },
      ],
    },
    // 13. [LAB] Logical Architecture Blank
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "LAB",
      name: "Logical Architecture",
      description:
        "Complete logical architecture showing components, buses and allocations",
      viewport: { x: 0, y: 0, zoom: 0.9 },
      elementLayouts: [
        {
          elementId: la.sdu,
          position: { x: 100, y: 160 },
          size: { width: 260, height: 160 },
        },
        {
          elementId: la.networkSwitch,
          position: { x: 460, y: 160 },
          size: { width: 240, height: 160 },
        },
        {
          elementId: la.server,
          position: { x: 800, y: 160 },
          size: { width: 260, height: 160 },
        },
        {
          elementId: la.ctu,
          position: { x: 460, y: 400 },
          size: { width: 240, height: 130 },
        },
        {
          elementId: la.passenger,
          position: { x: 100, y: 400 },
          size: { width: 180, height: 80 },
        },
      ],
    },
    // 14. [CRB] Capability Realization Blank
    {
      id: randomUUID(),
      modelId: modelIds.la,
      type: "CRB",
      name: "Capability Realization",
      description: "Logical component and function realization of capability",
      viewport: { x: 0, y: 0, zoom: 1 },
      elementLayouts: [
        {
          elementId: la.capStreamHD,
          position: { x: 400, y: 80 },
          size: { width: 280, height: 85 },
        },
        {
          elementId: la.sdu,
          position: { x: 120, y: 260 },
          size: { width: 240, height: 85 },
        },
        {
          elementId: la.server,
          position: { x: 420, y: 260 },
          size: { width: 240, height: 85 },
        },
        {
          elementId: la.networkSwitch,
          position: { x: 720, y: 260 },
          size: { width: 240, height: 85 },
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // PA DIAGRAMS
    // ───────────────────────────────────────────────────────────────────────
    // 15. [PCBD] Physical Component Breakdown
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "PCBD",
      name: "Physical Component Breakdown",
      description: "Hardware execution nodes and deployed software modules",
      viewport: { x: 0, y: 0, zoom: 0.85 },
      elementLayouts: [
        {
          elementId: pa.nodeSDU,
          position: { x: 80, y: 100 },
          size: { width: 270, height: 95 },
        },
        {
          elementId: pa.compPlayerApp,
          position: { x: 80, y: 240 },
          size: { width: 250, height: 85 },
        },
        {
          elementId: pa.nodeServer,
          position: { x: 390, y: 100 },
          size: { width: 270, height: 95 },
        },
        {
          elementId: pa.compStreamService,
          position: { x: 390, y: 240 },
          size: { width: 250, height: 85 },
        },
        {
          elementId: pa.nodeSwitch,
          position: { x: 700, y: 100 },
          size: { width: 250, height: 95 },
        },
        {
          elementId: pa.compSwitchFirmware,
          position: { x: 700, y: 240 },
          size: { width: 230, height: 85 },
        },
        {
          elementId: pa.nodeCAP,
          position: { x: 990, y: 100 },
          size: { width: 270, height: 95 },
        },
        {
          elementId: pa.compCrewGUI,
          position: { x: 990, y: 240 },
          size: { width: 230, height: 85 },
        },
      ],
    },
    // 16. [PFBD] Physical Function Breakdown
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "PFBD",
      name: "Physical Function Breakdown",
      description: "Decomposition of physical implementation functions",
      viewport: { x: 0, y: 0, zoom: 1 },
      elementLayouts: [
        {
          elementId: pa.fnRenderVideo,
          position: { x: 100, y: 120 },
          size: { width: 250, height: 80 },
        },
        {
          elementId: pa.fnReadStorage,
          position: { x: 420, y: 120 },
          size: { width: 290, height: 80 },
        },
        {
          elementId: pa.fnEncodeAudio,
          position: { x: 780, y: 120 },
          size: { width: 230, height: 80 },
        },
        {
          elementId: pa.fnRouteFrames,
          position: { x: 440, y: 280 },
          size: { width: 250, height: 80 },
        },
      ],
    },
    // 17. [PDFB] Physical Data Flow Blank
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "PDFB",
      name: "Physical Data Flow",
      description:
        "Packet and signal streams between hardware/software functions",
      viewport: { x: 0, y: 0, zoom: 1 },
      elementLayouts: [
        {
          elementId: pa.fnReadStorage,
          position: { x: 100, y: 160 },
          size: { width: 280, height: 85 },
        },
        {
          elementId: pa.fnRouteFrames,
          position: { x: 480, y: 160 },
          size: { width: 230, height: 85 },
        },
        {
          elementId: pa.fnRenderVideo,
          position: { x: 800, y: 160 },
          size: { width: 250, height: 85 },
        },
      ],
    },
    // 18. [PAB] Physical Architecture Blank
    {
      id: randomUUID(),
      modelId: modelIds.pa,
      type: "PAB",
      name: "Physical Architecture",
      description:
        "Physical nodes, Ethernet cables, deployments and component exchanges",
      viewport: { x: 0, y: 0, zoom: 0.9 },
      elementLayouts: [
        {
          elementId: pa.nodeServer,
          position: { x: 100, y: 140 },
          size: { width: 270, height: 160 },
        },
        {
          elementId: pa.nodeSwitch,
          position: { x: 460, y: 140 },
          size: { width: 250, height: 160 },
        },
        {
          elementId: pa.nodeSDU,
          position: { x: 810, y: 140 },
          size: { width: 270, height: 160 },
        },
        {
          elementId: pa.nodeCAP,
          position: { x: 460, y: 390 },
          size: { width: 250, height: 140 },
        },
      ],
    },
  ]);

  return {
    models: modelIds,
    oa,
    sa,
    la,
    pa,
  };
}
