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

// Freiluftkind USP Gallery
document.addEventListener("DOMContentLoaded", function () {
  const uspButton = document.querySelector(".product-gallery__usp button");
  const uspText = uspButton?.querySelector(".gallery-usp-text");

  if (!uspButton || !uspText) return;

  // USP Werte aus Liquid über JSON übertragen
  const uspValues = [
    {{ section.settings.freiluftkind-image-usp-1 | json }},
    {{ section.settings.freiluftkind-image-usp-2 | json }},
    {{ section.settings.freiluftkind-image-usp-3 | json }},
    {{ section.settings.freiluftkind-image-usp-4 | json }}
  ];

  function updateUSP(index) {
    if (uspValues[index]) {
      uspText.innerHTML = uspValues[index];
      uspButton.setAttribute("data-usp-index", index + 1);
    }
  }

  // Beobachtet die Änderung des aktiven Bildes
  const observer = new MutationObserver(() => {
    const activeImage = document.querySelector(".product-gallery__media:not([hidden]) img");
    if (activeImage) {
      const newIndex = [...document.querySelectorAll(".product-gallery__media img")].indexOf(activeImage);
      updateUSP(newIndex);
    }
  });

  observer.observe(document.querySelector(".product-gallery"), {
    childList: true,
    subtree: true,
  });
});