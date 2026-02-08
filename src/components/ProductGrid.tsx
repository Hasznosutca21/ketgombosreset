import { useEffect, useState } from "react";
import { ShopifyProduct, fetchProducts } from "@/lib/shopify";
import ProductCard from "./ProductCard";
import { useLanguage } from "@/hooks/useLanguage";
import { Loader2, ShoppingBag } from "lucide-react";

export const ProductGrid = () => {
  const { language } = useLanguage();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProducts(20);
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const t = {
    shop: language === "hu" ? "Webshop" : "Shop",
    shopDescription: language === "hu" ? "Tesla alkatrészek és kiegészítők" : "Tesla parts and accessories",
    noProducts: language === "hu" ? "Még nincsenek termékek" : "No products found",
    noProductsDesc: language === "hu" 
      ? "Hamarosan feltöltjük az áruházat Tesla alkatrészekkel és kiegészítőkkel!" 
      : "We'll be adding Tesla parts and accessories soon!",
    loading: language === "hu" ? "Termékek betöltése..." : "Loading products...",
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">{t.loading}</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="text-center text-destructive">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.shop}</h2>
        <p className="text-muted-foreground text-lg">{t.shopDescription}</p>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t.noProducts}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">{t.noProductsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.node.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
