import type { Metadata } from "next";
import { RentalOrderLookup } from "@/components/rental/rental-order-lookup";
export const metadata:Metadata={title:"Chỉnh sửa đơn thuê | TLORA Rental"};
export default function RentalEditPage(){return <RentalOrderLookup edit/>}
