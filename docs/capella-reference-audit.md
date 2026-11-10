# Capella reference audit: In-Flight Entertainment System

Reference files: `E:\Software\Capella\samples\In-Flight Entertainment System-1\In-Flight Entertainment System.capella` and `.aird` (Capella 7.1.0 sample). This inventory is for implementing editable model behavior; it is not application data or a static viewer.

## Representations in the sample

The `.aird` file contains 119 representation descriptors: OA 12, SA 35, LA 32, PA 39, and EPBS 1. The four requested layers therefore contain **118 distinct views**. Their prefixes and counts are:

| Layer | Representation prefixes (count) |
| --- | --- |
| OA | OAIB 3, OAB 2, OPD 2, OES 1, OEBD 1, OABD 1, OCB 1, MSM 1 |
| SA | SDFB 9, SFCD 5, ES 3, FS 3, SAB 3, MSM 2, SFBD 2, CM 2, CC 2, CDB 1, SC 1, MCB 1, one without a prefix |
| LA | LDFB 10, LAB 6, LFCD 5, FS 3, ES 3, MSM 2, CDB 1, LCBD 1, LFBD 1 |
| PA | PDFB 12, PFCD 9, PAB 9, PCBD 2, PPD 2, CDB 1, CDI 1, PFBD 1, two without a prefix |

The existing `seedIFEProject` creates 18 editable architecture diagrams and only an approximate subset of the sample elements and links. It must not be presented as an exact import of the 118 views. The seed deletes the project's current model content before inserting its data, so it must not be run on a user's working project.

### OEBD versus OAB: Aircraft and Cabin Crew

In the `.capella` model, `Crew` is an operational entity and `Cabin Crew` is an operational actor contained by `Crew`. `Aircraft` is a separate operational entity. The `.aird` representation `[OEBD] Operational Entities and Actors` references neither of the two `CommunicationMean` objects. `[OAB] All Operational Activities and Entities` references both. Those means connect `Crew` → `Aircraft` and `Ground Operator` → `Aircraft`; the sample does not define a direct `Cabin Crew` → `Aircraft` communication mean. Capella's model rules allow an entity/actor communication mean in OAB, so a user may create such a new link there. In OEBD, Capella draws hierarchy connectors from `Cabin Crew` and `Pilot` toward their parent `Crew`. They represent containment in the model, not a `CommunicationMean`. The frontend now draws these connectors and maps a child-to-parent handle gesture to a parent change, after confirmation.

`[OABD] All Activities` likewise visualizes the activity hierarchy. In the sample, `Watch Movie`, `Listen to Audio`, `Browse the Internet`, `Play Games`, and `Watch Moving Map` are children of `Use Entertainment Services`. A new `Operational Activity 1` becomes another child by setting its parent to `Use Entertainment Services`; an `OAIB` diagram is the place to model a `FunctionalExchange` between activities. This distinction is also described in the [Capella OABD/OAIB discussion](https://forum.mbse-capella.org/t/oabd-and-oaib-interaction-issues/4896).

Capella stores operational entities and actors as the same `oa:Entity` metaclass, distinguished by its `actor` attribute. The sample has `Ground Operator` with `actor=true` as the source of a communication mean. A blanket rule forbidding all actor-to-actor links is therefore not a sound model rule; the editor now decides by the relation type and active diagram. OA actor-to-actor communication means are available in OAB; component exchanges between actors use the corresponding architecture diagram and layer rule. Composition/generalization remains disallowed for these actors.

An existing communication mean may also be projected into an OCB view (as described in the [Capella forum](https://forum.mbse-capella.org/t/the-delete-from-diagram-command-about-the-communicationmean-between-the-ocb-and-oab-diagrams/7040)). The frontend now distinguishes relationships creatable in a diagram from relationships visible there: OCB can show a communication mean created in OAB without offering OCB as a creation surface for it.

## Semantic relationships found in `.capella`

| Relationship | Instances | Endpoints in the sample | Current editor status |
| --- | ---: | --- | --- |
| FunctionalExchange | 272 | 23 activity→activity; 249 FunctionOutputPort→FunctionInputPort | Direct function/activity links are editable; direction-specific ports still need first-class support. |
| ComponentExchange | 23 | ComponentPort→ComponentPort | Direct component links are editable; component ports still need first-class support. |
| CommunicationMean | 2 | Entity (`Crew`)→Entity (`Aircraft`) and Actor (`Ground Operator`)→Entity (`Aircraft`) | Editable type and OA rule added. |
| PhysicalLink | 21 | physical ports/links | Editable physical-node link is simplified. |
| PartDeploymentLink | 22 | part deployment | Editable deployment link is simplified. |

The sample also contains functional chain descriptions, mode/state-machine diagrams, physical path descriptions, multiple scenario kinds, and class diagrams. These are separate semantic editors and must be implemented or adapted before claiming full Capella parity. An architecture canvas that merely displays their labels would not meet the requirement.

Additional `.capella` semantic counts that are still **not** represented as first-class editable relations in the current frontend include: 179 `ComponentFunctionalAllocation`, 143 `FunctionRealization`, 142 `FunctionalExchangeRealization`, 69 `PortAllocation`, 65 `AbstractFunctionAbstractCapabilityInvolvement`, 58 `CapabilityRealizationInvolvement`, 33 `CapabilityInvolvement`, 33 `ComponentRealization`, 31 `FunctionalChainAbstractCapabilityInvolvement`, 26 `ComponentExchangeFunctionalExchangeAllocation`, 23 `CapabilityRealization`, 15 `MissionInvolvement`, 12 `SequenceLink`, and 7 `ScenarioRealization`. These are not interchangeable with generic canvas edges. The current editable `Allocation`, `InvolvementLink`, and `Realization` are simplifications of several of these Capella concepts, so full relationship parity remains open.
