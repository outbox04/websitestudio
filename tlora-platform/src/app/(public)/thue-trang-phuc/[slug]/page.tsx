import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RentalProductDetail } from "@/components/rental/rental-product-detail";
import { getRentalProduct, rentalProducts } from "@/lib/rental/catalog";
export function generateStaticParams(){return rentalProducts.map((product)=>({slug:product.slug}));}
export async function generateMetadata({params}:PageProps<"/thue-trang-phuc/[slug]">):Promise<Metadata>{const {slug}=await params;const product=getRentalProduct(slug);return {title:product?`${product.name} | TLORA Rental`:"Trang phục"};}
export default async function RentalDetailPage({params}:PageProps<"/thue-trang-phuc/[slug]">){const {slug}=await params;const product=getRentalProduct(slug);if(!product||product.type!=="costume")notFound();return <RentalProductDetail product={product}/>;}
