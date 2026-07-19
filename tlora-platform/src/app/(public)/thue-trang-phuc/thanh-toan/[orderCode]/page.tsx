import { RentalPaymentStatus } from "@/components/rental/rental-payment-status";
export default async function RentalPaymentPage({params}:PageProps<"/thue-trang-phuc/thanh-toan/[orderCode]">){const{orderCode}=await params;return <RentalPaymentStatus orderCode={orderCode.toUpperCase()}/>}
