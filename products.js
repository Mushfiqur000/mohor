// ==========================================================================
// MOHOR CLOTHINGS — products.js
// Static fallback product catalog & recommendation engine helpers.
// Used only when Firestore is empty/unreachable. Keep structure compatible
// with documents created from the Admin dashboard.
// ==========================================================================

window.productsData = [
  {
    id: "sample-1",
    title: { en: "Sample Three-Piece Set", bn: "নমুনা থ্রি-পিস" },
    category: "three-piece",
    regularPrice: 2200,
    salePrice: 1850,
    price: 1850,
    onSale: true,
    images: ["assets/image-placeholder.svg", "assets/banner-800.webp"],
    colors: ["Maroon", "Olive"],
    sizes: ["S", "M", "L"],
    sizeQuantities: { S: 2, M: 4, L: 5 },
    sizeMeasurements: { M: { en: "Bust: 36in, Waist: 30in", bn: "বুক: 36in, কোমর: 30in" } },
    description: { en: "A sample fallback product used when Firestore is unavailable.", bn: "ফায়ারস্টোর অনুপলভ্য হলে ব্যবহারের জন্য নমুনা পণ্য।" },
    details: ["Hand-finished embroidery", "Machine-wash gentle"]
  },
  {
    id: "sample-2",
    title: { en: "Luxury Kurti Collection", bn: "লাক্সারি কুর্তি কালেকশন" },
    category: "kurti",
    regularPrice: 1500,
    salePrice: 1250,
    price: 1250,
    onSale: true,
    images: ["assets/image-placeholder.svg"],
    colors: ["Navy", "Blush Pink"],
    sizes: ["M", "L", "XL"],
    sizeQuantities: { M: 3, L: 5, XL: 0 },
    sizeMeasurements: { L: { en: "Bust: 38in, Waist: 32in", bn: "বুক: 38in, কোমর: 32in" } },
    description: { en: "Elegant kurti crafted for comfort and daily luxury.", bn: "দৈনন্দিন মার্জিত লুকের জন্য বিশেষ ভাবে তৈরি কুর্তি।" },
    details: ["Pure cotton weave", "Handicraft detailing"]
  }
];

// Ensure fallback product IDs are normalized to strings
if (Array.isArray(window.productsData)) {
    window.productsData.forEach(p => p.id = String(p.id));
}

/**
 * Related Products Recommendation Generator
 * Smart Category Matching: Primary-sorts items in the same category.
 * Dynamic Fallback Logic: Backfills remaining slots with top items from other categories.
 */
window.getRelatedProducts = function(currentProduct, limit = 4) {
    if (!currentProduct) return [];
    
    const catalog = (Array.isArray(window.firestoreProducts) && window.firestoreProducts.length > 0)
        ? window.firestoreProducts
        : (window.productsData || []);

    if (!Array.isArray(catalog) || catalog.length === 0) return [];

    const currentId = String(currentProduct.id);
    const currentCat = currentProduct.category;

    // Filter out the current item
    const available = catalog.filter(p => String(p.id) !== currentId);

    // Primary sort: Same category items
    const sameCategoryItems = available.filter(p => p.category === currentCat);

    // Secondary sort: Fallback items from other categories
    const otherCategoryItems = available.filter(p => p.category !== currentCat);

    // Combine: Same category first, then fill remaining limit with fallback
    return [...sameCategoryItems, ...otherCategoryItems].slice(0, limit);
};

/**
 * Render Related Products grid cards into a target container.
 * Mirrors the same card template app.js's renderProducts() uses for the
 * main shop grid (color swatches, no separate CTA button) so related items
 * look visually consistent with the rest of the catalog rather than using
 * an older template whose "VIEW DETAILS" button lost its styling when the
 * shop-grid CSS moved away from that pattern.
 */
window.renderRelatedProducts = function(currentProduct, targetContainerId = 'relatedProductsGrid') {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    const items = window.getRelatedProducts(currentProduct, 4);
    if (items.length === 0) {
        const sec = container.closest('.related-products-section');
        if (sec) sec.style.display = 'none';
        return;
    }

    container.innerHTML = items.map(prod => {
        const displayTitle = typeof getText === 'function' ? getText(prod.title) : (prod.title?.[window.currentLang] || prod.title?.en || prod.title || '');
        const displayCategory = (prod.category || '').replace('-', ' ');
        const pricing = typeof window.getProductPricing === 'function'
            ? window.getProductPricing(prod)
            : { price: prod.price, regularPrice: prod.regularPrice || prod.price, isOnSale: false, discountPercent: 0 };
        const productUrl = typeof productPageUrl === 'function' ? productPageUrl(prod) : `/product/?id=${prod.id}`;
        const coverImage = typeof productCoverImage === 'function'
            ? productCoverImage(prod)
            : (prod.thumbnail || prod.thumbImage || (prod.images && prod.images[0] || '').replace(/-detail\.webp(?=$|\?)/i, '-thumb.webp') || 'assets/image-placeholder.svg');
        const colorOptionsHtml = typeof colorSwatchesHtml === 'function' ? colorSwatchesHtml(prod) : '';
        const isWishlisted = typeof window.isWishlisted === 'function' && window.isWishlisted(prod.id);
        const hasStock = typeof window.productHasStock === 'function' ? window.productHasStock(prod) : true;

        const saleBadgeHtml = pricing.isOnSale ? `<span class="card-badge-sale">SALE -${pricing.discountPercent}%</span>` : '';
        const stockBadgeHtml = hasStock ? '' : `<span class="card-stock-badge card-stock-badge-out" aria-label="Sold out">SOLD OUT</span>`;
        const wishlistBtnHtml = typeof window.toggleWishlist === 'function'
            ? `<button type="button" class="wishlist-toggle ${isWishlisted ? 'is-active' : ''}" data-wishlist-id="${String(prod.id)}" aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}" aria-pressed="${isWishlisted}">
                <span aria-hidden="true">${isWishlisted ? '♥' : '♡'}</span>
                <span>${isWishlisted ? 'Saved' : 'Wishlist'}</span>
            </button>`
            : '';
        const priceDisplayHtml = pricing.isOnSale
            ? `<div class="card-price"><span class="sale-price">৳ ${pricing.price}</span> <del class="old-price">৳ ${pricing.regularPrice}</del> <span class="card-discount">-${pricing.discountPercent}%</span></div>`
            : `<div class="card-price">৳ ${pricing.price}</div>`;

        return `
            <div class="product-card" data-id="${prod.id}">
                <div class="card-media">
                    ${saleBadgeHtml}
                    ${stockBadgeHtml}
                    <span class="card-cat">${displayCategory}</span>
                    <a class="card-media-link" href="${productUrl}" aria-label="${displayTitle}">
                        <img ${typeof window.catalogImageAttributes === 'function' ? window.catalogImageAttributes(coverImage, displayTitle) : `src="${coverImage}" alt="${displayTitle}" width="400" height="533" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/image-placeholder.svg';"`}>
                    </a>
                </div>
                <div class="card-body">
                    <div class="card-title"><a href="${productUrl}">${displayTitle}</a></div>
                    ${priceDisplayHtml}
                    ${colorOptionsHtml}
                    <div class="card-actions">
                        ${wishlistBtnHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    container.querySelectorAll('[data-wishlist-id]').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const active = window.toggleWishlist(button.dataset.wishlistId);
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
            button.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
            button.innerHTML = `<span aria-hidden="true">${active ? '♥' : '♡'}</span><span>${active ? 'Saved' : 'Wishlist'}</span>`;
        });
    });
};
