/**
 * Boutiques — interface.
 * The Boutiques tab of the sidebar (after the Journal) lists the shops, with a button for the GM that opens the
 * generator: template, name, description, number of goods, price setting, goods allowed and compendiums. The template
 * only pre-fills the goods allowed: a tree of groups and kinds, plus the rarities, where a group's box checks all its
 * kinds. A shop opens in a window of lines (good, number on sale, price, Acheter); the GM changes the prices and numbers
 * there, removes lines, adds services or drops items and creatures in, draws a new stock, renames the shop and shows it
 * to the players.
 */
import { SHOPS, PERCENTS, GOODS, SHOP_RARITIES, ITEM_KINDS } from './catalogue.mjs';
import {
  MODULE_ID, listShops, getShop, updateShop, deleteShop, generateShop, restock, addService, addDocument, buy, buyersOf,
  itemPacks, categoryLabel, rarityLabel, formatPrice, showGood
} from './boutiques.mjs';

const { HandlebarsApplicationMixin, ApplicationV2, DialogV2 } = foundry.applications.api;
const TEMPLATES = `modules/${MODULE_ID}/templates/boutiques`;
const TAB = 'boutiques';
const windows = new Set();
const escape = value => foundry.utils.escapeHTML(String(value ?? ''));

/* -------------------------------------------- */
/*  Sidebar tab                                 */
/* -------------------------------------------- */

class ShopDirectory extends HandlebarsApplicationMixin(foundry.applications.sidebar.AbstractSidebarTab) {
  static tabName = TAB;

  static DEFAULT_OPTIONS = {
    classes: ['directory', 'owidyn-shops'],
    window: { title: 'Boutiques' },
    actions: {
      create: ShopDirectory.#onCreate,
      open: ShopDirectory.#onOpen,
      toggleVisible: ShopDirectory.#onToggleVisible,
      delete: ShopDirectory.#onDelete
    }
  };

  static PARTS = { directory: { template: `${TEMPLATES}/directory.hbs`, root: true } };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return Object.assign(context, {
      isGM: game.user.isGM,
      shops: listShops().map(shop => ({
        id: shop.id, name: shop.name, visible: shop.visible, icon: SHOPS[shop.template]?.icon ?? 'fa-solid fa-store',
        template: SHOPS[shop.template]?.label ?? '', count: shop.lines.length
      }))
    });
  }

  static #onCreate() { new ShopGenerator().render({ force: true }); }
  static #onOpen(event, target) { openShop(target.closest('[data-shop-id]').dataset.shopId); }
  static #onToggleVisible(event, target) { toggleVisible(target.closest('[data-shop-id]').dataset.shopId); }
  static #onDelete(event, target) { confirmDelete(target.closest('[data-shop-id]').dataset.shopId); }
}

async function toggleVisible(id) {
  const shop = await updateShop(id, current => { current.visible = !current.visible; });
  if (shop) ui.notifications.info(`${shop.name} : ${shop.visible ? 'visible des joueurs' : 'cachée aux joueurs'}.`);
}

async function confirmDelete(id) {
  const shop = getShop(id);
  if (!shop) return;
  const ok = await DialogV2.confirm({ window: { title: 'Supprimer la boutique' }, content: `<p>Supprimer <strong>${escape(shop.name)}</strong> et son stock ?</p>` });
  if (!ok) return;
  for (const app of windows) if (app.shopId === id) app.close();
  await deleteShop(id);
}

/* -------------------------------------------- */
/*  Generator                                   */
/* -------------------------------------------- */

/** A group of checkboxes of the generator: its kinds, and whether all or some of them are checked. */
function checkGroup(key, label, field, choices, chosen) {
  const children = choices.map(choice => ({ ...choice, checked: chosen.has(choice.key) }));
  const count = children.filter(child => child.checked).length;
  return { key, label, field, children, checked: count === children.length, partial: (count > 0) && (count < children.length) };
}

class ShopGenerator extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.values = { template: 'equipement', name: '', description: '', count: 10, percent: 100, kinds: null, rarities: null, packs: null };
  }

  static DEFAULT_OPTIONS = {
    id: 'owidyn-shop-generator',
    tag: 'form',
    classes: ['owidyn-shop-generator'],
    window: { title: 'Nouvelle boutique', icon: 'fa-solid fa-store', resizable: true },
    position: { width: 600, height: 'auto' },
    form: { handler: ShopGenerator.#onSubmit, closeOnSubmit: false },
    actions: { allPacks: ShopGenerator.#onAllPacks, noPacks: ShopGenerator.#onNoPacks }
  };

  static PARTS = {
    form: { template: `${TEMPLATES}/generator.hbs`, scrollable: [''] },
    footer: { template: 'templates/generic/form-footer.hbs' }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const state = this.values;
    const def = SHOPS[state.template];
    const kinds = new Set(state.kinds ?? def.kinds);
    const rarities = new Set(state.rarities ?? def.rarities);
    const packs = itemPacks();
    const chosenPacks = new Set(state.packs ?? packs.map(pack => pack.collection));
    return Object.assign(context, {
      ...state,
      templates: Object.entries(SHOPS).map(([key, shop]) => ({ key, label: shop.label, selected: key === state.template })),
      groups: [
        ...GOODS.map(group => checkGroup(group.key, group.label, 'kinds', group.kinds.map(([key, label]) => ({ key, label })), kinds)),
        checkGroup('rarity', 'Rareté des objets', 'rarities', SHOP_RARITIES.map(key => ({ key, label: rarityLabel(key) })), rarities)
      ],
      packs: packs.map(pack => ({ ...pack, checked: chosenPacks.has(pack.collection) }))
        .sort((a, b) => a.packageTitle.localeCompare(b.packageTitle) || a.label.localeCompare(b.label)),
      percents: PERCENTS.map(value => ({ value, label: `${value} %`, selected: value === Number(state.percent) })),
      buttons: [{ type: 'submit', icon: 'fa-solid fa-dice', label: 'Générer la boutique' }]
    });
  }

  /** The form as it is now, kept when another template pre-fills the goods allowed. */
  #read() {
    const form = this.element;
    const checked = name => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
    return {
      template: form.elements.template.value, name: form.elements.name.value, description: form.elements.description.value,
      count: Math.max(1, Number(form.elements.count?.value) || 10), percent: Number(form.elements.percent.value) || 100,
      kinds: checked('kinds'), rarities: checked('rarities'), packs: checked('packs')
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const form = this.element;
    form.elements.template.addEventListener('change', () => {
      this.values = { ...this.#read(), kinds: null, rarities: null };
      this.render();
    });
    // A group's box checks or unchecks all its kinds, and shows whether all, some or none of them are checked
    const tree = form.querySelector('.owidyn-goods-tree');
    const childrenOf = group => [...tree.querySelectorAll(`input[data-parent="${group.dataset.group}"]`)];
    const sync = group => {
      const count = childrenOf(group).filter(input => input.checked).length;
      group.checked = count === childrenOf(group).length;
      group.indeterminate = (count > 0) && !group.checked;
    };
    for (const group of tree.querySelectorAll('input[data-group]')) sync(group);
    tree.addEventListener('change', event => {
      const input = event.target;
      if (input.dataset.group) {
        for (const child of childrenOf(input)) child.checked = input.checked;
        input.indeterminate = false;
      } else if (input.dataset.parent) sync(tree.querySelector(`input[data-group="${input.dataset.parent}"]`));
    });
  }

  static #onAllPacks() { for (const input of this.element.querySelectorAll('input[name="packs"]')) input.checked = true; }
  static #onNoPacks() { for (const input of this.element.querySelectorAll('input[name="packs"]')) input.checked = false; }

  static async #onSubmit() {
    const values = this.#read();
    const items = values.kinds.some(kind => ITEM_KINDS.has(kind));
    if (!values.kinds.length) return ui.notifications.warn('Autorisez au moins une sorte d\'articles.');
    if (items && !values.rarities.length) return ui.notifications.warn('Autorisez au moins une rareté (« Non magique » pour les objets ordinaires).');
    if (items && !values.packs.length) return ui.notifications.warn('Choisissez au moins un compendium.');
    // The form stays open when nothing could be drawn, to change its settings
    const shop = await generateShop(values);
    if (!shop?.id) return;
    await this.close();
    openShop(shop.id);
  }
}

/* -------------------------------------------- */
/*  Shop window                                 */
/* -------------------------------------------- */

class ShopWindow extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(shopId, options = {}) {
    super({ id: `owidyn-shop-${shopId}`, ...options });
    this.shopId = shopId;
    const buyers = buyersOf();
    this.buyerId = (buyers.find(actor => actor.id === game.user.character?.id) ?? buyers[0])?.id ?? null;
    windows.add(this);
  }

  static DEFAULT_OPTIONS = {
    classes: ['owidyn-shop'],
    window: { icon: 'fa-solid fa-store', resizable: true },
    position: { width: 680, height: 'auto' },
    actions: {
      buy: ShopWindow.#onBuy,
      show: ShopWindow.#onShow,
      remove: ShopWindow.#onRemove,
      addService: ShopWindow.#onAddService,
      restock: ShopWindow.#onRestock,
      edit: ShopWindow.#onEdit,
      toggleVisible: ShopWindow.#onToggleVisible
    }
  };

  static PARTS = { shop: { template: `${TEMPLATES}/shop.hbs`, scrollable: ['.owidyn-shop-lines'] } };

  get title() { return getShop(this.shopId)?.name ?? 'Boutique'; }

  async close(options) {
    windows.delete(this);
    return super.close(options);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const shop = getShop(this.shopId);
    if (!shop) return Object.assign(context, { missing: true });
    const isGM = game.user.isGM;
    const buyers = buyersOf();
    const denominations = Object.entries(CONFIG.DND5E.currencies).map(([key, coin]) => ({ key, label: game.i18n.localize(coin.abbreviation) }));
    return Object.assign(context, {
      isGM, shop,
      template: SHOPS[shop.template]?.label ?? '',
      description: shop.description ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(shop.description.replace(/\n/g, '<br>')) : '',
      buyers: buyers.map(actor => ({ id: actor.id, name: actor.name, selected: actor.id === this.buyerId })),
      lines: shop.lines.map(line => ({
        ...line,
        category: line.category ? categoryLabel(line.category, line.rarity) : '',
        priceLabel: formatPrice(line.price),
        unlimited: line.quantity === null,
        soldOut: line.quantity === 0,
        canShow: Boolean(line.uuid),
        denominations: denominations.map(coin => ({ ...coin, selected: coin.key === line.price.denomination }))
      }))
    });
  }

  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    // On the window itself, which stays from one render to the next: once
    if (!game.user.isGM) return;
    this.element.addEventListener('dragover', event => event.preventDefault());
    this.element.addEventListener('drop', event => this.#onDrop(event));
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const element = this.element;
    element.querySelector('select[name="buyer"]')?.addEventListener('change', event => { this.buyerId = event.target.value; });
    if (!game.user.isGM) return;
    for (const input of element.querySelectorAll('[data-field]')) input.addEventListener('change', event => this.#onEditLine(event));
  }

  /** A price, a number on sale or a service name changed by the GM. */
  async #onEditLine(event) {
    const input = event.currentTarget;
    const lineId = input.closest('[data-line-id]').dataset.lineId;
    const value = input.value.trim();
    await updateShop(this.shopId, shop => {
      const line = shop.lines.find(entry => entry.id === lineId);
      if (!line) return;
      if (input.dataset.field === 'quantity') line.quantity = value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
      else if (input.dataset.field === 'price') line.price.value = Math.max(0, Number(value) || 0);
      else if (input.dataset.field === 'denomination') line.price.denomination = value;
      else if ((input.dataset.field === 'name') && value) line.name = value;
    });
  }

  /** An item or a creature dropped by the GM becomes a line. */
  async #onDrop(event) {
    event.preventDefault();
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (!data?.uuid || !['Item', 'Actor'].includes(data.type)) return;
    await addDocument(this.shopId, data.uuid);
  }

  static async #onBuy(event, target) {
    const lineId = target.closest('[data-line-id]').dataset.lineId;
    target.disabled = true;
    try { await buy(this.shopId, lineId, game.actors.get(this.buyerId)); } finally { target.disabled = false; }
  }

  static #onShow(event, target) { showGood(this.shopId, target.closest('[data-line-id]').dataset.lineId); }

  static #onRemove(event, target) {
    const lineId = target.closest('[data-line-id]').dataset.lineId;
    updateShop(this.shopId, shop => { shop.lines = shop.lines.filter(line => line.id !== lineId); });
  }

  static #onAddService() { addService(this.shopId); }

  static async #onRestock() {
    const shop = getShop(this.shopId);
    const ok = await DialogV2.confirm({ window: { title: 'Nouveau stock' }, content: `<p>Remplacer le stock de <strong>${escape(shop?.name)}</strong> par un nouveau tirage, avec les mêmes réglages ?</p>` });
    if (ok) await restock(this.shopId);
  }

  static #onToggleVisible() { toggleVisible(this.shopId); }

  static async #onEdit() {
    const shop = getShop(this.shopId);
    if (!shop) return;
    const result = await DialogV2.input({
      window: { title: 'Modifier la boutique', icon: 'fa-solid fa-pen' },
      content: `<div class="form-group"><label>Nom</label><input type="text" name="name" value="${escape(shop.name)}"></div>`
        + `<div class="form-group stacked"><label>Description</label><textarea name="description" rows="5">${escape(shop.description)}</textarea></div>`,
      ok: { label: 'Enregistrer', icon: 'fa-solid fa-floppy-disk' },
      rejectClose: false
    });
    if (!result) return;
    await updateShop(this.shopId, current => {
      current.name = String(result.name ?? '').trim() || current.name;
      current.description = String(result.description ?? '');
    });
  }
}

/** Open a shop's window (one per shop). */
export function openShop(id) {
  if (!getShop(id)) return ui.notifications.warn('Cette boutique n\'existe plus.');
  const open = [...windows].find(app => app.shopId === id);
  if (open) return open.render({ force: true });
  return new ShopWindow(id).render({ force: true });
}

export const openGenerator = () => {
  if (!game.user.isGM) return ui.notifications.warn('Le générateur de boutiques est réservé au MJ.');
  return new ShopGenerator().render({ force: true });
};

/* -------------------------------------------- */
/*  Setup                                       */
/* -------------------------------------------- */

Hooks.once('init', () => {
  // The Boutiques tab, right after the Journal one
  const Sidebar = CONFIG.ui.sidebar ?? foundry.applications.sidebar.Sidebar;
  CONFIG.ui[TAB] = ShopDirectory;
  const tabs = Object.entries(Sidebar.TABS).filter(([key]) => key !== TAB);
  tabs.splice(tabs.findIndex(([key]) => key === 'journal') + 1, 0, [TAB, { tooltip: 'Boutiques', icon: 'fa-solid fa-store' }]);
  Sidebar.TABS = Object.fromEntries(tabs);
});

Hooks.on(`${MODULE_ID}.boutiquesChanged`, () => {
  ui[TAB]?.render();
  for (const app of [...windows]) {
    if (!getShop(app.shopId) || (!game.user.isGM && !getShop(app.shopId).visible)) app.close();
    else app.render();
  }
});

Hooks.once('ready', () => {
  const module = game.modules.get(MODULE_ID);
  module.api = { ...module.api, boutiques: { ...(module.api?.boutiques ?? {}), openGenerator, openShop } };
});
