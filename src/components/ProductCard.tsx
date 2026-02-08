import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useLanguage } from "@/hooks/useLanguage";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  product: ShopifyProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { language } = useLanguage();
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);
  
  const firstVariant = product.node.variants.edges[0]?.node;
  const image = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firstVariant) return;
    
    await addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || []
    });
    
    toast.success(language === "hu" ? "Kosárhoz adva!" : "Added to cart!", {
      position: "top-center"
    });
  };

  const t = {
    addToCart: language === "hu" ? "Kosárba" : "Add to Cart",
    outOfStock: language === "hu" ? "Elfogyott" : "Out of Stock",
  };

  const isAvailable = firstVariant?.availableForSale !== false;

  return (
    <Link to={`/product/${product.node.handle}`}>
      <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 h-full">
        <div className="aspect-square overflow-hidden bg-secondary/10">
          {image ? (
            <img 
              src={image.url} 
              alt={image.altText || product.node.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingCart className="w-12 h-12" />
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {product.node.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.node.description}
          </p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xl font-bold text-primary">
              {price.currencyCode} {parseFloat(price.amount).toFixed(0)}
            </span>
            <Button 
              size="sm" 
              variant="tesla"
              onClick={handleAddToCart}
              disabled={isLoading || !isAvailable}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  {isAvailable ? t.addToCart : t.outOfStock}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
