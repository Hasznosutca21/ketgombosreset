import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchProductByHandle, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useLanguage } from "@/hooks/useLanguage";
import CartDrawer from "@/components/CartDrawer";
import teslandLogo from "@/assets/tesland-logo.png";
import { toast } from "sonner";

const Product = () => {
  const { handle } = useParams<{ handle: string }>();
  const { language } = useLanguage();
  const [product, setProduct] = useState<ShopifyProduct['node'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const addItem = useCartStore(state => state.addItem);
  const cartLoading = useCartStore(state => state.isLoading);

  useEffect(() => {
    const loadProduct = async () => {
      if (!handle) return;
      try {
        setIsLoading(true);
        const data = await fetchProductByHandle(handle);
        setProduct(data);
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
  }, [handle]);

  const t = {
    back: language === "hu" ? "Vissza" : "Back",
    addToCart: language === "hu" ? "Kosárba" : "Add to Cart",
    outOfStock: language === "hu" ? "Elfogyott" : "Out of Stock",
    notFound: language === "hu" ? "Termék nem található" : "Product not found",
    loading: language === "hu" ? "Betöltés..." : "Loading...",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">{t.notFound}</p>
        <Button variant="outline" asChild>
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />{t.back}</Link>
        </Button>
      </div>
    );
  }

  const selectedVariant = product.variants.edges[selectedVariantIndex]?.node;
  const images = product.images.edges;
  const isAvailable = selectedVariant?.availableForSale !== false;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    
    const productWrapper: ShopifyProduct = {
      node: product
    };
    
    await addItem({
      product: productWrapper,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions || []
    });
    
    toast.success(language === "hu" ? "Kosárhoz adva!" : "Added to cart!", {
      position: "top-center"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <img src={teslandLogo} alt="TESLAND" className="h-6 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />{t.back}</Link>
          </Button>
          <CartDrawer />
        </div>
      </header>

      {/* Product Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-secondary/10">
              {images[selectedImage]?.node ? (
                <img 
                  src={images[selectedImage].node.url} 
                  alt={images[selectedImage].node.altText || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingCart className="w-16 h-16" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img 
                      src={img.node.url} 
                      alt={img.node.altText || ""} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.title}</h1>
              <p className="text-2xl font-bold text-primary">
                {selectedVariant?.price.currencyCode} {parseFloat(selectedVariant?.price.amount || "0").toFixed(0)}
              </p>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Variants */}
            {product.variants.edges.length > 1 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  {product.options[0]?.name || "Variant"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.edges.map((variant, index) => (
                    <button
                      key={variant.node.id}
                      onClick={() => setSelectedVariantIndex(index)}
                      disabled={!variant.node.availableForSale}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedVariantIndex === index
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      } ${!variant.node.availableForSale && "opacity-50 cursor-not-allowed"}`}
                    >
                      {variant.node.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                {language === "hu" ? "Mennyiség" : "Quantity"}
              </label>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button 
              size="lg" 
              variant="tesla"
              className="w-full"
              onClick={handleAddToCart}
              disabled={cartLoading || !isAvailable}
            >
              {cartLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isAvailable ? t.addToCart : t.outOfStock}
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Product;
