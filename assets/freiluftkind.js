import { animate as animate3 } from "vendor";

// js/common/cart/fetch-cart.js
var createCartPromise = () => {
  return new Promise(async (resolve) => {
    resolve(await (await fetch(`${Shopify.routes.root}cart.js`)).json());
  });
};
var fetchCart = createCartPromise();
document.addEventListener("cart:refresh", () => {
  fetchCart = createCartPromise();
});
document.addEventListener("cart:change", (event) => {
  fetchCart = event.detail["cart"];
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    fetchCart = createCartPromise();
  }
});

// js/common/cart/cart-count.js
var CartCount = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(
      document
        .createRange()
        .createContextualFragment("<span><slot></slot></span>")
    );
  }
  connectedCallback() {
    this._abortController = new AbortController();
    document.addEventListener(
      "cart:change",
      (event) => (this.itemCount = event.detail["cart"]["item_count"]),
      { signal: this._abortController.signal }
    );
    document.addEventListener(
      "cart:refresh",
      this._updateFromServer.bind(this),
      { signal: this._abortController.signal }
    );
    window.addEventListener("pageshow", this._updateFromServer.bind(this));
  }
  disconnectedCallback() {
    this._abortController.abort();
  }
  async _updateFromServer() {
    this.itemCount = (await fetchCart)["item_count"];
  }
  get itemCount() {
    return parseInt(this.innerText);
  }
  set itemCount(count) {
    if (this.itemCount === count) {
      return;
    }
    if (count === 0) {
      animate3(this, { opacity: 0 }, { duration: 0.1 });
      this.innerText = count;
    } else if (this.itemCount === 0) {
      animate3(this, { opacity: 1 }, { duration: 0.1 });
      this.innerText = count;
    } else {
      (async () => {
        await animate3(
          this.shadowRoot.firstElementChild,
          { transform: ["translateY(-50%)"], opacity: 0 },
          { duration: 0.25, easing: [1, 0, 0, 1] }
        ).finished;
        this.innerText = count;
        animate3(
          this.shadowRoot.firstElementChild,
          { transform: ["translateY(50%)", "translateY(0)"], opacity: 1 },
          { duration: 0.25, easing: [1, 0, 0, 1] }
        );
      })();
    }
  }
};
if (!window.customElements.get("cart-count")) {
  window.customElements.define("cart-count", CartCount);
}