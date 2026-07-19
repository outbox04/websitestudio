import type { Metadata } from "next";
import { RentalOrderLookup } from "@/components/rental/rental-order-lookup";
export const metadata:Metadata={title:"Tra cứu đơn thuê | TLORA Rental"};
export default function RentalLookupPage(){return <RentalOrderLookup/>}
