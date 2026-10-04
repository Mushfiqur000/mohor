(function () {
  function render() {
    const grid = document.getElementById('wishlistGrid');
    const empty = document.getElementById('wishlistEmpty');
    if (!grid || !empty) return;
    const ids = window.getWishlistIds ? window.getWishlistIds() : [];
    const catalog = (Array.isArray(window.firestoreProducts) && window.firestoreProducts.length)
      ? window.firestoreProducts
      : (window.productsData || []);
    const saved = catalog.filter(product => ids.includes(String(product.id)));
    empty.hidden = saved.length > 0;
    grid.hidden = saved.length === 0;
    if (saved.length && typeof window.renderProducts === 'function') window.renderProducts(saved);
  }
  document.addEventListener('DOMContentLoaded', () => {
    render();
    window.addEventListener('productsLoaded', render);
    window.addEventListener('wishlistChanged', render);
    if (typeof window.loadStoreProducts === 'function') window.loadStoreProducts();
  });
}());
