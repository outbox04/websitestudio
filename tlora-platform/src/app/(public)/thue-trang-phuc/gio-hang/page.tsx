import type { Metadata } from "next";
import { RentalCartCheckout } from "@/components/rental/rental-cart-checkout";
export const metadata:Metadata={title:"Giỏ thuê | TLORA Rental"};
export default function RentalCartPage(){return <RentalCartCheckout/>}
