/**
 * Bastion facilities of the books listed by dnd2024.wikidot beyond the Dungeon Master's Guide (Forgotten Realms,
 * Eberron, Ravenloft, Arcana Unleashed), in the Items compendium: their special facility subtypes are added to dnd5e's
 * list so that facility sheets and the Compendium Browser name them.
 */
export const OWIDYN_FACILITY_SUBTYPES = {
  amethystDragonDen: "Amethyst Dragon Den",
  cultOfTheDragonArchive: "Cult of the Dragon Archive",
  emeraldEnclaveGrove: "Emerald Enclave Grove",
  harperHideout: "Harper Hideout",
  lordsAllianceNobleResidence: "Lords’ Alliance Noble Residence",
  orderOfTheGauntletTournamentField: "Order of the Gauntlet Tournament Field",
  redWizardNecropolis: "Red Wizard Necropolis",
  zhentarimTravelStation: "Zhentarim Travel Station",
  artificersForge: "Artificer’s Forge",
  constructForge: "Construct Forge",
  dragonmarkOutpost: "Dragonmark Outpost",
  inquisitivesAgency: "Inquisitive’s Agency",
  kundarakVault: "Kundarak Vault",
  lyrandarHelm: "Lyrandar Helm",
  manifestZone: "Manifest Zone",
  museum: "Museum",
  navigatorsHelm: "Navigator’s Helm",
  orienHelm: "Orien Helm",
  ancientAltar: "Ancient Altar",
  cabinetOfCuriosities: "Cabinet of Curiosities",
  infirmary: "Infirmary",
  lightningGenerator: "Lightning Generator",
  liminalSpace: "Liminal Space",
  rookery: "Rookery",
  seanceParlor: "Séance Parlor",
  spiritVault: "Spirit Vault",
  circusTent: "Circus Tent",
  entertainmentSalon: "Entertainment Salon",
  geothermalVent: "Geothermal Vent",
  heistPlanningChamber: "Heist Planning Chamber",
  lighthouse: "Lighthouse",
  morgue: "Morgue",
  planarGateway: "Planar Gateway",
  soupKitchen: "Soup Kitchen",
  transmutationVat: "Transmutation Vat"
};

Hooks.once("init", () => {
  const subtypes = CONFIG.DND5E?.facilities?.types?.special?.subtypes;
  if (subtypes) for (const [key, label] of Object.entries(OWIDYN_FACILITY_SUBTYPES)) subtypes[key] ??= label;
});
