import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, Flame, ChefHat, Star } from "lucide-react";
import { AddToCartButton } from "@/components/cards/add-to-cart-button";
import { foods, getFoodBySlug } from "@/data/foods";
import { categories } from "@/data/categories";
import { FoodCard } from "@/components/cards/food-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return foods.map((food) => ({ slug: food.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const food = getFoodBySlug(slug);
  if (!food) return { title: "Item Not Found" };
  return {
    title: food.name,
    description: food.description,
    openGraph: {
      images: [{ url: food.image }],
    },
  };
}

export default async function ItemPage({ params }: Props) {
  const { slug } = await params;
  const food = getFoodBySlug(slug);
  if (!food) notFound();

  const category = categories.find((c) => c.slug === food.category);
  const relatedFoods = foods
    .filter((f) => f.category === food.category && f.slug !== food.slug)
    .slice(0, 3);

  return (
    <section className="py-16 md:py-24 lg:py-28">
      <Container>
        {/* Breadcrumb */}
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/menu">Menu</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/menu/${food.category}`}>
                  {category?.name ?? food.category}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{food.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section */}
        <div className="mb-16 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-creamson p-8 shadow-sm">
            <div className="flex h-full items-center justify-center">
              <img
                src={food.image}
                alt={food.name}
                className="h-80 w-80 object-contain transition-transform duration-500 hover:scale-105 md:h-96 md:w-96"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="default" className="rounded-full">
                {category?.name ?? food.category}
              </Badge>
              {food.isChefRecommendation && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 rounded-full"
                >
                  <ChefHat className="h-3 w-3" />
                  Chef&apos;s Pick
                </Badge>
              )}
              {!food.isAvailable && (
                <Badge variant="destructive" className="rounded-full">
                  Unavailable
                </Badge>
              )}
            </div>

            <h1 className="font-heading text-4xl font-bold text-secondary md:text-5xl">
              {food.name}
            </h1>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(food.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-1.5 text-sm font-semibold text-gray-700">
                  {food.rating}
                </span>
                <span className="text-sm text-gray-500">
                  ({food.reviews} reviews)
                </span>
              </div>
            </div>

            <div className="mt-6 text-3xl font-bold text-primary">
              ${food.price.toFixed(2)}
            </div>

            <p className="mt-6 leading-relaxed text-gray-600">
              {food.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-6">
              {food.cookingTime && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{food.cookingTime}</span>
                </div>
              )}
              {food.spiceLevel && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Flame
                      key={i}
                      className={`h-4 w-4 ${
                        i < food.spiceLevel! ? "text-orange-500" : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-1">
                    {food.spiceLevel === 1
                      ? "Mild"
                      : food.spiceLevel === 2
                        ? "Medium"
                        : "Hot"}
                  </span>
                </div>
              )}
              {food.isAvailable && (
                <Badge
                  variant="outline"
                  className="rounded-full border-green-500 text-green-600"
                >
                  Available
                </Badge>
              )}
            </div>

            <div className="mt-8">
              <AddToCartButton
                id={food.id}
                name={food.name}
                price={food.price}
                image={food.image}
                slug={food.slug}
              />
            </div>
          </div>
        </div>

        {/* Ingredients & Nutrition */}
        <div className="mb-16 grid grid-cols-1 gap-10 lg:grid-cols-2">
          {food.ingredients && food.ingredients.length > 0 && (
            <div>
              <h2 className="mb-6 font-heading text-2xl font-bold text-secondary">
                Ingredients
              </h2>
              <ul className="space-y-3">
                {food.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </span>
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
              {food.preparationNotes && (
                <p className="mt-6 text-sm italic text-gray-500">
                  {food.preparationNotes}
                </p>
              )}
            </div>
          )}

          {(food.calories != null ||
            food.protein != null ||
            food.fat != null ||
            food.carbs != null) && (
            <div>
              <h2 className="mb-6 font-heading text-2xl font-bold text-secondary">
                Nutrition Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {food.calories != null && (
                  <Card className="rounded-2xl border-0 bg-white shadow-sm">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-primary">{food.calories}</p>
                      <p className="mt-1 text-sm text-gray-500">Calories</p>
                    </CardContent>
                  </Card>
                )}
                {food.protein != null && (
                  <Card className="rounded-2xl border-0 bg-white shadow-sm">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-primary">{food.protein}g</p>
                      <p className="mt-1 text-sm text-gray-500">Protein</p>
                    </CardContent>
                  </Card>
                )}
                {food.fat != null && (
                  <Card className="rounded-2xl border-0 bg-white shadow-sm">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-primary">{food.fat}g</p>
                      <p className="mt-1 text-sm text-gray-500">Fat</p>
                    </CardContent>
                  </Card>
                )}
                {food.carbs != null && (
                  <Card className="rounded-2xl border-0 bg-white shadow-sm">
                    <CardContent className="p-5 text-center">
                      <p className="text-3xl font-bold text-primary">{food.carbs}g</p>
                      <p className="mt-1 text-sm text-gray-500">Carbs</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Related Dishes */}
        {relatedFoods.length > 0 && (
          <div>
            <h2 className="mb-8 font-heading text-2xl font-bold text-secondary">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedFoods.map((related) => (
                <FoodCard key={related.id} food={related} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
